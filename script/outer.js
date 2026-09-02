/* ================================================================
   outer.js — 布局注入、Footer、Modals、Changelog、加载条、Cookie 确认、关于页
   ================================================================ */

/* ---------- 生成 Footer ---------- */
function buildFooter() {
  const v = typeof CHANGELOG_VERSION !== 'undefined' ? CHANGELOG_VERSION : '3.11';
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
            <span class="changelog-old-ver">v3.10.5</span>

            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            <span class="changelog-new-ver">v3.11</span>
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
      <div class="ctx-item" id="ctxCompileParent">编译工具</div>
      <div class="ctx-item" id="ctxEditorParent">前端编辑器</div>
      <div class="ctx-item" id="ctxFrontendParent">前端工具</div>
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
  if (seenVersion !== (typeof CHANGELOG_VERSION !== 'undefined' ? CHANGELOG_VERSION : '3.11')) {
    setTimeout(() => overlay.classList.add('show'), 500);
  }

  const close = () => {
    overlay.classList.remove('show');
    localStorage.setItem('changelog_seen_version', typeof CHANGELOG_VERSION !== 'undefined' ? CHANGELOG_VERSION : '3.11');
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
