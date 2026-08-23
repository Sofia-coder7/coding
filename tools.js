/* ================================================================
   tools.js — Python 在线运行器 + Markdown 在线编辑器
   Prism.js 语法高亮 + Pyodide 执行 + marked.js 实时解析
   ================================================================ */

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', () => {
  initPythonHighlight();
  initPythonRunButton();
  initPythonDownloadButton();
  initMarkdownEditor();
  initMarkdownActions();
});

/* ================================================================
   Python 在线运行器
   ================================================================ */

let pyodide = null;
let pyodideLoading = false;

const PYODIDE_VERSION = '0.26.2';
const PYODIDE_INDEX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// ---------- 下载 ----------
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

// ---------- 语法高亮覆盖层 ----------
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

  // 初始高亮
  updateHighlight();

  // 输入时更新
  codeArea.addEventListener('input', updateHighlight);

  // Tab 键缩进
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

  // 滚动同步
  codeArea.addEventListener('scroll', () => {
    highlight.scrollTop = codeArea.scrollTop;
    highlight.scrollLeft = codeArea.scrollLeft;
  });
}

// ---------- 运行按钮 ----------
function initPythonRunButton() {
  const runBtn = document.getElementById('pyRun');
  if (runBtn) {
    runBtn.addEventListener('click', runPython);
  }
}

// ---------- 加载 Pyodide ----------
async function ensurePyodide() {
  if (pyodide) return pyodide;
  if (pyodideLoading) {
    while (pyodideLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    return pyodide;
  }

  pyodideLoading = true;
  const output = document.getElementById('pyOutput');

  if (output) {
    output.innerHTML = '<span class="py-loading">正在加载 Python 运行时 (Pyodide)，首次加载约 10-20 秒...</span>';
  }

  if (!window.loadPyodide) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${PYODIDE_INDEX}pyodide.js`;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Pyodide 脚本加载失败'));
      document.head.appendChild(script);
    });
  }

  pyodide = await window.loadPyodide({ indexURL: PYODIDE_INDEX });
  pyodideLoading = false;

  if (output) {
    output.innerHTML = '<span class="py-success">Python 运行时加载完成，可以运行代码了。</span>';
  }

  return pyodide;
}

// ---------- 运行 Python ----------
async function runPython() {
  const codeArea = document.getElementById('pyCode');
  const output = document.getElementById('pyOutput');
  const runBtn = document.getElementById('pyRun');

  if (!codeArea || !output) return;

  const code = codeArea.value;

  runBtn.disabled = true;
  runBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg> 运行中...';

  try {
    const py = await ensurePyodide();
    if (!py) return;

    let captured = '';
    py.setStdout({ batched: (s) => { captured += s + '\n'; } });
    py.setStderr({ batched: (s) => { captured += s + '\n'; } });

    await py.runPythonAsync(code);

    if (captured.trim()) {
      output.innerHTML = '';
      const pre = document.createElement('span');
      pre.textContent = captured.replace(/\n$/, '');
      output.appendChild(pre);
    } else {
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

// ---------- 错误格式化 ----------
function formatPythonError(msg) {
  return msg
    .replace(/^PythonError: /, '')
    .trim();
}

/* ================================================================
   Markdown 在线编辑器
   ================================================================ */

function initMarkdownEditor() {
  const codeArea = document.getElementById('mdCode');
  const preview = document.getElementById('mdPreview');

  if (!codeArea || !preview) return;

  // 配置 marked
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
      // 高亮预览中的代码块
      preview.innerHTML = html;
      // 对代码块应用 Prism 高亮
      if (window.Prism) {
        preview.querySelectorAll('pre code').forEach(block => {
          Prism.highlightElement(block);
        });
      }
    } else {
      preview.innerHTML = '<p style="color:var(--t4)">Markdown 解析器加载失败</p>';
    }
  }

  // 初始渲染
  updatePreview();

  // 输入时实时预览
  let debounceTimer;
  codeArea.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updatePreview, 150);
  });

  // Tab 键缩进
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

  // 滚动同步
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
