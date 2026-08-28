document.addEventListener('DOMContentLoaded', () => {
  initPythonHighlight();
  initPythonRunButton();
  initPythonDownloadButton();
  initPythonImportButton();
  initMarkdownEditor();
  initMarkdownActions();
  initMarkdownImportButton();
});

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
