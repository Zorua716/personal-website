# 个人网站后端

基于 FastAPI + SQLite 的个人网站后端，提供联系表单、管理员后台、项目 / 文章管理、项目点击统计与图片上传。

## 功能

- 联系表单：保存留言，可选 SMTP 邮件通知，带蜜罐与频率限制；
- 管理员：单账号登录，JWT 存 HttpOnly Cookie；
- 项目管理：增删改查、排序、发布状态；
- 文章管理：Markdown 写入并服务端渲染为 HTML；
- 点击统计：`/go/{slug}` 记数并跳转；
- 图片上传：本地存储，默认保存在 `uploads/`；
- 管理页面：`/admin`。

## 安装与运行

```powershell
cd D:\Eveees\Course\Software\personal-website\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

首次启动会自动建表，并根据 `.env` 创建管理员账号。

管理页面：`http://127.0.0.1:8000/admin`

接口文档：`http://127.0.0.1:8000/docs`

## 环境变量

见 `.env.example`。生产环境务必修改 `SECRET_KEY` 和管理员密码，并把 `CORS_ORIGINS` 收紧为你的站点域名。

## 上传与存储

默认把图片保存到本地 `uploads/`，数据库只保存相对 URL。部署到服务器后，建议接入 S3 兼容对象存储，再替换存储逻辑。
