// 共用互動：複製按鈕、導覽高亮
// 新增頁面不需改這支，HTML 用對 class 與 data 屬性即可自動生效。

document.addEventListener("DOMContentLoaded", function () {
  // 複製指令
  document.querySelectorAll(".cmd").forEach(function (box) {
    const btn = box.querySelector(".copy");
    const pre = box.querySelector("pre");
    if (!btn || !pre) return;
    btn.addEventListener("click", function () {
      const text = pre.innerText.replace(/\n$/, "");
      navigator.clipboard.writeText(text).then(function () {
        const old = btn.textContent;
        btn.textContent = "COPIED";
        btn.classList.add("done");
        setTimeout(function () {
          btn.textContent = old;
          btn.classList.remove("done");
        }, 1200);
      });
    });
  });

  // 依檔名高亮當前導覽項
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    const target = a.getAttribute("href");
    if (target === here || (here === "index.html" && target === "index.html")) {
      a.classList.add("active");
    }
  });
});
