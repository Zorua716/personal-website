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

  var sections = ["about", "skills", "projects", "contact"]
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
