/* ================================================================
   setting.js — 主题切换、设置弹窗、缓存/Cookie 管理
   ================================================================ */

/* ---------- 主题 ---------- */
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function initThemeToggle() {
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    const darkToggle = document.getElementById('settingDarkMode');
    if (darkToggle) darkToggle.checked = next === 'dark';
  });
}

/* ---------- 设置弹窗 ---------- */
function initSettingsModal() {
  const overlay = document.getElementById('settingsOverlay');
  if (!overlay) return;

  const footerSettings = document.getElementById('footerSettings');
  const ctxSettings = document.getElementById('ctxSettings');
  const closeX = document.getElementById('settingsCloseX');

  const open = () => overlay.classList.add('show');
  const close = () => overlay.classList.remove('show');

  if (footerSettings) footerSettings.addEventListener('click', open);
  if (ctxSettings) ctxSettings.addEventListener('click', (e) => { e.stopPropagation(); closeAllCtx(); open(); });
  if (closeX) closeX.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const darkToggle = document.getElementById('settingDarkMode');
  if (darkToggle) {
    darkToggle.checked = document.documentElement.getAttribute('data-theme') === 'dark';
    darkToggle.addEventListener('change', () => {
      const next = darkToggle.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  const btnCheck = document.getElementById('btnCheckUpdate');
  if (btnCheck) btnCheck.addEventListener('click', () => {
    localStorage.removeItem('changelog_seen_version');
    btnCheck.textContent = '已触发';
    btnCheck.disabled = true;
    setTimeout(() => { btnCheck.textContent = '检查更新'; btnCheck.disabled = false; location.reload(); }, 1500);
  });

  const btnReset = document.getElementById('btnResetVersion');
  if (btnReset) btnReset.addEventListener('click', () => {
    localStorage.removeItem('changelog_seen_version');
    btnReset.textContent = '重置中...';
    btnReset.disabled = true;
    const clearCaches = ('caches' in window) ? caches.keys().then(ns => Promise.all(ns.map(n => caches.delete(n)))) : Promise.resolve();
    const clearSW = ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) ? navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister().catch(() => {})))).catch(() => {}) : Promise.resolve();
    Promise.all([clearCaches, clearSW]).then(() => {
      btnReset.textContent = '已重置';
      setTimeout(() => { btnReset.textContent = '重置版本缓存'; btnReset.disabled = false; location.reload(); }, 1200);
    });
  });

  const btnClear = document.getElementById('btnClearCache');
  if (btnClear) btnClear.addEventListener('click', () => {
    btnClear.textContent = '清理中...'; btnClear.disabled = true;
    if ('caches' in window) {
      caches.keys().then(ns => Promise.all(ns.map(n => caches.delete(n)))).then(() => {
        btnClear.textContent = '已清理';
        setTimeout(() => { btnClear.textContent = '清理资源缓存'; btnClear.disabled = false; }, 1500);
      });
    } else {
      btnClear.textContent = '已清理';
      setTimeout(() => { btnClear.textContent = '清理资源缓存'; btnClear.disabled = false; }, 1500);
    }
  });

  const btnClearCookie = document.getElementById('btnClearCookie');
  if (btnClearCookie) btnClearCookie.addEventListener('click', () => {
    btnClearCookie.textContent = '清理中...'; btnClearCookie.disabled = true;
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + location.hostname + ';';
      }
    });
    setTimeout(() => {
      btnClearCookie.textContent = '已清理';
      setTimeout(() => { btnClearCookie.textContent = '清理 Cookie'; btnClearCookie.disabled = false; }, 1500);
    }, 500);
  });
}
