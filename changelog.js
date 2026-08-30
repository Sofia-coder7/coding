/* ================================================================
   更新日志数据 — 独立存储，便于维护
   ================================================================ */

const CHANGELOG_VERSION = '2.56';

const CHANGELOG_DATA = [
  {
    version: '2.56',
    date: '2026-08-30',
    items: [
      { type: '新增', tag: 'new', text: '设置页缓存管理新增 Cookie 管理功能' },
      { type: '优化', tag: 'optimize', text: '更新日志数据独立为 changelog.js 存储' },
      { type: '移除', tag: 'del', text: '去除开发者文件夹' },
      { type: '移除', tag: 'del', text: '去除邀请码门控，保留特殊码机制' }
    ]
  },
  {
    version: '2.55',
    date: '2026-08-29',
    items: [
      { type: '新增', tag: 'new', text: '关于页新增「在线反馈」区块，点击展开飞书表单' },
      { type: '优化', tag: 'optimize', text: '导航栏按钮点击后显示加载条再切换页面，重复点击当前页无效' }
    ]
  },
  {
    version: '2.54',
    date: '2026-08-29',
    items: [
      { type: '优化', tag: 'optimize', text: '右键菜单区分输入框内外：非输入框显示导航项，输入框内显示粘贴' },
      { type: '修复', tag: 'fix', text: '修复右键粘贴失效（改用右键目标元素而非 activeElement）' },
      { type: '修复', tag: 'fix', text: '修复右键剪切仅复制未删除的问题' },
      { type: '优化', tag: 'optimize', text: '右键搜索改用 cn.bing.com，新增菜单弹出动画' },
      { type: '新增', tag: 'new', text: '拦截 F12 键，需特殊码方可打开开发者工具' }
    ]
  },
  {
    version: '2.53',
    date: '2026-08-29',
    items: [
      { type: '新增', tag: 'new', text: '自定义右键菜单，支持复制、粘贴、剪切、搜索' },
      { type: '新增', tag: 'new', text: '拦截 Ctrl+U 与 Ctrl+Shift+I，需输入特殊码方可使用' }
    ]
  },
  {
    version: '2.52.2',
    date: '2026-08-29',
    items: [
      { type: '优化', tag: 'optimize', text: '关于页 section 标题整体放大 0.75 倍' }
    ]
  },
  {
    version: '2.52.1',
    date: '2026-08-29',
    items: [
      { type: '优化', tag: 'optimize', text: '重写关于页 section 标题样式，移除实心填充改为简约风格' }
    ]
  },
  {
    version: '2.52',
    date: '2026-08-29',
    items: [
      { type: '优化', tag: 'optimize', text: '关于页站点统计每次进入都从 0 开始播放数字动画' },
      { type: '优化', tag: 'optimize', text: '重写关于页面文本内容与布局，补全全部五项在线工具' }
    ]
  },
  {
    version: '2.51',
    date: '2026-08-29',
    items: [
      { type: '修复', tag: 'fix', text: '修复 HTML/CSS/JavaScript 编辑器无法输入文字的问题' },
      { type: '修复', tag: 'fix', text: '修复 HTML/CSS/JavaScript 编辑器无语法高亮显示的问题' },
      { type: '修复', tag: 'fix', text: '修复 HTML/CSS/JavaScript 工具无法导入、下载、预览的问题' },
      { type: '移除', tag: 'del', text: '去除边缘高光效果及对应设置项' },
      { type: '新增', tag: 'new', text: '关于页 GitHub 链接指向项目仓库' },
      { type: '新增', tag: 'new', text: '新增页面顶部加载进度条' },
      { type: '新增', tag: 'new', text: '新增 Cookie 使用确认对话框' }
    ]
  },
  {
    version: '2.50.1',
    date: '2026-08-29',
    items: [
      { type: '优化', tag: 'optimize', text: 'HTML / CSS / JavaScript / Markdown 编辑器增加 Prism 语法高亮彩色显示' },
      { type: '优化', tag: 'optimize', text: '去除侧边栏工具图标的颜色，恢复统一风格' }
    ]
  },
  {
    version: '2.50',
    date: '2026-08-29',
    items: [
      { type: '修复', tag: 'fix', text: '修复 v2.48 更新日志在历史记录中缺失的问题' },
      { type: '优化', tag: 'optimize', text: '所有代码工具侧边栏图标增加颜色分类，一目了然' },
      { type: '优化', tag: 'optimize', text: '站点统计动态数字改为点击「关于」时才从 0 开始播放' }
    ]
  },
  {
    version: '2.49',
    date: '2026-08-29',
    items: [
      { type: '移除', tag: 'del', text: '移除 Lua / Ruby / PHP 在线运行工具' },
      { type: '优化', tag: 'optimize', text: '去除工具编辑器输入框的默认边框' },
      { type: '新增', tag: 'new', text: '工具切换/离开时弹出确认弹窗，防止代码丢失' }
    ]
  },
  {
    version: '2.48',
    date: '2026-08-29',
    items: [
      { type: '新增', tag: 'new', text: '新增 HTML / CSS / JavaScript 在线预览工具，基于 iframe 实时渲染' },
      { type: '新增', tag: 'new', text: '新增 Lua / Ruby / PHP 在线运行工具（懒加载 CDN，失败自动降级）' },
      { type: '优化', tag: 'optimize', text: 'Python 运行支持切换引擎：系统自带（快速）/ Pyodide（完整）' },
      { type: '优化', tag: 'optimize', text: '设置页「重置版本缓存」现在真正生效，清除缓存后自动刷新' },
      { type: '新增', tag: 'new', text: '点击侧边栏 Logo 可刷新网页并免输入邀请码直接进入' }
    ]
  },
  {
    version: '2.47',
    date: '2026-08-29',
    items: [
      { type: '修复', tag: 'fix', text: '计数器日期改为北京时间计算，杜绝访客时区导致的日期错误' },
      { type: '移除', tag: 'del', text: '移除关于页面的 AI 相关内容' },
      { type: '新增', tag: 'new', text: '关于页新增站点统计：站点浏览、今日浏览、昨日访客、本月访客' },
      { type: '新增', tag: 'new', text: '新增昨日数据计数器，每日首次访问自动迁移前一日计数' }
    ]
  },
  {
    version: '2.46.1',
    date: '2026-08-29',
    items: [
      { type: '优化', tag: 'optimize', text: '计数器拆分为总/月/日三个计数器，跨天自动重置日计数，跨月自动重置月计数' }
    ]
  },
  {
    version: '2.46',
    date: '2026-08-29',
    items: [
      { type: '新增', tag: 'new', text: '接入 ruseo.cn PV 计数器，每次访问页面 +1（不受邀请码门控影响）' }
    ]
  },
  {
    version: '2.45',
    date: '2026-08-29',
    items: [
      { type: '移除', tag: 'del', text: '完整移除博客系统，删除 blog.html、script.js、style.css、blog-icon.jpg' },
      { type: '移除', tag: 'del', text: '移除侧边栏"博客"导航入口与关于页面的博客链接' }
    ]
  },
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
      { type: '更换', tag: 'replace', text: '域名更换为 devup5.github.io' },
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
      { type: '修复', tag: 'fix', text: '字符串转义字符（\n、\t 等）无法正确解析的问题' },
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
