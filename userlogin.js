/* ================================================================
   User Login / Register — 登录注册交互逻辑
   ================================================================ */

const API_BASE = "https://login.sofia7.de5.net";
const STORAGE_KEY = "user_session";
const REMEMBER_KEY = "user_remember";

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
  if (!btn) return;
  btn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

// ---------- 会话管理 ----------
function saveSession(user, remember) {
  const session = {
    user: user,
    timestamp: Date.now()
  };
  if (remember) {
    // 保持登录：存 localStorage，30天有效
    session.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem(REMEMBER_KEY, JSON.stringify(session));
  }
  // 会话级存储
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function getSession() {
  // 先尝试会话存储
  let raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const session = JSON.parse(raw);
      return session.user;
    } catch (e) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
  // 再尝试保持登录
  raw = localStorage.getItem(REMEMBER_KEY);
  if (raw) {
    try {
      const session = JSON.parse(raw);
      if (session.expiresAt && session.expiresAt > Date.now()) {
        // 续期到会话存储
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        return session.user;
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch (e) {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }
  return null;
}

function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

// ---------- 显示消息 ----------
function showMessage(form, type, text) {
  const msgEl = form.querySelector('.form-message');
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.className = `form-message show ${type}`;
}

function hideMessage(form) {
  const msgEl = form.querySelector('.form-message');
  if (msgEl) {
    msgEl.className = 'form-message';
  }
}

// ---------- 表单验证 ----------
function validateUsername(username) {
  if (!username || username.trim().length < 3) {
    return '用户名至少 3 个字符';
  }
  if (username.length > 20) {
    return '用户名最多 20 个字符';
  }
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
    return '用户名只能包含字母、数字、下划线和中文';
  }
  return null;
}

function validatePassword(password) {
  if (!password || password.length < 6) {
    return '密码至少 6 位';
  }
  if (password.length > 64) {
    return '密码最多 64 位';
  }
  return null;
}

// ---------- 登录 ----------
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(form);

    const username = form.querySelector('#username').value.trim();
    const password = form.querySelector('#password').value;
    const remember = form.querySelector('#remember').checked;

    const submitBtn = form.querySelector('.btn-submit');

    // 隐私政策同意验证
    const privacyAgree = form.querySelector('#privacyAgree');
    if (privacyAgree && !privacyAgree.checked) {
      showMessage(form, 'error', '请先阅读并同意《隐私政策》');
      return;
    }

    // 验证
    const userErr = validateUsername(username);
    if (userErr) {
      showMessage(form, 'error', userErr);
      return;
    }
    const pwdErr = validatePassword(password);
    if (pwdErr) {
      showMessage(form, 'error', pwdErr);
      return;
    }

    // 加载状态
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="btn-spinner"></span>登录中...';

    try {
      const response = await fetch(API_BASE+"/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || `登录失败 (${response.status})`);
      }

      // 保存会话
      const user = data.user || { username, id: data.userId };
      saveSession(user, remember);

      showMessage(form, 'success', '登录成功，正在跳转...');

      setTimeout(() => {
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        window.location.href = redirect || 'blog.html';
      }, 800);

    } catch (err) {
      showMessage(form, 'error', err.message || '网络错误，请稍后重试');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// ---------- 注册 ----------
function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(form);

    const username = form.querySelector('#username').value.trim();
    const password = form.querySelector('#password').value;
    const confirmPassword = form.querySelector('#confirmPassword').value;
    const remember = form.querySelector('#remember').checked;

    const submitBtn = form.querySelector('.btn-submit');

    // 隐私政策同意验证
    const privacyAgree = form.querySelector('#privacyAgree');
    if (privacyAgree && !privacyAgree.checked) {
      showMessage(form, 'error', '请先阅读并同意《隐私政策》');
      return;
    }

    // 验证
    const userErr = validateUsername(username);
    if (userErr) {
      showMessage(form, 'error', userErr);
      return;
    }
    const pwdErr = validatePassword(password);
    if (pwdErr) {
      showMessage(form, 'error', pwdErr);
      return;
    }
    if (password !== confirmPassword) {
      showMessage(form, 'error', '两次输入的密码不一致');
      return;
    }

    // 加载状态
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="btn-spinner"></span>注册中...';

    try {
      const response = await fetch(API_BASE+"/register", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || `注册失败 (${response.status})`);
      }

      // 注册成功自动登录
      const user = data.user || { username, id: data.userId };
      saveSession(user, remember);

      showMessage(form, 'success', '注册成功，正在跳转...');

      setTimeout(() => {
        window.location.href = 'blog.html';
      }, 800);

    } catch (err) {
      showMessage(form, 'error', err.message || '网络错误，请稍后重试');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// ---------- Blog 页面用户状态 ----------
function initBlogUserStatus() {
  const user = getSession();
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;

  // 移除已有的用户相关元素
  const existingAuth = navRight.querySelectorAll('.nav-auth-btn, .user-menu-wrap');
  existingAuth.forEach(el => el.remove());

  if (user) {
    // 已登录：显示用户菜单
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu-wrap';
    userMenu.innerHTML = `
      <button class="user-avatar-btn" id="userAvatarBtn" title="${user.username}">
        <span class="user-avatar-text">${user.username.charAt(0).toUpperCase()}</span>
      </button>
      <div class="user-dropdown glass" id="userDropdown">
        <div class="user-dropdown-head">
          <span class="user-dropdown-name">${user.username}</span>
          <span class="user-dropdown-sub">已登录</span>
        </div>
        <div class="user-dropdown-divider"></div>
        <button class="user-dropdown-item" id="logoutBtn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          退出登录
        </button>
      </div>
    `;
    navRight.insertBefore(userMenu, navRight.firstChild);

    const avatarBtn = userMenu.querySelector('#userAvatarBtn');
    const dropdown = userMenu.querySelector('#userDropdown');

    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
    });

    const logoutBtn = userMenu.querySelector('#logoutBtn');
    logoutBtn.addEventListener('click', () => {
      clearSession();
      location.reload();
    });
  } else {
    // 未登录：显示登录/注册按钮
    const authBtns = document.createElement('div');
    authBtns.className = 'nav-auth-btns';
    authBtns.innerHTML = `
      <a href="login.html" class="nav-auth-btn nav-auth-login">登录</a>
      <a href="register.html" class="nav-auth-btn nav-auth-register">注册</a>
    `;
    navRight.insertBefore(authBtns, navRight.firstChild);
  }
}

// ---------- 页面守卫（如已登录则跳过登录页） ----------
function initAuthPageGuard() {
  const isLoginPage = document.getElementById('loginForm') !== null;
  const isRegisterPage = document.getElementById('registerForm') !== null;

  if ((isLoginPage || isRegisterPage) && getSession()) {
    window.location.href = 'blog.html';
  }
}

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initThemeToggle();
  initAuthPageGuard();
  initLoginForm();
  initRegisterForm();
  initBlogUserStatus();
});
