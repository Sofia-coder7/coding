const projects = [
  {
    id: 1,
    title: 'TurboWarp 互动游戏集',
    desc: '基于 TurboWarp 平台开发的系列互动小游戏，涵盖迷宫、打砖块等经典玩法。',
    cover: 'https://picsum.photos/seed/turbowarp-game/600/400',
    tags: ['TurboWarp', '积木编程', '游戏']
  },
  {
    id: 2,
    title: '静态网站快速部署',
    desc: '从构建到上线的完整部署流程，支持 GitHub Pages 与 Vercel 一键托管。',
    cover: 'https://picsum.photos/seed/deploy-site/600/400',
    tags: ['网站部署', 'GitHub Pages', 'Vercel']
  },
  {
    id: 3,
    title: '响应式个人博客',
    desc: '纯 HTML / CSS / JavaScript 手写，支持暗色模式与文章分类筛选。',
    cover: 'https://picsum.photos/seed/html-blog/600/400',
    tags: ['HTML', 'CSS', 'JavaScript']
  },
  {
    id: 4,
    title: 'AI 智能体助手',
    desc: '基于大语言模型构建的智能对话助手，支持多轮对话与工具调用。',
    cover: 'https://picsum.photos/seed/ai-agent/600/400',
    tags: ['AI 智能体', 'LLM', 'Prompt']
  },
  {
    id: 5,
    title: 'TurboWarp 教学课件',
    desc: '面向编程初学者的 TurboWarp 教学项目，用积木拖拽理解循环、条件与变量。',
    cover: 'https://picsum.photos/seed/turbowarp-edu/600/400',
    tags: ['TurboWarp', '教学', '积木编程']
  },
  {
    id: 6,
    title: 'AI 提示词工程库',
    desc: '整理和优化常用 AI 提示词模板，覆盖写作、编程、分析等场景。',
    cover: 'https://picsum.photos/seed/prompt-lib/600/400',
    tags: ['AI 智能体', 'Prompt', 'LLM']
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initThemeToggle();
  initPageSwitch();
  initBurger();
  initToolSwitch();
  renderProjects();
  initScrollReveal();
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

  const backHome = document.getElementById('backHome');
  if (backHome) {
    backHome.addEventListener('click', () => {
      switchPage(0);
    });
  }

  const footerAbout = document.getElementById('footerAbout');
  if (footerAbout) {
    footerAbout.addEventListener('click', () => {
      window.location.href = 'blog.html';
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

  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.remove('active');
    const page = parseInt(l.dataset.page);
    if (page === index) {
      l.classList.add('active');
    }
  });

  document.querySelectorAll('.page-scroll').forEach(s => {
    if (parseInt(s.id.replace('page', '').replace('Scroll', '')) !== index) s.scrollTop = 0;
  });

  document.getElementById('burger').classList.remove('open');
  document.getElementById('navList').classList.remove('open');
}

function initToolSwitch() {
  const btns = document.querySelectorAll('.tool-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      switchTool(tool);
    });
  });
}

function switchTool(toolKey) {
  document.querySelectorAll('.tool-btn').forEach(b => {
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

function initBurger() {
  const btn = document.getElementById('burger');
  const list = document.getElementById('navList');
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    list.classList.toggle('open');
  });
}

function renderProjects() {
  const list = document.getElementById('projectList');
  list.innerHTML = '';
  projects.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'project-card';
    card.style.animationDelay = `${i * 0.08}s`;
    card.innerHTML = `
      <div class="project-cover">
        <img src="${p.cover}" alt="${p.title}" loading="lazy">
        <div class="project-overlay">
          <a href="#" class="overlay-btn" title="查看详情" aria-label="查看详情">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>
          </a>
          <a href="#" class="overlay-btn" title="源码" aria-label="源码">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
          </a>
        </div>
      </div>
      <div class="project-body">
        <h3 class="project-title">${p.title}</h3>
        <p class="project-desc">${p.desc}</p>
        <div class="project-tags">
          ${p.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

function initScrollReveal() {
  const els = document.querySelectorAll('.project-card');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}
