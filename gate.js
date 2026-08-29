/* ================================================================
   邀请码门控逻辑 — 直接访问/刷新需输入邀请码，站内跳转免验证
   （sessionStorage 仅本会话有效，刷新页面需重新输入）
   ================================================================ */

const INVITE_CODES = [
  "bI0hy7If3cuCTe2GtTjzaFcSnxot49HZ",
  "svvFR05eFvh96OETSi86aKSsbU35mHgG"
];
const INVITE_STORAGE_KEY = "invite_verified";

function isPageRefresh() {
  const navEntries = performance.getEntriesByType('navigation');
  if (navEntries.length > 0) {
    return navEntries[0].type === 'reload';
  }
  if (performance.navigation) {
    return performance.navigation.type === 1;
  }
  return false;
}

function initInviteGate() {
  // 一次性免验证标记（sidebar-logo 点击刷新时使用），命中则直接解锁并清除
  if (sessionStorage.getItem('invite_bypass') === '1') {
    sessionStorage.removeItem('invite_bypass');
    sessionStorage.setItem(INVITE_STORAGE_KEY, '1');
    const gate = document.getElementById('invite-gate');
    if (gate) gate.remove();
    document.body.classList.remove('gate-active');
    return;
  }

  // 刷新页面时清除会话标记，强制重新输入
  if (isPageRefresh()) {
    sessionStorage.removeItem(INVITE_STORAGE_KEY);
  }

  // 已在本会话验证过且非刷新（站内跳转），直接跳过
  if (sessionStorage.getItem(INVITE_STORAGE_KEY) === '1') {
    const gate = document.getElementById('invite-gate');
    if (gate) gate.remove();
    document.body.classList.remove('gate-active');
    return;
  }

  // 锁定页面滚动
  document.body.classList.add('gate-active');

  const gate = document.getElementById('invite-gate');
  if (!gate) return;

  const input = gate.querySelector('.gate-input');
  const btn = gate.querySelector('.gate-btn');
  const msg = gate.querySelector('.gate-msg');
  const card = gate.querySelector('.gate-card');

  function tryUnlock() {
    const value = input.value.trim();
    if (!value) {
      msg.textContent = "请输入邀请码";
      msg.classList.remove('success');
      msg.classList.add('show');
      return;
    }

    if (INVITE_CODES.includes(value)) {
      sessionStorage.setItem(INVITE_STORAGE_KEY, "1");
      msg.textContent = "验证通过，正在进入...";
      msg.classList.add('success');
      msg.classList.add('show');
      gate.classList.add('unlocked');
      document.body.classList.remove('gate-active');
      setTimeout(() => {
        gate.remove();
      }, 500);
    } else {
      msg.textContent = "邀请码错误，请重新输入";
      msg.classList.remove('success');
      msg.classList.add('show');
      input.value = '';
      input.focus();
      card.style.animation = 'none';
      requestAnimationFrame(() => {
        card.style.animation = 'gateShake 0.4s ease';
      });
    }
  }

  btn.addEventListener('click', tryUnlock);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      tryUnlock();
    }
  });

  setTimeout(() => input.focus(), 100);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInviteGate);
} else {
  initInviteGate();
}
