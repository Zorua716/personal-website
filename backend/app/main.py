import datetime as dt
import os
import re
import smtplib
import uuid
from collections import defaultdict, deque
from email.mime.text import MIMEText
from pathlib import Path

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from mistune import create_markdown
from pydantic import BaseModel, Field
from sqlalchemy import String, Text, Integer, DateTime, Boolean, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
SITE_DIR = BASE_DIR.parent
ASSETS_DIR = SITE_DIR / "assets"
UPLOAD_DIR = BASE_DIR / "uploads"
STATIC_DIR = BASE_DIR / "static"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

DB_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'app.db'}")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin12345")
SESSION_COOKIE = "session"
TOKEN_TTL_MINUTES = 60 * 24 * 7
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]

engine = create_engine(
    DB_URL,
    connect_args={"check_same_thread": False} if DB_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


class AdminUser(Base):
    __tablename__ = "admin_users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))


class Project(Base):
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(120))
    category: Mapped[str] = mapped_column(String(80), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[str] = mapped_column(Text, default="")
    url: Mapped[str] = mapped_column(String(500), default="")
    type_label: Mapped[str] = mapped_column(String(80), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))


class Post(Base):
    __tablename__ = "posts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(160))
    summary: Mapped[str] = mapped_column(String(300), default="")
    content_md: Mapped[str] = mapped_column(Text, default="")
    content_html: Mapped[str] = mapped_column(Text, default="")
    published: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc), onupdate=lambda: dt.datetime.now(dt.timezone.utc))


class ContactMessage(Base):
    __tablename__ = "contact_messages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(160))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc))


class ClickStat(Base):
    __tablename__ = "click_stats"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    count: Mapped[int] = mapped_column(Integer, default=0)


Base.metadata.create_all(bind=engine)
markdown = create_markdown(escape=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_admin(db: Session) -> None:
    if db.scalar(select(AdminUser).where(AdminUser.username == ADMIN_USERNAME)):
        return
    db.add(
        AdminUser(
            username=ADMIN_USERNAME,
            password_hash=bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode(),
        )
    )
    db.commit()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=TOKEN_TTL_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def current_admin(request: Request, db: Session = Depends(get_db)) -> AdminUser:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="未登录")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="登录已过期")
    user = db.scalar(select(AdminUser).where(AdminUser.username == payload.get("sub")))
    if not user:
        raise HTTPException(status_code=401, detail="账号不存在")
    return user


def project_dict(p: Project) -> dict:
    return {
        "id": p.id,
        "slug": p.slug,
        "title": p.title,
        "category": p.category,
        "description": p.description,
        "tags": [t.strip() for t in (p.tags or "").split(",") if t.strip()],
        "url": p.url,
        "type_label": p.type_label,
        "sort_order": p.sort_order,
        "published": p.published,
        "created_at": p.created_at.isoformat(),
    }


def post_dict(p: Post) -> dict:
    return {
        "id": p.id,
        "slug": p.slug,
        "title": p.title,
        "summary": p.summary,
        "content_md": p.content_md,
        "content_html": p.content_html,
        "published": p.published,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat(),
    }


def send_email(subject: str, body: str) -> bool:
    host = os.getenv("SMTP_HOST")
    if not host:
        return False
    try:
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", ""))
        msg["To"] = os.getenv("CONTACT_TO_EMAIL", os.getenv("SMTP_USER", ""))
        port = int(os.getenv("SMTP_PORT", "465"))
        with smtplib.SMTP_SSL(host, port, timeout=10) as server:
            user = os.getenv("SMTP_USER", "")
            password = os.getenv("SMTP_PASSWORD", "")
            if user:
                server.login(user, password)
            server.send_message(msg)
        return True
    except Exception:
        return False


app = FastAPI(title="个人网站后端", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

contact_rate: dict = defaultdict(deque)


@app.on_event("startup")
def on_startup() -> None:
    with SessionLocal() as db:
        seed_admin(db)


class LoginIn(BaseModel):
    username: str
    password: str


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=160)
    message: str = Field(min_length=1, max_length=2000)
    website: str = ""


class ProjectIn(BaseModel):
    slug: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=120)
    category: str = ""
    description: str = ""
    tags: str = ""
    url: str = ""
    type_label: str = ""
    sort_order: int = 0
    published: bool = True


class PostIn(BaseModel):
    slug: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=160)
    summary: str = ""
    content_md: str = ""
    published: bool = True


class ClickIn(BaseModel):
    slug: str


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/projects")
def list_projects(db: Session = Depends(get_db)):
    rows = db.scalars(select(Project).where(Project.published.is_(True)).order_by(Project.sort_order, Project.id)).all()
    return [project_dict(p) for p in rows]


@app.get("/api/projects/{slug}")
def get_project(slug: str, db: Session = Depends(get_db)):
    p = db.scalar(select(Project).where(Project.slug == slug, Project.published.is_(True)))
    if not p:
        raise HTTPException(status_code=404, detail="项目不存在")
    return project_dict(p)


@app.get("/api/posts")
def list_posts(db: Session = Depends(get_db)):
    rows = db.scalars(select(Post).where(Post.published.is_(True)).order_by(Post.created_at.desc())).all()
    return [post_dict(p) for p in rows]


@app.get("/api/posts/{slug}")
def get_post(slug: str, db: Session = Depends(get_db)):
    p = db.scalar(select(Post).where(Post.slug == slug, Post.published.is_(True)))
    if not p:
        raise HTTPException(status_code=404, detail="文章不存在")
    return post_dict(p)


@app.post("/api/contact")
def create_contact(body: ContactIn, request: Request, db: Session = Depends(get_db)):
    if body.website:
        return {"ok": True}
    now = dt.datetime.now(dt.timezone.utc)
    ip = request.client.host if request.client else "unknown"
    timestamps = [t for t in contact_rate[ip] if now - t < dt.timedelta(hours=1)]
    if len(timestamps) >= 5:
        raise HTTPException(status_code=429, detail="提交过于频繁")
    contact_rate[ip] = timestamps + [now]
    db.add(ContactMessage(name=body.name.strip(), email=body.email.strip(), message=body.message.strip()))
    db.commit()
    send_email("个人网站新留言", f"姓名：{body.name}\n邮箱：{body.email}\n\n{body.message}")
    return {"ok": True}


@app.post("/api/analytics/click")
def record_click(body: ClickIn, db: Session = Depends(get_db)):
    stat = db.scalar(select(ClickStat).where(ClickStat.slug == body.slug))
    if not stat:
        stat = ClickStat(slug=body.slug, count=0)
        db.add(stat)
    stat.count += 1
    db.commit()
    return {"ok": True, "count": stat.count}


@app.get("/go/{slug}")
def go(slug: str, db: Session = Depends(get_db)):
    p = db.scalar(select(Project).where(Project.slug == slug, Project.published.is_(True)))
    if not p or not p.url:
        raise HTTPException(status_code=404, detail="项目不存在")
    stat = db.scalar(select(ClickStat).where(ClickStat.slug == slug))
    if not stat:
        stat = ClickStat(slug=slug, count=0)
        db.add(stat)
    stat.count += 1
    db.commit()
    return RedirectResponse(p.url, status_code=302)


@app.post("/api/admin/login")
def login(body: LoginIn, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(AdminUser).where(AdminUser.username == body.username))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    token = create_token(user.username)
    response.set_cookie(SESSION_COOKIE, token, httponly=True, samesite="lax", max_age=TOKEN_TTL_MINUTES * 60)
    return {"ok": True, "username": user.username}


@app.post("/api/admin/logout")
def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True}


@app.get("/api/admin/me")
def me(admin: AdminUser = Depends(current_admin)):
    return {"username": admin.username}


@app.get("/api/admin/projects")
def admin_projects(db: Session = Depends(get_db), admin: AdminUser = Depends(current_admin)):
    rows = db.scalars(select(Project).order_by(Project.sort_order, Project.id)).all()
    return [project_dict(p) for p in rows]


@app.post("/api/admin/projects")
def create_project(body: ProjectIn, db: Session = Depends(get_db), admin: AdminUser = Depends(current_admin)):
    if db.scalar(select(Project).where(Project.slug == body.slug)):
        raise HTTPException(status_code=409, detail="slug 已存在")
    p = Project(**body.model_dump())
    db.add(p)
    db.commit()
    return project_dict(p)


@app.put("/api/admin/projects/{project_id}")
def update_project(project_id: int, body: ProjectIn, db: Session = Depends(get_db), admin: AdminUser = Depends(current_admin)):
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail="项目不存在")
    for key, value in body.model_dump().items():
        setattr(p, key, value)
    db.commit()
    return project_dict(p)


@app.delete("/api/admin/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), admin: AdminUser = Depends(current_admin)):
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail="项目不存在")
    db.delete(p)
    db.commit()
    return {"ok": True}


@app.get("/api/admin/posts")
def admin_posts(db: Session = Depends(get_db), admin: AdminUser = Depends(current_admin)):
    rows = db.scalars(select(Post).order_by(Post.created_at.desc())).all()
    return [post_dict(p) for p in rows]


@app.post("/api/admin/posts")
def create_post(body: PostIn, db: Session = Depends(get_db), admin: AdminUser = Depends(current_admin)):
    if db.scalar(select(Post).where(Post.slug == body.slug)):
        raise HTTPException(status_code=409, detail="slug 已存在")
    p = Post(**body.model_dump(), content_html=markdown(body.content_md))
    db.add(p)
    db.commit()
    return post_dict(p)


@app.put("/api/admin/posts/{post_id}")
def update_post(post_id: int, body: PostIn, db: Session = Depends(get_db), admin: AdminUser = Depends(current_admin)):
    p = db.get(Post, post_id)
    if not p:
        raise HTTPException(status_code=404, detail="文章不存在")
    for key, value in body.model_dump().items():
        setattr(p, key, value)
    p.content_html = markdown(p.content_md)
    db.commit()
    return post_dict(p)


@app.delete("/api/admin/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), admin: AdminUser = Depends(current_admin)):
    p = db.get(Post, post_id)
    if not p:
        raise HTTPException(status_code=404, detail="文章不存在")
    db.delete(p)
    db.commit()
    return {"ok": True}


@app.get("/api/admin/messages")
def admin_messages(db: Session = Depends(get_db), admin: AdminUser = Depends(current_admin)):
    rows = db.scalars(select(ContactMessage).order_by(ContactMessage.created_at.desc())).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "email": m.email,
            "message": m.message,
            "created_at": m.created_at.isoformat(),
        }
        for m in rows
    ]


@app.delete("/api/admin/messages/{message_id}")
def delete_message(message_id: int, db: Session = Depends(get_db), admin: AdminUser = Depends(current_admin)):
    m = db.get(ContactMessage, message_id)
    if not m:
        raise HTTPException(status_code=404, detail="留言不存在")
    db.delete(m)
    db.commit()
    return {"ok": True}


@app.get("/api/admin/stats")
def admin_stats(db: Session = Depends(get_db), admin: AdminUser = Depends(current_admin)):
    clicks = {s.slug: s.count for s in db.scalars(select(ClickStat)).all()}
    message_count = db.scalar(select(ContactMessage.id).order_by(ContactMessage.id.desc()).limit(1)) or 0
    project_count = db.scalar(select(Project.id).order_by(Project.id.desc()).limit(1)) or 0
    post_count = db.scalar(select(Post.id).order_by(Post.id.desc()).limit(1)) or 0
    return {
        "clicks": clicks,
        "message_count": message_count,
        "project_count": project_count,
        "post_count": post_count,
    }


ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"}


@app.post("/api/admin/upload")
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(current_admin),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="仅支持 png / jpg / webp / gif / svg")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="图片不能超过 5MB")
    ext = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif", "image/svg+xml": ".svg"}[file.content_type]
    name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / name).write_bytes(data)
    return {"url": f"/uploads/{name}"}


app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/admin", include_in_schema=False)
def admin_page():
    return FileResponse(STATIC_DIR / "admin.html")


@app.get("/", include_in_schema=False)
def site_index():
    return FileResponse(SITE_DIR / "index.html")


@app.get("/index.html", include_in_schema=False)
def site_index_alias():
    return FileResponse(SITE_DIR / "index.html")


@app.get("/styles.css", include_in_schema=False)
def site_styles():
    return FileResponse(SITE_DIR / "styles.css")


@app.get("/script.js", include_in_schema=False)
def site_script():
    return FileResponse(SITE_DIR / "script.js")


@app.get("/assets/{filename}", include_in_schema=False)
def site_asset(filename: str):
    target = (ASSETS_DIR / filename).resolve()
    if not str(target).startswith(str(ASSETS_DIR.resolve())):
        raise HTTPException(status_code=404, detail="资源不存在")
    if not target.is_file():
        raise HTTPException(status_code=404, detail="资源不存在")
    return FileResponse(target)
