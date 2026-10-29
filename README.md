# 陈世堂的个人网站

一个纯静态的个人展示网站，包含个人介绍、技能、项目与联系方式。采用浅色纸张网格、粗黑边框、硬阴影与超大排版的编辑设计风格（neo-brutalist editorial），支持手机、平板和桌面端。

## 本地预览

直接用浏览器打开 `index.html` 即可，无需安装依赖。

## 项目文档

- [PRD.md](PRD.md)：产品目标、信息架构、功能需求与验收标准
- [TECH_DESIGN.md](TECH_DESIGN.md)：技术栈、页面结构、视觉系统、交互与部署方案
- [AGENTS.md](AGENTS.md)：AI 编码助手的项目约定与开发规范

## 部署到 GitHub Pages

1. 在 GitHub 新建一个空仓库，建议命名为 `personal-website`。
2. 在本目录初始化并推送：

```powershell
git init -b main
git add -A
git commit -m "Initial personal website"
git remote add origin https://github.com/Zorua716/personal-website.git
git push -u origin main
```

3. 打开仓库 `Settings -> Pages`，把 Source 选为 `GitHub Actions`。
4. 推送后工作流会自动发布，网站地址为：

```text
https://zorua716.github.io/personal-website/
```

## 绑定自定义域名

如果之后购买了自己的域名（例如 `chenshitang.com`），可在 GitHub Pages 的 Custom domain 中填写，并按提示配置 DNS。HTTPS 证书由 GitHub 自动签发。

## 说明

- 图片资源全部保存在本地 `assets/`，不依赖外部 CDN。
- 头像为 GitHub 默认头像的本地副本。
- `PRD.md`、`TECH_DESIGN.md`、`AGENTS.md` 仅作为项目文档，不会被发布到公开网站。
