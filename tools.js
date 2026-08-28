document.addEventListener('DOMContentLoaded', () => {
  initPythonHighlight();
  initPythonRunButton();
  initPythonDownloadButton();
  initMarkdownEditor();
  initMarkdownActions();
  initChatToggle();
  initChatInput();
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
         random.randint/choice、import（忽略）、注释、算术、
         class 类定义/实例化/方法、self 属性、字典/列表/字符串方法、
         元组解包、round()、time.time()
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

function processEscapes(str) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\' && i + 1 < str.length) {
      const next = str[i + 1];
      switch (next) {
        case 'n': result += '\n'; i++; break;
        case 't': result += '\t'; i++; break;
        case 'r': result += '\r'; i++; break;
        case '\\': result += '\\'; i++; break;
        case '"': result += '"'; i++; break;
        case "'": result += "'"; i++; break;
        case '0': result += '\0'; i++; break;
        default: result += next; i++; break;
      }
    } else {
      result += str[i];
    }
  }
  return result;
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

  vars['time'] = { time: () => Date.now() / 1000 };

  function appendOutput(text) {
    const parts = String(text).split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] !== '') {
        outputEl.appendChild(document.createTextNode(parts[i]));
      }
      if (i < parts.length - 1) {
        outputEl.appendChild(document.createElement('br'));
      }
    }
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

  function isPyObj(v) {
    return v && typeof v === 'object' && v.__class__ && v.__attrs__ !== undefined;
  }

  async function createInstance(className) {
    const cls = classes[className];
    if (!cls) return undefined;
    const obj = { __class__: className, __attrs__: {} };
    if (cls.methods['__init__']) {
      await callMethod(obj, '__init__', []);
    }
    return obj;
  }

  async function callMethod(obj, methodName, args) {
    const cls = classes[obj.__class__];
    if (!cls) return undefined;
    const method = cls.methods[methodName];
    if (!method) return undefined;
    const savedVars = { ...vars };
    vars['self'] = obj;
    method.params.slice(1).forEach((p, i) => { vars[p] = args[i]; });
    hasReturn = false;
    returnVal = undefined;
    await execFrom(method.bodyStart, method.bodyIndent);
    const result = hasReturn ? returnVal : undefined;
    Object.keys(vars).forEach(k => { if (!(k in savedVars)) delete vars[k]; });
    Object.assign(vars, savedVars);
    return result;
  }

  async function evalExpr(expr) {
    expr = expr.trim();
    if (!expr) return '';

    if (expr.startsWith("f'") || expr.startsWith('f"')) return evalFString(expr);
    if (expr.startsWith("'") || expr.startsWith('"')) {
      const m = expr.match(/^(['"])((?:.|\n)*?)\1$/);
      return m ? processEscapes(m[2]) : expr;
    }
    if (expr === 'True') return true;
    if (expr === 'False') return false;
    if (expr === 'None') return null;
    if (/^-?\d+$/.test(expr)) return parseInt(expr);
    if (/^-?\d+\.\d+$/.test(expr)) return parseFloat(expr);

    if (expr.startsWith('random.randint(') && expr.endsWith(')')) {
      const args = expr.slice(15, -1).split(',').map(a => Number(await evalExpr(a.trim())));
      return Math.floor(Math.random() * (args[1] - args[0] + 1)) + args[0];
    }
    if (expr.startsWith('random.choice(') && expr.endsWith(')')) {
      const listStr = expr.slice(14, -1);
      const items = listStr.split(',').map(a => evalExpr(a.trim()));
      const resolved = await Promise.all(items);
      return resolved[Math.floor(Math.random() * resolved.length)];
    }
    if (expr.startsWith('len(') && expr.endsWith(')')) {
      const v = await evalExpr(expr.slice(4, -1).trim());
      return Array.isArray(v) ? v.length : String(v).length;
    }
    if (expr.startsWith('int(') && expr.endsWith(')')) {
      const v = await evalExpr(expr.slice(4, -1).trim());
      const num = parseInt(String(v).trim());
      if (isNaN(num)) throw new Error('ValueError: invalid literal for int(): ' + v);
      return num;
    }
    if (expr.startsWith('str(') && expr.endsWith(')')) {
      return String(await evalExpr(expr.slice(4, -1).trim()));
    }
    if (expr.startsWith('float(') && expr.endsWith(')')) {
      const num = parseFloat(await evalExpr(expr.slice(6, -1).trim()));
      if (isNaN(num)) throw new Error('ValueError: could not convert to float');
      return num;
    }
    if (expr.startsWith('abs(') && expr.endsWith(')')) {
      return Math.abs(Number(await evalExpr(expr.slice(4, -1).trim())));
    }
    if (expr.startsWith('round(') && expr.endsWith(')')) {
      const argStr = expr.slice(6, -1);
      const parts = splitTopLevel(argStr, ',');
      const num = Number(await evalExpr(parts[0].trim()));
      const digits = parts.length > 1 ? parseInt(await evalExpr(parts[1].trim())) : 0;
      return Number(num.toFixed(digits));
    }
    if (expr.startsWith('range(') && expr.endsWith(')')) {
      const argStr = expr.slice(6, -1);
      const argParts = splitTopLevel(argStr, ',');
      const args = [];
      for (const a of argParts) args.push(Number(await evalExpr(a.trim())));
      const start = args.length > 1 ? args[0] : 0;
      const end = args.length > 1 ? args[1] : args[0];
      const step = args.length > 2 ? args[2] : 1;
      const arr = [];
      for (let v = start; step > 0 ? v < end : v > end; v += step) arr.push(v);
      return arr;
    }

    if (expr.startsWith('input(') && expr.endsWith(')')) {
      const arg = expr.slice(6, -1).trim();
      const promptText = arg ? String(await evalExpr(arg)) : '';
      return await getInput(promptText);
    }

    if (expr.startsWith('[') && expr.endsWith(']')) {
      const inner = expr.slice(1, -1).trim();
      if (!inner) return [];
      const parts = splitTopLevel(inner, ',');
      const result = [];
      for (const p of parts) result.push(await evalExpr(p.trim()));
      return result;
    }

    if (expr.startsWith('{') && expr.endsWith('}')) {
      const inner = expr.slice(1, -1).trim();
      if (!inner) return {};
      const dict = {};
      const pairs = splitTopLevel(inner, ',');
      for (const pair of pairs) {
        const kv = splitTopLevel(pair.trim(), ':');
        if (kv.length >= 2) {
          const k = await evalExpr(kv[0].trim());
          const v = await evalExpr(kv.slice(1).join(':').trim());
          dict[k] = v;
        }
      }
      return dict;
    }

    const bracketMatch = expr.match(/^(\w+)\[(.+)\]$/);
    if (bracketMatch) {
      const obj = await evalExpr(bracketMatch[1]);
      const key = await evalExpr(bracketMatch[2].trim());
      if (obj && typeof obj === 'object') return obj[key];
      return undefined;
    }

    const dotBracketMatch = expr.match(/^(\w+)\.(\w+)\[(.+)\]$/);
    if (dotBracketMatch) {
      const baseObj = await evalExpr(dotBracketMatch[1]);
      let attrVal;
      if (isPyObj(baseObj)) {
        const attrName = dotBracketMatch[2];
        if (attrName in baseObj.__attrs__) attrVal = baseObj.__attrs__[attrName];
        else {
          const cls = classes[baseObj.__class__];
          if (cls && cls.classVars && attrName in cls.classVars) attrVal = cls.classVars[attrName];
        }
      } else if (baseObj && typeof baseObj === 'object') {
        attrVal = baseObj[dotBracketMatch[2]];
      }
      const key = await evalExpr(dotBracketMatch[3].trim());
      if (attrVal && typeof attrVal === 'object') return attrVal[key];
      return undefined;
    }

    const dotCallMatch = expr.match(/^(\w+)\.(\w+)\((.*)\)$/);
    if (dotCallMatch) {
      const objName = dotCallMatch[1];
      const methodName = dotCallMatch[2];
      const argStr = dotCallMatch[3];
      const argParts = argStr ? splitTopLevel(argStr, ',') : [];
      const args = [];
      for (const a of argParts) args.push(await evalExpr(a.trim()));
      const obj = vars[objName];

      if (isPyObj(obj)) {
        return await callMethod(obj, methodName, args);
      }

      if (obj && typeof obj === 'object' && typeof obj[methodName] === 'function') {
        return obj[methodName](...args);
      }

      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        if (methodName === 'get') {
          const key = args[0];
          const def = args.length > 1 ? args[1] : undefined;
          return obj.hasOwnProperty(key) ? obj[key] : def;
        }
        if (methodName === 'keys') return Object.keys(obj);
        if (methodName === 'values') return Object.values(obj);
        if (methodName === 'items') {
          return Object.entries(obj).map(([k, v]) => [k, v]);
        }
      }

      if (typeof obj === 'string') {
        if (methodName === 'strip') return obj.trim();
        if (methodName === 'lower') return obj.toLowerCase();
        if (methodName === 'upper') return obj.toUpperCase();
        if (methodName === 'startswith') return obj.startsWith(String(args[0]));
        if (methodName === 'endswith') return obj.endsWith(String(args[0]));
        if (methodName === 'split') {
          const sep = args.length > 0 ? String(args[0]) : undefined;
          return obj.split(sep);
        }
        if (methodName === 'replace') return obj.split(String(args[0])).join(String(args[1]));
      }

      if (Array.isArray(obj)) {
        if (methodName === 'append') { obj.push(args[0]); return undefined; }
        if (methodName === 'pop') return obj.pop();
        if (methodName === 'len' || methodName === 'length') return obj.length;
        if (methodName === 'indexOf' || methodName === 'index') return obj.indexOf(args[0]);
      }

      return undefined;
    }

    const dotAttrCallMatch = expr.match(/^(\w+)\.(\w+)\.(\w+)\((.*)\)$/);
    if (dotAttrCallMatch) {
      const baseObj = vars[dotAttrCallMatch[1]];
      const attrName = dotAttrCallMatch[2];
      const methodName = dotAttrCallMatch[3];
      const argStr = dotAttrCallMatch[4];
      const argParts = argStr ? splitTopLevel(argStr, ',') : [];
      const args = [];
      for (const a of argParts) args.push(await evalExpr(a.trim()));

      let attrVal;
      if (isPyObj(baseObj)) {
        if (attrName in baseObj.__attrs__) attrVal = baseObj.__attrs__[attrName];
        else {
          const cls = classes[baseObj.__class__];
          if (cls && cls.classVars && attrName in cls.classVars) attrVal = cls.classVars[attrName];
        }
      } else if (baseObj && typeof baseObj === 'object') {
        attrVal = baseObj[attrName];
      }

      if (attrVal && typeof attrVal === 'object' && !Array.isArray(attrVal)) {
        if (methodName === 'get') {
          const key = args[0];
          const def = args.length > 1 ? args[1] : undefined;
          return attrVal.hasOwnProperty(key) ? attrVal[key] : def;
        }
      }
      if (Array.isArray(attrVal)) {
        if (methodName === 'append') { attrVal.push(args[0]); return undefined; }
        if (methodName === 'pop') return attrVal.pop();
      }

      return undefined;
    }

    const dotAttrMatch = expr.match(/^(\w+)\.(\w+)$/);
    if (dotAttrMatch) {
      const obj = vars[dotAttrMatch[1]];
      if (isPyObj(obj)) {
        const attrName = dotAttrMatch[2];
        if (attrName in obj.__attrs__) return obj.__attrs__[attrName];
        const cls = classes[obj.__class__];
        if (cls && cls.classVars && attrName in cls.classVars) return cls.classVars[attrName];
        return undefined;
      }
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        return obj[dotAttrMatch[2]];
      }
    }

    if (expr.includes(' and ')) {
      const parts = expr.split(' and ');
      for (const p of parts) {
        if (!await evalExpr(p.trim())) return false;
      }
      return true;
    }
    if (expr.includes(' or ')) {
      const parts = expr.split(' or ');
      for (const p of parts) {
        if (await evalExpr(p.trim())) return true;
      }
      return false;
    }
    if (expr.startsWith('not ')) return !await evalExpr(expr.slice(4).trim());

    const compMatch = expr.match(/^(.+?)\s*(==|!=|<=|>=|<|>)\s*(.+)$/);
    if (compMatch) {
      const a = await evalExpr(compMatch[1].trim());
      const b = await evalExpr(compMatch[3].trim());
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
        const vals = [];
        for (const p of parts) vals.push(await evalExpr(p.trim()));
        const allNum = vals.every(v => typeof v === 'number' || /^-?\d+(\.\d+)?$/.test(String(v)));
        return allNum ? vals.reduce((a, b) => a + Number(b), 0) : vals.map(v => String(v)).join('');
      }
    }
    if (expr.includes('-')) {
      const parts = splitTopLevel(expr, '-');
      if (parts.length > 1) {
        const vals = [];
        for (const p of parts) vals.push(Number(await evalExpr(p.trim())));
        if (vals.every(v => !isNaN(v))) return vals.reduce((a, b) => a - b);
      }
    }
    if (expr.includes('*')) {
      const parts = splitTopLevel(expr, '*');
      if (parts.length > 1) {
        const vals = [];
        for (const p of parts) vals.push(Number(await evalExpr(p.trim())));
        if (vals.every(v => !isNaN(v))) return vals.reduce((a, b) => a * b);
      }
    }

    if (classes[expr]) return await createInstance(expr);
    if (expr in vars) return vars[expr];

    return expr;
  }

  async function evalFString(expr) {
    const q = expr[1];
    const content = expr.slice(2, expr.lastIndexOf(q));
    let result = '';
    let i = 0;
    while (i < content.length) {
      if (content[i] === '{' && content[i + 1] !== '{') {
        let depth = 1;
        let j = i + 1;
        while (j < content.length && depth > 0) {
          if (content[j] === '{') depth++;
          if (content[j] === '}') depth--;
          j++;
        }
        const inner = content.slice(i + 1, j - 1);
        result += String(await evalExpr(inner.trim()));
        i = j;
      } else if (content[i] === '\\' && i + 1 < content.length) {
        result += processEscapes(content.slice(i, i + 2));
        i += 2;
      } else {
        result += content[i];
        i++;
      }
    }
    return result;
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
        if (retExpr) returnVal = await evalExpr(retExpr);
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
        const vals = [];
        for (const p of parts) vals.push(await evalExpr(p.trim()));
        const sep = sepMatch ? sepMatch[2] : ' ';
        const end = endMatch ? endMatch[2] : '\n';
        appendOutput(vals.join(sep) + end);
        i++;
        continue;
      }

      if (trimmed.startsWith('class ') && trimmed.endsWith(':')) {
        const clsMatch = trimmed.match(/^class\s+(\w+)\s*(\(.*\))?\s*:$/);
        if (clsMatch) {
          const className = clsMatch[1];
          const bodyStart = i + 1;
          const bodyIndent = indent + 1;
          const bodyEnd = skipBlock(bodyStart, indent);
          const methods = {};
          const classVars = {};

          let ci = bodyStart;
          while (ci < bodyEnd) {
            const craw = lines[ci];
            if (!craw || craw.trim() === '' || craw.trim().startsWith('#')) { ci++; continue; }
            const cindent = getIndent(craw);
            if (cindent <= indent) break;
            const ctrim = craw.trim();

            const defMatch = ctrim.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:$/);
            if (defMatch && cindent === bodyIndent) {
              const params = defMatch[2] ? defMatch[2].split(',').map(p => p.trim()).filter(p => p) : [];
              const methodBodyStart = ci + 1;
              const methodBodyIndent = cindent + 1;
              const methodBodyEnd = skipBlock(methodBodyStart, cindent);
              methods[defMatch[1]] = { params, bodyStart: methodBodyStart, bodyIndent: methodBodyIndent };
              ci = methodBodyEnd;
              continue;
            }

            const cvMatch = ctrim.match(/^(\w+)\s*=\s*(.+)$/);
            if (cvMatch && cindent === bodyIndent) {
              classVars[cvMatch[1]] = await evalExpr(cvMatch[2]);
              ci++;
              continue;
            }

            ci++;
          }

          classes[className] = { methods, classVars };
          i = bodyEnd;
          continue;
        }
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

      if (trimmed.startsWith('if ') && trimmed.endsWith(':')) {
        const cond = trimmed.slice(3, -1).trim();
        const isDunder = trimmed.match(/^if\s+__name__\s*==\s*["']__main__["']\s*:$/);
        const condResult = isDunder ? true : await evalExpr(cond);
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
            if (!condResult && await evalExpr(econd)) {
              const result = await execFrom(i + 1, indent);
              if (result.control) { control = result.control; }
              i = eBlockEnd;
              condResult = true;
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
          const rangeArgsStr = m[2];
          const rangeParts = splitTopLevel(rangeArgsStr, ',');
          const rangeArgs = [];
          for (const a of rangeParts) rangeArgs.push(Number(await evalExpr(a.trim())));
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
          const varNames = m[1].trim();
          const iterExpr = m[2].trim();
          const iterable = await evalExpr(iterExpr);
          const blockEnd = skipBlock(i + 1, indent);

          const isTupleUnpack = varNames.includes(',');
          const varList = isTupleUnpack ? varNames.split(',').map(s => s.trim()) : [varNames];

          if (Array.isArray(iterable)) {
            for (const item of iterable) {
              if (isTupleUnpack && Array.isArray(item)) {
                varList.forEach((name, idx) => { vars[name] = item[idx]; });
              } else {
                vars[varList[0]] = item;
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
          if (trimmed !== 'while True:' && !await evalExpr(cond)) break;
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

      const attrAugMatch = trimmed.match(/^(\w+)\.(\w+)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
      if (attrAugMatch) {
        const objName = attrAugMatch[1];
        const attrName = attrAugMatch[2];
        const op = attrAugMatch[3];
        const r = await evalExpr(attrAugMatch[4]);
        const obj = vars[objName];
        if (isPyObj(obj)) {
          const v = obj.__attrs__[attrName] || 0;
          if (op === '+=') obj.__attrs__[attrName] = (typeof v === 'number' && typeof r === 'number') ? v + r : String(v) + String(r);
          else if (op === '-=') obj.__attrs__[attrName] = v - r;
          else if (op === '*=') obj.__attrs__[attrName] = v * r;
          else if (op === '/=') obj.__attrs__[attrName] = v / r;
        }
        i++;
        continue;
      }

      const augMatch = trimmed.match(/^(\w+)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
      if (augMatch) {
        const v = vars[augMatch[1]] || 0;
        const r = await evalExpr(augMatch[3]);
        if (augMatch[2] === '+=') vars[augMatch[1]] = (typeof v === 'number' && typeof r === 'number') ? v + r : String(v) + String(r);
        else if (augMatch[2] === '-=') vars[augMatch[1]] = v - r;
        else if (augMatch[2] === '*=') vars[augMatch[1]] = v * r;
        else if (augMatch[2] === '/=') vars[augMatch[1]] = v / r;
        i++;
        continue;
      }

      const attrAssignMatch = trimmed.match(/^(\w+)\.(\w+)\s*=\s*(.+)$/);
      if (attrAssignMatch) {
        const objName = attrAssignMatch[1];
        const attrName = attrAssignMatch[2];
        const value = await evalExpr(attrAssignMatch[3]);
        const obj = vars[objName];
        if (isPyObj(obj)) {
          obj.__attrs__[attrName] = value;
        } else if (obj && typeof obj === 'object') {
          obj[attrName] = value;
        }
        i++;
        continue;
      }

      const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
      if (assignMatch) {
        vars[assignMatch[1]] = await evalExpr(assignMatch[2]);
        i++;
        continue;
      }

      const dotAttrMethodMatch = trimmed.match(/^(\w+)\.(\w+)\.(\w+)\((.*)\)$/);
      if (dotAttrMethodMatch) {
        const baseName = dotAttrMethodMatch[1];
        const attrName = dotAttrMethodMatch[2];
        const methodName = dotAttrMethodMatch[3];
        const argStr = dotAttrMethodMatch[4];
        const argParts = argStr ? splitTopLevel(argStr, ',') : [];
        const args = [];
        for (const a of argParts) args.push(await evalExpr(a.trim()));
        const baseObj = vars[baseName];

        let attrVal;
        if (isPyObj(baseObj)) {
          if (attrName in baseObj.__attrs__) attrVal = baseObj.__attrs__[attrName];
          else {
            const cls = classes[baseObj.__class__];
            if (cls && cls.classVars && attrName in cls.classVars) attrVal = cls.classVars[attrName];
          }
        } else if (baseObj && typeof baseObj === 'object') {
          attrVal = baseObj[attrName];
        }

        if (Array.isArray(attrVal)) {
          if (methodName === 'append') { attrVal.push(args[0]); i++; continue; }
          if (methodName === 'pop') { attrVal.pop(); i++; continue; }
        }

        i++;
        continue;
      }

      const methodCallMatch = trimmed.match(/^(\w+)\.(\w+)\((.*)\)$/);
      if (methodCallMatch) {
        const objName = methodCallMatch[1];
        const methodName = methodCallMatch[2];
        const argStr = methodCallMatch[3];
        const argParts = argStr ? splitTopLevel(argStr, ',') : [];
        const args = [];
        for (const a of argParts) args.push(await evalExpr(a.trim()));
        const obj = vars[objName];

        if (isPyObj(obj)) {
          await callMethod(obj, methodName, args);
          if (hasReturn) { control = 'return'; break; }
          i++;
          continue;
        }

        if (Array.isArray(obj)) {
          if (methodName === 'append') { obj.push(args[0]); i++; continue; }
          if (methodName === 'pop') { obj.pop(); i++; continue; }
        }

        i++;
        continue;
      }

      const fnCallMatch = trimmed.match(/^(\w+)\((.*)\)$/);
      if (fnCallMatch && funcs[fnCallMatch[1]]) {
        const argStr = fnCallMatch[2];
        const argParts = argStr ? splitTopLevel(argStr, ',') : [];
        const args = [];
        for (const a of argParts) args.push(await evalExpr(a.trim()));
        await callFunc(fnCallMatch[1], args);
        if (hasReturn) { control = 'return'; break; }
        i++;
        continue;
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

function initChatToggle() {
  const fab = document.getElementById('aiFab');
  const chat = document.getElementById('aiChat');
  const closeBtn = document.getElementById('aiChatClose');

  if (fab && chat) {
    fab.addEventListener('click', () => {
      chat.classList.toggle('open');
      if (chat.classList.contains('open')) {
        const input = document.getElementById('aiInput');
        if (input) setTimeout(() => input.focus(), 300);
      }
    });
  }

  if (closeBtn && chat) {
    closeBtn.addEventListener('click', () => {
      chat.classList.remove('open');
    });
  }
}

function initChatInput() {
  const input = document.getElementById('aiInput');
  const sendBtn = document.getElementById('aiSend');

  if (!input || !sendBtn) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

  sendBtn.addEventListener('click', sendMessage);
}

const AI_CONFIG = {
  apiUrl: 'https://api.sofia7.de5.net',
  model: 'glm-4.7-flash',
  systemPrompt: '你是一个友好的 AI 助手，擅长回答编程、技术和日常问题。回答简洁明了，代码使用 Markdown 代码块格式。'
};

let chatHistory = [];
let isWaiting = false;

async function sendMessage() {
  const input = document.getElementById('aiInput');
  const sendBtn = document.getElementById('aiSend');

  if (!input || isWaiting) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';

  appendMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  const typingEl = showTyping();
  isWaiting = true;
  sendBtn.disabled = true;

  try {
    const response = await callGLMApi();
    typingEl.remove();
    chatHistory.push({ role: 'assistant', content: response });
  } catch (err) {
    typingEl.remove();
    appendMessage('bot', '抱歉，发生了错误：' + (err.message || '未知错误'));
  } finally {
    isWaiting = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

async function callGLMApi() {
  const messages = [
    { role: 'system', content: AI_CONFIG.systemPrompt },
    ...chatHistory.slice(-10)
  ];

  const response = await fetch(AI_CONFIG.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      messages: messages,
      stream: true,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error('API 返回 ' + response.status + ' ' + response.statusText + (errText ? ': ' + errText : ''));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  const messagesEl = document.getElementById('aiMessages');
  const msgEl = document.createElement('div');
  msgEl.className = 'ai-msg ai-msg-bot';
  msgEl.innerHTML = '<div class="ai-msg-avatar">AI</div><div class="ai-msg-content"></div>';
  messagesEl.appendChild(msgEl);
  const contentEl = msgEl.querySelector('.ai-msg-content');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;

      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content || '';
        if (delta) {
          fullText += delta;
          if (window.marked) {
            contentEl.innerHTML = marked.parse(fullText);
            if (window.Prism) {
              contentEl.querySelectorAll('pre code').forEach(block => {
                Prism.highlightElement(block);
              });
            }
          } else {
            contentEl.textContent = fullText;
          }
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
      } catch (e) {}
    }
  }

  return fullText || '（空回复）';
}

function appendMessage(role, content) {
  const messages = document.getElementById('aiMessages');
  if (!messages) return;

  const msgEl = document.createElement('div');
  msgEl.className = 'ai-msg ai-msg-' + (role === 'user' ? 'user' : 'bot');

  const avatar = document.createElement('div');
  avatar.className = 'ai-msg-avatar';
  avatar.textContent = role === 'user' ? '我' : 'AI';

  const contentEl = document.createElement('div');
  contentEl.className = 'ai-msg-content';

  if (role === 'bot' && window.marked) {
    contentEl.innerHTML = marked.parse(content);
    if (window.Prism) {
      contentEl.querySelectorAll('pre code').forEach(block => {
        Prism.highlightElement(block);
      });
    }
  } else {
    contentEl.textContent = content;
  }

  msgEl.appendChild(avatar);
  msgEl.appendChild(contentEl);
  messages.appendChild(msgEl);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const messages = document.getElementById('aiMessages');
  if (!messages) return document.createElement('div');

  const el = document.createElement('div');
  el.className = 'ai-msg ai-msg-bot';
  el.innerHTML = '<div class="ai-msg-avatar">AI</div><div class="ai-msg-content"><div class="ai-typing"><span></span><span></span><span></span></div></div>';
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
  return el;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
