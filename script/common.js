/* ================================================================
   common.js — 全局共享布局与功能
   所有页面通过 mount 点注入 sidebar / footer / modals
   ================================================================ */

const PAGE_PATHS = {
  'home.html': { nav: 'home', label: '首页' },
  'about.html': { nav: 'about', label: '关于' },
  'changelog.html': { nav: 'changelog', label: '更新日志' },
  'python.html': { nav: 'python', label: 'Python', parent: 'tools' },
  'html.html': { nav: 'html', label: 'HTML', parent: 'tools' },
  'cascading-style-sheets.html': { nav: 'css', label: 'CSS', parent: 'tools' },
  'javascript.html': { nav: 'javascript', label: 'JavaScript', parent: 'tools' },
  'markdown.html': { nav: 'markdown', label: 'Markdown', parent: 'tools' },
};

function currentFileName() {
  const p = window.location.pathname;
  return p.substring(p.lastIndexOf('/') + 1) || 'home.html';
}

function siteBase() {
  return window.location.pathname.includes('/tools/') ? '../' : '';
}

/* ---------- 生成 Sidebar ---------- */
function buildSidebar() {
  const cur = currentFileName();
  const info = PAGE_PATHS[cur] || {};
  const base = siteBase();
  const isNav = (name) => info.nav === name ? 'active' : '';
  const isParent = (name) => info.parent === name ? 'active' : '';

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-top">
        <button type="button" class="sidebar-logo" data-nav="home.html">
          <span class="logo-mark">&lt;/&gt;</span>
          <span class="logo-name">Portfolio</span>
        </button>
      </div>
      <nav class="sidebar-nav">
        <button type="button" class="sidebar-link ${isNav('home')}" data-nav="home.html">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span>首页</span>
        </button>
        <button type="button" class="sidebar-link ${isNav('about')}" data-nav="about.html">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          <span>关于</span>
        </button>
        <button type="button" class="sidebar-link ${isNav('changelog')}" data-nav="changelog.html">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
          <span>更新日志</span>
        </button>
        <div class="sidebar-dropdown open" id="dropdownTools">
          <button type="button" class="sidebar-link sidebar-dropdown-toggle ${isParent('tools')}" data-dropdown="tools">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
            <span>在线工具</span>
            <svg class="dropdown-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="sidebar-dropdown-menu">
            <button type="button" class="sidebar-sublink ${isNav('python')}" data-nav="tools/python.html">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 8c0-1.5 1.5-2 3-2s3 .5 3 2-1 2-3 2-3-.5-3-2z"/><path d="M10 14c1.5 0 3-.5 3-2s-1.5-2-3-2-3 .5-3 2 1.5 2 3 2z"/></svg>
              <span>Python</span>
            </button>
            <button type="button" class="sidebar-sublink ${isNav('html')}" data-nav="tools/html.html">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              <span>HTML</span>
            </button>
            <button type="button" class="sidebar-sublink ${isNav('css')}" data-nav="tools/cascading-style-sheets.html">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              <span>CSS</span>
            </button>
            <button type="button" class="sidebar-sublink ${isNav('javascript')}" data-nav="tools/javascript.html">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7v10c0 5.52 4.48 10 10 10s10-4.48 10-10V7L12 2z"/></svg>
              <span>JavaScript</span>
            </button>
            <button type="button" class="sidebar-sublink ${isNav('markdown')}" data-nav="tools/markdown.html">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Markdown</span>
            </button>
          </div>
        </div>
      </nav>
      <div class="sidebar-bottom">
        <div class="sidebar-links">
          <button class="sidebar-icon-btn sidebar-theme" id="themeBtn" aria-label="切换主题" title="切换主题">
            <svg class="ic-sun" viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="5" fill="currentColor"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <svg class="ic-moon" viewBox="0 0 24 24" width="18" height="18"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor"/></svg>
          </button>
          <button type="button" class="sidebar-icon-btn" id="footerSettings" title="设置">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </button>
          <button type="button" class="sidebar-icon-btn" data-nav="about.html" title="关于我">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          </button>
        </div>
        <p class="sidebar-copy">© 2026 devup5.github.io</p>
      </div>
      <button class="sidebar-burger" id="burger" aria-label="关闭菜单">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </aside>
    <button class="sidebar-open-btn" id="sidebarOpen" aria-label="打开菜单">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
    </button>`;
}

/* ---------- 生成 Footer ---------- */
function buildFooter() {
  const v = typeof CHANGELOG_VERSION !== 'undefined' ? CHANGELOG_VERSION : '3.10.5';
  return `
    <div class="page-footer" id="pageFooter">
      <p>© 寒枝可栖 2026 保留所有权利.</p>
      <p>本站已运行 <span id="runTime">0年 0月 0天</span> | v${v}</p>
    </div>`;
}

/* ---------- 生成 Modals ---------- */
function buildModals() {
  return `
    <div class="changelog-overlay" id="changelogOverlay">
      <div class="changelog-modal">
        <div class="changelog-header">
          <div class="changelog-version">
            <span class="changelog-old-ver">v3.10.4</span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            <span class="changelog-new-ver">v3.10.5</span>
          </div>
          <button class="changelog-close-x" id="changelogCloseX" aria-label="关闭">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="changelog-body">
          <ul class="changelog-list" id="changelogPopupList"></ul>
        </div>
        <div class="changelog-footer">
          <button class="changelog-close-btn" id="changelogCloseBtn">关闭</button>
        </div>
      </div>
    </div>

    <div class="settings-overlay" id="settingsOverlay">
      <div class="settings-modal">
        <div class="settings-modal-header">
          <h3>设置</h3>
          <button class="settings-close-x" id="settingsCloseX">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="settings-modal-body">
          <div class="settings-group">
            <p class="settings-group-title">个性化</p>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-name">深色模式</span>
                <span class="settings-item-desc">切换深色 / 浅色主题</span>
              </div>
              <label class="settings-toggle">
                <input type="checkbox" id="settingDarkMode">
                <span class="settings-toggle-slider"></span>
              </label>
            </div>
          </div>
          <div class="settings-group">
            <p class="settings-group-title">缓存管理</p>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-name">检查更新</span>
                <span class="settings-item-desc">获取最新版本</span>
              </div>
              <button type="button" class="settings-btn" id="btnCheckUpdate">检查更新</button>
            </div>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-name">重置版本缓存</span>
                <span class="settings-item-desc">无法更新时尝试重置</span>
              </div>
              <button type="button" class="settings-btn" id="btnResetVersion">重置版本缓存</button>
            </div>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-name">清理资源缓存</span>
                <span class="settings-item-desc">释放空间，下次加载会变慢</span>
              </div>
              <button type="button" class="settings-btn settings-btn-danger" id="btnClearCache">清理资源缓存</button>
            </div>
            <div class="settings-item">
              <div class="settings-item-info">
                <span class="settings-item-name">Cookie 管理</span>
                <span class="settings-item-desc">清除本站所有 Cookie</span>
              </div>
              <button type="button" class="settings-btn settings-btn-danger" id="btnClearCookie">清理 Cookie</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="cookie-consent" id="cookieConsent">
      <div class="cookie-content">
        <div class="cookie-text">
          <span class="cookie-icon">🍪</span>
          <p>本站使用 Cookie 改善浏览体验并统计访问数据，继续使用即表示同意。</p>
        </div>
        <div class="cookie-actions">
          <button class="cookie-btn cookie-decline" id="cookieDecline">仅必要</button>
          <button class="cookie-btn cookie-accept" id="cookieAccept">同意并继续</button>
        </div>
      </div>
    </div>

    <div class="ctx-menu" id="ctxMenu">
      <div class="ctx-item" data-nav="home.html">返回主页</div>
      <div class="ctx-item" data-nav="changelog.html">更新日志</div>
      <div class="ctx-item" id="ctxToolsParent">在线工具</div>
      <div class="ctx-item" data-nav="about.html">关于</div>
      <div class="ctx-item" id="ctxSettings">设置</div>
      <div class="ctx-separator" id="ctxSep"></div>
      <div class="ctx-item" id="ctxCopy">复制</div>
      <div class="ctx-item" id="ctxPaste">粘贴</div>
      <div class="ctx-item" id="ctxCut">剪切</div>
      <div class="ctx-item" id="ctxSearch">搜索</div>
    </div>

    <div class="code-modal-overlay" id="codeModalOverlay">
      <div class="code-modal">
        <div class="code-modal-icon">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <p class="code-modal-title">请输入特殊码</p>
        <p class="code-modal-desc">此操作已被保护，请验证后继续</p>
        <input type="text" class="code-modal-input" id="codeModalInput" placeholder="输入特殊码..." autocomplete="off" spellcheck="false">
        <p class="code-modal-error" id="codeModalError"></p>
        <div class="code-modal-actions">
          <button class="code-modal-btn code-modal-cancel" id="codeModalCancel">取消</button>
          <button class="code-modal-btn code-modal-confirm" id="codeModalConfirm">确认</button>
        </div>
      </div>
    </div>`;
}

/* ---------- 注入布局 ---------- */
function injectLayout() {
  const loadingMount = document.getElementById('loadingBarMount');
  if (loadingMount) loadingMount.innerHTML = '<div class="loading-bar" id="loadingBar"><div class="loading-bar-progress"></div></div>';

  const sidebarMount = document.getElementById('sidebarMount');
  if (sidebarMount) sidebarMount.innerHTML = buildSidebar();

  const footerMount = document.getElementById('footerMount');
  if (footerMount) footerMount.innerHTML = buildFooter();

  const modalsMount = document.getElementById('modalsMount');
  if (modalsMount) modalsMount.innerHTML = buildModals();
}

/* ================================================================
   初始化
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  injectLayout();
  initTheme();
  initThemeToggle();
  initNavigation();
  initSidebar();
  initDropdowns();
  initChangelog();
  initRunTime();
  initSettingsModal();
  initLoadingBar();
  initCookieConsent();
  initContextMenu();
  initShortcutBlock();
  initPageSpecific();
});

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

/* ---------- 导航 ---------- */
function initNavigation() {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const path = el.dataset.nav;
      if (path) navigateTo(path);
    });
  });
}

function navigateTo(path) {
  const base = siteBase();
  const url = base + path;

  var bar = document.getElementById('loadingBar');
  var progress = bar ? bar.querySelector('.loading-bar-progress') : null;
  if (bar && progress) {
    bar.classList.remove('done');
    progress.style.transition = 'none';
    progress.style.width = '0%';
    requestAnimationFrame(function() {
      progress.style.transition = 'width 0.6s ease';
      progress.style.width = '90%';
    });
  }

  var settled = false;
  function go() {
    if (settled) return;
    settled = true;
    if (progress) {
      progress.style.width = '100%';
      setTimeout(function() { if (bar) bar.classList.add('done'); }, 200);
    }
    window.location.href = url;
  }

  setTimeout(go, 8000);

  try {
    fetch(url).then(go, go);
  } catch(e) {
    go();
  }
}

/* ---------- 侧边栏 ---------- */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const burger = document.getElementById('burger');
  const openBtn = document.getElementById('sidebarOpen');
  if (burger) burger.addEventListener('click', () => sidebar.classList.remove('open'));
  if (openBtn) openBtn.addEventListener('click', () => sidebar.classList.add('open'));
}

/* ---------- 下拉菜单 ---------- */
function initDropdowns() {
  document.querySelectorAll('.sidebar-dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dropdown = toggle.closest('.sidebar-dropdown');
      const wasOpen = dropdown.classList.contains('open');
      document.querySelectorAll('.sidebar-dropdown').forEach(d => d.classList.remove('open'));
      if (!wasOpen) dropdown.classList.add('open');
    });
  });
}

/* ---------- 更新日志弹窗 ---------- */
function initChangelog() {
  const overlay = document.getElementById('changelogOverlay');
  if (!overlay) return;

  const popupList = document.getElementById('changelogPopupList');
  if (popupList && typeof CHANGELOG_DATA !== 'undefined' && CHANGELOG_DATA.length > 0) {
    const latest = CHANGELOG_DATA[0];
    popupList.innerHTML = latest.items.map(item =>
      `<li><span class="changelog-tag changelog-tag-${item.tag}">${item.type}</span>${item.text}</li>`
    ).join('');
  }

  const seenVersion = localStorage.getItem('changelog_seen_version');
  if (seenVersion !== (typeof CHANGELOG_VERSION !== 'undefined' ? CHANGELOG_VERSION : '3.10.5')) {
    setTimeout(() => overlay.classList.add('show'), 500);
  }

  const close = () => {
    overlay.classList.remove('show');
    localStorage.setItem('changelog_seen_version', typeof CHANGELOG_VERSION !== 'undefined' ? CHANGELOG_VERSION : '3.10.5');
  };

  const closeX = document.getElementById('changelogCloseX');
  const closeBtn = document.getElementById('changelogCloseBtn');
  if (closeX) closeX.addEventListener('click', close);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  renderFullChangelog();
  updateChangelogDeco();
}

function renderFullChangelog() {
  const container = document.getElementById('changelogFullList');
  if (!container || typeof CHANGELOG_DATA === 'undefined') return;
  let html = '';
  CHANGELOG_DATA.forEach(release => {
    html += `<div class="changelog-item"><div class="changelog-item-header"><div class="changelog-item-version">v${release.version}</div><div class="changelog-item-date">${release.date}</div></div><ul class="changelog-item-list">`;
    release.items.forEach(item => {
      html += `<li><span class="changelog-tag changelog-tag-${item.tag}">${item.type}</span>${item.text}</li>`;
    });
    html += `</ul></div>`;
  });
  container.innerHTML = html;
}

function updateChangelogDeco() {
  const deco = document.getElementById('changelogDeco');
  if (!deco || typeof CHANGELOG_VERSION === 'undefined') return;
  const parts = CHANGELOG_VERSION.split('.');
  if (parts.length >= 3) {
    const patch = parts.slice(2).join('.');
    deco.innerHTML = 'v' + parts.slice(0, 2).join('.') + '<span class="about-deco-patch">.' + patch + '</span>';
  } else {
    deco.textContent = 'v' + CHANGELOG_VERSION;
  }
}

/* ---------- 运行时间 ---------- */
const SITE_START_DATE = new Date('2026-08-15');

function initRunTime() {
  const el = document.getElementById('runTime');
  if (!el) return;
  function update() {
    const now = new Date();
    let years = now.getFullYear() - SITE_START_DATE.getFullYear();
    let months = now.getMonth() - SITE_START_DATE.getMonth();
    let days = now.getDate() - SITE_START_DATE.getDate();
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    el.textContent = `${years}年 ${months}月 ${days}天`;
  }
  update();
  setInterval(update, 60000);
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

/* ---------- 加载进度条 ---------- */
function initLoadingBar() {
  const bar = document.getElementById('loadingBar');
  if (!bar) return;
  const progress = bar.querySelector('.loading-bar-progress');
  if (!progress) return;
  progress.style.width = '0%';
  progress.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  requestAnimationFrame(() => {
    progress.style.width = '100%';
    setTimeout(() => bar.classList.add('done'), 350);
  });
}

/* ---------- Cookie 确认 ---------- */
function initCookieConsent() {
  const banner = document.getElementById('cookieConsent');
  if (!banner) return;
  if (localStorage.getItem('cookie_accepted') === '1') { banner.remove(); return; }
  const accept = document.getElementById('cookieAccept');
  const decline = document.getElementById('cookieDecline');
  if (accept) accept.addEventListener('click', () => { localStorage.setItem('cookie_accepted', '1'); banner.classList.add('hide'); setTimeout(() => banner.remove(), 400); });
  if (decline) decline.addEventListener('click', () => { localStorage.setItem('cookie_accepted', '1'); banner.classList.add('hide'); setTimeout(() => banner.remove(), 400); });
}

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
    const tools = document.getElementById('ctxToolsParent');
    const settings = document.getElementById('ctxSettings');

    [sep, copy, paste, cut, search, home, changelog, about, tools, settings].forEach(hideItem);

    if (inInput) {
      showItem(paste);
      if (t.selectionStart !== t.selectionEnd) { showItem(copy); showItem(cut); showItem(search); }
    } else {
      [home, changelog, about, tools, settings].forEach(showItem);
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

  if (document.getElementById('ctxToolsParent')) {
    document.getElementById('ctxToolsParent').addEventListener('click', (e) => {
      e.stopPropagation(); closeAllCtx(); navigateTo('tools/python.html');
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

/* ---------- 页面特定初始化钩子 ---------- */
function initPageSpecific() {
  const cur = currentFileName();
  if (cur === 'about.html') initAboutPage();
}

/* ---------- 关于页 ---------- */
function initAboutPage() {
  const github = document.getElementById('aboutGithub');
  if (github) github.addEventListener('click', () => window.open('https://github.com/devup5/toolkit', '_blank'));
  const bilibili = document.getElementById('aboutBilibili');
  if (bilibili) bilibili.addEventListener('click', () => window.open('https://space.bilibili.com/3493127635601963', '_blank'));
  const feedback = document.getElementById('aboutFeedback');
  if (feedback) feedback.addEventListener('click', () => {
    const wrap = document.getElementById('feedbackIframe');
    if (wrap) { wrap.style.display = 'block'; feedback.style.display = 'none'; }
  });

  const total = document.getElementById('statTotal');
  if (!total) return;
  const fmt = n => Number(n || 0).toLocaleString('en-US');
  let statsCache = null;

  function animateNumber(el, target, duration) {
    if (!el) return;
    if (target <= 0) { el.textContent = fmt(target); return; }
    const startTime = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    function tick(now) {
      const p = Math.min((now - startTime) / duration, 1);
      el.textContent = fmt(Math.round(target * ease(p)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function playAnimation() {
    if (!statsCache) return;
    total.textContent = '0';
    const today = document.getElementById('statToday');
    const yesterday = document.getElementById('statYesterday');
    const month = document.getElementById('statMonth');
    if (today) today.textContent = '0';
    if (yesterday) yesterday.textContent = '0';
    if (month) month.textContent = '0';
    animateNumber(total, statsCache.total, 1400);
    if (today) animateNumber(today, statsCache.today, 1100);
    if (yesterday) animateNumber(yesterday, statsCache.yesterday, 1100);
    if (month) animateNumber(month, statsCache.month, 1200);
  }

  if (window.PVStatsReady) {
    Promise.resolve(window.PVStatsReady).then(stats => {
      if (!stats) return;
      statsCache = stats;
      playAnimation();
    }).catch(() => {});
  } else {
    var API = 'https://js.ruseo.cn/api/counter.php';
    var KEY = 'e91d240cb9d6f59608ce9db2fded6e79';
    var IDS = ['32213d0aaffbc0c523dce9c372ad9a63','7a5000d0757ff5e1d649df7433d082ba','618c85d0ef884185d67e6caba50d1f65','c9b394fa8ed7a2698d85b9096751db17'];
    Promise.all(IDS.map(id => fetch(API + '?action=get&api_key=' + KEY + '&counter_id=' + id).then(r => r.json()))).then(results => {
      function cnt(r) { return parseInt(r && r.counter && r.counter.current_count, 10) || 0; }
      statsCache = { total: cnt(results[0]), month: cnt(results[1]), today: cnt(results[2]), yesterday: cnt(results[3]) };
      playAnimation();
    }).catch(() => {});
  }

  window.triggerAboutStatsAnimation = playAnimation;
}
