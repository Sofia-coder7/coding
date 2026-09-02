/* 各工具页面按需调用对应的 init 函数 */

function initPythonDownloadButton() {
  const downloadBtn = document.getElementById('pyDownload');
  const codeArea = document.getElementById('pyCode');

  if (!downloadBtn || !codeArea) return;

  downloadBtn.addEventListener('click', () => {
    const blob = new Blob([codeArea.value], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'main.py';
    a.click();
    URL.revokeObjectURL(url);
  });
}

function initPythonHighlight() {
  const codeArea = document.getElementById('pyCode');
  const highlight = document.getElementById('pyHighlight');
  const codeEl = highlight.querySelector('code');

  if (!codeArea || !highlight || !codeEl) return;

  function updateHighlight() {
    codeEl.textContent = codeArea.value + '\n';
    if (window.Prism) {
      Prism.highlightElement(codeEl);
    }
  }

  updateHighlight();

  codeArea.addEventListener('input', updateHighlight);

  codeArea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeArea.selectionStart;
      const end = codeArea.selectionEnd;
      const value = codeArea.value;
      codeArea.value = value.substring(0, start) + '    ' + value.substring(end);
      codeArea.selectionStart = codeArea.selectionEnd = start + 4;
      updateHighlight();
    }
  });

  codeArea.addEventListener('scroll', () => {
    highlight.scrollTop = codeArea.scrollTop;
    highlight.scrollLeft = codeArea.scrollLeft;
  });
}

function initPythonRunButton() {
  const runBtn = document.getElementById('pyRun');
  if (runBtn) {
    runBtn.addEventListener('click', runPython);
  }
}

/* ================================================================
   内置 Python 预览引擎 — 不依赖 Pyodide
   支持：变量赋值、print()、f-string、for/range、while/break、
         if/elif/else、try/except、函数定义/调用、input()、
         random.randint/choice、import（忽略）、注释、算术
   递归 async 架构，支持任意嵌套
   ================================================================ */

async function runPython() {
  const codeArea = document.getElementById('pyCode');
  const output = document.getElementById('pyOutput');
  const runBtn = document.getElementById('pyRun');

  if (!codeArea || !output) return;

  const code = codeArea.value;

  runBtn.disabled = true;
  runBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg> 运行中...';

  try {
    output.innerHTML = '';
    const result = await execPythonPreview(code, output);
    if (result.error) {
      const errSpan = document.createElement('span');
      errSpan.className = 'py-err';
      errSpan.textContent = result.error;
      output.appendChild(errSpan);
    } else if (!result.hasOutput) {
      output.innerHTML = '<span class="py-success">代码执行完成（无输出）</span>';
    }
  } catch (err) {
    output.innerHTML = '';
    const errSpan = document.createElement('span');
    errSpan.className = 'py-err';
    errSpan.textContent = formatPythonError(err.message || String(err));
    output.appendChild(errSpan);
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> 运行';
  }
}

function stripComment(line) {
  let inStr = false, quote = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inStr) {
      if (c === quote) inStr = false;
      continue;
    }
    if (c === "'" || c === '"') { inStr = true; quote = c; continue; }
    if (c === '#') return line.slice(0, i);
  }
  return line;
}

function getIndent(line) {
  const m = line.match(/^(\s*)/);
  return m ? m[1].length : 0;
}

function splitTopLevel(str, sep) {
  const parts = [];
  let depth = 0, current = '', inStr = false, sc = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (inStr) { current += c; if (c === sc) inStr = false; continue; }
    if (c === "'" || c === '"') { inStr = true; sc = c; current += c; continue; }
    if ('([{'.includes(c)) depth++;
    if (')]}'.includes(c)) depth--;
    if (c === sep && depth === 0) { parts.push(current); current = ''; }
    else current += c;
  }
  parts.push(current);
  return parts;
}

async function execPythonPreview(code, outputEl) {
  const lines = code.split('\n').map(l => stripComment(l));
  const vars = {};
  const funcs = {};
  const classes = {};
  let hasOutput = false;
  let error = null;
  let returnVal = undefined;
  let hasReturn = false;
  let selfObj = null;

  // 内置模块模拟
  vars['time'] = { __isModule__: true, time: () => Date.now() / 1000 };
  vars['datetime'] = {
    __isModule__: true,
    datetime: {
      __isClass__: true,
      now: () => {
        const d = new Date();
        return {
          __isDatetime__: true,
          strftime: (fmt) => {
            const pad = (n) => String(n).padStart(2, '0');
            return fmt
              .replace(/%Y/g, d.getFullYear())
              .replace(/%m/g, pad(d.getMonth() + 1))
              .replace(/%d/g, pad(d.getDate()))
              .replace(/%H/g, pad(d.getHours()))
              .replace(/%M/g, pad(d.getMinutes()))
              .replace(/%S/g, pad(d.getSeconds()));
          }
        };
      }
    }
  };

  function appendOutput(text) {
    outputEl.appendChild(document.createTextNode(text));
    hasOutput = true;
  }

  async function getInput(promptText) {
    if (promptText) appendOutput(promptText);
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.className = 'py-input-wrap';
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'py-input-field';
      input.placeholder = '输入后按 Enter';
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const val = input.value;
          wrap.remove();
          appendOutput(val + '\n');
          resolve(val);
        }
      });
      wrap.appendChild(input);
      outputEl.appendChild(wrap);
      input.focus();
    });
  }

  function unescapeStr(s) {
    return s.replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\r/g, '\r')
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
  }

  function createInstance(className, args) {
    const cls = classes[className];
    if (!cls) return undefined;
    const obj = { __class__: className, __dict__: {} };
    // 复制类属性
    for (const k in cls.classVars) {
      obj.__dict__[k] = cls.classVars[k];
    }
    // 如果有 __init__ 方法，调用它
    if (cls.methods['__init__']) {
      const savedSelf = selfObj;
      selfObj = obj;
      const savedVars = { ...vars };
      cls.methods['__init__'].params.forEach((p, i) => {
        if (p === 'self') return;
        vars[p] = args[i - 1] !== undefined ? args[i - 1] : undefined;
      });
      hasReturn = false;
      returnVal = undefined;
      execFromSync(cls.methods['__init__'].bodyStart, cls.methods['__init__'].bodyIndent);
      Object.keys(vars).forEach(k => { if (!(k in savedVars)) delete vars[k]; });
      Object.assign(vars, savedVars);
      selfObj = savedSelf;
    }
    return obj;
  }

  function getAttr(obj, attr) {
    if (obj && typeof obj === 'object' && obj.__class__ && obj.__dict__) {
      if (attr in obj.__dict__) return obj.__dict__[attr];
      const cls = classes[obj.__class__];
      if (cls && cls.methods[attr]) {
        return { __method__: true, obj, name: attr };
      }
      return undefined;
    }
    return undefined;
  }

  function setAttr(obj, attr, value) {
    if (obj && typeof obj === 'object' && obj.__dict__) {
      obj.__dict__[attr] = value;
    }
  }

  function execFromSync(startIdx, endIndent) {
    // 同步版本的 execFrom（用于 __init__ 等简单方法，不支持 input）
    let i = startIdx;
    while (i < lines.length) {
      const raw = lines[i];
      if (raw.trim() === '' || raw.trim().startsWith('#')) { i++; continue; }
      const indent = getIndent(raw);
      if (indent <= endIndent) break;
      const trimmed = raw.trim();

      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) { i++; continue; }
      if (trimmed === 'return') { hasReturn = true; break; }
      if (trimmed.startsWith('return ')) {
        returnVal = evalExpr(trimmed.slice(7).trim());
        hasReturn = true;
        break;
      }

      if (trimmed.startsWith('print(') && trimmed.endsWith(')')) {
        const argsStr = trimmed.slice(6, -1);
        const mainArgs = argsStr.replace(/sep\s*=\s*(['"]).*?\1,?/g, '').replace(/end\s*=\s*(['"]).*?\1,?/g, '').trim();
        if (mainArgs.endsWith(',')) mainArgs = mainArgs.slice(0, -1);
        const parts = mainArgs ? splitTopLevel(mainArgs, ',') : [];
        const vals = parts.map(a => evalExpr(a.trim()));
        appendOutput(vals.join(' ') + '\n');
        i++;
        continue;
      }

      const selfAssignMatch = trimmed.match(/^self\.(\w+)\s*=(?!=)\s*(.+)$/);
      if (selfAssignMatch && selfObj) {
        setAttr(selfObj, selfAssignMatch[1], evalExpr(selfAssignMatch[2]));
        i++;
        continue;
      }

      const assignMatch = trimmed.match(/^(\w+)\s*=(?!=)\s*(.+)$/);
      if (assignMatch) {
        vars[assignMatch[1]] = evalExpr(assignMatch[2]);
        i++;
        continue;
      }

      // 方法调用语句: self.method(args) 或 obj.method(args)
      const methodStmtMatch = trimmed.match(/^(\w+(?:\.\w+)*)\((.*)\)$/);
      if (methodStmtMatch) {
        const fullExpr = methodStmtMatch[1];
        const argsStr = methodStmtMatch[2];
        if (fullExpr.includes('.')) {
          const dotIdx = fullExpr.lastIndexOf('.');
          const objExpr = fullExpr.slice(0, dotIdx);
          const methodName = fullExpr.slice(dotIdx + 1);
          const obj = evalExpr(objExpr);
          if (obj && typeof obj === 'object' && obj.__class__) {
            const args = argsStr ? splitTopLevel(argsStr, ',').map(a => evalExpr(a.trim())) : [];
            callMethodSync(obj, methodName, args);
            i++;
            continue;
          }
        }
      }

      i++;
    }
  }

  function callMethodSync(obj, methodName, args) {
    const cls = classes[obj.__class__];
    if (!cls || !cls.methods[methodName]) return undefined;
    const method = cls.methods[methodName];
    const savedSelf = selfObj;
    selfObj = obj;
    const savedVars = { ...vars };
    method.params.forEach((p, i) => {
      if (p === 'self') return;
      vars[p] = args[i - 1] !== undefined ? args[i - 1] : undefined;
    });
    hasReturn = false;
    returnVal = undefined;
    execFromSync(method.bodyStart, method.bodyIndent);
    const result = hasReturn ? returnVal : undefined;
    Object.keys(vars).forEach(k => { if (!(k in savedVars)) delete vars[k]; });
    Object.assign(vars, savedVars);
    selfObj = savedSelf;
    return result;
  }

  async function callMethodAsync(obj, methodName, args) {
    const cls = classes[obj.__class__];
    if (!cls || !cls.methods[methodName]) return undefined;
    const method = cls.methods[methodName];
    const savedSelf = selfObj;
    selfObj = obj;
    const savedVars = { ...vars };
    method.params.forEach((p, i) => {
      if (p === 'self') return;
      vars[p] = args[i - 1] !== undefined ? args[i - 1] : undefined;
    });
    hasReturn = false;
    returnVal = undefined;
    await execFrom(method.bodyStart, method.bodyIndent);
    const result = hasReturn ? returnVal : undefined;
    Object.keys(vars).forEach(k => { if (!(k in savedVars)) delete vars[k]; });
    Object.assign(vars, savedVars);
    selfObj = savedSelf;
    return result;
  }

  function evalExpr(expr) {
    expr = expr.trim();
    if (!expr) return '';

    if (expr.startsWith("f'") || expr.startsWith('f"')) return evalFString(expr);
    if (expr.startsWith("'") || expr.startsWith('"')) {
      const m = expr.match(/^(['"])((?:.|\n)*?)\1$/);
      return m ? unescapeStr(m[2]) : expr;
    }
    if (expr === 'True') return true;
    if (expr === 'False') return false;
    if (expr === 'None') return null;
    if (/^-?\d+$/.test(expr)) return parseInt(expr);
    if (/^-?\d+\.\d+$/.test(expr)) return parseFloat(expr);

    if (expr.startsWith('random.randint(') && expr.endsWith(')')) {
      const args = expr.slice(15, -1).split(',').map(a => Number(evalExpr(a.trim())));
      return Math.floor(Math.random() * (args[1] - args[0] + 1)) + args[0];
    }
    if (expr.startsWith('random.choice(') && expr.endsWith(')')) {
      const listStr = expr.slice(14, -1);
      const items = listStr.split(',').map(a => evalExpr(a.trim()));
      return items[Math.floor(Math.random() * items.length)];
    }
    if (expr.startsWith('len(') && expr.endsWith(')')) {
      const v = evalExpr(expr.slice(4, -1).trim());
      if (Array.isArray(v)) return v.length;
      if (v && typeof v === 'object' && v.__isDict__) return Object.keys(v).filter(k => k !== '__isDict__').length;
      return String(v).length;
    }
    if (expr.startsWith('int(') && expr.endsWith(')')) {
      const v = evalExpr(expr.slice(4, -1).trim());
      const num = parseInt(String(v).trim());
      if (isNaN(num)) throw new Error('ValueError: invalid literal for int(): ' + v);
      return num;
    }
    if (expr.startsWith('str(') && expr.endsWith(')')) {
      return String(evalExpr(expr.slice(4, -1).trim()));
    }
    if (expr.startsWith('float(') && expr.endsWith(')')) {
      const num = parseFloat(evalExpr(expr.slice(6, -1).trim()));
      if (isNaN(num)) throw new Error('ValueError: could not convert to float');
      return num;
    }
    if (expr.startsWith('abs(') && expr.endsWith(')')) {
      return Math.abs(Number(evalExpr(expr.slice(4, -1).trim())));
    }
    if (expr.startsWith('round(') && expr.endsWith(')')) {
      const args = expr.slice(6, -1).split(',');
      const num = Number(evalExpr(args[0].trim()));
      const decimals = args[1] ? parseInt(evalExpr(args[1].trim())) : 0;
      return Number(num.toFixed(decimals));
    }
    if (expr.startsWith('range(') && expr.endsWith(')')) {
      const args = expr.slice(6, -1).split(',').map(a => Number(evalExpr(a.trim())));
      const start = args.length > 1 ? args[0] : 0;
      const end = args.length > 1 ? args[1] : args[0];
      const step = args.length > 2 ? args[2] : 1;
      const arr = [];
      for (let v = start; step > 0 ? v < end : v > end; v += step) arr.push(v);
      return arr;
    }

    if (expr.startsWith('[') && expr.endsWith(']')) {
      const inner = expr.slice(1, -1).trim();
      if (!inner) return [];
      return splitTopLevel(inner, ',').map(a => evalExpr(a.trim()));
    }

    // 字典字面量 {key: value, ...}
    if (expr.startsWith('{') && expr.endsWith('}')) {
      const inner = expr.slice(1, -1).trim();
      const dict = {};
      dict.__isDict__ = true;
      if (!inner) return dict;
      const pairs = splitTopLevel(inner, ',');
      for (const pair of pairs) {
        const colonIdx = pair.indexOf(':');
        if (colonIdx > 0) {
          const key = evalExpr(pair.slice(0, colonIdx).trim());
          const val = evalExpr(pair.slice(colonIdx + 1).trim());
          dict[String(key)] = val;
        }
      }
      return dict;
    }

    if (expr.includes(' and ')) {
      return expr.split(' and ').every(p => !!evalExpr(p.trim()));
    }
    if (expr.includes(' or ')) {
      return expr.split(' or ').some(p => !!evalExpr(p.trim()));
    }
    if (expr.startsWith('not ')) return !evalExpr(expr.slice(4).trim());

    const compMatch = expr.match(/^(.+?)\s*(==|!=|<=|>=|<|>)\s*(.+)$/);
    if (compMatch) {
      const a = evalExpr(compMatch[1].trim());
      const b = evalExpr(compMatch[3].trim());
      switch (compMatch[2]) {
        case '==': return a == b;
        case '!=': return a != b;
        case '<=': return a <= b;
        case '>=': return a >= b;
        case '<': return a < b;
        case '>': return a > b;
      }
    }

    if (expr.includes('+')) {
      const parts = splitTopLevel(expr, '+');
      if (parts.length > 1) {
        const vals = parts.map(p => evalExpr(p.trim()));
        const allNum = vals.every(v => typeof v === 'number' || /^-?\d+(\.\d+)?$/.test(String(v)));
        return allNum ? vals.reduce((a, b) => a + Number(b), 0) : vals.map(v => String(v)).join('');
      }
    }
    if (expr.includes('-')) {
      const parts = splitTopLevel(expr, '-');
      if (parts.length > 1) {
        const vals = parts.map(p => Number(evalExpr(p.trim())));
        if (vals.every(v => !isNaN(v))) return vals.reduce((a, b) => a - b);
      }
    }
    if (expr.includes('*')) {
      const parts = splitTopLevel(expr, '*');
      if (parts.length > 1) {
        const vals = parts.map(p => Number(evalExpr(p.trim())));
        if (vals.every(v => !isNaN(v))) return vals.reduce((a, b) => a * b);
      }
    }

    // 属性访问: obj.attr
    if (expr.includes('.') && !expr.startsWith('"') && !expr.startsWith("'") && !expr.startsWith('f"') && !expr.startsWith("f'")) {
      const dotIdx = expr.indexOf('.');
      const objExpr = expr.slice(0, dotIdx);
      const attr = expr.slice(dotIdx + 1);
      const obj = evalExpr(objExpr.trim());
      
      // 类实例属性/方法
      if (obj && typeof obj === 'object' && obj.__class__) {
        // 检查是否是方法调用（带括号）
        if (attr.includes('(') && attr.endsWith(')')) {
          const methodName = attr.slice(0, attr.indexOf('('));
          const argsStr = attr.slice(attr.indexOf('(') + 1, -1);
          const args = argsStr ? splitTopLevel(argsStr, ',').map(a => evalExpr(a.trim())) : [];
          const method = getAttr(obj, methodName);
          if (method && method.__method__) {
            return callMethodSync(obj, methodName, args);
          }
        }
        return getAttr(obj, attr);
      }
      
      // 字典方法
      if (obj && typeof obj === 'object' && obj.__isDict__) {
        if (attr.includes('(') && attr.endsWith(')')) {
          const methodName = attr.slice(0, attr.indexOf('('));
          const argsStr = attr.slice(attr.indexOf('(') + 1, -1);
          const args = argsStr ? splitTopLevel(argsStr, ',').map(a => evalExpr(a.trim())) : [];
          const keys = Object.keys(obj).filter(k => k !== '__isDict__');
          switch (methodName) {
            case 'get':
              return args[0] !== undefined && obj[String(args[0])] !== undefined ? obj[String(args[0])] : (args[1] !== undefined ? args[1] : undefined);
            case 'keys':
              return keys;
            case 'values':
              return keys.map(k => obj[k]);
            case 'items':
              return keys.map(k => [k, obj[k]]);
          }
        }
        if (obj[attr] !== undefined) return obj[attr];
      }
      
      // 列表方法
      if (Array.isArray(obj)) {
        if (attr.includes('(') && attr.endsWith(')')) {
          const methodName = attr.slice(0, attr.indexOf('('));
          const argsStr = attr.slice(attr.indexOf('(') + 1, -1);
          const args = argsStr ? splitTopLevel(argsStr, ',').map(a => evalExpr(a.trim())) : [];
          switch (methodName) {
            case 'append':
              obj.push(args[0]);
              return undefined;
            case 'pop':
              return args[0] !== undefined ? obj.splice(args[0], 1)[0] : obj.pop();
            case 'index':
              return obj.indexOf(args[0]);
            case 'join':
              return obj.join(args[0] !== undefined ? String(args[0]) : ',');
          }
        }
      }
      
      // 字符串方法
      if (typeof obj === 'string') {
        if (attr.includes('(') && attr.endsWith(')')) {
          const methodName = attr.slice(0, attr.indexOf('('));
          const argsStr = attr.slice(attr.indexOf('(') + 1, -1);
          const args = argsStr ? splitTopLevel(argsStr, ',').map(a => evalExpr(a.trim())) : [];
          switch (methodName) {
            case 'lower': return obj.toLowerCase();
            case 'upper': return obj.toUpperCase();
            case 'strip': return obj.trim();
            case 'lstrip': return obj.trimStart();
            case 'rstrip': return obj.trimEnd();
            case 'startswith': return obj.startsWith(String(args[0]));
            case 'endswith': return obj.endsWith(String(args[0]));
            case 'replace': return obj.replaceAll(String(args[0]), String(args[1]));
            case 'split': return obj.split(args[0] !== undefined ? String(args[0]) : ',');
            case 'join': return args[0] && Array.isArray(args[0]) ? args[0].join(obj) : obj;
          }
        }
      }
      
      // 模块/普通对象属性访问
      if (obj && typeof obj === 'object') {
        if (attr.includes('(') && attr.endsWith(')')) {
          const methodName = attr.slice(0, attr.indexOf('('));
          const argsStr = attr.slice(attr.indexOf('(') + 1, -1);
          const args = argsStr ? splitTopLevel(argsStr, ',').map(a => evalExpr(a.trim())) : [];
          if (typeof obj[methodName] === 'function') {
            return obj[methodName](...args);
          }
        }
        if (obj[attr] !== undefined) return obj[attr];
      }
    }

    // self 关键字
    if (expr === 'self') return selfObj;

    // 下标访问: obj[key]
    if (expr.endsWith(']') && expr.includes('[')) {
      const bracketIdx = expr.lastIndexOf('[');
      const objExpr = expr.slice(0, bracketIdx);
      const keyExpr = expr.slice(bracketIdx + 1, -1);
      const obj = evalExpr(objExpr.trim());
      const key = evalExpr(keyExpr.trim());
      if (Array.isArray(obj)) return obj[Number(key)];
      if (obj && typeof obj === 'object' && obj.__isDict__) return obj[String(key)];
      if (obj && typeof obj === 'object' && obj.__class__) return getAttr(obj, String(key));
    }

    // time.time() 支持
    if (expr === 'time.time()') return Date.now() / 1000;

    if (expr in vars) return vars[expr];

    return expr;
  }

  function evalFString(expr) {
    const q = expr[1];
    const content = expr.slice(2, expr.lastIndexOf(q));
    const result = content.replace(/\{([^}]+)\}/g, (_, inner) => {
      return String(evalExpr(inner.trim()));
    });
    return unescapeStr(result);
  }

  function skipBlock(startIdx, baseIndent) {
    let i = startIdx;
    while (i < lines.length) {
      const raw = lines[i];
      if (raw.trim() === '') { i++; continue; }
      if (getIndent(raw) <= baseIndent) return i;
      i++;
    }
    return i;
  }

  function findBlockEnd(startIdx, baseIndent) {
    return skipBlock(startIdx, baseIndent);
  }

  async function callFunc(name, args) {
    const fn = funcs[name];
    if (!fn) return undefined;
    const savedVars = { ...vars };
    fn.params.forEach((p, i) => { vars[p] = args[i]; });
    hasReturn = false;
    returnVal = undefined;
    await execFrom(fn.bodyStart, fn.bodyIndent);
    const result = hasReturn ? returnVal : undefined;
    Object.keys(vars).forEach(k => { if (!(k in savedVars)) delete vars[k]; });
    Object.assign(vars, savedVars);
    return result;
  }

  async function execFrom(startIdx, endIndent) {
    let i = startIdx;
    let control = null;

    while (i < lines.length) {
      const raw = lines[i];
      if (raw.trim() === '' || raw.trim().startsWith('#')) { i++; continue; }
      const indent = getIndent(raw);
      if (indent <= endIndent) break;

      const trimmed = raw.trim();

      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) { i++; continue; }

      if (trimmed === 'break') { control = 'break'; break; }
      if (trimmed === 'continue') { control = 'continue'; break; }

      if (trimmed.startsWith('return')) {
        const retExpr = trimmed.slice(6).trim();
        if (retExpr) returnVal = evalExpr(retExpr);
        hasReturn = true;
        control = 'return';
        break;
      }

      if (trimmed.startsWith('print(') && trimmed.endsWith(')')) {
        const argsStr = trimmed.slice(6, -1);
        const sepMatch = argsStr.match(/sep\s*=\s*(['"])(.*?)\1/);
        const endMatch = argsStr.match(/end\s*=\s*(['"])(.*?)\1/);
        let mainArgs = argsStr.replace(/sep\s*=\s*(['"]).*?\1,?/g, '').replace(/end\s*=\s*(['"]).*?\1,?/g, '').trim();
        if (mainArgs.endsWith(',')) mainArgs = mainArgs.slice(0, -1);
        const parts = mainArgs ? splitTopLevel(mainArgs, ',') : [];
        const vals = parts.map(a => evalExpr(a.trim()));
        const sep = sepMatch ? sepMatch[2] : ' ';
        const end = endMatch ? endMatch[2] : '\n';
        appendOutput(vals.join(sep) + end);
        i++;
        continue;
      }

      if (trimmed.startsWith('input(') && trimmed.endsWith(')')) {
        const arg = trimmed.slice(6, -1).trim();
        const promptText = arg ? String(evalExpr(arg)) : '';
        await getInput(promptText);
        i++;
        continue;
      }

      const inputAssignMatch = trimmed.match(/^(\w+)\s*=(?!=)\s*input\((.*)\)$/);
      if (inputAssignMatch) {
        const promptArg = inputAssignMatch[2].trim();
        const promptText = promptArg ? String(evalExpr(promptArg)) : '';
        const inputVal = await getInput(promptText);
        vars[inputAssignMatch[1]] = inputVal;
        i++;
        continue;
      }

      if (trimmed.startsWith('def ') && trimmed.endsWith(':')) {
        const fnMatch = trimmed.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:$/);
        if (fnMatch) {
          const params = fnMatch[2] ? fnMatch[2].split(',').map(p => p.trim()).filter(p => p) : [];
          const bodyStart = i + 1;
          const bodyIndent = indent + 1;
          const bodyEnd = skipBlock(bodyStart, indent);
          funcs[fnMatch[1]] = { params, bodyStart, bodyIndent };
          i = bodyEnd;
          continue;
        }
      }

      // class 类定义
      if (trimmed.startsWith('class ') && trimmed.endsWith(':')) {
        const classMatch = trimmed.match(/^class\s+(\w+)\s*(\([^)]*\))?\s*:$/);
        if (classMatch) {
          const className = classMatch[1];
          const classBodyStart = i + 1;
          const classBodyIndent = indent + 1;
          const classBodyEnd = skipBlock(classBodyStart, indent);
          
          // 解析类体：收集方法和类属性
          const methods = {};
          const classVars = {};
          let ci = classBodyStart;
          while (ci < classBodyEnd) {
            const craw = lines[ci];
            if (craw.trim() === '' || craw.trim().startsWith('#')) { ci++; continue; }
            const cindent = getIndent(craw);
            if (cindent <= indent) break;
            const ctrimmed = craw.trim();
            
            // 类方法
            if (ctrimmed.startsWith('def ') && ctrimmed.endsWith(':') && cindent === classBodyIndent) {
              const m = ctrimmed.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:$/);
              if (m) {
                const params = m[2] ? m[2].split(',').map(p => p.trim()).filter(p => p) : [];
                const methodBodyStart = ci + 1;
                const methodBodyIndent = cindent + 1;
                const methodBodyEnd = skipBlock(methodBodyStart, cindent);
                methods[m[1]] = { params, bodyStart: methodBodyStart, bodyIndent: methodBodyIndent };
                ci = methodBodyEnd;
                continue;
              }
            }
            
            // 类属性赋值
            const classVarMatch = ctrimmed.match(/^(\w+)\s*=(?!=)\s*(.+)$/);
            if (classVarMatch && cindent === classBodyIndent) {
              classVars[classVarMatch[1]] = evalExpr(classVarMatch[2]);
            }
            
            ci++;
          }
          
          classes[className] = { methods, classVars };
          i = classBodyEnd;
          continue;
        }
      }

      if (trimmed.startsWith('if ') && trimmed.endsWith(':')) {
        const cond = trimmed.slice(3, -1).trim();
        const isDunder = trimmed.match(/^if\s+__name__\s*==\s*["']__main__["']\s*:$/);
        const condResult = isDunder ? true : evalExpr(cond);
        const blockEnd = skipBlock(i + 1, indent);

        if (condResult) {
          const result = await execFrom(i + 1, indent);
          if (result.control) { i = blockEnd; control = result.control; }
          else { i = blockEnd; }
        } else {
          i = blockEnd;
        }

        while (i < lines.length) {
          const lt = lines[i].trim();
          if (lt === '' || getIndent(lines[i]) > indent) { i++; continue; }
          if (getIndent(lines[i]) !== indent) break;
          if (lt.startsWith('elif ') && lt.endsWith(':')) {
            const econd = lt.slice(5, -1).trim();
            const eBlockEnd = skipBlock(i + 1, indent);
            if (!condResult && evalExpr(econd)) {
              const result = await execFrom(i + 1, indent);
              if (result.control) { control = result.control; }
              i = eBlockEnd;
              continue;
            }
            i = eBlockEnd;
            continue;
          }
          if (lt === 'else:') {
            const eBlockEnd = skipBlock(i + 1, indent);
            if (!condResult) {
              const result = await execFrom(i + 1, indent);
              if (result.control) { control = result.control; }
            }
            i = eBlockEnd;
            continue;
          }
          break;
        }
        if (control) break;
        continue;
      }

      if (trimmed.startsWith('for ') && trimmed.includes(' range(') && trimmed.endsWith(':')) {
        const m = trimmed.match(/^for\s+(\w+)\s+in\s+range\(([^)]+)\)\s*:$/);
        if (m) {
          const rangeArgs = m[2].split(',').map(a => Number(evalExpr(a.trim())));
          const start = rangeArgs.length > 1 ? rangeArgs[0] : 0;
          const end = rangeArgs.length > 1 ? rangeArgs[1] : rangeArgs[0];
          const step = rangeArgs.length > 2 ? rangeArgs[2] : 1;
          const blockEnd = skipBlock(i + 1, indent);

          for (let v = start; step > 0 ? v < end : v > end; v += step) {
            vars[m[1]] = v;
            const result = await execFrom(i + 1, indent);
            if (result.control === 'break') break;
            if (result.control === 'return') { control = 'return'; break; }
          }
          i = blockEnd;
          if (control) break;
          continue;
        }
      }

      if (trimmed.startsWith('for ') && trimmed.includes(' in ') && trimmed.endsWith(':')) {
        const m = trimmed.match(/^for\s+(.+?)\s+in\s+(.+)\s*:$/);
        if (m) {
          const varNames = m[1].split(',').map(v => v.trim());
          const iterable = evalExpr(m[2].trim());
          const blockEnd = skipBlock(i + 1, indent);
          if (Array.isArray(iterable)) {
            for (const item of iterable) {
              if (varNames.length === 1) {
                vars[varNames[0]] = item;
              } else if (Array.isArray(item)) {
                varNames.forEach((name, idx) => {
                  vars[name] = item[idx];
                });
              }
              const result = await execFrom(i + 1, indent);
              if (result.control === 'break') break;
              if (result.control === 'return') { control = 'return'; break; }
            }
          }
          i = blockEnd;
          if (control) break;
          continue;
        }
      }

      if (trimmed === 'while True:' || (trimmed.startsWith('while ') && trimmed.endsWith(':'))) {
        const cond = trimmed === 'while True:' ? 'True' : trimmed.slice(6, -1).trim();
        const blockEnd = skipBlock(i + 1, indent);
        let iterations = 0;

        while (true) {
          if (trimmed !== 'while True:' && !evalExpr(cond)) break;
          const result = await execFrom(i + 1, indent);
          if (result.control === 'break') break;
          if (result.control === 'return') { control = 'return'; break; }
          iterations++;
          if (iterations > 10000) { error = '循环次数过多，已停止'; break; }
        }
        i = blockEnd;
        if (control) break;
        continue;
      }

      if (trimmed.startsWith('try:') || trimmed.startsWith('try :')) {
        const blockEnd = skipBlock(i + 1, indent);
        let hadError = false;
        let errorMsg = '';

        try {
          const result = await execFrom(i + 1, indent);
          if (result.control) control = result.control;
        } catch (e) {
          hadError = true;
          errorMsg = e.message;
        }

        i = blockEnd;
        while (i < lines.length) {
          const lt = lines[i].trim();
          if (lt === '' || getIndent(lines[i]) > indent) { i++; continue; }
          if (getIndent(lines[i]) !== indent) break;
          if (lt.startsWith('except') && lt.endsWith(':')) {
            const eBlockEnd = skipBlock(i + 1, indent);
            if (hadError && !control) {
              const result = await execFrom(i + 1, indent);
              if (result.control) control = result.control;
            }
            i = eBlockEnd;
            continue;
          }
          if (lt === 'finally:') {
            const eBlockEnd = skipBlock(i + 1, indent);
            const result = await execFrom(i + 1, indent);
            if (result.control) control = result.control;
            i = eBlockEnd;
            continue;
          }
          break;
        }
        if (control) break;
        continue;
      }

      // self.attr = value 赋值
      const selfAssignMatch = trimmed.match(/^self\.(\w+)\s*=(?!=)\s*(.+)$/);
      if (selfAssignMatch && selfObj) {
        setAttr(selfObj, selfAssignMatch[1], evalExpr(selfAssignMatch[2]));
        i++;
        continue;
      }

      // obj.attr = value 属性赋值
      const objAttrAssignMatch = trimmed.match(/^(\w+(?:\.\w+)*)\.(\w+)\s*=(?!=)\s*(.+)$/);
      if (objAttrAssignMatch && !trimmed.startsWith('self.')) {
        const obj = evalExpr(objAttrAssignMatch[1]);
        if (obj && typeof obj === 'object' && obj.__class__) {
          setAttr(obj, objAttrAssignMatch[2], evalExpr(objAttrAssignMatch[3]));
          i++;
          continue;
        }
      }

      const augMatch = trimmed.match(/^(\w+)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
      if (augMatch) {
        const v = vars[augMatch[1]] || 0;
        const r = evalExpr(augMatch[3]);
        if (augMatch[2] === '+=') vars[augMatch[1]] = (typeof v === 'number' && typeof r === 'number') ? v + r : String(v) + String(r);
        else if (augMatch[2] === '-=') vars[augMatch[1]] = v - r;
        else if (augMatch[2] === '*=') vars[augMatch[1]] = v * r;
        else if (augMatch[2] === '/=') vars[augMatch[1]] = v / r;
        i++;
        continue;
      }

      const assignMatch = trimmed.match(/^(\w+)\s*=(?!=)\s*(.+)$/);
      if (assignMatch) {
        const rhs = assignMatch[2].trim();
        // 检查是否是类实例化: var = ClassName(args)
        const newObjMatch = rhs.match(/^(\w+)\((.*)\)$/);
        if (newObjMatch && classes[newObjMatch[1]]) {
          const args = newObjMatch[2] ? splitTopLevel(newObjMatch[2], ',').map(a => evalExpr(a.trim())) : [];
          vars[assignMatch[1]] = createInstance(newObjMatch[1], args);
        } else {
          vars[assignMatch[1]] = evalExpr(rhs);
        }
        i++;
        continue;
      }

      const fnCallMatch = trimmed.match(/^(\w+)\((.*)\)$/);
      if (fnCallMatch && funcs[fnCallMatch[1]]) {
        const args = fnCallMatch[2] ? splitTopLevel(fnCallMatch[2], ',').map(a => evalExpr(a.trim())) : [];
        await callFunc(fnCallMatch[1], args);
        if (hasReturn) { control = 'return'; break; }
        i++;
        continue;
      }

      // 异步方法调用语句: obj.method(args) 或 self.method(args)
      const methodCallMatch = trimmed.match(/^(\w+(?:\.\w+)*)\((.*)\)$/);
      if (methodCallMatch) {
        const fullExpr = methodCallMatch[1];
        const argsStr = methodCallMatch[2];
        if (fullExpr.includes('.')) {
          const dotIdx = fullExpr.lastIndexOf('.');
          const objExpr = fullExpr.slice(0, dotIdx);
          const methodName = fullExpr.slice(dotIdx + 1);
          const obj = evalExpr(objExpr);
          if (obj && typeof obj === 'object' && obj.__class__) {
            const cls = classes[obj.__class__];
            if (cls && cls.methods[methodName]) {
              const args = argsStr ? splitTopLevel(argsStr, ',').map(a => evalExpr(a.trim())) : [];
              await callMethodAsync(obj, methodName, args);
              if (hasReturn) { control = 'return'; break; }
              i++;
              continue;
            }
          }
        }
      }

      i++;
    }

    return { nextIdx: i, control };
  }

  await execFrom(0, -1);
  return { error, hasOutput };
}

function formatPythonError(msg) {
  return msg.replace(/^PythonError: /, '').trim();
}

function initMarkdownEditor() {
  const codeArea = document.getElementById('mdCode');
  const preview = document.getElementById('mdPreview');

  if (!codeArea || !preview) return;

  if (window.marked) {
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: false,
      mangle: false
    });
  }

  function updatePreview() {
    const md = codeArea.value;
    if (window.marked) {
      let html = marked.parse(md);
      preview.innerHTML = html;
      if (window.Prism) {
        preview.querySelectorAll('pre code').forEach(block => {
          Prism.highlightElement(block);
        });
      }
    } else {
      preview.innerHTML = '<p style="color:var(--t4)">Markdown 解析器加载失败</p>';
    }
  }

  updatePreview();

  let debounceTimer;
  codeArea.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updatePreview, 150);
  });

  codeArea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeArea.selectionStart;
      const end = codeArea.selectionEnd;
      const value = codeArea.value;
      codeArea.value = value.substring(0, start) + '  ' + value.substring(end);
      codeArea.selectionStart = codeArea.selectionEnd = start + 2;
      updatePreview();
    }
  });

  let isSyncing = false;
  codeArea.addEventListener('scroll', () => {
    if (isSyncing) return;
    isSyncing = true;
    const ratio = codeArea.scrollTop / (codeArea.scrollHeight - codeArea.clientHeight || 1);
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    requestAnimationFrame(() => { isSyncing = false; });
  });
}

function initMarkdownActions() {
  const copyBtn = document.getElementById('mdCopy');
  const downloadBtn = document.getElementById('mdDownload');
  const codeArea = document.getElementById('mdCode');

  if (copyBtn && codeArea) {
    copyBtn.addEventListener('click', () => {
      codeArea.select();
      navigator.clipboard.writeText(codeArea.value).then(() => {
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> 已复制';
        setTimeout(() => { copyBtn.innerHTML = original; }, 1500);
      }).catch(() => {
        document.execCommand('copy');
      });
    });
  }

  if (downloadBtn && codeArea) {
    downloadBtn.addEventListener('click', () => {
      const blob = new Blob([codeArea.value], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.md';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

function initPythonImportButton() {
  const importBtn = document.getElementById('pyImport');
  const fileInput = document.getElementById('pyImportFile');
  const codeArea = document.getElementById('pyCode');
  const highlight = document.getElementById('pyHighlight');

  if (!importBtn || !fileInput || !codeArea) return;

  importBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      codeArea.value = ev.target.result;
      if (highlight) {
        const codeEl = highlight.querySelector('code');
        if (codeEl) {
          codeEl.textContent = codeArea.value + '\n';
          if (window.Prism) Prism.highlightElement(codeEl);
        }
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });
}

function initMarkdownImportButton() {
  const importBtn = document.getElementById('mdImport');
  const fileInput = document.getElementById('mdImportFile');
  const codeArea = document.getElementById('mdCode');

  if (!importBtn || !fileInput || !codeArea) return;

  importBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      codeArea.value = ev.target.result;
      codeArea.dispatchEvent(new Event('input'));
    };
    reader.readAsText(file);
    fileInput.value = '';
  });
}

/* ================================================================
   Python 引擎切换：系统自带（builtin） / Pyodide
   Pyodide 懒加载，首次使用时下载
   ================================================================ */

let pyodideInstance = null;
let pyodideLoading = false;

async function loadPyodideRuntime(outputEl) {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoading) {
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (pyodideInstance) {
          clearInterval(check);
          resolve(pyodideInstance);
        }
      }, 200);
    });
  }
  pyodideLoading = true;
  if (outputEl) {
    const msg = document.createElement('span');
    msg.className = 'py-info';
    msg.textContent = '正在加载 Pyodide 运行环境（首次加载较慢，请稍候）...\n';
    outputEl.appendChild(msg);
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
    script.onload = async () => {
      try {
        pyodideInstance = await loadPyodide({
          stdout: (text) => {
            if (outputEl) {
              const span = document.createElement('span');
              span.textContent = text + '\n';
              outputEl.appendChild(span);
              outputEl.scrollTop = outputEl.scrollHeight;
            }
          },
          stderr: (text) => {
            if (outputEl) {
              const span = document.createElement('span');
              span.className = 'py-err';
              span.textContent = text + '\n';
              outputEl.appendChild(span);
              outputEl.scrollTop = outputEl.scrollHeight;
            }
          }
        });
        pyodideLoading = false;
        resolve(pyodideInstance);
      } catch (e) {
        pyodideLoading = false;
        reject(e);
      }
    };
    script.onerror = () => {
      pyodideLoading = false;
      reject(new Error('Pyodide 加载失败，请检查网络连接'));
    };
    document.head.appendChild(script);
  });
}

// 重写 runPython 以支持引擎切换
const originalRunPython = runPython;

runPython = async function() {
  const engine = document.getElementById('pyEngine');
  const engineType = engine ? engine.value : 'builtin';
  const codeArea = document.getElementById('pyCode');
  const output = document.getElementById('pyOutput');
  const runBtn = document.getElementById('pyRun');

  if (!codeArea || !output) return;

  if (engineType === 'builtin') {
    return originalRunPython();
  }

  const code = codeArea.value;
  runBtn.disabled = true;
  runBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg> 运行中...';

  try {
    output.innerHTML = '';
    const pyodide = await loadPyodideRuntime(output);
    output.innerHTML = '';
    try {
      await pyodide.runPythonAsync(code);
    } catch (err) {
      const errSpan = document.createElement('span');
      errSpan.className = 'py-err';
      errSpan.textContent = String(err.message || err);
      output.appendChild(errSpan);
    }
    if (output.children.length === 0) {
      output.innerHTML = '<span class="py-success">代码执行完成（无输出）</span>';
    }
  } catch (err) {
    output.innerHTML = '';
    const errSpan = document.createElement('span');
    errSpan.className = 'py-err';
    errSpan.textContent = String(err.message || err);
    output.appendChild(errSpan);
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> 运行';
  }
};

// 保存引擎选择偏好
document.addEventListener('DOMContentLoaded', () => {
  const engineSel = document.getElementById('pyEngine');
  if (engineSel) {
    const saved = localStorage.getItem('py_engine');
    if (saved) engineSel.value = saved;
    engineSel.addEventListener('change', () => {
      localStorage.setItem('py_engine', engineSel.value);
    });
  }
});

/* ================================================================
   HTML / CSS / JavaScript 在线预览（iframe + srcdoc）
   ================================================================ */

function initHtmlPreview() {
  const codeEl = document.getElementById('htmlCode');
  const preview = document.getElementById('htmlPreview');
  const refreshBtn = document.getElementById('htmlRefresh');
  if (!codeEl || !preview) return;

  function render() {
    preview.srcdoc = codeEl.value;
  }

  let timer;
  codeEl.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(render, 400);
  });

  if (refreshBtn) refreshBtn.addEventListener('click', render);
  setTimeout(render, 200);

  setupImportDownload('html', '.html', 'index.html');
}

function initCssPreview() {
  const codeEl = document.getElementById('cssCode');
  const preview = document.getElementById('cssPreview');
  const refreshBtn = document.getElementById('cssRefresh');
  if (!codeEl || !preview) return;

  const demoHtml = `<!DOCTYPE html>
<html>
<head>
  <style id="__demo_css"></style>
</head>
<body>
  <div class="demo-box">
    <h2>CSS 预览演示</h2>
    <p>在这里可以实时预览你的 CSS 效果。</p>
    <button class="demo-btn">演示按钮</button>
  </div>
  <div class="demo-box" style="margin-top:16px;">
    <h3>卡片 2</h3>
    <p>第二个演示卡片。</p>
  </div>
</body>
</html>`;

  function render() {
    const doc = demoHtml.replace('<style id="__demo_css"></style>', `<style id="__demo_css">${codeEl.value}</style>`);
    preview.srcdoc = doc;
  }

  let timer;
  codeEl.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(render, 300);
  });

  if (refreshBtn) refreshBtn.addEventListener('click', render);
  setTimeout(render, 200);

  setupImportDownload('css', '.css', 'style.css');
}

function initJsPreview() {
  const codeEl = document.getElementById('jsCode');
  const preview = document.getElementById('jsPreview');
  const refreshBtn = document.getElementById('jsRefresh');
  if (!codeEl || !preview) return;

  function render() {
    const doc = `<!DOCTYPE html>
<html>
<body>
<script>
try {
${codeEl.value}
} catch(e) {
  document.body.innerHTML = '<pre style="color:red;padding:20px;">' + e.message + '</pre>';
}
<\/script>
</body>
</html>`;
    preview.srcdoc = doc;
  }

  if (refreshBtn) refreshBtn.addEventListener('click', render);
  setTimeout(render, 200);

  setupImportDownload('js', '.js', 'main.js');
}

function setupImportDownload(prefix, ext, fileName) {
  const downloadBtn = document.getElementById(prefix + 'Download');
  const codeArea = document.getElementById(prefix + 'Code');
  const importBtn = document.getElementById(prefix + 'Import');
  const importFile = document.getElementById(prefix + 'ImportFile');

  if (downloadBtn && codeArea) {
    downloadBtn.addEventListener('click', () => {
      const blob = new Blob([codeArea.value], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (importBtn && importFile && codeArea) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        codeArea.value = ev.target.result;
        codeArea.dispatchEvent(new Event('input'));
      };
      reader.readAsText(file);
      importFile.value = '';
    });
  }
}

/* ================================================================
   通用代码编辑器 Prism 高亮初始化
   适用于 HTML / CSS / JavaScript / Markdown 编辑器
   ================================================================ */

function initCodeHighlight(textareaId, highlightId, tabSpaces) {
  const codeArea = document.getElementById(textareaId);
  const highlight = document.getElementById(highlightId);
  if (!codeArea || !highlight) return;
  const codeEl = highlight.querySelector('code');
  if (!codeEl) return;

  const tabStr = ' '.repeat(tabSpaces || 2);

  function updateHighlight() {
    codeEl.textContent = codeArea.value + '\n';
    if (window.Prism) {
      Prism.highlightElement(codeEl);
    }
  }

  updateHighlight();

  codeArea.addEventListener('input', updateHighlight);

  codeArea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeArea.selectionStart;
      const end = codeArea.selectionEnd;
      const value = codeArea.value;
      codeArea.value = value.substring(0, start) + tabStr + value.substring(end);
      codeArea.selectionStart = codeArea.selectionEnd = start + tabStr.length;
      updateHighlight();
    }
  });

  codeArea.addEventListener('scroll', () => {
    highlight.scrollTop = codeArea.scrollTop;
    highlight.scrollLeft = codeArea.scrollLeft;
  });

  // 返回更新函数，供外部（如导入文件）调用
  return { update: updateHighlight };
}

// 各编辑器高亮实例（供导入等场景调用）
window._highlighters = {};

document.addEventListener('DOMContentLoaded', () => {
  window._highlighters.html = initCodeHighlight('htmlCode', 'htmlHighlight', 2);
  window._highlighters.css = initCodeHighlight('cssCode', 'cssHighlight', 2);
  window._highlighters.javascript = initCodeHighlight('jsCode', 'jsHighlight', 2);
  window._highlighters.markdown = initCodeHighlight('mdCode', 'mdHighlight', 2);
});

/* ================================================================
   TypeScript 在线运行
   使用 TypeScript 编译器将 TS 转译为 JS，通过 new Function 执行
   ================================================================ */

function initTypeScript() {
  const runBtn = document.getElementById('tsRun');
  const codeArea = document.getElementById('tsCode');
  const output = document.getElementById('tsOutput');
  const highlight = document.getElementById('tsHighlight');
  const downloadBtn = document.getElementById('tsDownload');
  const importBtn = document.getElementById('tsImport');
  const importFile = document.getElementById('tsImportFile');

  if (!runBtn || !codeArea || !output) return;

  if (highlight) {
    const codeEl = highlight.querySelector('code');
    if (codeEl) {
      function updateHighlight() {
        codeEl.textContent = codeArea.value + '\n';
        if (window.Prism) Prism.highlightElement(codeEl);
      }
      updateHighlight();
      codeArea.addEventListener('input', updateHighlight);
      codeArea.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const s = codeArea.selectionStart, en = codeArea.selectionEnd;
          codeArea.value = codeArea.value.substring(0, s) + '  ' + codeArea.value.substring(en);
          codeArea.selectionStart = codeArea.selectionEnd = s + 2;
          updateHighlight();
        }
      });
      codeArea.addEventListener('scroll', () => {
        highlight.scrollTop = codeArea.scrollTop;
        highlight.scrollLeft = codeArea.scrollLeft;
      });
    }
  }

  let tsLoader = null;
  function loadTsCompiler() {
    if (window.ts) return Promise.resolve();
    if (tsLoader) return tsLoader;
    tsLoader = new Promise((resolve, reject) => {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/typescript@5.3.3/lib/typescript.js';
      s.onload = function() { resolve(); };
      s.onerror = function() { tsLoader = null; reject(new Error('TypeScript 编译器加载失败，请检查网络连接')); };
      document.head.appendChild(s);
    });
    return tsLoader;
  }

  runBtn.addEventListener('click', async () => {
    const code = codeArea.value;
    runBtn.disabled = true;
    output.innerHTML = '';

    try {
      if (!window.ts) {
        runBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg> 加载编译器...';
        await loadTsCompiler();
      }
      runBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg> 运行中...';

      if (!window.ts) throw new Error('TypeScript 编译器加载失败');

      const result = ts.transpileModule(code, {
        compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.None }
      });

      const jsCode = result.outputText;
      const out = [];
      const fakeConsole = {
        log: (...args) => out.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
        error: (...args) => out.push(args.map(a => String(a)).join(' ')),
        warn: (...args) => out.push(args.map(a => String(a)).join(' ')),
        info: (...args) => out.push(args.map(a => String(a)).join(' '))
      };

      try {
        new Function('console', jsCode)(fakeConsole);
      } catch(e) {
        out.push('Error: ' + e.message);
      }

      if (out.length === 0) {
        output.innerHTML = '<span class="py-success">代码执行完成（无输出）</span>';
      } else {
        const span = document.createElement('span');
        span.textContent = out.join('\n');
        output.appendChild(span);
      }
    } catch (err) {
      const errSpan = document.createElement('span');
      errSpan.className = 'py-err';
      errSpan.textContent = String(err.message || err);
      output.appendChild(errSpan);
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> 运行';
    }
  });

  if (downloadBtn && codeArea) {
    downloadBtn.addEventListener('click', () => {
      const blob = new Blob([codeArea.value], { type: 'text/x-typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'main.ts'; a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (importBtn && importFile && codeArea) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        codeArea.value = ev.target.result;
        codeArea.dispatchEvent(new Event('input'));
      };
      reader.readAsText(file);
      importFile.value = '';
    });
  }
}

/* ================================================================
   PHP 在线运行
   内置 PHP→JS 转译器，通过 new Function 执行
   ================================================================ */

function initPhpRun() {
  const runBtn = document.getElementById('phpRun');
  if (runBtn) runBtn.addEventListener('click', runPhp);
}

async function runPhp() {
  const codeArea = document.getElementById('phpCode');
  const output = document.getElementById('phpOutput');
  const runBtn = document.getElementById('phpRun');

  if (!codeArea || !output) return;
  const code = codeArea.value;

  runBtn.disabled = true;
  runBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg> 运行中...';

  output.innerHTML = '';

  try {
    const out = [];
    const echo = (...args) => { out.push(args.join('')); };
    const print = (...args) => { out.push(args.join('')); };

    const PHP_VERSION = '8.2.0';
    const count = (a) => Array.isArray(a) ? a.length : (a && typeof a === 'object' ? Object.keys(a).length : 0);
    const array_sum = (a) => Array.isArray(a) ? a.reduce((s, v) => s + Number(v || 0), 0) : 0;
    const array_column = (a, c) => Array.isArray(a) ? a.map(i => i ? i[c] : null) : [];
    const array_keys = (a) => Array.isArray(a) ? a.map((_, i) => i) : Object.keys(a);
    const array_values = (a) => Array.isArray(a) ? a : Object.values(a);
    const array_merge = (...arrs) => arrs.flat();
    const array_reverse = (a) => [...a].reverse();
    const array_slice = (a, off, len) => a.slice(off, len !== undefined ? off + len : undefined);
    const array_splice = (a, off, len, ...items) => { a.splice(off, len, ...items); return a; };
    const array_push = (a, ...items) => { a.push(...items); return a.length; };
    const array_pop = (a) => a.pop();
    const array_shift = (a) => a.shift();
    const array_unshift = (a, ...items) => { a.unshift(...items); return a.length; };
    const array_map = (fn, a) => a.map(fn);
    const array_filter = (a, fn) => fn ? a.filter(fn) : a.filter(v => v);
    const array_reduce = (a, fn, init) => a.reduce(fn, init);
    const array_combine = (k, v) => { const o = {}; k.forEach((kk, i) => o[kk] = v[i]); return o; };
    const in_array = (n, a) => a.includes(n);
    const implode = (sep, a) => Array.isArray(a) ? a.join(sep) : String(a);
    const explode = (sep, s) => String(s).split(sep);
    const strlen = (s) => String(s).length;
    const strtoupper = (s) => String(s).toUpperCase();
    const strtolower = (s) => String(s).toLowerCase();
    const str_replace = (s, r, subj) => String(subj).split(s).join(r);
    const str_repeat = (s, n) => String(s).repeat(n);
    const substr = (s, start, len) => len !== undefined ? String(s).substr(start, len) : String(s).substr(start);
    const trim = (s) => String(s).trim();
    const ltrim = (s) => String(s).trimStart();
    const rtrim = (s) => String(s).trimEnd();
    const str_pad = (s, len, pad, side) => { pad = pad || ' '; side = side || 'right'; const d = len - s.length; if (d <= 0) return s; const p = pad.repeat(Math.ceil(d / pad.length)).slice(0, d); return side === 'left' ? p + s : s + p; };
    const sprintf_impl = (fmt, ...args) => { let i = 0; return fmt.replace(/%[sdif]/g, () => String(args[i++])); };
    const number_format = (n, dec) => Number(n).toFixed(dec || 0);
    const range = (start, end, step) => { step = step || 1; const r = []; for (let v = start; step > 0 ? v <= end : v >= end; v += step) r.push(v); return r; };
    const is_array = (v) => Array.isArray(v);
    const is_string = (v) => typeof v === 'string';
    const is_numeric = (v) => typeof v === 'number' || /^-?\d+(\.\d+)?$/.test(String(v));
    const is_null = (v) => v === null;
    const isset = (v) => v !== undefined && v !== null;
    const empty = (v) => !v || (Array.isArray(v) && v.length === 0) || v === '';
    const gettype = (v) => { if (Array.isArray(v)) return 'array'; if (v === null) return 'NULL'; return typeof v; };
    const get_class = (v) => v && v.__class__ ? v.__class__ : false;
    const var_dump = (v) => { out.push(typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)); };
    const print_r = (v) => { out.push(typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)); };
    const json_encode = (v) => JSON.stringify(v);
    const json_decode = (s) => JSON.parse(s);
    const intval = (v) => parseInt(v);
    const floatval = (v) => parseFloat(v);
    const strval = (v) => String(v);
    const abs = (v) => Math.abs(v);
    const max_fn = (...a) => Math.max(...a.flat());
    const min_fn = (...a) => Math.min(...a.flat());
    const round_fn = (n, d) => { d = d || 0; const f = Math.pow(10, d); return Math.round(n * f) / f; };
    const floor_fn = (n) => Math.floor(n);
    const ceil_fn = (n) => Math.ceil(n);
    const sqrt_fn = (n) => Math.sqrt(n);
    const pow_fn = (b, e) => Math.pow(b, e);
    const date_fn = (fmt) => { const d = new Date(); return fmt.replace(/Y/g, d.getFullYear()).replace(/m/g, String(d.getMonth()+1).padStart(2,'0')).replace(/d/g, String(d.getDate()).padStart(2,'0')).replace(/H/g, String(d.getHours()).padStart(2,'0')).replace(/i/g, String(d.getMinutes()).padStart(2,'0')).replace(/s/g, String(d.getSeconds()).padStart(2,'0')); };
    const time_fn = () => Math.floor(Date.now() / 1000);
    const sort_fn = (a) => { a.sort((x, y) => x - y); return a; };
    const rsort_fn = (a) => { a.sort((x, y) => y - x); return a; };
    const asort_fn = (a) => { if (Array.isArray(a)) a.sort((x, y) => x - y); return a; };
    const usort_fn = (a, fn) => { a.sort(fn); return a; };
    const compact_fn = () => ({});
    const extract_fn = () => 0;

    const jsCode = transpilePhp(code);

    const fn = new Function('echo', 'print', 'PHP_VERSION', 'count', 'array_sum',
      'array_column', 'array_keys', 'array_values', 'array_merge', 'array_reverse',
      'array_slice', 'array_splice', 'array_push', 'array_pop', 'array_shift',
      'array_unshift', 'array_map', 'array_filter', 'array_reduce', 'array_combine',
      'in_array', 'implode', 'explode', 'strlen', 'strtoupper', 'strtolower',
      'str_replace', 'str_repeat', 'substr', 'trim', 'ltrim', 'rtrim', 'str_pad',
      'sprintf', 'number_format', 'range', 'is_array', 'is_string', 'is_numeric',
      'is_null', 'isset', 'empty', 'gettype', 'get_class', 'var_dump', 'print_r',
      'json_encode', 'json_decode', 'intval', 'floatval', 'strval', 'abs', 'max',
      'min', 'round', 'floor', 'ceil', 'sqrt', 'pow', 'date', 'time', 'sort',
      'rsort', 'asort', 'usort',
      jsCode);

    fn(echo, print, PHP_VERSION, count, array_sum, array_column, array_keys,
      array_values, array_merge, array_reverse, array_slice, array_splice,
      array_push, array_pop, array_shift, array_unshift, array_map, array_filter,
      array_reduce, array_combine, in_array, implode, explode, strlen,
      strtoupper, strtolower, str_replace, str_repeat, substr, trim, ltrim,
      rtrim, str_pad, sprintf_impl, number_format, range, is_array, is_string,
      is_numeric, is_null, isset, empty, gettype, get_class, var_dump, print_r,
      json_encode, json_decode, intval, floatval, strval, abs, max_fn, min_fn,
      round_fn, floor_fn, ceil_fn, sqrt_fn, pow_fn, date_fn, time_fn,
      sort_fn, rsort_fn, asort_fn, usort_fn);

    if (out.length === 0) {
      output.innerHTML = '<span class="py-success">代码执行完成（无输出）</span>';
    } else {
      const span = document.createElement('span');
      span.textContent = out.join('');
      output.appendChild(span);
    }
  } catch (err) {
    const errSpan = document.createElement('span');
    errSpan.className = 'py-err';
    errSpan.textContent = 'PHP Error: ' + (err.message || String(err));
    output.appendChild(errSpan);
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> 运行';
  }
}

function transpilePhp(phpCode) {
  let code = phpCode;

  code = code.replace(/<\?php\s*/g, '').replace(/\?>\s*$/g, '');

  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  code = code.replace(/\/\/[^\n]*/g, '');
  code = code.replace(/^[ \t]*#[^\n]*/gm, '');

  code = code.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, str) => {
    if (!str.includes('$')) return match;
    let c = str;
    c = c.replace(/\{\$([^}]+)\}/g, '${$1}');
    c = c.replace(/\$(\w+(?:\[[^\]]*\]|\->\w+)*)/g, '${$1}');
    c = c.replace(/->/g, '.');
    c = c.replace(/\\"/g, '"');
    return '`' + c + '`';
  });

  code = code.replace(/foreach\s*\(\s*\$(\w+)\s+as\s+\$(\w+)\s*=>\s*\$(\w+)\s*\)/g,
    'for (const [$2, $3] of Object.entries($1))');
  code = code.replace(/foreach\s*\(\s*\$(\w+)\s+as\s+\$(\w+)\s*\)/g,
    'for (const $2 of $1)');

  code = code.replace(/\$(\w+)/g, '$1');

  code = code.split('\n').map(line => {
    const m = line.match(/^(\s*)(echo|print)\s+(.+);(.*)$/);
    if (m) return m[1] + m[2] + '(' + m[3] + ');' + m[4];
    return line;
  }).join('\n');

  code = code.replace(/=>/g, ':');

  code = convertArrayFunc(code);

  code = code.replace(/->/g, '.');

  code = code.replace(/\s\.\s/g, ' + ');

  code = convertBracketArrays(code);

  return code;
}

function convertArrayFunc(code) {
  let result = '';
  let i = 0;
  while (i < code.length) {
    if (code.substring(i, i + 7).match(/^array\s*\(/)) {
      const start = code.indexOf('(', i);
      result += '[';
      i = start + 1;
      let depth = 1;
      let inStr = false, strCh = '';
      while (i < code.length && depth > 0) {
        const c = code[i];
        if (inStr) {
          if (c === strCh && code[i - 1] !== '\\') inStr = false;
          result += c;
        } else if (c === '"' || c === "'" || c === '`') {
          inStr = true; strCh = c; result += c;
        } else if (c === '(' || c === '[' || c === '{') {
          depth++; result += c;
        } else if (c === ')') {
          depth--;
          if (depth === 0) { result += ']'; i++; break; }
          result += c;
        } else result += c;
        i++;
      }
    } else {
      result += code[i];
      i++;
    }
  }
  return result;
}

function convertBracketArrays(code) {
  let result = '';
  let i = 0;
  while (i < code.length) {
    if (code[i] === '[') {
      let depth = 1, j = i + 1, inStr = false, strCh = '';
      while (j < code.length && depth > 0) {
        const c = code[j];
        if (inStr) {
          if (c === strCh && code[j - 1] !== '\\') inStr = false;
        } else if (c === '"' || c === "'" || c === '`') {
          inStr = true; strCh = c;
        } else if (c === '[' || c === '(' || c === '{') depth++;
        else if (c === ']') { depth--; if (depth === 0) break; }
        j++;
      }
      const content = code.substring(i + 1, j);
      const converted = convertBracketArrays(content);
      const isAssoc = /^['"`]?\w+['"`]?\s*:/.test(converted.trim()) ||
                      /,\s*['"`]?\w+['"`]?\s*:/.test(converted);
      result += isAssoc ? '{' + converted + '}' : '[' + converted + ']';
      i = j + 1;
    } else {
      result += code[i];
      i++;
    }
  }
  return result;
}

function initPhpHighlight() {
  const codeArea = document.getElementById('phpCode');
  const highlight = document.getElementById('phpHighlight');
  if (!codeArea || !highlight) return;
  const codeEl = highlight.querySelector('code');
  if (!codeEl) return;

  function updateHighlight() {
    codeEl.textContent = codeArea.value + '\n';
    if (window.Prism) Prism.highlightElement(codeEl);
  }
  updateHighlight();
  codeArea.addEventListener('input', updateHighlight);
  codeArea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = codeArea.selectionStart, en = codeArea.selectionEnd;
      codeArea.value = codeArea.value.substring(0, s) + '    ' + codeArea.value.substring(en);
      codeArea.selectionStart = codeArea.selectionEnd = s + 4;
      updateHighlight();
    }
  });
  codeArea.addEventListener('scroll', () => {
    highlight.scrollTop = codeArea.scrollTop;
    highlight.scrollLeft = codeArea.scrollLeft;
  });
}

function initPhpDownloadButton() {
  const downloadBtn = document.getElementById('phpDownload');
  const codeArea = document.getElementById('phpCode');
  if (!downloadBtn || !codeArea) return;
  downloadBtn.addEventListener('click', () => {
    const blob = new Blob([codeArea.value], { type: 'text/x-php' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'index.php'; a.click();
    URL.revokeObjectURL(url);
  });
}

function initPhpImportButton() {
  const importBtn = document.getElementById('phpImport');
  const importFile = document.getElementById('phpImportFile');
  const codeArea = document.getElementById('phpCode');
  const highlight = document.getElementById('phpHighlight');
  if (!importBtn || !importFile || !codeArea) return;
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      codeArea.value = ev.target.result;
      if (highlight) {
        const codeEl = highlight.querySelector('code');
        if (codeEl) {
          codeEl.textContent = codeArea.value + '\n';
          if (window.Prism) Prism.highlightElement(codeEl);
        }
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  });
}

/* ================================================================
   CSS 格式化 / 压缩
   ================================================================ */

function initCssFormatter() {
  const codeArea = document.getElementById('cssFmtCode');
  const outputArea = document.getElementById('cssFmtOutput');
  const outputHighlight = document.getElementById('cssFmtOutputHighlight');
  const formatBtn = document.getElementById('cssFmtFormat');
  const compressBtn = document.getElementById('cssFmtCompress');
  const clearBtn = document.getElementById('cssFmtClear');
  const copyBtn = document.getElementById('cssFmtCopy');
  const highlight = document.getElementById('cssFmtHighlight');

  if (!codeArea || !outputArea) return;

  if (highlight) {
    const codeEl = highlight.querySelector('code');
    if (codeEl) {
      function updateHighlight() {
        codeEl.textContent = codeArea.value + '\n';
        if (window.Prism) Prism.highlightElement(codeEl);
      }
      updateHighlight();
      codeArea.addEventListener('input', updateHighlight);
      codeArea.addEventListener('scroll', () => {
        highlight.scrollTop = codeArea.scrollTop;
        highlight.scrollLeft = codeArea.scrollLeft;
      });
    }
  }

  function updateOutputHighlight() {
    if (!outputHighlight) return;
    const codeEl = outputHighlight.querySelector('code');
    if (!codeEl) return;
    codeEl.textContent = outputArea.value + '\n';
    if (window.Prism) Prism.highlightElement(codeEl);
    outputHighlight.scrollTop = outputArea.scrollTop;
    outputHighlight.scrollLeft = outputArea.scrollLeft;
  }

  outputArea.addEventListener('scroll', () => {
    if (outputHighlight) {
      outputHighlight.scrollTop = outputArea.scrollTop;
      outputHighlight.scrollLeft = outputArea.scrollLeft;
    }
  });

  function formatCss(css) {
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    css = css.replace(/\s*\{\s*/g, ' {\n  ');
    css = css.replace(/\s*;\s*/g, ';\n  ');
    css = css.replace(/\s*\}\s*/g, '\n}\n\n');
    css = css.replace(/\n  \n/g, '\n');
    css = css.replace(/\n\n+/g, '\n\n');
    css = css.replace(/^\s+/gm, (match) => match.replace(/\t/g, '  '));
    css = css.replace(/\n  \n}/g, '\n}');
    css = css.trim() + '\n';
    return css;
  }

  function compressCss(css) {
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    css = css.replace(/\s*:\s*/g, ':');
    css = css.replace(/\s*;\s*/g, ';');
    css = css.replace(/\s*\{\s*/g, '{');
    css = css.replace(/\s*\}\s*/g, '}');
    css = css.replace(/\s*,\s*/g, ',');
    css = css.replace(/\n+/g, '');
    css = css.replace(/;}/g, '}');
    css = css.trim();
    return css;
  }

  if (formatBtn) formatBtn.addEventListener('click', () => {
    outputArea.value = formatCss(codeArea.value);
    updateOutputHighlight();
  });

  if (compressBtn) compressBtn.addEventListener('click', () => {
    outputArea.value = compressCss(codeArea.value);
    updateOutputHighlight();
  });

  if (clearBtn) clearBtn.addEventListener('click', () => {
    codeArea.value = '';
    outputArea.value = '';
    if (highlight) {
      const codeEl = highlight.querySelector('code');
      if (codeEl) { codeEl.textContent = '\n'; if (window.Prism) Prism.highlightElement(codeEl); }
    }
    updateOutputHighlight();
  });

  if (copyBtn) copyBtn.addEventListener('click', () => {
    if (!outputArea.value) return;
    navigator.clipboard.writeText(outputArea.value).then(() => {
      const original = copyBtn.innerHTML;
      copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> 已复制';
      setTimeout(() => { copyBtn.innerHTML = original; }, 1500);
    }).catch(() => {
      outputArea.select();
      document.execCommand('copy');
    });
  });
}

/* ================================================================
   Base64 加密 / 解密
   ================================================================ */

function initBase64() {
  const input = document.getElementById('b64Input');
  const output = document.getElementById('b64Output');
  const encodeBtn = document.getElementById('b64Encode');
  const decodeBtn = document.getElementById('b64Decode');
  const clearBtn = document.getElementById('b64Clear');
  const swapBtn = document.getElementById('b64Swap');
  const copyBtn = document.getElementById('b64Copy');

  if (!input || !output) return;

  function encodeBase64(text) {
    try {
      return btoa(unescape(encodeURIComponent(text)));
    } catch(e) {
      return '编码失败：' + e.message;
    }
  }

  function decodeBase64(base64) {
    try {
      return decodeURIComponent(escape(atob(base64.trim())));
    } catch(e) {
      return '解码失败：输入不是有效的 Base64 字符串';
    }
  }

  if (encodeBtn) encodeBtn.addEventListener('click', () => {
    output.value = encodeBase64(input.value);
  });

  if (decodeBtn) decodeBtn.addEventListener('click', () => {
    output.value = decodeBase64(input.value);
  });

  if (clearBtn) clearBtn.addEventListener('click', () => {
    input.value = '';
    output.value = '';
  });

  if (swapBtn) swapBtn.addEventListener('click', () => {
    const tmp = input.value;
    input.value = output.value;
    output.value = tmp;
  });

  if (copyBtn) copyBtn.addEventListener('click', () => {
    if (!output.value) return;
    navigator.clipboard.writeText(output.value).then(() => {
      const original = copyBtn.innerHTML;
      copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> 已复制';
      setTimeout(() => { copyBtn.innerHTML = original; }, 1500);
    }).catch(() => {
      output.select();
      document.execCommand('copy');
    });
  });
}

/* ================================================================
   在线调色板
   ================================================================ */

function initColorPicker() {
  const picker = document.getElementById('colorPicker');
  const preview = document.getElementById('colorPreview');
  const hexInput = document.getElementById('colorHex');
  const rgbInput = document.getElementById('colorRgb');
  const hslInput = document.getElementById('colorHsl');
  const copyBtn = document.getElementById('colorCopy');
  const paletteGrid = document.getElementById('colorPalette');
  const tabs = document.querySelectorAll('.color-tab');

  if (!picker || !preview) return;

  let currentScheme = 'complementary';

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  function updateAll(hex) {
    hex = hex.toLowerCase();
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    picker.value = hex;
    preview.style.background = hex;
    hexInput.value = hex;
    rgbInput.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    hslInput.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

    updatePalette(hex, currentScheme);
  }

  function generatePalette(hex, scheme) {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const colors = [];

    switch (scheme) {
      case 'complementary':
        colors.push(hex);
        colors.push(hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l));
        for (let i = 1; i <= 2; i++) {
          colors.push(hslToHex(hsl.h, hsl.s, Math.max(10, hsl.l - i * 15)));
          colors.push(hslToHex((hsl.h + 180) % 360, hsl.s, Math.max(10, hsl.l - i * 15)));
        }
        break;
      case 'analogous':
        for (let i = -2; i <= 2; i++) {
          colors.push(hslToHex((hsl.h + i * 30 + 360) % 360, hsl.s, hsl.l));
        }
        break;
      case 'triadic':
        colors.push(hex);
        colors.push(hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l));
        colors.push(hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l));
        for (let i = 1; i <= 2; i++) {
          colors.push(hslToHex(hsl.h, hsl.s, Math.max(10, hsl.l - i * 20)));
          colors.push(hslToHex((hsl.h + 120) % 360, hsl.s, Math.max(10, hsl.l - i * 20)));
        }
        break;
      case 'shades':
        colors.push(hex);
        for (let i = 1; i <= 5; i++) {
          colors.push(hslToHex(hsl.h, hsl.s, Math.max(5, hsl.l - i * 15)));
        }
        for (let i = 1; i <= 3; i++) {
          colors.unshift(hslToHex(hsl.h, hsl.s, Math.min(95, hsl.l + i * 15)));
        }
        break;
    }
    return colors;
  }

  function hslToHex(h, s, l) {
    const rgb = hslToRgb(h, s, l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  function updatePalette(hex, scheme) {
    const colors = generatePalette(hex, scheme);
    if (!paletteGrid) return;
    paletteGrid.innerHTML = '';
    colors.forEach(color => {
      const rgb = hexToRgb(color);
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.innerHTML = `
        <div class="color-swatch-color" style="background:${color}"></div>
        <div class="color-swatch-info">
          <span class="color-swatch-hex">${color.toUpperCase()}</span>
          <span class="color-swatch-rgb">rgb(${rgb.r}, ${rgb.g}, ${rgb.b})</span>
        </div>
      `;
      swatch.addEventListener('click', () => {
        updateAll(color);
      });
      paletteGrid.appendChild(swatch);
    });
  }

  picker.addEventListener('input', () => updateAll(picker.value));

  hexInput.addEventListener('input', () => {
    const v = hexInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) updateAll(v);
  });

  rgbInput.addEventListener('input', () => {
    const m = rgbInput.value.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) updateAll(rgbToHex(parseInt(m[1]), parseInt(m[2]), parseInt(m[3])));
  });

  hslInput.addEventListener('input', () => {
    const m = hslInput.value.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
    if (m) {
      const rgb = hslToRgb(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
      updateAll(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentScheme = tab.dataset.scheme;
      updateAll(hexInput.value);
    });
  });

  if (copyBtn) copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(hexInput.value).then(() => {
      const original = copyBtn.innerHTML;
      copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> 已复制';
      setTimeout(() => { copyBtn.innerHTML = original; }, 1500);
    }).catch(() => {});
  });

  updateAll('#3b82f6');
}
