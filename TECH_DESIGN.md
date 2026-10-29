# 陈世堂个人网站 · 技术设计文档（TECH DESIGN）

版本：1.1
更新日期：2026-10-29
状态：已实现并上线

## 一、技术栈

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 页面 | HTML5 | 单页语义化结构 |
| 样式 | 原生 CSS3 | CSS 变量、Grid、Flexbox、动画、媒体查询 |
| 交互 | 原生 JavaScript ES6+ | 无框架、无构建步骤 |
| 图形 | 本地 SVG + CSS | favicon、印章、条形码、按钮装饰 |
| 图片 | 本地 PNG | GitHub 默认头像副本 |
| 版本控制 | Git | 仓库 `Zorua716/personal-website` |
| 部署 | GitHub Pages | 由 GitHub Actions 自动发布 |

选型原则：

- 内容规模小，单页纯静态最合适；
- 不使用 React / Vue / Tailwind，避免为展示页引入构建和依赖；
- 不引用外部字体、CDN、统计脚本，保证离线可打开；
- 视觉个性通过排版、色彩、边框、网格和 CSS 动画实现。

## 二、总体架构

这是一个无后端的静态站点：

```text
浏览器
  ├─ index.html        页面结构与静态文案
  ├─ styles.css        视觉系统、布局、响应式、动画
  ├─ script.js         菜单、导航高亮、复制、进场动画、光标
  └─ assets/
       ├─ avatar.png   本地头像
       └─ favicon.svg  本地图标

GitHub 仓库 main
  └─ GitHub Actions
       ├─ checkout
       ├─ 复制站点文件到 _site
       ├─ configure-pages
       ├─ upload-pages-artifact
       └─ deploy-pages
            └─ https://zorua716.github.io/personal-website/
```

没有服务器、数据库、API、登录系统或内容管理后台。所有内容在 HTML 中静态维护。

## 三、目录结构

```text
personal-website/
├── index.html                       页面结构
├── styles.css                       全部样式
├── script.js                        全部交互
├── assets/
│   ├── avatar.png                   GitHub 默认头像（本地）
│   └── favicon.svg                  网站图标
├── .github/
│   └── workflows/
│       └── deploy-pages.yml         GitHub Pages 自动部署
├── .gitignore
├── .nojekyll
├── README.md
├── PRD.md                           产品需求文档
├── TECH_DESIGN.md                   本文档
└── AGENTS.md                        AI 开发约定
```

## 四、页面结构与锚点

页面为单页结构：

| 区块 | 锚点 | 内容 |
| --- | --- | --- |
| 首屏 | `#top` | 姓名、身份、介绍、头像身份卡、主按钮 |
| 关于 | `#about` | 个人简介、教育经历、方向与状态 |
| 技能 | `#skills` | AI / ML、Web / Tools、Backend |
| 项目 | `#projects` | 两个编号式项目条目 |
| 联系 | `#contact` | 邮箱、GitHub、复制邮箱 |

顶部导航与移动端菜单指向这些锚点。页面还包含：

- 顶部关键词跑马灯；
- 左侧竖排信息栏（桌面端）；
- 页脚与返回顶部。

## 五、视觉系统

### 5.1 CSS 变量

```css
:root {
  --paper: #f2efe6;
  --ink: #111111;
  --blue: #2c55ff;
  --lime: #d8ff3e;
  --orange: #ff5a36;
  --muted: #5d5a51;
  --line-soft: rgba(17, 17, 17, 0.22);
}
```

背景使用 64px 网格：

```css
background-image:
  linear-gradient(rgba(17, 17, 17, 0.045) 1px, transparent 1px),
  linear-gradient(90deg, rgba(17, 17, 17, 0.045) 1px, transparent 1px);
background-size: 64px 64px;
```

### 5.2 排版

- 中文标题：系统黑体，字重 800–900，紧字距；
- 英文标题：`Arial Black` 字体栈；
- 标签与编号：等宽字体 `SFMono-Regular / Consolas`；
- 正文：系统无衬线字体；
- 不使用远程字体，保证离线可用。

### 5.3 组件模式

- 2px 粗黑边框；
- 4–12px 无模糊硬阴影；
- 蓝色 / 酸性绿强调；
- 非对称网格；
- 编号式章节；
- 以边框和留白替代圆角卡片堆叠。

## 六、响应式设计

| 断点 | 行为 |
| --- | --- |
| `max-width: 1240px` | 隐藏左侧竖排栏 |
| `max-width: 980px` | 首屏、关于、联系改为单列 |
| `max-width: 760px` | 导航折叠为菜单；技能 / 项目改为单列；页脚纵向排列 |
| `hover: none / pointer: coarse` | 隐藏自定义光标 |
| `prefers-reduced-motion` | 关闭动画、平滑滚动和自定义光标 |

重点测试宽度：390px、768px、1440px。

## 七、交互实现

### 7.1 移动端菜单

- `#menu-toggle` 控制 `#nav.open`；
- `aria-expanded` 同步菜单状态；
- 点击导航项或按 Escape 自动关闭。

### 7.2 导航高亮

使用 `IntersectionObserver` 监听 `#about`、`#skills`、`#projects`、`#contact`，当区块进入视口中部时给对应链接添加 `.active`。

### 7.3 滚动进场

`.reveal` 初始透明度 0、向下偏移；进入视口后添加 `.visible`。若浏览器不支持 IntersectionObserver 或用户偏好减少动效，则直接显示。

### 7.4 复制邮箱

- 优先使用 `navigator.clipboard.writeText`；
- 非安全上下文或旧浏览器回退到临时 textarea + `execCommand("copy")`；
- 成功后按钮文字临时变为「已复制 ✓」。

### 7.5 自定义光标

- 仅在 `(pointer: fine)` 且未开启减少动效时启用；
- 使用 `requestAnimationFrame` 与线性插值跟随鼠标；
- 悬停链接 / 按钮时放大；
- 采用 `mix-blend-mode: difference`，在浅色与黑色区域都保持可见。

### 7.6 CSS 动画

- 顶部跑马灯：`translateX(-50%)` 无限循环；
- 圆形印章：20 秒旋转；
- 按钮 hover：位移 + 硬阴影变化；
- 项目 hover：整行变蓝、文字反白；
- 技能 hover：浅绿底与标签位移。

## 八、内容维护

当前没有 CMS 或数据文件，所有文案直接写在 `index.html`。

| 内容 | 位置 |
| --- | --- |
| 姓名 / 身份 / 介绍 | Hero 区块 |
| 简介 / 教育 | 关于区块 |
| 技能标签 | 技能区块的 `.stack-row` |
| 项目名称 / 描述 / 标签 | 项目区块的 `.project` |
| 邮箱 / GitHub | 联系区块 |
| 头像 | `assets/avatar.png` |

修改项目时应同步更新项目编号、说明和技术标签，不要添加未验证的指标。

## 九、部署设计

### 9.1 工作流

`.github/workflows/deploy-pages.yml`：

1. 检出 `main`；
2. 创建 `_site`，复制 `index.html`、`styles.css`、`script.js`、`assets/`；
3. 配置 GitHub Pages；
4. 上传 `_site` 作为 Pages artifact；
5. 使用 `actions/deploy-pages@v4` 发布。

文档文件（`PRD.md`、`TECH_DESIGN.md`、`AGENTS.md`、`README.md`）不会被复制到 `_site`，因此不会发布到公开网站上。

### 9.2 访问地址

```text
https://zorua716.github.io/personal-website/
```

### 9.3 自定义域名

当前未绑定独立域名。后续若购买 `example.com`：

1. 在 GitHub Pages 的 Custom domain 填写域名；
2. 按 GitHub 提示配置 DNS；
3. 等待 HTTPS 证书签发。

## 十、测试与验证

当前采用静态检查 + 人工验证：

1. `node --check script.js` 检查脚本语法；
2. 检查 HTML 主要标签是否配对；
3. 检查是否引入外部字体 / CDN / 追踪脚本；
4. 使用 Chrome 无头模式渲染截图，确认页面可正常加载；
5. 检查 390px、768px、1440px 布局；
6. 人工验证菜单、锚点、复制邮箱、GitHub 链接；
7. 检查 GitHub Actions 部署状态与线上 HTTP 200。

当前没有单元测试框架；页面为静态内容，主要依赖人工视觉与交互验证。

## 十一、已知限制

- 内容修改需要直接编辑 HTML；
- 未提供博客、项目详情页或后台管理；
- 每次推送 `main` 都会触发 Pages 部署；
- GitHub Pages 在中国大陆的访问速度可能不稳定；
- 自定义域名需要额外购买并配置 DNS；
- 不使用统计工具，因此没有访问量数据。

## 十二、后续扩展建议

- 为两个项目增加独立详情页与截图；
- 增加简历 PDF 下载；
- 增加 Markdown 驱动的博客；
- 增加中英文切换；
- 如果内容规模扩大，再考虑 Astro 等静态生成器，而不是直接引入重型框架。
