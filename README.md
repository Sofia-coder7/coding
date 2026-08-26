# v2.13.2
**更新预览**

 - *.sidebar-sublink* 的 *scale(1.25)* → *scale(1.0625)*（即 1.25 × 0.85），*.sidebar-dropdown-menu* 的 *margin-left: -20px* → *-10px*（右移10px）
 - *CHANGELOG_VERSION* → *2.13.2*

# v2.13.1 
**更新预览**

- 删除 *projects* 数组（6条项目数据）
- 删除 *renderProjects()* 函数
- 删除 *initScrollReveal()* 函数及其调用（仅服务于项目卡片）
- 修复 *footerAbout* 从 *switchPage(4)* 改为 *switchPage(1)*（page 4 已不存在，改为跳转"关于"页）
- *CHANGELOG_VERSION* 更新为 *2.13.1*
- 移除首页统计中的"6 项目作品"项

# v2.13.1 
**更新预览**

### 1. 下拉菜单工具样式调整
- .sidebar-sublink 添加 transform: scale(1.25) + transform-origin: left center
- .sidebar-dropdown-menu 添加 margin-left: -20px 实现左移 20px
- 字体从 0.84rem 增大到 1.05rem，padding 加大
### 2. "在线网站"改为独立页面
- 从下拉菜单改为普通侧边栏导航项 data-page="3"
- 移除原有的 GitHub/bilibili/博客/TurboWarp 外链
### 3. 新建"在线网站"页面（page 3）
- 宫格布局（sites-grid），自适应列数 minmax(280px, 1fr)
- **三个网站卡片：**
- Minecraft中文Wiki → https://zh.minecraft.wiki/
- Minecraft基岩版Wiki → https://wiki.bedrock.dev/
- MCBEID表 → https://idlist.projectxero.top/
- 每张卡片含 SVG 图标、名称、URL、描述，hover 有上浮+边框高亮+图标放大效果
### 4. 主题按钮移入 sidebar-links
- #themeBtn 从 .sidebar-bottom 的独立按钮移入 .sidebar-links 内
- 样式从 40x40 改为 36x36，与 GitHub/bilibili 图标按钮统一
