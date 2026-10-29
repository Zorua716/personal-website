# 个人网站后端部署

本项目的 FastAPI 同时提供个人网站、管理后台和 API：

- `/`：个人网站
- `/admin`：管理后台
- `/api/...`：接口
- `/docs`：接口文档

后端需要持久化 SQLite 数据和上传图片，推荐部署到带持久磁盘的 VPS、Railway、Render 或云服务器。GitHub Pages 不能运行 Python。

## 方式一：Docker Compose + Caddy（推荐）

前提：一台 Linux VPS、一个已经解析到服务器 IP 的域名、安装 Docker。

1. 把项目上传到服务器：

```bash
git clone https://github.com/Zorua716/personal-website.git
cd personal-website
```

2. 准备环境变量：

```bash
cp backend/.env.production.example backend/.env
cp deploy/.env.example deploy/.env
```

编辑 `backend/.env`：

- 修改 `SECRET_KEY` 和 `ADMIN_PASSWORD`
- 把 `CORS_ORIGINS` 改成你的 GitHub Pages 地址或自定义域名
- 需要邮件通知时填写 SMTP

编辑 `deploy/.env`：

```text
SITE_DOMAIN=你的域名
```

3. 启动：

```bash
docker compose --env-file deploy/.env up -d --build
```

Caddy 会自动申请 HTTPS 证书。部署后访问：

```text
https://你的域名/
https://你的域名/admin
```

4. 数据备份：

```bash
docker compose exec app sh -c "cp /data/app.db /data/app.db.bak"
```

SQLite 和上传文件都在 `app_data` 卷中。

## 方式二：systemd + Nginx

适用于不使用 Docker 的 Linux VPS。

1. 把项目放到 `/opt/personal-website`。
2. 创建虚拟环境并安装依赖：

```bash
cd /opt/personal-website/backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.production.example .env
```

3. 修改 `.env` 后，把 `deploy/personal-website.service` 复制到 `/etc/systemd/system/`：

```bash
sudo cp deploy/personal-website.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now personal-website
```

4. 配置 Nginx：

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/personal-website
sudo ln -s /etc/nginx/sites-available/personal-website /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

把 `server_name` 改成你的域名，并用 certbot 或 Caddy 配置 HTTPS。

## 平台注意事项

- **Railway / Render**：可以用 Dockerfile，但必须挂载持久磁盘，否则 SQLite 和上传文件会丢失。
- **Vercel**：可以把 FastAPI 拆成 serverless 函数，但 SQLite 和本地 uploads 不持久，需要 PostgreSQL + 对象存储。
- **Cloudflare Workers**：不能直接运行当前 FastAPI + SQLite，需要改写成 Workers/D1 架构。
- **国内服务器**：绑定域名通常需要 ICP 备案；香港或海外服务器不需要备案。

## 安全清单

- 修改默认管理员密码和 `SECRET_KEY`
- 生产环境 `COOKIE_SECURE=true`
- `CORS_ORIGINS` 不要保留 `*`
- 使用 HTTPS
- 定期备份 SQLite 和上传目录
- 限制上传文件大小，不要把 `.env` 提交到 Git
