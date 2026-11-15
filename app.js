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
  var users, nextId;
  function reset() {
    users = [
      { id: 1, u: "ADMIN", p: "admin001", admin: true },
      { id: 2, u: "elaine", p: "password", admin: false }
    ];
    nextId = 3;
    render();
    out("", "");
  }
  function render() {
    var rows = users.map(function (x) {
      return "<tr><td>" + x.id + "</td><td>" + esc(x.u) + "</td><td>" + esc(x.p) + "</td><td class=center>" + (x.admin ? "1" : "0") + "</td></tr>";
    }).join("");
    document.getElementById("sqli-table").innerHTML =
      "<table class=sim-table><tr><th>id</th><th>username</th><th>password</th><th class=center>isAdmin</th></tr>" + rows + "</table>" +
      "<div class=sim-note>共 " + users.length + " 筆。注入後回看這張表，就能確認資料被新增、提權或刪除。</div>";
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
        users.push({ id: nextId++, u: m[1], p: m[2], admin: m[3] === "1" }); changed = true;
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

/* ---------- Lab 2 XSS 留言板 + Session Hijacking ---------- */
function initXss() {
  var root = document.getElementById("xss-sim");
  if (!root) return;
  var me = "claude_test";
  var current, board, stolen;
  var victim = {
    user: "victim",
    sid: "sess-victim-8f3a9b",
    cookie: "session_id=sess-victim-8f3a9b; session_user=victim; fake_session=20251202-Demo-session-cookie"
  };
  function isSteal(m) {
    return /<script[^>]*>[\s\S]*?(fetch|document\.cookie|steal)/i.test(m) || /on\w+\s*=[^>]*(fetch|cookie)/i.test(m);
  }
  function isScript(m) {
    return /<script|on\w+\s*=|<svg|<img/i.test(m);
  }
  function protect() { return document.getElementById("xss-protect").checked; }

  function renderUser() {
    var hijacked = current === victim.user;
    document.getElementById("xss-user").innerHTML =
      "目前登入使用者：<strong>" + esc(current) + "</strong>" +
      (hijacked ? " <span class='badge high'>已冒用受害者身分</span>" : "");
  }
  function renderBoard() {
    var p = protect();
    document.getElementById("xss-board").innerHTML = board.length ? board.map(function (msg) {
      var tag = "";
      if (!p && isScript(msg.m)) tag = "<div class=pl-label style='color:#c23b4b'>此留言含腳本，任何瀏覽本頁的使用者都會執行它</div>";
      else if (p && isScript(msg.m)) tag = "<div class=pl-label style='color:#2f8f5b'>已 HTML 編碼，腳本不執行</div>";
      var body = "<span class=mono>" + esc(msg.m) + "</span>";
      return "<div class='panel' style='margin:8px 0;padding:12px 14px'><div class=pl-label>" + esc(msg.uid) + "：</div>" + body + tag + "</div>";
    }).join("") : "<div class=sim-note>目前沒有留言。</div>";
  }
  function renderStolen() {
    var el = document.getElementById("xss-collector");
    if (!stolen.length) { el.innerHTML = "<div class='xss-term'>Cookie Collector<br><span style='opacity:.6'>尚未收到任何 cookie。</span></div>"; return; }
    el.innerHTML = "<div class='xss-term'>Cookie Collector<br>" + stolen.map(function (s) {
      return "[" + s.t + "] 10.0.0.9 (" + esc(s.user) + ") &rarr; " + esc(s.cookie) +
        " <button class='use' data-target='xss-sid' data-value='" + s.sid + "'>複製 session_id</button>";
    }).join("<br>") + "</div>";
    // 新加的「複製 session_id」按鈕要補綁定
    el.querySelectorAll(".use[data-target]").forEach(function (b) {
      b.addEventListener("click", function () {
        document.getElementById(b.getAttribute("data-target")).value = b.getAttribute("data-value");
      });
    });
  }
  function out(cls, html) {
    var o = document.getElementById("xss-out");
    o.className = "sim-out" + (cls ? " show " + cls : "");
    o.innerHTML = html;
  }

  // vulnerable 模式下，真的讓留言中的腳本在瀏覽器執行（Stored XSS 實演）
  // 竊取 cookie 類不真的送網路，交給模擬 Collector，避免對外請求
  function execPayload(m) {
    if (isSteal(m)) return;
    try {
      var holder = document.createElement("div");
      holder.style.display = "none";
      document.body.appendChild(holder);
      holder.innerHTML = m;                 // 觸發 inline 事件處理器，如 img onerror
      holder.querySelectorAll("script").forEach(function (s) {
        try { window.eval(s.textContent || ""); } catch (e) {}
      });
      setTimeout(function () { holder.remove(); }, 1500);
    } catch (e) {}
  }

  function post() {
    var m = document.getElementById("xss-msg").value;
    if (!m.trim()) return;
    board.unshift({ uid: current, m: m });
    renderBoard();
    if (isScript(m)) {
      if (protect()) {
        out("ok", "Protected 模式：留言在輸出前做 HTML 編碼，&lt;script&gt; 變成純文字顯示，不會執行。");
      } else if (isSteal(m)) {
        out("bad", "留言已存入，含有竊取 cookie 的腳本。接著按「模擬 victim 開啟留言板」，讓受害者在自己的瀏覽器觸發它。");
      } else {
        execPayload(m);
        out("bad", "留言已存入，且立即在你的瀏覽器執行，你應該看到彈窗。這就是 Stored XSS：留言被當成程式碼執行。");
      }
    } else {
      out("info", "留言已存入。這則不含腳本，屬於正常留言。");
    }
    document.getElementById("xss-msg").value = "";
  }

  function victimVisit() {
    if (protect()) { out("ok", "Protected 模式下，受害者瀏覽留言板時腳本被當純文字顯示，沒有任何腳本執行，cookie 未外洩。"); return; }
    // 受害者的瀏覽器真的執行留言中的腳本
    board.forEach(function (x) { if (isScript(x.m)) execPayload(x.m); });
    var hasSteal = board.some(function (x) { return isSteal(x.m); });
    var hasScript = board.some(function (x) { return isScript(x.m); });
    if (hasSteal) {
      if (!stolen.some(function (s) { return s.sid === victim.sid; })) stolen.push({ t: now(), user: victim.user, sid: victim.sid, cookie: victim.cookie });
      renderStolen();
      out("bad", "受害者 victim 開啟留言板，惡意腳本在其瀏覽器執行，讀取 document.cookie 後送往攻擊者的 Collector。Collector 已收到 victim 的 cookie。接著複製 session_id，到下方冒用身分。");
    } else if (hasScript) {
      out("bad", "受害者瀏覽器執行了留言中的腳本，你應該看到彈窗。把它換成竊取 cookie 的 fetch，就能偷走 session。");
    } else {
      out("info", "目前留言都沒有腳本，受害者瀏覽後沒有任何事發生。先發一則腳本留言。");
    }
  }

  function hijack() {
    var sid = document.getElementById("xss-sid").value.trim();
    if (sid === victim.sid) {
      current = victim.user;
      renderUser(); renderBoard();
      out("bad", "成功冒用身分。把竊得的 session_id 當成自己的 cookie 後，伺服器把你認成 victim，目前登入使用者已變為 victim。這就是 Session Hijacking。");
    } else {
      out("info", "這個 session_id 不存在，無法冒用。請從 Collector 複製竊得的 session_id。");
    }
  }

  function reset() {
    current = me; board = []; stolen = [];
    document.getElementById("xss-sid").value = "";
    renderUser(); renderBoard(); renderStolen(); out("", "");
  }
  document.getElementById("xss-post").addEventListener("click", post);
  document.getElementById("xss-victim").addEventListener("click", victimVisit);
  document.getElementById("xss-hijack").addEventListener("click", hijack);
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
