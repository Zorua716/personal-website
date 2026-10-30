(function () {
  "use strict";

  var nav = document.getElementById("nav");
  var menuToggle = document.getElementById("menu-toggle");
  var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setMenu(open) {
    if (!nav || !menuToggle) return;
    nav.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      setMenu(!nav.classList.contains("open"));
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenu(false);
  });

  // 当前区块导航高亮
  var linkByHash = {};
  navLinks.forEach(function (link) {
    linkByHash[link.getAttribute("href")] = link;
  });

  var sections = ["about", "skills", "projects", "posts", "contact"]
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (link) {
            link.classList.remove("active");
          });
          var active = linkByHash["#" + entry.target.id];
          if (active) active.classList.add("active");
        });
      },
      { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
    );
    sections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  // 复制邮箱
  var copyBtn = document.getElementById("copy-email");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email") || "";
      copyText(email).then(function (ok) {
        if (!ok) return;
        var original = copyBtn.textContent;
        copyBtn.textContent = "已复制 ✓";
        window.setTimeout(function () {
          copyBtn.textContent = original;
        }, 1600);
      });
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () {
          return true;
        },
        function () {
          return fallbackCopy(text);
        }
      );
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    textarea.remove();
    return ok;
  }

  // 滚动进场
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  // 后端 API 集成
  var API_BASE =
    window.PERSONAL_API_BASE ||
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? ""
      : "http://127.0.0.1:8000");

  var adminLink = document.getElementById("admin-link");
  if (adminLink) {
    adminLink.href = (window.PERSONAL_API_BASE || "http://127.0.0.1:8000") + "/admin";
  }

  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderProjects(projects) {
    var box = document.getElementById("project-list");
    if (!box) return;
    box.innerHTML = projects.map(function (p, i) {
      var tags = (p.tags || []).map(function (t) { return "<li>" + escHtml(t) + "</li>"; }).join("");
      return (
        '<a class="project project-link" href="' + API_BASE + '/go/' + encodeURIComponent(p.slug) + '" target="_blank" rel="noreferrer">' +
          '<div class="project-left"><span class="project-no">' + String(i + 1).padStart(2, "0") + "</span>" +
          '<span class="project-year">' + escHtml(p.type_label || "WORK") + "</span></div>" +
          '<div class="project-main"><p class="project-type">' + escHtml(p.category) + "</p>" +
          "<h3>" + escHtml(p.title) + "</h3><p>" + escHtml(p.description) + "</p>" +
          '<ul class="tags">' + tags + "</ul></div>" +
          '<div class="project-mark" aria-hidden="true">↗</div></a>'
      );
    }).join("");
  }

  fetch(API_BASE + "/api/projects")
    .then(function (res) { if (!res.ok) throw new Error("offline"); return res.json(); })
    .then(function (projects) { if (Array.isArray(projects) && projects.length) renderProjects(projects); })
    .catch(function () { /* 后端不可用时保留静态项目列表 */ });

  function openPost(post) {
    var modal = document.getElementById("post-modal");
    if (!modal) return;
    var date = post.created_at ? new Date(post.created_at).toLocaleDateString("zh-CN") : "";
    document.getElementById("post-modal-date").textContent = date;
    document.getElementById("post-modal-title").textContent = post.title || "";
    document.getElementById("post-modal-content").innerHTML = post.content_html || "";
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closePost() {
    var modal = document.getElementById("post-modal");
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  var postModal = document.getElementById("post-modal");
  var postClose = document.getElementById("post-modal-close");
  if (postModal && postClose) {
    postClose.addEventListener("click", closePost);
    postModal.addEventListener("click", function (event) {
      if (event.target === postModal) closePost();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closePost();
    });
  }

  function renderPosts(posts) {
    var box = document.getElementById("post-list");
    if (!box) return;
    if (!posts.length) {
      box.innerHTML = '<p class="post-empty">还没有发布文章。</p>';
      return;
    }
    box.innerHTML = posts.map(function (p, i) {
      var date = p.created_at ? new Date(p.created_at).toLocaleDateString("zh-CN") : "";
      return (
        '<button class="post-item" type="button" data-post="' + i + '">' +
          '<span class="post-date">' + escHtml(date) + "</span>" +
          "<span><span class=\"post-title\">" + escHtml(p.title) + "</span>" +
          '<span class="post-summary">' + escHtml(p.summary || "") + "</span></span>" +
          '<span class="post-arrow" aria-hidden="true">↗</span></button>'
      );
    }).join("");
    box.querySelectorAll("[data-post]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openPost(posts[parseInt(btn.dataset.post, 10)]);
      });
    });
  }

  fetch(API_BASE + "/api/posts")
    .then(function (res) { if (!res.ok) throw new Error("offline"); return res.json(); })
    .then(function (posts) { renderPosts(Array.isArray(posts) ? posts : []); })
    .catch(function () {
      var box = document.getElementById("post-list");
      if (box) box.innerHTML = '<p class="post-empty">文章暂时无法加载，请确认后端正在运行。</p>';
    });

  var contactForm = document.getElementById("contact-form");
  var contactMsg = document.getElementById("contact-msg");
  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var fd = new FormData(contactForm);
      var payload = {
        name: fd.get("name"),
        email: fd.get("email"),
        message: fd.get("message"),
        website: fd.get("website") || ""
      };
      if (!payload.name || !payload.email || !payload.message) {
        contactMsg.className = "form-msg err";
        contactMsg.textContent = "请填写姓名、邮箱和留言内容。";
        return;
      }
      var btn = contactForm.querySelector("button[type=submit]");
      btn.disabled = true;
      fetch(API_BASE + "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, d: d }; }); })
        .then(function (r) {
          contactMsg.className = r.ok ? "form-msg ok" : "form-msg err";
          contactMsg.textContent = r.ok ? "留言已发送，谢谢！" : (r.d.detail || "发送失败，请稍后重试。");
          if (r.ok) contactForm.reset();
        })
        .catch(function () {
          contactMsg.className = "form-msg err";
          contactMsg.textContent = "后端未运行，请直接发送邮件到 3540226929@qq.com。";
        })
        .finally(function () { btn.disabled = false; });
    });
  }

  // 自定义光标
  var cursor = document.getElementById("cursor");
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  if (cursor && finePointer && !reducedMotion) {
    var targetX = window.innerWidth / 2;
    var targetY = window.innerHeight / 2;
    var currentX = targetX;
    var currentY = targetY;

    document.addEventListener("mousemove", function (event) {
      targetX = event.clientX;
      targetY = event.clientY;
    });

    document.querySelectorAll("a, button").forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        cursor.classList.add("hover");
      });
      el.addEventListener("mouseleave", function () {
        cursor.classList.remove("hover");
      });
    });

    function animateCursor() {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      cursor.style.left = currentX + "px";
      cursor.style.top = currentY + "px";
      window.requestAnimationFrame(animateCursor);
    }

    animateCursor();
  }
})();
