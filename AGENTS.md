# AGENTS.md

本文件是给 AI 编码助手（Codex、Cursor、Copilot 等）阅读的项目约定。开始修改前请先阅读 `README.md`、`PRD.md` 和 `TECH_DESIGN.md`。

## 项目概述

这是陈世堂的个人展示网站，纯静态单页，采用「新粗野主义编辑设计」风格：浅色纸张网格、粗黑边框、硬阴影、超大排版、蓝色与酸性绿强调色。网站展示个人介绍、技能、两个真实项目与联系方式。

线上地址：`https://zorua716.github.io/personal-website/`

## 快速开始

没有安装依赖，也没有构建步骤：

```powershell
Start-Process "D:\Eveees\Course\Software\personal-website\index.html"
```

或者直接用浏览器打开 `index.html`。

## 硬性约定

### 技术约束

- 只使用原生 HTML、CSS、JavaScript；
- 不引入 React、Vue、Tailwind、Bootstrap 或任何运行时框架；
- 不引入构建步骤、npm 依赖或外部 CDN；
- 不引入远程字体、远程图片或第三方统计脚本；
- 图片与图标必须保存在本地 `assets/`；
- 保持页面可以通过 `file://` 直接打开。

### 设计约束

- 当前主题是浅色纸张 + 黑色粗线 + 蓝色 / 酸性绿的编辑设计；
- 不要恢复旧版的深色星空、Canvas 粒子或居中卡片式布局；
- 主色变量位于 `styles.css` 的 `:root`，优先复用变量；
- 保持 2px 黑边框、硬阴影、编号章节和非对称布局；
- 改版或新增区块时，必须同时适配 390px、768px、1440px；
- 动画要克制，并保留 `prefers-reduced-motion` 支持；
- 自定义光标只在精细指针设备启用。

### 内容约束

- 姓名：陈世堂；身份：物联网工程专业学生；
- 学校：大连民族大学；
- 邮箱：3540226929@qq.com；
- GitHub：https://github.com/Zorua716；
- 项目只展示真实内容：
  - MiniMind 小语言模型训练；
  - 电商图片提取下载助手。
- 不要虚构用户数、下载量、评分、合作品牌或项目指标；
- 头像使用本地 `assets/avatar.png`，不要改回远程 URL。

## 目录结构

```text
index.html                 页面结构与文案
styles.css                 主题、布局、响应式、动画
script.js                  菜单、导航高亮、复制、进场、光标
assets/avatar.png          本地头像
assets/favicon.svg         本地图标
.github/workflows/         GitHub Pages 自动部署
PRD.md                     需求文档
TECH_DESIGN.md             技术设计文档
README.md                  使用与部署说明
```

## 代码风格

- HTML / CSS / JS 均使用两空格缩进；
- JS 使用分号与双引号；
- 类名使用 kebab-case；
- 选择器与变量命名语义化，避免无意义的 `box1`、`item2`；
- 不写内联样式，除非是动态计算值；
- 新增交互必须使用原生 API，并处理不支持的情况。

## 关键实现

- 锚点：`#top`、`#about`、`#skills`、`#projects`、`#contact`；
- 菜单：`#menu-toggle` 控制 `#nav.open`；
- 复制邮箱：`#copy-email` 的 `data-email`；
- 进场动画：`.reveal` + IntersectionObserver；
- 自定义光标：`#cursor`；
- 部署：推送 `main` 后由 GitHub Actions 发布 `_site`。

## 测试要求

每次改动至少完成：

1. `node --check script.js`；
2. 检查 HTML 主要标签配对；
3. 确认没有新增外部资源；
4. 浏览器打开 `index.html` 检查桌面和手机布局；
5. 验证移动端菜单、锚点、复制邮箱、GitHub 链接；
6. 推送后检查 GitHub Actions 是否成功。

## 部署

- 仓库：`https://github.com/Zorua716/personal-website`
- 分支：`main`
- Pages Source：`GitHub Actions`
- 工作流：`.github/workflows/deploy-pages.yml`
- 默认域名：`https://zorua716.github.io/personal-website/`

工作流只会复制 `index.html`、`styles.css`、`script.js` 和 `assets/` 到 `_site`，因此 `PRD.md`、`TECH_DESIGN.md`、`AGENTS.md` 不会发布到公开网站。

## 安全与隐私

- 不要提交私钥、令牌、密码或 `.env`；
- 不要接入访客追踪或第三方统计；
- 不要在页面中暴露本机绝对路径；
- 自定义域名需要用户自行购买并配置 DNS。

## 常见任务

### 新增项目

1. 在 `#projects` 的 `.project-list` 中新增一个 `.project`；
2. 保持编号、英文类型、项目名、描述、技术标签的结构一致；
3. 只填写真实项目信息；
4. 检查移动端单列布局。

### 新增博客

当前没有博客系统。若后续增加，优先使用 Markdown 驱动的静态方案，并保持无后端、无追踪；不要在未确认的情况下引入重型 CMS。

### 修改主题

先确认用户明确要求更换视觉方向，再同时调整 `:root` 变量、组件样式和响应式规则。不要只改主色而不检查对比度与移动端布局。
