// 共用互動 + 三個 Lab 的瀏覽器模擬練習
// 全部純前端，無後端。新增頁面照既有 class / id 命名即可自動生效。

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function now() {
  var d = new Date();
  function p(n) { return (n < 10 ? "0" : "") + n; }
  return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}

document.addEventListener("DOMContentLoaded", function () {
  // 複製指令卡
  document.querySelectorAll(".cmd").forEach(function (box) {
    var btn = box.querySelector(".copy"), pre = box.querySelector("pre");
    if (!btn || !pre) return;
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(pre.innerText.replace(/\n$/, "")).then(function () {
        var old = btn.textContent;
        btn.textContent = "已複製"; btn.classList.add("done");
        setTimeout(function () { btn.textContent = old; btn.classList.remove("done"); }, 1200);
      });
    });
  });

  // payload「填入」按鈕：把 data-value 塞進目標欄位
  document.querySelectorAll(".use[data-target]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var el = document.getElementById(btn.getAttribute("data-target"));
      if (!el) return;
      el.value = btn.getAttribute("data-value");
      el.focus();
    });
  });

  // 導覽高亮
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    if (a.getAttribute("href") === here) a.classList.add("active");
  });

  initSqli();
  initXss();
  initSsti();
});

/* ---------- Lab 1 SQL Injection 模擬登入 ---------- */
function initSqli() {
  var root = document.getElementById("sqli-sim");
  if (!root) return;
  var users;
  function reset() {
    users = [
      { u: "ADMIN", p: "admin001", admin: true },
      { u: "pony", p: "password", admin: false }
    ];
    render();
    out("", "");
  }
  function render() {
    var rows = users.map(function (x) {
      return "<tr><td>" + esc(x.u) + "</td><td>" + esc(x.p) + "</td><td class=center>" + (x.admin ? "1" : "0") + "</td></tr>";
    }).join("");
    document.getElementById("sqli-table").innerHTML =
      "<table class=sim-table><tr><th>username</th><th>password</th><th class=center>isAdmin</th></tr>" + rows + "</table>";
  }
  function out(cls, html) {
    var o = document.getElementById("sqli-out");
    o.className = "sim-out" + (cls ? " show " + cls : "");
    o.innerHTML = html;
  }
  function run() {
    var U = document.getElementById("sqli-user").value;
    var P = document.getElementById("sqli-pass").value;
    var q = "SELECT * FROM users WHERE username = '" + U + "' AND password = '" + P + "'";
    var msgs = [], loggedIn = null, changed = false;
    var parts = U.split(";");
    var first = parts[0];

    if (/or\s+1\s*=\s*1/i.test(first) && /--/.test(first)) {
      loggedIn = users.find(function (x) { return x.admin; }) || users[0];
      msgs.push("注入成功。OR 1=1 讓條件永遠成立，-- 把後面的密碼檢查註解掉，未提供正確密碼即以管理員 " + esc(loggedIn.u) + " 身分登入。");
    }
    parts.slice(1).forEach(function (seg) {
      var s = seg.trim(); if (!s || s.indexOf("--") === 0) return;
      var m;
      if (m = s.match(/insert\s+into\s+users\s*\([^)]*\)\s*values\s*\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*(\d+)/i)) {
        users.push({ u: m[1], p: m[2], admin: m[3] === "1" }); changed = true;
        msgs.push("INSERT 成功。新增使用者 " + esc(m[1]) + "，isAdmin=" + m[3] + "。");
      } else if (m = s.match(/update\s+users\s+set\s+isadmin\s*=\s*(\d+)\s+where\s+username\s*=\s*'([^']*)'/i)) {
        var t = users.find(function (x) { return x.u.toLowerCase() === m[2].toLowerCase(); });
        if (t) { t.admin = m[1] === "1"; changed = true; msgs.push("UPDATE 成功。" + esc(m[2]) + " 的 isAdmin 已改為 " + m[1] + "。"); }
      } else if (m = s.match(/delete\s+from\s+users\s+where\s+username\s*=\s*'([^']*)'/i)) {
        var before = users.length;
        users = users.filter(function (x) { return x.u.toLowerCase() !== m[1].toLowerCase(); });
        if (users.length < before) { changed = true; msgs.push("DELETE 成功。已刪除使用者 " + esc(m[1]) + "。"); }
      }
    });

    if (!loggedIn && !changed) {
      var hit = users.find(function (x) { return x.u === U && x.p === P; });
      if (hit) { loggedIn = hit; msgs.push("一般登入成功：帳號密碼正確（" + esc(hit.u) + "）。"); }
      else msgs.push("登入失敗：查無符合的帳號密碼。試試看注入 payload。");
    }
    render();
    var cls = (loggedIn || changed) ? "bad" : "info";
    var head = loggedIn ? "<strong>登入成功" + (loggedIn.admin ? "（管理員）" : "") + "</strong><br>" : "";
    out(cls, head + msgs.join("<br>") + "<div class=sim-note>伺服器實際執行：</div><pre>" + esc(q) + "</pre>");
  }
  document.getElementById("sqli-login").addEventListener("click", run);
  document.getElementById("sqli-reset").addEventListener("click", reset);
  reset();
}

/* ---------- Lab 2 XSS 留言板 ---------- */
function initXss() {
  var root = document.getElementById("xss-sim");
  if (!root) return;
  var board = [], stolen = [];
  var victimCookie = "session_id=demo-7f3a9b; session_user=victim";
  function renderBoard() {
    var protect = document.getElementById("xss-protect").checked;
    document.getElementById("xss-board").innerHTML = board.length ? board.map(function (m) {
      var body = protect ? esc(m) : ("<span class=mono>" + esc(m) + "</span>");
      return "<div class=panel style='margin:8px 0;padding:12px 14px'><div class=pl-label>匿名留言</div>" + body + "</div>";
    }).join("") : "<div class=sim-note>目前沒有留言。</div>";
  }
  function renderStolen() {
    document.getElementById("xss-collector").innerHTML = stolen.length ?
      "<table class=sim-table><tr><th>時間</th><th>竊得的 cookie</th></tr>" +
      stolen.map(function (s) { return "<tr><td>" + s.t + "</td><td class=mono>" + esc(s.c) + "</td></tr>"; }).join("") + "</table>"
      : "<div class=sim-note>尚未收到任何 cookie。</div>";
  }
  function out(cls, html) {
    var o = document.getElementById("xss-out");
    o.className = "sim-out" + (cls ? " show " + cls : "");
    o.innerHTML = html;
  }
  function post() {
    var m = document.getElementById("xss-msg").value;
    if (!m.trim()) return;
    var protect = document.getElementById("xss-protect").checked;
    board.push(m);
    renderBoard();
    if (protect) {
      out("ok", "Protected 模式：留言在輸出前做了 HTML 編碼，&lt;script&gt; 變成純文字顯示，腳本不會執行。");
    } else if (/<script[^>]*>[\s\S]*?(fetch|document\.cookie|steal)/i.test(m) || /on\w+\s*=\s*[^>]*(fetch|cookie)/i.test(m)) {
      stolen.push({ t: now(), c: victimCookie });
      renderStolen();
      out("bad", "惡意腳本在受害者瀏覽器執行，讀取 document.cookie 後送往攻擊者的 Collector。下方 Collector 已收到受害者的 cookie，攻擊者可用它冒用身分。");
    } else if (/<script[^>]*>[\s\S]*?alert/i.test(m) || /on\w+\s*=/i.test(m) || /<svg|<img/i.test(m)) {
      out("bad", "彈窗觸發：留言中的 JavaScript 被執行，代表存在 Stored XSS。把 alert 換成竊取 cookie 的程式碼即可偷走 session。");
    } else {
      out("info", "留言已存入。這則不含腳本，屬於正常留言。");
    }
    document.getElementById("xss-msg").value = "";
  }
  function reset() { board = []; stolen = []; renderBoard(); renderStolen(); out("", ""); }
  document.getElementById("xss-post").addEventListener("click", post);
  document.getElementById("xss-reset").addEventListener("click", reset);
  document.getElementById("xss-protect").addEventListener("change", renderBoard);
  reset();
}

/* ---------- Lab 3 SSTI 模板求值 ---------- */
function initSsti() {
  var root = document.getElementById("ssti-sim");
  if (!root) return;
  var fs = {
    "surprise.txt": "FLAG{ssti_rce_demo_2026}",
    "app.py": "from flask import Flask, request, render_template_string\n# ... debug=True"
  };
  function shell(cmd) {
    cmd = cmd.trim();
    if (cmd === "whoami") return "esam-lab\\student";
    if (cmd === "id") return "uid=1000(student) gid=1000(student)";
    if (cmd === "hostname") return "esam-lab-vm";
    if (/^ls(\s|$)/.test(cmd)) return [".", "..", "app.py", "surprise.txt", "templates"].join("\n");
    var m = cmd.match(/^cat\s+(\S+)/);
    if (m) return fs[m[1]] !== undefined ? fs[m[1]] : "cat: " + m[1] + ": No such file";
    return cmd + ": command not found";
  }
  function evalTemplate(input) {
    if (!/\{\{[\s\S]*\}\}/.test(input)) return { echo: true, val: input };
    var expr = input.replace(/^[\s\S]*?\{\{\s*/, "").replace(/\s*\}\}[\s\S]*$/, "");
    var m;
    if (m = expr.match(/popen\(\s*'([^']*)'\s*\)/)) return { val: shell(m[1]) };
    if (m = expr.match(/^(\d+)\s*\*\s*'(\d+)'$/)) return { val: m[2].repeat(parseInt(m[1], 10)) };
    if (m = expr.match(/^(\d+)\s*\*\s*(\d+)$/)) return { val: String(parseInt(m[1], 10) * parseInt(m[2], 10)) };
    if (/^request$/.test(expr)) return { val: "<Request 'http://esam-lab/' [GET]>" };
    if (/^config$/.test(expr)) return { val: "<Config {'DEBUG': True, 'SECRET_KEY': '...'}>" };
    if (/__import__\('os'\)/.test(expr)) return { val: "<module 'os' (built-in)>" };
    return { val: "" };
  }
  function run() {
    var input = document.getElementById("ssti-input").value;
    var r = evalTemplate(input);
    var o = document.getElementById("ssti-out");
    o.className = "sim-out show " + (r.echo ? "info" : "bad");
    var head = r.echo ? "輸入被原樣顯示（確認會回填，但尚未被當語法執行）：" : "模板引擎解析輸入並執行，回傳結果：";
    o.innerHTML = head + "<pre>" + esc(r.val) + "</pre>";
  }
  document.getElementById("ssti-run").addEventListener("click", run);
  document.getElementById("ssti-reset").addEventListener("click", function () {
    document.getElementById("ssti-input").value = "";
    document.getElementById("ssti-out").className = "sim-out";
  });
}
