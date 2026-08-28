/* ================================================================
   DevBlog — 交互逻辑
   ================================================================ */

// ---------- 文章数据 ----------
const posts = [
  {
    id: 1,
    title: '深入理解 JavaScript 异步编程',
    excerpt: '从回调函数到 Promise，再到 async/await，探索 JavaScript 异步编程的演进历程和最佳实践。',
    category: 'tech',
    categoryName: '技术',
    cover: 'https://picsum.photos/seed/js-async/600/400',
    date: '2026-08-15',
    views: 328,
    comments: 12
  },
  {
    id: 2,
    title: '使用 CSS 玻璃拟态打造现代 UI',
    excerpt: 'backdrop-filter 的妙用，教你用纯 CSS 实现毛玻璃效果，提升界面质感与层次感。',
    category: 'tech',
    categoryName: '技术',
    cover: 'https://picsum.photos/seed/css-glass/600/400',
    date: '2026-08-12',
    views: 256,
    comments: 8
  },
  {
    id: 3,
    title: '周末徒步记：城市边缘的自然之美',
    excerpt: '远离喧嚣，走进山林，记录一次周末徒步的所见所感，感受大自然带来的宁静与力量。',
    category: 'life',
    categoryName: '生活',
    cover: 'https://picsum.photos/seed/hiking/600/400',
    date: '2026-08-08',
    views: 189,
    comments: 15
  },
  {
    id: 4,
    title: 'React 18 新特性全面解析',
    excerpt: '并发渲染、自动批处理、Transitions，React 18 带来了哪些革命性的变化？',
    category: 'tech',
    categoryName: '技术',
    cover: 'https://picsum.photos/seed/react18/600/400',
    date: '2026-08-05',
    views: 412,
    comments: 23
  },
  {
    id: 5,
    title: '关于代码与人生的随想',
    excerpt: '写代码多年后的一些感悟，技术之外的思考，关于成长、热爱与坚持。',
    category: 'essay',
    categoryName: '随笔',
    cover: 'https://picsum.photos/seed/code-life/600/400',
    date: '2026-08-01',
    views: 567,
    comments: 31
  },
  {
    id: 6,
    title: 'Docker 容器化部署实践指南',
    excerpt: '从 Dockerfile 编写到多容器编排，手把手教你容器化部署完整流程。',
    category: 'tech',
    categoryName: '技术',
    cover: 'https://picsum.photos/seed/docker/600/400',
    date: '2026-07-28',
    views: 298,
    comments: 9
  }
];

// 分类颜色
const catColors = {
  tech: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  life: 'linear-gradient(135deg, #10b981, #059669)',
  essay: 'linear-gradient(135deg, #ec4899, #db2777)'
};

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbar();
  initMobileMenu();
  initThemeToggle();
  renderPosts(posts);
  initFilter();
  initBackToTop();
  initScrollSpy();
  initCounter();
  initScrollReveal();
  initLoadMore();
});

// ---------- 主题 ----------
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
  const btn = document.getElementById('themeToggle');
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    btn.style.transform = 'scale(0.9) rotate(15deg)';
    setTimeout(() => btn.style.transform = '', 200);
  });
}

// ---------- 导航栏 ----------
function initNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav.classList.add('is-sticky');
    } else {
      nav.classList.remove('is-sticky');
    }
  });
}

function initMobileMenu() {
  const btn = document.getElementById('menuBtn');
  const links = document.getElementById('navLinks');

  btn.addEventListener('click', () => {
    btn.classList.toggle('is-open');
    links.classList.toggle('is-open');
  });

  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('is-open');
      links.classList.remove('is-open');
    });
  });
}

// ---------- 渲染文章 ----------
function renderPosts(list) {
  const grid = document.getElementById('postGrid');
  grid.innerHTML = '';
  list.forEach((p, i) => grid.appendChild(createCard(p, i)));
  // 触发滚动动画
  initScrollReveal();
}

function createCard(post, index) {
  const card = document.createElement('article');
  card.className = 'post-card';
  card.dataset.category = post.category;
  card.style.animationDelay = `${index * 0.08}s`;

  const color = catColors[post.category] || catColors.tech;

  card.innerHTML = `
    <div class="post-cover">
      <img src="${post.cover}" alt="${post.title}" loading="lazy">
      <span class="post-tag" style="background:${color};">${post.categoryName}</span>
    </div>
    <div class="post-body">
      <h3 class="post-title">${post.title}</h3>
      <p class="post-excerpt">${post.excerpt}</p>
      <div class="post-foot">
        <div class="post-meta">
          <span>📅 ${post.date}</span>
          <span>👁 ${post.views}</span>
          <span>💬 ${post.comments}</span>
        </div>
        <span class="post-more">阅读 →</span>
      </div>
    </div>
  `;

  card.addEventListener('click', () => {
    console.log('打开文章:', post.title);
  });

  return card;
}

// ---------- 分类过滤 ----------
function initFilter() {
  const chips = document.querySelectorAll('.chip');
  const grid = document.getElementById('postGrid');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.dataset.filter;
      const list = filter === 'all' ? posts : posts.filter(p => p.category === filter);

      grid.style.opacity = '0';
      grid.style.transform = 'translateY(8px)';
      setTimeout(() => {
        renderPosts(list);
        grid.style.opacity = '1';
        grid.style.transform = 'translateY(0)';
        grid.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      }, 250);
    });
  });
}

// ---------- 回到顶部 ----------
function initBackToTop() {
  const btn = document.getElementById('toTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) btn.classList.add('show');
    else btn.classList.remove('show');
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ---------- 滚动高亮 ----------
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id], header[id]');
  const items = document.querySelectorAll('.nav-item');

  window.addEventListener('scroll', () => {
    let current = '';
    const pos = window.scrollY + 120;

    sections.forEach(s => {
      const top = s.offsetTop;
      const h = s.offsetHeight;
      if (pos >= top && pos < top + h) current = s.id;
    });

    items.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') === `#${current}`) {
        item.classList.add('active');
      }
    });
  });
}

// ---------- 数字动画 ----------
function initCounter() {
  const nums = document.querySelectorAll('.meta-num');
  let done = false;

  const animate = (el) => {
    const target = +el.dataset.count;
    const dur = 1800;
    const step = target / (dur / 16);
    let cur = 0;
    const tick = () => {
      cur += step;
      if (cur < target) {
        el.textContent = Math.floor(cur).toLocaleString();
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toLocaleString();
      }
    };
    tick();
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !done) {
        done = true;
        nums.forEach(animate);
      }
    });
  }, { threshold: 0.5 });

  const meta = document.querySelector('.hero-meta');
  if (meta) observer.observe(meta);
}

// ---------- 滚动淡入 ----------
function initScrollReveal() {
  const els = document.querySelectorAll('.side-card, .post-card, .visual-card');
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
    if (el.style.opacity === '1') return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// ---------- 加载更多 ----------
function initLoadMore() {
  const btn = document.getElementById('loadMore');
  if (!btn) return;
  let count = 0;

  btn.addEventListener('click', () => {
    count++;
    const grid = document.getElementById('postGrid');
    const more = posts.slice(0, 3).map((p, i) => ({
      ...p,
      id: p.id + count * 100 + i,
      title: `${p.title}（续篇 ${count}）`
    }));

    more.forEach((p, i) => {
      const card = createCard(p, document.querySelectorAll('.post-card').length + i);
      grid.appendChild(card);
    });

    if (count >= 2) {
      btn.textContent = '没有更多了';
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    }
  });
}
