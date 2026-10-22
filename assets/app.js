(function () {
  var root = document.documentElement;
  var btn = document.getElementById("themeBtn");
  var bar = document.getElementById("progress");
  var toTop = document.getElementById("toTop");

  function systemDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function current() {
    return root.dataset.theme || (systemDark() ? "dark" : "light");
  }

  function paintButton() {
    if (!btn) return;
    var dark = current() === "dark";
    btn.textContent = dark ? "☾" : "☀";
    btn.setAttribute("aria-label", dark ? "切换到浅色" : "切换到深色");
  }

  function apply(theme) {
    if (theme) {
      root.dataset.theme = theme;
      try {
        localStorage.setItem("iv-theme", theme);
      } catch (e) {}
    } else {
      delete root.dataset.theme;
      try {
        localStorage.removeItem("iv-theme");
      } catch (e) {}
    }
    paintButton();
  }

  try {
    var saved = localStorage.getItem("iv-theme");
    if (saved === "dark" || saved === "light") root.dataset.theme = saved;
  } catch (e) {}
  paintButton();

  if (btn) {
    btn.addEventListener("click", function () {
      apply(current() === "dark" ? "light" : "dark");
    });
  }

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    if (bar) {
      var p = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      bar.style.width = (p * 100).toFixed(2) + "%";
    }
    if (toTop) toTop.classList.toggle("show", doc.scrollTop > 480);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ── 题目抽屉 ── */
  var drawer = document.getElementById("qdrawer");

  if (drawer) {
    var qbtn = document.getElementById("qbtn");
    var qmask = document.getElementById("qmask");
    var qclose = document.getElementById("qclose");
    var qcount = document.getElementById("qcount");
    var qfilter = document.getElementById("qfilter");
    var qbody = drawer.querySelector(".qbody");
    var qlinks = Array.prototype.slice.call(drawer.querySelectorAll("a[data-q]"));
    var qheads = Array.prototype.slice.call(document.querySelectorAll("h3.q"));
    var lastFocus = null;
    var ticking = false;

    function indexOf(num) {
      for (var i = 0; i < qheads.length; i++) {
        if (qheads[i].id === "q" + num) return i;
      }
      return -1;
    }

    function setActive(num) {
      var idx = indexOf(num);
      qlinks.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("data-q") === String(num));
      });
      if (qcount && idx >= 0) {
        qcount.textContent = idx + 1 + " / " + qheads.length;
      }
      var active = drawer.querySelector("a.active");
      if (active && drawer.classList.contains("open") && qbody) {
        var r = active.getBoundingClientRect();
        var box = qbody.getBoundingClientRect();
        if (r.top < box.top + 8 || r.bottom > box.bottom - 8) {
          active.scrollIntoView({ block: "center" });
        }
      }
    }

    function currentQ() {
      var num = null;
      for (var i = 0; i < qheads.length; i++) {
        if (qheads[i].getBoundingClientRect().top <= 120) num = qheads[i].id.slice(1);
        else break;
      }
      return num;
    }

    function jumpTo(el) {
      var keep = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      var top = window.scrollY + el.getBoundingClientRect().top - 68;
      window.scrollTo(0, Math.max(0, top));
      root.style.scrollBehavior = keep;
    }

    function refresh() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var num = currentQ();
        if (num) setActive(num);
      });
    }

    function applyFilter() {
      if (!qfilter || !qcount) return;

      var q = qfilter.value.trim().toLowerCase();
      var visible = 0;
      var groups = drawer.querySelectorAll(".qgroup");

      Array.prototype.forEach.call(groups, function (group) {
        var shown = 0;
        var head = group.querySelector("h4");
        var groupHit =
          !/^\d+$/.test(q) && head && head.textContent.toLowerCase().indexOf(q) >= 0;

        Array.prototype.forEach.call(group.querySelectorAll("a[data-q]"), function (a) {
          var hit = !q || groupHit || a.textContent.toLowerCase().indexOf(q) >= 0;
          a.hidden = !hit;
          if (hit) shown += 1;
        });
        group.hidden = shown === 0;
        visible += shown;
      });

      if (!q) {
        qcount.textContent = "共 " + qheads.length + " 题";
        var num = currentQ();
        if (num) setActive(num);
        return;
      }

      qcount.textContent = visible ? visible + " / " + qheads.length : "没有匹配";
    }

    function openDrawer() {
      lastFocus = document.activeElement;
      qmask.hidden = false;
      requestAnimationFrame(function () {
        qmask.classList.add("show");
      });
      drawer.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
      qbtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      var num = currentQ();
      if (num) setActive(num);
      if (qclose) qclose.focus();
    }

    function closeDrawer() {
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      qbtn.setAttribute("aria-expanded", "false");
      qmask.classList.remove("show");
      setTimeout(function () {
        if (!drawer.classList.contains("open")) qmask.hidden = true;
      }, 240);
      document.body.style.overflow = "";
      if (qfilter && qfilter.value) {
        qfilter.value = "";
        applyFilter();
      }
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    qbtn.addEventListener("click", openDrawer);
    qmask.addEventListener("click", closeDrawer);
    if (qclose) qclose.addEventListener("click", closeDrawer);
    if (qfilter) qfilter.addEventListener("input", applyFilter);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer();
    });

    qlinks.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var id = a.getAttribute("href");
        var target = document.querySelector(id);
        closeDrawer();
        if (target) {
          jumpTo(target);
          setActive(a.getAttribute("data-q"));
          if (history.replaceState) history.replaceState(null, "", id);
        }
      });
    });

    window.addEventListener("scroll", refresh, { passive: true });

    var first = currentQ();
    if (first) setActive(first);

    if (location.hash) {
      var initial = document.querySelector(location.hash);
      if (initial) {
        jumpTo(initial);
        setActive(location.hash.slice(2));
      }
    }
  }

  /* ── 代码复制 ── */
  Array.prototype.slice
    .call(document.querySelectorAll("pre"))
    .forEach(function (pre) {
      if (pre.querySelector(".copy")) return;

      var copy = document.createElement("button");
      copy.type = "button";
      copy.className = "copy";
      copy.textContent = "复制";

      function done() {
        copy.textContent = "已复制";
        setTimeout(function () {
          copy.textContent = "复制";
        }, 1400);
      }

      function fallback(text) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          done();
        } catch (e) {
          copy.textContent = "复制失败";
        }
        document.body.removeChild(ta);
      }

      copy.addEventListener("click", function () {
        var code = pre.querySelector("code");
        var text = (code || pre).innerText;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {
            fallback(text);
          });
        } else {
          fallback(text);
        }
      });

      pre.appendChild(copy);
    });
})();
