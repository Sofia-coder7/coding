/* ================================================================
   contextmenu.js — 右键菜单、快捷键拦截、特殊码验证
   ================================================================ */

/* ---------- 右键菜单 ---------- */
function closeAllCtx() {
  const menu = document.getElementById('ctxMenu');
  if (menu) { menu.classList.remove('show'); menu.style.display = 'none'; }
}

function initContextMenu() {
  const menu = document.getElementById('ctxMenu');
  if (!menu) return;
  let targetEl = null;

  function showItem(el) { if (el) el.style.display = ''; }
  function hideItem(el) { if (el) el.style.display = 'none'; }

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const t = e.target;
    const inInput = t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT');
    targetEl = inInput ? t : null;

    const sep = document.getElementById('ctxSep');
    const copy = document.getElementById('ctxCopy');
    const paste = document.getElementById('ctxPaste');
    const cut = document.getElementById('ctxCut');
    const search = document.getElementById('ctxSearch');
    const home = document.querySelector('#ctxMenu [data-nav="home.html"]');
    const changelog = document.querySelector('#ctxMenu [data-nav="changelog.html"]');
    const about = document.querySelector('#ctxMenu [data-nav="about.html"]');
    const compile = document.getElementById('ctxCompileParent');
    const editor = document.getElementById('ctxEditorParent');
    const frontend = document.getElementById('ctxFrontendParent');
    const settings = document.getElementById('ctxSettings');

    [sep, copy, paste, cut, search, home, changelog, about, compile, editor, frontend, settings].forEach(hideItem);

    if (inInput) {
      showItem(paste);
      if (t.selectionStart !== t.selectionEnd) { showItem(copy); showItem(cut); showItem(search); }
    } else {
      [home, changelog, about, compile, editor, frontend, settings].forEach(showItem);
      const sel = window.getSelection();
      if (sel && sel.toString().trim()) { showItem(sep); showItem(copy); showItem(search); }
    }

    menu.style.display = 'block';
    menu.classList.add('show');
    const rect = menu.getBoundingClientRect();
    let x = e.clientX, y = e.clientY;
    if (x + rect.width > window.innerWidth - 4) x = window.innerWidth - rect.width - 4;
    if (y + rect.height > window.innerHeight - 4) y = window.innerHeight - rect.height - 4;
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
  });

  document.addEventListener('click', closeAllCtx);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllCtx(); });
  document.addEventListener('scroll', closeAllCtx, true);

  if (document.getElementById('ctxCompileParent')) {
    document.getElementById('ctxCompileParent').addEventListener('click', (e) => {
      e.stopPropagation(); closeAllCtx(); navigateTo('tools/php.html');
    });
  }
  if (document.getElementById('ctxEditorParent')) {
    document.getElementById('ctxEditorParent').addEventListener('click', (e) => {
      e.stopPropagation(); closeAllCtx(); navigateTo('tools/html.html');
    });
  }
  if (document.getElementById('ctxFrontendParent')) {
    document.getElementById('ctxFrontendParent').addEventListener('click', (e) => {
      e.stopPropagation(); closeAllCtx(); navigateTo('tools/css-formatter.html');
    });
  }

  const copy = document.getElementById('ctxCopy');
  if (copy) copy.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (targetEl && targetEl.selectionStart !== targetEl.selectionEnd) {
      try { await navigator.clipboard.writeText(targetEl.value.substring(targetEl.selectionStart, targetEl.selectionEnd)); } catch { document.execCommand('copy'); }
    } else {
      const sel = window.getSelection();
      if (sel && sel.toString()) { try { await navigator.clipboard.writeText(sel.toString()); } catch { document.execCommand('copy'); } }
    }
    closeAllCtx();
  });

  const paste = document.getElementById('ctxPaste');
  if (paste) paste.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (targetEl) {
      try {
        const text = await navigator.clipboard.readText();
        const s = targetEl.selectionStart, en = targetEl.selectionEnd;
        targetEl.value = targetEl.value.substring(0, s) + text + targetEl.value.substring(en);
        targetEl.selectionStart = targetEl.selectionEnd = s + text.length;
        targetEl.dispatchEvent(new Event('input'));
        targetEl.focus();
      } catch {}
    }
    closeAllCtx();
  });

  const cut = document.getElementById('ctxCut');
  if (cut) cut.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (targetEl && targetEl.selectionStart !== targetEl.selectionEnd) {
      const s = targetEl.selectionStart, en = targetEl.selectionEnd;
      try { await navigator.clipboard.writeText(targetEl.value.substring(s, en)); } catch {}
      targetEl.value = targetEl.value.substring(0, s) + targetEl.value.substring(en);
      targetEl.selectionStart = targetEl.selectionEnd = s;
      targetEl.dispatchEvent(new Event('input'));
      targetEl.focus();
    }
    closeAllCtx();
  });

  const search = document.getElementById('ctxSearch');
  if (search) search.addEventListener('click', (e) => {
    e.stopPropagation();
    let query = '';
    if (targetEl && targetEl.selectionStart !== targetEl.selectionEnd) {
      query = targetEl.value.substring(targetEl.selectionStart, targetEl.selectionEnd);
    } else {
      const sel = window.getSelection();
      if (sel) query = sel.toString().trim();
    }
    if (query) window.open('https://cn.bing.com/search?q=' + encodeURIComponent(query), '_blank');
    closeAllCtx();
  });
}

/* ---------- 快捷键拦截 ---------- */
function initShortcutBlock() {
  const overlay = document.getElementById('codeModalOverlay');
  if (!overlay) return;
  const input = document.getElementById('codeModalInput');
  const errorEl = document.getElementById('codeModalError');
  const confirmBtn = document.getElementById('codeModalConfirm');
  const cancelBtn = document.getElementById('codeModalCancel');
  const SPECIAL_CODE = '4mMhxpoxjZBmvp1t4uatwF44EDJkK5N8';
  let pendingShortcut = null;
  let bypass = false;

  function showModal(type) { pendingShortcut = type; input.value = ''; errorEl.textContent = ''; overlay.classList.add('show'); setTimeout(() => input.focus(), 50); }
  function hideModal() { overlay.classList.remove('show'); pendingShortcut = null; }
  function verify() {
    if (input.value.trim() === SPECIAL_CODE) {
      hideModal();
      if (pendingShortcut === 'view-source') window.open('view-source:' + window.location.href, '_blank');
      else if (pendingShortcut === 'devtools') bypass = true;
    } else { errorEl.textContent = '特殊码不正确'; input.value = ''; input.focus(); }
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) { if (bypass) { bypass = false; return; } e.preventDefault(); showModal('view-source'); }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) { if (bypass) { bypass = false; return; } e.preventDefault(); showModal('devtools'); }
    if (e.key === 'F12' || e.keyCode === 123) { if (bypass) { bypass = false; return; } e.preventDefault(); showModal('devtools'); }
  });

  if (confirmBtn) confirmBtn.addEventListener('click', verify);
  if (cancelBtn) cancelBtn.addEventListener('click', hideModal);
  if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); verify(); } if (e.key === 'Escape') hideModal(); });
}
