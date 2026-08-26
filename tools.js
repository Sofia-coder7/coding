let pyodide = null;
let pyodideLoading = false;

const PYODIDE_VERSION = '0.26.2';
const PYODIDE_INDEX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

document.addEventListener('DOMContentLoaded', () => {
  initPythonHighlight();
  initPythonRunButton();
  initPythonDownloadButton();
  initMarkdownEditor();
  initMarkdownActions();
  initTVisualEditor();
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

function formatPythonError(msg) {
  return msg
    .replace(/^PythonError: /, '')
    .trim();
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

const MC_COLORS = {
  '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
  '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
  '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
  'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF'
};

const MC_COLOR_NAMES = {
  '0': 'black', '1': 'dark_blue', '2': 'dark_green', '3': 'dark_aqua',
  '4': 'dark_red', '5': 'dark_purple', '6': 'gold', '7': 'gray',
  '8': 'dark_gray', '9': 'blue', 'a': 'green', 'b': 'aqua',
  'c': 'red', 'd': 'magenta', 'e': 'yellow', 'f': 'white'
};

const MC_FORMAT_CODES = {
  'l': 'bold', 'm': 'strikethrough', 'n': 'underlined', 'o': 'italic'
};

function parseMCText(rawText) {
  const segments = [];
  let color = 'white';
  const fmt = { bold: false, italic: false, underlined: false, strikethrough: false };

  let i = 0;
  while (i < rawText.length) {
    if (rawText[i] === '$' && i + 1 < rawText.length) {
      const next = rawText[i + 1].toLowerCase();

      if (next === 'f' && i + 2 < rawText.length && rawText[i + 2].toLowerCase() === 'n') {
        segments.push({ char: '\n', color, ...fmt, newline: true });
        i += 3;
        continue;
      }

      if (MC_COLORS[next]) {
        color = next;
        i += 2;
        continue;
      }

      if (next === 'r') {
        color = 'white';
        fmt.bold = false; fmt.italic = false; fmt.underlined = false; fmt.strikethrough = false;
        i += 2;
        continue;
      }

      if (MC_FORMAT_CODES[next]) {
        fmt[MC_FORMAT_CODES[next]] = !fmt[MC_FORMAT_CODES[next]];
        i += 2;
        continue;
      }

      segments.push({ char: rawText[i], color, ...fmt });
      i++;
    } else {
      segments.push({ char: rawText[i], color, ...fmt });
      i++;
    }
  }
  return segments;
}

function buildBedrockRawJSON(segments, scoreboardName, initScore) {
  if (segments.length === 0) return '{"rawtext":[{"text":""}]}';

  const rawtextArray = [];
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const score = initScore + i;

    rawtextArray.push({ selector: `@s[scores={${scoreboardName}=${score}..}]` });

    const textObj = { text: s.char };
    if (MC_COLOR_NAMES[s.color]) {
      textObj.color = MC_COLOR_NAMES[s.color];
    }
    if (s.bold) textObj.bold = true;
    if (s.italic) textObj.italic = true;
    if (s.underlined) textObj.underlined = true;
    if (s.strikethrough) textObj.strikethrough = true;

    rawtextArray.push(textObj);
  }

  const placeholders = segments.map(() => '%%s').join('');
  const withArray = [];

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const score = initScore + i;

    const innerRawtext = [];
    innerRawtext.push({ selector: `@s[scores={${scoreboardName}=${score}..}]` });

    const textObj = { text: s.char };
    if (MC_COLOR_NAMES[s.color]) {
      textObj.color = MC_COLOR_NAMES[s.color];
    }
    if (s.bold) textObj.bold = true;
    if (s.italic) textObj.italic = true;
    if (s.underlined) textObj.underlined = true;
    if (s.strikethrough) textObj.strikethrough = true;

    innerRawtext.push(textObj);
    withArray.push({ rawtext: innerRawtext });
  }

  const result = {
    rawtext: [
      {
        translate: placeholders,
        with: withArray
      }
    ]
  };

  return JSON.stringify(result);
}

function updateTDisplayPreview() {
  const input = document.getElementById('tdInput');
  const preview = document.getElementById('tdPreview');
  if (!input || !preview) return;

  const segments = parseMCText(input.value);
  preview.innerHTML = '';

  segments.forEach(s => {
    if (s.newline) {
      preview.appendChild(document.createElement('br'));
      return;
    }
    const span = document.createElement('span');
    span.textContent = s.char;
    span.style.color = MC_COLORS[s.color] || '#FFFFFF';
    if (s.bold) span.style.fontWeight = 'bold';
    if (s.italic) span.style.fontStyle = 'italic';
    if (s.underlined) span.style.textDecoration = 'underline';
    if (s.strikethrough) span.style.textDecoration = 'line-through';
    if (s.underlined && s.strikethrough) span.style.textDecoration = 'underline line-through';
    preview.appendChild(span);
  });
}

function initTDisplay() {
  const input = document.getElementById('tdInput');
  if (!input) return;

  updateTDisplayPreview();

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(updateTDisplayPreview, 100);
  });

  const convertBtn = document.getElementById('tdConvert');
  const copyBtn = document.getElementById('tdCopy');
  const clearBtn = document.getElementById('tdClear');
  const output = document.getElementById('tdOutput');

  if (convertBtn) {
    convertBtn.addEventListener('click', () => {
      const rawText = input.value;
      if (!rawText.trim()) return;

      const initScore = parseInt(document.getElementById('tdInitScore').value) || 0;
      const scoreboardName = (document.getElementById('tdScoreboard').value || 'T显').trim();
      const doInit = document.getElementById('tdInit').value === 'true';

      const segments = parseMCText(rawText);
      const lines = [];

      if (doInit) {
        lines.push(`scoreboard objectives add ${scoreboardName} dummy`);
        lines.push('');
      }

      lines.push(`# 总帧数: ${segments.length}`);
      lines.push(`# 每帧递增 ${scoreboardName} 分数即可播放动画`);
      lines.push('');

      const rawJSON = buildBedrockRawJSON(segments, scoreboardName, initScore);
      lines.push(`/titleraw @a title ${rawJSON}`);

      output.textContent = lines.join('\n');
      output.classList.add('td-output-active');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const text = output.textContent;
      if (!text || output.querySelector('.td-placeholder')) return;
      navigator.clipboard.writeText(text).then(() => {
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> 已复制';
        setTimeout(() => { copyBtn.innerHTML = original; }, 1500);
      }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      output.innerHTML = '<span class="td-placeholder">转换结果将显示在这里...</span>';
      updateTDisplayPreview();
    });
  }
}

let tvElements = [];
let tvEditingIndex = -1;
let tvJsonCompressed = false;

function initTVisualEditor() {
  const addTextBtn = document.getElementById('tvAddText');
  const addSelBtn = document.getElementById('tvAddSel');
  const addScrBtn = document.getElementById('tvAddScr');
  const copyCmdBtn = document.getElementById('tvCopyCmd');
  const clearAllBtn = document.getElementById('tvClearAll');
  const formatBtn = document.getElementById('tvFormat');
  const compressBtn = document.getElementById('tvCompress');

  if (addTextBtn) addTextBtn.addEventListener('click', () => openModal('text'));
  if (addSelBtn) addSelBtn.addEventListener('click', () => openModal('selector'));
  if (addScrBtn) addScrBtn.addEventListener('click', () => openModal('score'));
  if (copyCmdBtn) copyCmdBtn.addEventListener('click', copyTvCommand);
  if (clearAllBtn) clearAllBtn.addEventListener('click', () => {
    tvElements = [];
    renderTvElements();
  });
  if (formatBtn) formatBtn.addEventListener('click', () => { tvJsonCompressed = false; updateTvOutputs(); });
  if (compressBtn) compressBtn.addEventListener('click', () => { tvJsonCompressed = true; updateTvOutputs(); });

  const cmdType = document.getElementById('tvCmdType');
  const position = document.getElementById('tvPosition');
  const target = document.getElementById('tvTarget');
  if (cmdType) cmdType.addEventListener('change', updateTvOutputs);
  if (position) position.addEventListener('change', updateTvOutputs);
  if (target) target.addEventListener('input', updateTvOutputs);

  tvElements = [
    { type: 'text', content: '$e欢迎，' },
    { type: 'selector', content: '@p' },
    { type: 'text', content: '$7| 金币：' },
    { type: 'score', content: '*', objective: 'coin' }
  ];
  renderTvElements();
}

function renderTvElements() {
  const list = document.getElementById('tvElemList');
  const countEl = document.getElementById('tvElemCount');
  if (!list) return;

  list.innerHTML = '';
  if (countEl) countEl.textContent = tvElements.length;

  if (tvElements.length === 0) {
    list.innerHTML = '<div class="tv-empty">点击上方按钮添加元素</div>';
    updateTvOutputs();
    return;
  }

  tvElements.forEach((el, i) => {
    const card = document.createElement('div');
    card.className = 'tv-elem-card';

    const typeLabel = el.type === 'text' ? 'TEXT' : el.type === 'selector' ? 'SEL' : 'SCR';
    const typeClass = el.type === 'text' ? 'tv-elem-type-text' : el.type === 'selector' ? 'tv-elem-type-sel' : 'tv-elem-type-scr';

    let displayValue = '';
    let subValue = '';
    if (el.type === 'text') {
      displayValue = el.content;
      subValue = '文本内容';
    } else if (el.type === 'selector') {
      displayValue = el.content;
      subValue = '实体选择器';
    } else if (el.type === 'score') {
      displayValue = `${el.content} / ${el.objective}`;
      subValue = '玩家名 / 记分板';
    }

    card.innerHTML = `
      <span class="tv-elem-type ${typeClass}">${typeLabel}</span>
      <div class="tv-elem-content">
        <div class="tv-elem-value">${escapeHtml(displayValue)}</div>
        <div class="tv-elem-sub">${subValue}</div>
      </div>
      <div class="tv-elem-actions">
        <button class="tv-elem-btn" data-action="up" data-idx="${i}" title="上移">↑</button>
        <button class="tv-elem-btn" data-action="down" data-idx="${i}" title="下移">↓</button>
        <button class="tv-elem-btn" data-action="edit" data-idx="${i}" title="编辑">✎</button>
        <button class="tv-elem-btn danger" data-action="delete" data-idx="${i}" title="删除">✕</button>
      </div>
    `;

    list.appendChild(card);
  });

  list.querySelectorAll('.tv-elem-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const idx = parseInt(btn.dataset.idx);
      if (action === 'up' && idx > 0) {
        [tvElements[idx - 1], tvElements[idx]] = [tvElements[idx], tvElements[idx - 1]];
        renderTvElements();
      } else if (action === 'down' && idx < tvElements.length - 1) {
        [tvElements[idx + 1], tvElements[idx]] = [tvElements[idx], tvElements[idx + 1]];
        renderTvElements();
      } else if (action === 'edit') {
        openModal(tvElements[idx].type, idx);
      } else if (action === 'delete') {
        tvElements.splice(idx, 1);
        renderTvElements();
      }
    });
  });

  updateTvOutputs();
}

function openModal(type, editIdx) {
  tvEditingIndex = editIdx !== undefined ? editIdx : -1;
  const isEdit = editIdx !== undefined;
  const existing = isEdit ? tvElements[editIdx] : {};

  const overlay = document.createElement('div');
  overlay.className = 'tv-modal-overlay';

  const typeLabels = { text: '文本 (text)', selector: '选择器 (selector)', score: '记分板 (score)' };

  let bodyHtml = '';
  if (type === 'text') {
    bodyHtml = `
      <div class="tv-modal-field">
        <label>文本内容（支持 $颜色码 和 $fn 换行）</label>
        <input type="text" id="modalInput1" value="${escapeAttr(existing.content || '')}" placeholder="例如: $e欢迎" spellcheck="false">
      </div>
    `;
  } else if (type === 'selector') {
    bodyHtml = `
      <div class="tv-modal-field">
        <label>选择器</label>
        <input type="text" id="modalInput1" value="${escapeAttr(existing.content || '@p')}" placeholder="例如: @p, @a, @s" spellcheck="false">
      </div>
    `;
  } else if (type === 'score') {
    bodyHtml = `
      <div class="tv-modal-field">
        <label>玩家名</label>
        <input type="text" id="modalInput1" value="${escapeAttr(existing.content || '*')}" placeholder="* 或 玩家名" spellcheck="false">
      </div>
      <div class="tv-modal-field">
        <label>记分板名称</label>
        <input type="text" id="modalInput2" value="${escapeAttr(existing.objective || '')}" placeholder="例如: coin" spellcheck="false">
      </div>
    `;
  }

  overlay.innerHTML = `
    <div class="tv-modal">
      <div class="tv-modal-header">
        <span class="tv-modal-title">${isEdit ? '编辑元素' : '添加元素'} — ${typeLabels[type]}</span>
        <button class="tv-modal-close" id="modalClose">✕</button>
      </div>
      <div class="tv-modal-body">${bodyHtml}</div>
      <div class="tv-modal-footer">
        <button class="tv-modal-btn tv-modal-cancel" id="modalCancel">取消</button>
        <button class="tv-modal-btn tv-modal-save" id="modalSave">保存</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => {
    document.body.removeChild(overlay);
    tvEditingIndex = -1;
  };

  overlay.querySelector('#modalClose').addEventListener('click', close);
  overlay.querySelector('#modalCancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#modalSave').addEventListener('click', () => {
    const input1 = document.getElementById('modalInput1').value.trim();
    if (!input1 && type !== 'score') { return; }

    const elem = { type };
    if (type === 'text') {
      elem.content = input1;
    } else if (type === 'selector') {
      elem.content = input1;
    } else if (type === 'score') {
      elem.content = input1 || '*';
      elem.objective = document.getElementById('modalInput2').value.trim() || 'objective';
    }

    if (tvEditingIndex >= 0) {
      tvElements[tvEditingIndex] = elem;
    } else {
      tvElements.push(elem);
    }
    close();
    renderTvElements();
  });

  const firstInput = overlay.querySelector('input');
  if (firstInput) { firstInput.focus(); firstInput.select(); }
}

function buildTvRawJSON() {
  const rawtextArray = [];
  tvElements.forEach(el => {
    if (el.type === 'text') {
      const segments = parseMCText(el.content);
      if (segments.length === 0) {
        rawtextArray.push({ text: '' });
      } else {
        let currentText = '';
        let currentColor = null;
        let currentFmt = {};

        segments.forEach(s => {
          const colorChanged = currentColor !== s.color;
          const fmtChanged =
            !!s.bold !== !!currentFmt.bold ||
            !!s.italic !== !!currentFmt.italic ||
            !!s.underlined !== !!currentFmt.underlined ||
            !!s.strikethrough !== !!currentFmt.strikethrough;

          if ((currentColor !== null && (colorChanged || fmtChanged)) || s.newline) {
            if (currentText) {
              const obj = { text: currentText };
              if (MC_COLOR_NAMES[currentColor]) obj.color = MC_COLOR_NAMES[currentColor];
              if (currentFmt.bold) obj.bold = true;
              if (currentFmt.italic) obj.italic = true;
              if (currentFmt.underlined) obj.underlined = true;
              if (currentFmt.strikethrough) obj.strikethrough = true;
              rawtextArray.push(obj);
            }
            if (s.newline) {
              rawtextArray.push({ text: '\n' });
              currentText = '';
            } else {
              currentText = s.char;
            }
            currentColor = s.color;
            currentFmt = { ...s };
            delete currentFmt.char;
            delete currentFmt.color;
            delete currentFmt.newline;
          } else {
            currentText += s.char;
            currentColor = s.color;
            currentFmt = { ...s };
            delete currentFmt.char;
            delete currentFmt.color;
            delete currentFmt.newline;
          }
        });

        if (currentText) {
          const obj = { text: currentText };
          if (MC_COLOR_NAMES[currentColor]) obj.color = MC_COLOR_NAMES[currentColor];
          if (currentFmt.bold) obj.bold = true;
          if (currentFmt.italic) obj.italic = true;
          if (currentFmt.underlined) obj.underlined = true;
          if (currentFmt.strikethrough) obj.strikethrough = true;
          rawtextArray.push(obj);
        }
      }
    } else if (el.type === 'selector') {
      rawtextArray.push({ selector: el.content });
    } else if (el.type === 'score') {
      rawtextArray.push({ score: { name: el.content, objective: el.objective } });
    }
  });

  return { rawtext: rawtextArray };
}

function updateTvOutputs() {
  const previewEl = document.getElementById('tvPreview');
  const jsonEl = document.getElementById('tvJsonOutput');
  const cmdEl = document.getElementById('tvCmdOutput');
  const charCountEl = document.getElementById('tvCharCount');

  if (previewEl) {
    previewEl.innerHTML = '';
    let totalChars = 0;
    tvElements.forEach(el => {
      if (el.type === 'text') {
        const segments = parseMCText(el.content);
        segments.forEach(s => {
          if (s.newline) {
            previewEl.appendChild(document.createElement('br'));
            return;
          }
          const span = document.createElement('span');
          span.textContent = s.char;
          span.style.color = MC_COLORS[s.color] || '#FFFFFF';
          if (s.bold) span.style.fontWeight = 'bold';
          if (s.italic) span.style.fontStyle = 'italic';
          if (s.underlined) span.style.textDecoration = 'underline';
          if (s.strikethrough) span.style.textDecoration = 'line-through';
          if (s.underlined && s.strikethrough) span.style.textDecoration = 'underline line-through';
          previewEl.appendChild(span);
          totalChars++;
        });
      } else if (el.type === 'selector') {
        const span = document.createElement('span');
        span.textContent = `[${el.content}]`;
        span.style.color = '#10b981';
        span.style.fontStyle = 'italic';
        previewEl.appendChild(span);
        totalChars += el.content.length + 2;
      } else if (el.type === 'score') {
        const span = document.createElement('span');
        span.textContent = `[${el.objective}]`;
        span.style.color = '#f59e0b';
        span.style.fontStyle = 'italic';
        previewEl.appendChild(span);
        totalChars += el.objective.length + 2;
      }
    });
    if (charCountEl) charCountEl.textContent = totalChars;
  }

  const rawJSON = buildTvRawJSON();
  const jsonStr = tvJsonCompressed ? JSON.stringify(rawJSON) : JSON.stringify(rawJSON, null, 2);
  if (jsonEl) jsonEl.textContent = jsonStr;

  if (cmdEl) {
    const cmdType = document.getElementById('tvCmdType')?.value || 'titleraw';
    const target = document.getElementById('tvTarget')?.value || '@a';
    const position = document.getElementById('tvPosition')?.value || 'actionbar';
    const compactJSON = JSON.stringify(rawJSON);

    if (cmdType === 'titleraw') {
      cmdEl.textContent = `/titleraw ${target} ${position} ${compactJSON}`;
    } else {
      cmdEl.textContent = `/tellraw ${target} ${compactJSON}`;
    }
  }
}

function copyTvCommand() {
  const cmdEl = document.getElementById('tvCmdOutput');
  if (!cmdEl) return;
  const text = cmdEl.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('tvCopyCmd');
    if (!btn) return;
    const original = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> 已复制';
    setTimeout(() => { btn.innerHTML = original; }, 1500);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
