/* ================================================================
   ai.js — AI 对话浮窗
   GLM-4.7-flash · 流式响应 · Markdown 渲染
   ================================================================ */

// API 通过 Cloudflare Worker 代理，Key 保存在服务端，前端不接触
const AI_CONFIG = {
  // 部署后替换为你的 Worker 地址
  // 格式：https://你的worker名.你的子域.workers.dev
  // 或绑定自定义域名：https://api.hanzkx.de5.net
  apiUrl: 'https://api.hanzkx.de5.net',
  model: 'glm-4.7-flash',
  systemPrompt: '你是一个友好的 AI 助手，擅长回答编程、技术和日常问题。回答简洁明了，代码使用 Markdown 代码块格式。'
};

let chatHistory = [];
let isWaiting = false;

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', () => {
  initChatToggle();
  initChatInput();
});

// ---------- 浮窗开关 ----------
function initChatToggle() {
  const fab = document.getElementById('aiFab');
  const chat = document.getElementById('aiChat');
  const closeBtn = document.getElementById('aiChatClose');

  if (fab && chat) {
    fab.addEventListener('click', () => {
      chat.classList.toggle('open');
      if (chat.classList.contains('open')) {
        const input = document.getElementById('aiInput');
        if (input) setTimeout(() => input.focus(), 300);
      }
    });
  }

  if (closeBtn && chat) {
    closeBtn.addEventListener('click', () => {
      chat.classList.remove('open');
    });
  }
}

// ---------- 输入处理 ----------
function initChatInput() {
  const input = document.getElementById('aiInput');
  const sendBtn = document.getElementById('aiSend');

  if (!input || !sendBtn) return;

  // Enter 发送，Shift+Enter 换行
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // 自动调整高度
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

  sendBtn.addEventListener('click', sendMessage);
}

// ---------- 发送消息 ----------
async function sendMessage() {
  const input = document.getElementById('aiInput');
  const sendBtn = document.getElementById('aiSend');

  if (!input || isWaiting) return;

  const text = input.value.trim();
  if (!text) return;

  // 清空输入
  input.value = '';
  input.style.height = 'auto';

  // 添加用户消息
  appendMessage('user', text);

  // 添加到历史
  chatHistory.push({ role: 'user', content: text });

  // 显示打字指示器
  const typingEl = showTyping();

  // 禁用发送
  isWaiting = true;
  sendBtn.disabled = true;

  try {
    // 调用 API（流式，直接在页面上渲染）
    const response = await callGLMApi();

    // 移除打字指示器
    typingEl.remove();

    // 添加到历史（消息已在流式渲染时显示）
    chatHistory.push({ role: 'assistant', content: response });
  } catch (err) {
    typingEl.remove();
    appendMessage('bot', '抱歉，发生了错误：' + (err.message || '未知错误'));
  } finally {
    isWaiting = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

// ---------- 调用 GLM API（流式） ----------
async function callGLMApi() {
  const messages = [
    { role: 'system', content: AI_CONFIG.systemPrompt },
    ...chatHistory.slice(-10) // 保留最近 10 条上下文
  ];

  const response = await fetch(AI_CONFIG.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      messages: messages,
      stream: true,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error('API 返回 ' + response.status + ' ' + response.statusText + (errText ? ': ' + errText : ''));
  }

  // 读取流式响应
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  // 创建一个实时更新的消息元素
  const messagesEl = document.getElementById('aiMessages');
  const msgEl = document.createElement('div');
  msgEl.className = 'ai-msg ai-msg-bot';
  msgEl.innerHTML = '<div class="ai-msg-avatar">AI</div><div class="ai-msg-content"></div>';
  messagesEl.appendChild(msgEl);
  const contentEl = msgEl.querySelector('.ai-msg-content');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // 按行处理 SSE
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;

      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;

      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content || '';
        if (delta) {
          fullText += delta;
          // 实时渲染 Markdown
          if (window.marked) {
            contentEl.innerHTML = marked.parse(fullText);
            // 高亮代码块
            if (window.Prism) {
              contentEl.querySelectorAll('pre code').forEach(block => {
                Prism.highlightElement(block);
              });
            }
          } else {
            contentEl.textContent = fullText;
          }
          // 自动滚动到底部
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
      } catch (e) {
        // 忽略 JSON 解析错误
      }
    }
  }

  if (!fullText) {
    return '（空回复）';
  }

  return fullText;
}

// ---------- 添加消息 ----------
function appendMessage(role, content) {
  const messages = document.getElementById('aiMessages');
  if (!messages) return;

  const msgEl = document.createElement('div');
  msgEl.className = 'ai-msg ai-msg-' + (role === 'user' ? 'user' : 'bot');

  const avatar = document.createElement('div');
  avatar.className = 'ai-msg-avatar';
  avatar.textContent = role === 'user' ? '我' : 'AI';

  const contentEl = document.createElement('div');
  contentEl.className = 'ai-msg-content';

  if (role === 'bot' && window.marked) {
    contentEl.innerHTML = marked.parse(content);
    if (window.Prism) {
      contentEl.querySelectorAll('pre code').forEach(block => {
        Prism.highlightElement(block);
      });
    }
  } else {
    contentEl.textContent = content;
  }

  msgEl.appendChild(avatar);
  msgEl.appendChild(contentEl);
  messages.appendChild(msgEl);

  // 自动滚动
  messages.scrollTop = messages.scrollHeight;
}

// ---------- 打字指示器 ----------
function showTyping() {
  const messages = document.getElementById('aiMessages');
  if (!messages) return document.createElement('div');

  const el = document.createElement('div');
  el.className = 'ai-msg ai-msg-bot';
  el.innerHTML = '<div class="ai-msg-avatar">AI</div><div class="ai-msg-content"><div class="ai-typing"><span></span><span></span><span></span></div></div>';
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
  return el;
}
