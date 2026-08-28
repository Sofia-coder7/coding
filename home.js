document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initThemeToggle();
  initPageSwitch();
  initSidebar();
  initDropdowns();
  initToolSwitch();
  initChangelog();
  initAboutLinks();
  initRunTime();
  initSettings();
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

const CHANGELOG_VERSION = '2.41';

const CHANGELOG_DATA = [
  {
    version: '2.41',
    date: '2026-08-28',
    items: [
      { type: '移除', tag: 'del', text: '去除 AI 对话功能，删除浮动按钮、对话浮窗及相关代码' },
      { type: '优化', tag: 'optimize', text: '导航栏去除"设置"项，仅保留底部设置图标' },
      { type: '更换', tag: 'replace', text: '更换博客图标为书本样式 SVG path' },
      { type: '新增', tag: 'new', text: '所有在线工具支持导入文件并解析（Python 导入 .py，Markdown 导入 .md）' }
    ]
  },
  {
    version: '2.40',
    date: '2026-08-28',
    items: [
      { type: '移除', tag: 'del', text: '完整移除登录注册系统，删除 login.html、register.html、userlogin.js、userlogin.css、privacy.html' },
      { type: '新增', tag: 'new', text: '新增设置页面，支持深色模式切换、边缘高光效果开关' },
      { type: '新增', tag: 'new', text: '设置页面支持缓存管理：检查更新、重置版本缓存、清理资源缓存' },
      { type: '新增', tag: 'new', text: '接入 51.la 网站统计' }
    ]
  },
  {
    version: '2.39',
    date: '2026-08-28',
    items: [
      { type: '优化', tag: 'optimize', text: '全站整体放大至 1.15 倍，视觉效果更加舒适' },
      { type: '优化', tag: 'optimize', text: '更新日志标签颜色优化：新增绿、优化蓝、更换黄、修复橘、删除红' },
      { type: '优化', tag: 'optimize', text: '在线工具子项默认灰色显示，去除默认蓝色高亮' },
      { type: '更换', tag: 'replace', text: '侧边栏底部移除 GitHub 和 bilibili 图标，新增设置图标' }
    ]
  },
  {
    version: '2.38.3',
    date: '2026-08-28',
    items: [
      { type: '修复', tag: 'fix', text: '更新日志装饰文字补丁号改为下标显示' }
    ]
  },
  {
    version: '2.38.2',
    date: '2026-08-28',
    items: [
      { type: '优化', tag: 'optimize', text: '更新日志装饰文字中补丁号缩小显示（如 v2.38 正常，.2 缩小上标）' }
    ]
  },
  {
    version: '2.38.1',
    date: '2026-08-28',
    items: [
      { type: '修复', tag: 'fix', text: '更新日志页面装饰文字改为自动跟随版本号，无需手动修改' }
    ]
  },
  {
    version: '2.38',
    date: '2026-08-28',
    items: [
      { type: '优化', tag: 'optimize', text: 'about-title 标题字号再放大 1.2 倍' },
      { type: '优化', tag: 'optimize', text: 'Markdown 工具图标替换为 SVG path 铅笔图标' },
      { type: '优化', tag: 'optimize', text: '"在线工具"下拉菜单默认展开' }
    ]
  },
  {
    version: '2.37.2',
    date: '2026-08-28',
    items: [
      { type: '优化', tag: 'optimize', text: '放大"关于"和"更新日志"页面标题字号至 1.2 倍' }
    ]
  },
  {
    version: '2.37.1',
    date: '2026-08-28',
    items: [
      { type: '修复', tag: 'fix', text: '修复更新日志页面装饰文字仍显示 v2.36 的问题' }
    ]
  },
  {
    version: '2.37',
    date: '2026-08-28',
    items: [
      { type: '优化', tag: 'optimize', text: '在线工具下拉菜单图标替换为 SVG path，风格统一' },
      { type: '更换', tag: 'replace', text: '域名更换为 sofia-coder7.github.io' },
      { type: '新增', tag: 'new', text: '侧边栏新增"博客"入口，快捷跳转博客页面' },
      { type: '移除', tag: 'del', text: '暂时去除登录、注册系统' }
    ]
  },
  {
    version: '2.36',
    date: '2026-08-28',
    items: [
      { type: '新增', tag: 'new', text: '新增"更新日志"独立页面，展示历代所有版本更新记录' }
    ]
  },
  {
    version: '2.35.4',
    date: '2026-08-28',
    items: [
      { type: '新增', tag: 'new', text: 'Python 引擎支持 class 类定义、实例化、方法调用、self 关键字' },
      { type: '新增', tag: 'new', text: '支持字典 dict、列表方法（append/pop/items/get）、字符串方法（lower/strip/split）' },
      { type: '新增', tag: 'new', text: '支持 time/datetime 模块、round() 函数、for 循环多变量解包' },
      { type: '修复', tag: 'fix', text: '字符串转义字符（\\n、\\t 等）无法正确解析的问题' },
      { type: '修复', tag: 'fix', text: '赋值号 = 与比较运算符 == 混淆的问题' }
    ]
  },
  {
    version: '2.35.3',
    date: '2026-08-28',
    items: [
      { type: '修复', tag: 'fix', text: '重写 Python 引擎为递归 async 架构，修复函数体内 while/try/input 不生效的问题' },
      { type: '新增', tag: 'new', text: '支持 return 语句、for...in 列表遍历、range() 函数、int() 异常抛出' }
    ]
  },
  {
    version: '2.35.2',
    date: '2026-08-28',
    items: [
      { type: '优化', tag: 'optimize', text: 'Python 输出区域提供输入交互服务，支持 input() 函数' }
    ]
  },
  {
    version: '2.35.1',
    date: '2026-08-28',
    items: [
      { type: '修复', tag: 'fix', text: '修复 Python 预览引擎若干错误' }
    ]
  },
  {
    version: '2.35',
    date: '2026-08-27',
    items: [
      { type: '移除', tag: 'del', text: '去除 Minecraft 相关页面与"在线网站"栏目内容' },
      { type: '移除', tag: 'del', text: '去除"T显编辑"工具' },
      { type: '新增', tag: 'new', text: 'Python 运行预览内置到 tool.js，不依赖 Pyodide' },
      { type: '优化', tag: 'optimize', text: '在线工具下拉菜单 CSS 缩小 0.85 倍，右移 5px' }
    ]
  },
  {
    version: '2.34.1',
    date: '2026-08-26',
    items: [
      { type: '修复', tag: 'fix', text: '修复刷新网页无需输入邀请码的问题' }
    ]
  },
  {
    version: '2.34',
    date: '2026-08-26',
    items: [
      { type: '优化', tag: 'optimize', text: '站内跳转链接不受邀请码管控，独立访问需输入' }
    ]
  },
  {
    version: '2.33',
    date: '2026-08-25',
    items: [
      { type: '新增', tag: 'new', text: '登录、注册需同意隐私政策' },
      { type: '优化', tag: 'optimize', text: '隐私政策链接改为新窗口打开' }
    ]
  },
  {
    version: '2.32',
    date: '2026-08-24',
    items: [
      { type: '优化', tag: 'optimize', text: '所有邀请码不在本地保存，每次访问都需输入' }
    ]
  },
  {
    version: '2.31',
    date: '2026-08-23',
    items: [
      { type: '新增', tag: 'new', text: '全站邀请码门控，输入正确邀请码方可访问' },
      { type: '新增', tag: 'new', text: '新建 develop 文件夹，需管理员密码访问' }
    ]
  },
  {
    version: '2.21.2',
    date: '2026-08-22',
    items: [
      { type: '修复', tag: 'fix', text: '登录/注册 API 请求地址添加 /login 和 /register 后缀' }
    ]
  },
  {
    version: '2.21.1',
    date: '2026-08-22',
    items: [
      { type: '优化', tag: 'optimize', text: '注册/登录页面 Logo 更换为 blog-icon.jpg' }
    ]
  },
  {
    version: '2.21',
    date: '2026-08-22',
    items: [
      { type: '新增', tag: 'new', text: '制作 login.html / register.html 登录注册页面' },
      { type: '新增', tag: 'new', text: '接入登录注册 API，对接云端数据库' },
      { type: '新增', tag: 'new', text: '增加"保持登录"选项，本地保存用户信息' },
      { type: '优化', tag: 'optimize', text: '登录/注册按钮仅在 blog 中显示，home 不需要登录' }
    ]
  },
  {
    version: '2.13.2',
    date: '2026-08-21',
    items: [
      { type: '优化', tag: 'optimize', text: '下拉菜单中的工具 CSS 缩小 0.85 倍，右移 10px' }
    ]
  },
  {
    version: '2.13.1',
    date: '2026-08-21',
    items: [
      { type: '移除', tag: 'del', text: '去除"项目"界面' }
    ]
  },
  {
    version: '2.13',
    date: '2026-08-20',
    items: [
      { type: '新增', tag: 'new', text: 'GitHub 文件夹代码彻底去除 AI 相关功能' }
    ]
  }
];

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
  if (github) github.addEventListener('click', () => window.open('https://github.com', '_blank'));

  const bilibili = document.getElementById('aboutBilibili');
  if (bilibili) bilibili.addEventListener('click', () => window.open('https://space.bilibili.com/3493127635601963', '_blank'));

  const blog = document.getElementById('aboutBlog');
  if (blog) blog.addEventListener('click', () => window.location.href = 'blog.html');
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

/* ---------- 边缘高光效果 ---------- */
let edgeGlowHandler = null;

function enableEdgeGlow() {
  if (edgeGlowHandler) return;
  edgeGlowHandler = (e) => {
    const els = document.querySelectorAll('.about-tech-card, .settings-item, .changelog-item, .try-panel, .about-tool-item');
    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (mx >= 0 && mx <= rect.width && my >= 0 && my <= rect.height) {
        el.style.setProperty('--gx', mx + 'px');
        el.style.setProperty('--gy', my + 'px');
        el.classList.add('edge-glow');
      } else {
        el.classList.remove('edge-glow');
      }
    });
  };
  document.addEventListener('mousemove', edgeGlowHandler);
}

function disableEdgeGlow() {
  if (!edgeGlowHandler) return;
  document.removeEventListener('mousemove', edgeGlowHandler);
  edgeGlowHandler = null;
  document.querySelectorAll('.edge-glow').forEach(el => {
    el.classList.remove('edge-glow');
    el.style.removeProperty('--gx');
    el.style.removeProperty('--gy');
  });
}

/* ---------- 设置页面 ---------- */
function initSettings() {
  const darkToggle = document.getElementById('settingDarkMode');
  const glowToggle = document.getElementById('settingEdgeGlow');

  if (darkToggle) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    darkToggle.checked = isDark;
    darkToggle.addEventListener('change', () => {
      const next = darkToggle.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  if (glowToggle) {
    const glowSaved = localStorage.getItem('edge_glow') === 'on';
    glowToggle.checked = glowSaved;
    if (glowSaved) enableEdgeGlow();
    glowToggle.addEventListener('change', () => {
      if (glowToggle.checked) {
        localStorage.setItem('edge_glow', 'on');
        enableEdgeGlow();
      } else {
        localStorage.setItem('edge_glow', 'off');
        disableEdgeGlow();
      }
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
      localStorage.removeItem('changelog_seen_version');
      btnReset.textContent = '已重置';
      btnReset.disabled = true;
      setTimeout(() => {
        btnReset.textContent = '重置版本缓存';
        btnReset.disabled = false;
      }, 1500);
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
}
