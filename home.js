document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initThemeToggle();
  initPageSwitch();
  initSidebar();
  initDropdowns();
  initToolSwitch();
  initToolDirtyWatch();
  initConfirmDialog();
  initChangelog();
  initAboutLinks();
  initAboutStats();
  initRunTime();
  initSettings();
  initLoadingBar();
  initCookieConsent();
  initContextMenu();
  initShortcutBlock();
});

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
  btn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

function initPageSwitch() {
  const navLinks = document.querySelectorAll('[data-page]:not(.page)');

  navLinks.forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = parseInt(el.dataset.page);
      if (el.classList.contains('sidebar-logo')) {
        location.reload();
        return;
      }
      switchPage(target);
    });
  });

  const footerAbout = document.getElementById('footerAbout');
  if (footerAbout) {
    footerAbout.addEventListener('click', () => {
      switchPage(1);
    });
  }

  const footerSettings = document.getElementById('footerSettings');
  if (footerSettings) {
    footerSettings.addEventListener('click', () => {
      switchPage(4);
    });
  }
}

function switchPage(index) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });
  const target = document.querySelector(`.page[data-page="${index}"]`);
  if (target) target.classList.add('active');

  // 切换到关于页时，触发站点统计数字动画（每次进入都从 0 开始）
  if (index === 1 && typeof window.triggerAboutStatsAnimation === 'function') {
    window.triggerAboutStatsAnimation();
  }

  document.querySelectorAll('.sidebar-link').forEach(l => {
    l.classList.remove('active');
    const page = parseInt(l.dataset.page);
    if (page === index) {
      l.classList.add('active');
    }
  });

  document.querySelectorAll('.page-scroll').forEach(s => {
    if (parseInt(s.id.replace('page', '').replace('Scroll', '')) !== index) s.scrollTop = 0;
  });

  const sidebar = document.getElementById('sidebar');
  if (sidebar && window.innerWidth <= 768) {
    sidebar.classList.remove('open');
  }
}

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

function initToolSwitch() {
  document.querySelectorAll('[data-tool]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const tool = btn.dataset.tool;
      switchTool(tool);
      switchPage(2);
    });
  });
}

function switchTool(toolKey) {
  document.querySelectorAll('[data-tool]').forEach(b => {
    b.classList.toggle('active', b.dataset.tool === toolKey);
  });

  document.querySelectorAll('.try-panel').forEach(p => {
    p.classList.remove('active');
  });

  const panel = document.getElementById(`panel-${toolKey}`);
  if (panel) {
    panel.classList.add('active');
  }
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const burger = document.getElementById('burger');
  const openBtn = document.getElementById('sidebarOpen');

  if (burger) {
    burger.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
  }

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
    });
  }
}

function initChangelog() {
  const overlay = document.getElementById('changelogOverlay');
  if (!overlay) return;

  const seenVersion = localStorage.getItem('changelog_seen_version');
  if (seenVersion !== CHANGELOG_VERSION) {
    setTimeout(() => overlay.classList.add('show'), 500);
  }

  const close = () => {
    overlay.classList.remove('show');
    localStorage.setItem('changelog_seen_version', CHANGELOG_VERSION);
  };

  const closeX = document.getElementById('changelogCloseX');
  const closeBtn = document.getElementById('changelogCloseBtn');
  if (closeX) closeX.addEventListener('click', close);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // 渲染完整更新日志页面
  renderFullChangelog();
}

function renderFullChangelog() {
  const container = document.getElementById('changelogFullList');
  if (!container) return;

  let html = '';
  CHANGELOG_DATA.forEach((release, idx) => {
    html += `<div class="changelog-item">`;
    html += `<div class="changelog-item-header">`;
    html += `<div class="changelog-item-version">v${release.version}</div>`;
    html += `<div class="changelog-item-date">${release.date}</div>`;
    html += `</div>`;
    html += `<ul class="changelog-item-list">`;
    release.items.forEach(item => {
      html += `<li><span class="changelog-tag changelog-tag-${item.tag}">${item.type}</span>${item.text}</li>`;
    });
    html += `</ul>`;
    html += `</div>`;
  });

  container.innerHTML = html;

  const deco = document.getElementById('changelogDeco');
  if (deco) {
    const parts = CHANGELOG_VERSION.split('.');
    if (parts.length >= 3) {
      const patch = parts.slice(2).join('.');
      deco.innerHTML = 'v' + parts.slice(0, 2).join('.') + '<span class="about-deco-patch">.' + patch + '</span>';
    } else {
      deco.textContent = 'v' + CHANGELOG_VERSION;
    }
  }
}

function initAboutLinks() {
  const github = document.getElementById('aboutGithub');
  if (github) github.addEventListener('click', () => window.open('https://github.com/devup5/toolkit', '_blank'));


  const bilibili = document.getElementById('aboutBilibili');
  if (bilibili) bilibili.addEventListener('click', () => window.open('https://space.bilibili.com/3493127635601963', '_blank'));

  const feedback = document.getElementById('aboutFeedback');
  if (feedback) {
    feedback.addEventListener('click', () => {
      const wrap = document.getElementById('feedbackIframe');
      if (wrap) {
        wrap.style.display = 'block';
        feedback.style.display = 'none';
      }
    });
  }
}

function initAboutStats() {
  const total = document.getElementById('statTotal');
  if (!total) return;

  const fmt = n => Number(n || 0).toLocaleString('en-US');
  let statsCache = null;

  function animateNumber(el, target, duration) {
    if (!el) return;
    if (target <= 0) { el.textContent = fmt(target); return; }
    const start = 0;
    const startTime = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    function tick(now) {
      const p = Math.min((now - startTime) / duration, 1);
      const val = Math.round(start + (target - start) * ease(p));
      el.textContent = fmt(val);
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

  // 静默获取数据，不立即播放动画
  Promise.resolve(window.PVStatsReady)
    .then(stats => {
      if (!stats) return;
      statsCache = stats;
      // 如果当前已经在关于页，立即播放
      const activePage = document.querySelector('.page.active');
      if (activePage && parseInt(activePage.dataset.page) === 1) {
        playAnimation();
      }
    })
    .catch(() => {});

  // 暴露触发方法，切换到关于页时调用
  window.triggerAboutStatsAnimation = playAnimation;
}

const SITE_START_DATE = new Date('2026-08-15');

function initRunTime() {
  const el = document.getElementById('runTime');
  if (!el) return;

  function update() {
    const now = new Date();
    let years = now.getFullYear() - SITE_START_DATE.getFullYear();
    let months = now.getMonth() - SITE_START_DATE.getMonth();
    let days = now.getDate() - SITE_START_DATE.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    el.textContent = `${years}年 ${months}月 ${days}天`;
  }

  update();
  setInterval(update, 60000);
}

/* ---------- 设置页面 ---------- */
function initSettings() {
  const darkToggle = document.getElementById('settingDarkMode');

  if (darkToggle) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    darkToggle.checked = isDark;
    darkToggle.addEventListener('change', () => {
      const next = darkToggle.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  const btnCheck = document.getElementById('btnCheckUpdate');
  if (btnCheck) {
    btnCheck.addEventListener('click', () => {
      localStorage.removeItem('changelog_seen_version');
      btnCheck.textContent = '已触发';
      btnCheck.disabled = true;
      setTimeout(() => {
        btnCheck.textContent = '检查更新';
        btnCheck.disabled = false;
        location.reload();
      }, 1500);
    });
  }

  const btnReset = document.getElementById('btnResetVersion');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      // 真正清除所有版本/功能相关缓存：changelog 记忆、Service Worker、Cache Storage
      localStorage.removeItem('changelog_seen_version');

      btnReset.textContent = '重置中...';
      btnReset.disabled = true;

      const clearCaches = ('caches' in window)
        ? caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))))
        : Promise.resolve();

      const clearSW = ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations)
        ? navigator.serviceWorker.getRegistrations().then(regs =>
            Promise.all(regs.map(r => r.unregister().catch(() => {})))
          ).catch(() => {})
        : Promise.resolve();

      Promise.all([clearCaches, clearSW]).then(() => {
        btnReset.textContent = '已重置';
        setTimeout(() => {
          btnReset.textContent = '重置版本缓存';
          btnReset.disabled = false;
          location.reload();
        }, 1200);
      });
    });
  }

  const btnClear = document.getElementById('btnClearCache');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      btnClear.textContent = '清理中...';
      btnClear.disabled = true;
      if ('caches' in window) {
        caches.keys().then(names => {
          return Promise.all(names.map(name => caches.delete(name)));
        }).then(() => {
          btnClear.textContent = '已清理';
          setTimeout(() => {
            btnClear.textContent = '清理资源缓存';
            btnClear.disabled = false;
          }, 1500);
        });
      } else {
        btnClear.textContent = '已清理';
        setTimeout(() => {
          btnClear.textContent = '清理资源缓存';
          btnClear.disabled = false;
        }, 1500);
      }
    });
  }

  const btnClearCookie = document.getElementById('btnClearCookie');
  if (btnClearCookie) {
    btnClearCookie.addEventListener('click', () => {
      btnClearCookie.textContent = '清理中...';
      btnClearCookie.disabled = true;

      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (name) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + location.hostname + ';';
        }
      });

      setTimeout(() => {
        btnClearCookie.textContent = '已清理';
        setTimeout(() => {
          btnClearCookie.textContent = '清理 Cookie';
          btnClearCookie.disabled = false;
        }, 1500);
      }, 500);
    });
  }
}

/* ================================================================
   工具脏状态跟踪 & 切换确认
   ================================================================ */

const toolDirtyState = {
  currentTool: 'python',
  defaults: {}
};

function isCurrentToolDirty() {
  const tool = toolDirtyState.currentTool;
  const id = getEditorIdForTool(tool);
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  const def = toolDirtyState.defaults[tool];
  if (def === undefined) return false;
  return el.value !== def;
}

function getEditorIdForTool(tool) {
  const map = {
    python: 'pyCode',
    markdown: 'mdCode',
    html: 'htmlCode',
    css: 'cssCode',
    javascript: 'jsCode'
  };
  return map[tool] || null;
}

function initToolDirtyWatch() {
  // 记录每个工具编辑器的初始值
  const tools = ['python', 'markdown', 'html', 'css', 'javascript'];
  tools.forEach(tool => {
    const id = getEditorIdForTool(tool);
    const el = document.getElementById(id);
    if (el) toolDirtyState.defaults[tool] = el.value;
  });

  // 监听输入变化（可选：防抖触发某些效果）
  tools.forEach(tool => {
    const id = getEditorIdForTool(tool);
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        toolDirtyState.defaults[tool]; // no-op, just ensure tracking
      });
    }
  });
}

/* ================================================================
   确认弹窗（居中悬浮）
   ================================================================ */

let confirmCallback = null;

function initConfirmDialog() {
  const overlay = document.getElementById('confirmOverlay');
  const cancelBtn = document.getElementById('confirmCancel');
  const okBtn = document.getElementById('confirmOk');

  if (!overlay) return;

  function close() {
    overlay.classList.remove('show');
    confirmCallback = null;
  }

  cancelBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('show')) close();
  });

  okBtn.addEventListener('click', () => {
    if (confirmCallback) {
      const cb = confirmCallback;
      confirmCallback = null;
      overlay.classList.remove('show');
      cb();
    } else {
      overlay.classList.remove('show');
    }
  });
}

function showConfirm(title, body, onOk) {
  const overlay = document.getElementById('confirmOverlay');
  const titleEl = document.getElementById('confirmTitle');
  const bodyEl = document.getElementById('confirmBody');
  if (!overlay) { onOk && onOk(); return; }

  if (titleEl) titleEl.textContent = title || '确认';
  if (bodyEl) bodyEl.textContent = body || '确定要继续吗？';
  confirmCallback = onOk || null;

  overlay.classList.add('show');
}

// 重写 switchTool 加入脏检测确认
const originalSwitchTool = switchTool;
switchTool = function(toolKey) {
  if (toolKey === toolDirtyState.currentTool) {
    originalSwitchTool(toolKey);
    return;
  }

  if (isCurrentToolDirty()) {
    showConfirm('切换工具', '当前代码有修改，切换后会丢失未保存的内容，确定继续吗？', () => {
      // 更新新工具的默认值快照
      const id = getEditorIdForTool(toolKey);
      const el = document.getElementById(id);
      if (el) toolDirtyState.defaults[toolKey] = el.value;
      toolDirtyState.currentTool = toolKey;
      originalSwitchTool(toolKey);
    });
  } else {
    const id = getEditorIdForTool(toolKey);
    const el = document.getElementById(id);
    if (el) toolDirtyState.defaults[toolKey] = el.value;
    toolDirtyState.currentTool = toolKey;
    originalSwitchTool(toolKey);
  }
};

// 重写 switchPage — 同页无效 + 加载条 + 离开工具页检查
const originalSwitchPage = switchPage;
function runNavLoadingBar(onComplete) {
  const bar = document.getElementById('loadingBar');
  const progress = bar ? bar.querySelector('.loading-bar-progress') : null;
  if (!progress) { onComplete(); return; }

  bar.classList.remove('done');
  progress.style.width = '0%';

  let width = 0;
  const interval = setInterval(() => {
    width += Math.random() * 25 + 15;
    if (width >= 100) {
      width = 100;
      clearInterval(interval);
      progress.style.width = '100%';
      setTimeout(() => {
        bar.classList.add('done');
        onComplete();
      }, 200);
    }
    progress.style.width = width + '%';
  }, 80);
}
switchPage = function(index) {
  const activePage = document.querySelector('.page.active');
  const currentPage = activePage ? parseInt(activePage.dataset.page) : -1;

  if (currentPage === index) return;

  if (currentPage === 2 && index !== 2 && isCurrentToolDirty()) {
    showConfirm('离开工具页', '当前代码有修改，离开后会丢失未保存的内容，确定继续吗？', () => {
      runNavLoadingBar(() => originalSwitchPage(index));
    });
    return;
  }

  runNavLoadingBar(() => originalSwitchPage(index));
};

/* ---------- 顶部加载进度条 ---------- */
function initLoadingBar() {
  const bar = document.getElementById('loadingBar');
  if (!bar) return;
  const progress = bar.querySelector('.loading-bar-progress');
  if (!progress) return;

  let width = 0;
  const interval = setInterval(() => {
    width += Math.random() * 18 + 6;
    if (width >= 100) {
      width = 100;
      clearInterval(interval);
      progress.style.width = '100%';
      setTimeout(() => {
        bar.classList.add('done');
      }, 300);
    }
    progress.style.width = width + '%';
  }, 120);
}

/* ---------- Cookie 使用确认 ---------- */
function initCookieConsent() {
  const banner = document.getElementById('cookieConsent');
  if (!banner) return;

  if (localStorage.getItem('cookie_accepted') === '1') {
    banner.remove();
    return;
  }

  const acceptBtn = document.getElementById('cookieAccept');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem('cookie_accepted', '1');
      banner.classList.add('hide');
      setTimeout(() => banner.remove(), 400);
    });
  }

  const declineBtn = document.getElementById('cookieDecline');
  if (declineBtn) {
    declineBtn.addEventListener('click', () => {
      localStorage.setItem('cookie_accepted', '1');
      banner.classList.add('hide');
      setTimeout(() => banner.remove(), 400);
    });
  }
}

/* ---------- 自定义右键菜单 ---------- */
function initContextMenu() {
  const menu = document.getElementById('ctxMenu');
  if (!menu) return;

  const els = {
    home: document.getElementById('ctxHome'),
    changelog: document.getElementById('ctxChangelog'),
    tools: document.getElementById('ctxTools'),
    about: document.getElementById('ctxAbout'),
    settings: document.getElementById('ctxSettings'),
    sep: document.getElementById('ctxSep'),
    copy: document.getElementById('ctxCopy'),
    paste: document.getElementById('ctxPaste'),
    cut: document.getElementById('ctxCut'),
    search: document.getElementById('ctxSearch'),
  };

  let targetEl = null;

  function hideMenu() {
    menu.classList.remove('show');
    menu.style.display = 'none';
  }

  function showItem(el) { if (el) el.style.display = ''; }
  function hideItem(el) { if (el) el.style.display = 'none'; }

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    const t = e.target;
    const inInput = t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT');
    targetEl = inInput ? t : null;

    const sel = window.getSelection();
    const hasPageSel = !inInput && sel && sel.toString().trim().length > 0;
    let hasInputSel = false;
    if (inInput && t.selectionStart !== undefined) {
      hasInputSel = t.selectionStart !== t.selectionEnd;
    }

    // 先隐藏所有项
    Object.values(els).forEach(hideItem);

    if (inInput) {
      // 输入框内：粘贴始终显示
      showItem(els.paste);
      if (hasInputSel) {
        showItem(els.copy);
        showItem(els.cut);
        showItem(els.search);
      }
    } else {
      // 非输入框：导航项始终显示
      showItem(els.home);
      showItem(els.changelog);
      showItem(els.tools);
      showItem(els.about);
      showItem(els.settings);
      if (hasPageSel) {
        showItem(els.sep);
        showItem(els.copy);
        showItem(els.search);
      }
    }

    // 定位
    menu.style.display = 'block';
    menu.classList.add('show');
    const rect = menu.getBoundingClientRect();
    let x = e.clientX, y = e.clientY;
    if (x + rect.width > window.innerWidth - 4) x = window.innerWidth - rect.width - 4;
    if (y + rect.height > window.innerHeight - 4) y = window.innerHeight - rect.height - 4;
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
  });

  document.addEventListener('click', hideMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideMenu();
  });
  document.addEventListener('scroll', hideMenu, true);

  // 导航项点击
  els.home.addEventListener('click', (e) => {
    e.stopPropagation();
    hideMenu();
    location.reload();
  });
  els.changelog.addEventListener('click', (e) => {
    e.stopPropagation();
    hideMenu();
    if (typeof switchPage === 'function') switchPage(3);
  });
  els.tools.addEventListener('click', (e) => {
    e.stopPropagation();
    hideMenu();
    if (typeof switchPage === 'function') switchPage(2);
  });
  els.about.addEventListener('click', (e) => {
    e.stopPropagation();
    hideMenu();
    if (typeof switchPage === 'function') switchPage(1);
  });
  els.settings.addEventListener('click', (e) => {
    e.stopPropagation();
    hideMenu();
    if (typeof switchPage === 'function') switchPage(4);
  });

  els.copy.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (targetEl && targetEl.selectionStart !== targetEl.selectionEnd) {
      const s = targetEl.selectionStart, en = targetEl.selectionEnd;
      const text = targetEl.value.substring(s, en);
      try { await navigator.clipboard.writeText(text); } catch { document.execCommand('copy'); }
    } else {
      const sel = window.getSelection();
      if (sel && sel.toString()) {
        try { await navigator.clipboard.writeText(sel.toString()); } catch { document.execCommand('copy'); }
      }
    }
    hideMenu();
  });

  els.paste.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (targetEl && (targetEl.tagName === 'TEXTAREA' || targetEl.tagName === 'INPUT')) {
      try {
        const text = await navigator.clipboard.readText();
        const s = targetEl.selectionStart, en = targetEl.selectionEnd;
        targetEl.value = targetEl.value.substring(0, s) + text + targetEl.value.substring(en);
        targetEl.selectionStart = targetEl.selectionEnd = s + text.length;
        targetEl.dispatchEvent(new Event('input'));
        targetEl.focus();
      } catch {}
    }
    hideMenu();
  });

  els.cut.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (targetEl && targetEl.selectionStart !== targetEl.selectionEnd) {
      const s = targetEl.selectionStart, en = targetEl.selectionEnd;
      const text = targetEl.value.substring(s, en);
      try { await navigator.clipboard.writeText(text); } catch {}
      targetEl.value = targetEl.value.substring(0, s) + targetEl.value.substring(en);
      targetEl.selectionStart = targetEl.selectionEnd = s;
      targetEl.dispatchEvent(new Event('input'));
      targetEl.focus();
    } else {
      const sel = window.getSelection();
      if (sel && sel.toString()) {
        try { await navigator.clipboard.writeText(sel.toString()); } catch {}
        sel.deleteFromDocument();
      }
    }
    hideMenu();
  });

  els.search.addEventListener('click', (e) => {
    e.stopPropagation();
    let query = '';
    if (targetEl && targetEl.selectionStart !== targetEl.selectionEnd) {
      query = targetEl.value.substring(targetEl.selectionStart, targetEl.selectionEnd);
    } else {
      const sel = window.getSelection();
      if (sel) query = sel.toString().trim();
    }
    if (query) {
      window.open('https://cn.bing.com/search?q=' + encodeURIComponent(query), '_blank');
    }
    hideMenu();
  });
}

/* ---------- 快捷键拦截（Ctrl+U / Ctrl+Shift+I） ---------- */
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

  function showModal(type) {
    pendingShortcut = type;
    input.value = '';
    errorEl.textContent = '';
    overlay.classList.add('show');
    setTimeout(() => input.focus(), 50);
  }

  function hideModal() {
    overlay.classList.remove('show');
    pendingShortcut = null;
  }

  function verify() {
    if (input.value.trim() === SPECIAL_CODE) {
      hideModal();
      if (pendingShortcut === 'view-source') {
        window.open('view-source:' + window.location.href, '_blank');
      } else if (pendingShortcut === 'devtools') {
        bypass = true;
      }
    } else {
      errorEl.textContent = '特殊码不正确';
      input.value = '';
      input.focus();
    }
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
      if (bypass) { bypass = false; return; }
      e.preventDefault();
      showModal('view-source');
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
      if (bypass) { bypass = false; return; }
      e.preventDefault();
      showModal('devtools');
    }
    if (e.key === 'F12' || e.keyCode === 123) {
      if (bypass) { bypass = false; return; }
      e.preventDefault();
      showModal('devtools');
    }
  });

  confirmBtn.addEventListener('click', verify);
  cancelBtn.addEventListener('click', hideModal);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); verify(); }
    if (e.key === 'Escape') { hideModal(); }
  });
}