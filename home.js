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

  const footerGithub = document.getElementById('footerGithub');
  if (footerGithub) {
    footerGithub.addEventListener('click', () => {
      window.open('https://github.com', '_blank');
    });
  }

  const footerBilibili = document.getElementById('footerBilibili');
  if (footerBilibili) {
    footerBilibili.addEventListener('click', () => {
      window.open('https://space.bilibili.com/3493127635601963?spm_id_from=333.1007.0.0', '_blank');
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

const CHANGELOG_VERSION = '2.13.1';

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
