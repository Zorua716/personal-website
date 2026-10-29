(function () {
  "use strict";

  // 移动端菜单
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("nav-toggle");
  var links = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];

  function setMenu(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenu(!nav.classList.contains("open"));
    });
  }

  links.forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  // 当前导航高亮
  var sectionIds = ["about", "skills", "projects", "contact"];
  var linkByHash = {};
  links.forEach(function (link) {
    linkByHash[link.getAttribute("href")] = link;
  });

  var sections = sectionIds
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.remove("active");
          });
          var active = linkByHash["#" + entry.target.id];
          if (active) active.classList.add("active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  // 复制邮箱
  var copyBtn = document.getElementById("copy-email");
  var email = document.getElementById("email");
  if (copyBtn && email) {
    copyBtn.addEventListener("click", function () {
      copyText(email.textContent).then(function (ok) {
        if (!ok) return;
        var original = copyBtn.textContent;
        copyBtn.textContent = "已复制";
        window.setTimeout(function () {
          copyBtn.textContent = original;
        }, 1500);
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

  // 进场动画
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || !("IntersectionObserver" in window)) {
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
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  // 星空背景
  var canvas = document.getElementById("stars");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var stars = [];
    var width = 0;
    var height = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var motion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function makeStars() {
      var count = window.innerWidth < 760 ? 70 : 140;
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random(),
          y: Math.random(),
          r: Math.random() * 1.3 + 0.3,
          a: Math.random() * 0.7 + 0.2,
          tw: Math.random() * 0.8 + 0.2
        });
      }
    }

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    var t = 0;
    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var alpha = motion ? s.a * (0.6 + 0.4 * Math.sin(t * s.tw + i)) : s.a;
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(230, 234, 242, " + alpha.toFixed(3) + ")";
        ctx.fill();
      }
      if (motion) {
        t += 0.02;
        window.requestAnimationFrame(draw);
      }
    }

    makeStars();
    resize();
    draw();
    window.addEventListener("resize", function () {
      resize();
      if (!motion) draw();
    });
  }
})();
