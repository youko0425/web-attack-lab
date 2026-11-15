# CLAUDE.md

本檔案提供給 AI（Claude Code 等）閱讀，用以理解本專案的目的、結構與開發規則。新增或修改內容前請先完整讀過本檔，並依此處規範進行。

## 專案目的

這是 ESAM「AI 資安進駐 Web 攻防」課程的一站式教學網站。每個 Web 攻擊手法對應一個 Lab 頁面，內容包含漏洞原理、靶機環境、現場操作步驟、可直接複製的 payload，以及修補方式。

網站的設計前提是「課堂同步演練」：學員一邊看頁面一邊操作，因此所有指令與 payload 都必須能一鍵複製後直接貼到瀏覽器或終端機使用，不需學員自行輸入。

目前收錄 Lab 01 SQL Injection、Lab 02 XSS + Session Hijacking、Lab 03 SSTI to RCE。本專案設計為可持續擴充，之後新增的攻擊手法（例如 CSRF、IDOR、檔案上傳、SSRF）都應沿用同一套結構新增頁面。

## 技術與部署

- 純靜態網站，只有 HTML、CSS、原生 JavaScript，無框架、無建置流程。
- 以 GitHub Pages 部署，根目錄即網站根目錄，`index.html` 為首頁。
- 不使用任何需要後端的功能。靶機本身（Flask）另外部署，不屬於本網站。

## 檔案結構

```
/
├── index.html          首頁，Lab 列表與使用說明
├── lab1-sqli.html      Lab 01 SQL Injection
├── lab2-xss.html       Lab 02 XSS + Session Hijacking
├── lab3-ssti.html      Lab 03 SSTI to RCE
├── style.css           全站共用樣式，配色集中在 :root 變數
├── app.js              全站共用互動：複製按鈕、導覽高亮
├── CLAUDE.md
└── README.md
```

## 檔案命名規則

- Lab 頁面一律命名為 `labN-slug.html`，N 為兩位內的序號，slug 為攻擊手法英文簡稱小寫，例如 `lab4-csrf.html`。
- 新檔一律放在根目錄，與既有 Lab 頁面同層；不要另開子資料夾放頁面。
- 共用資源為根目錄的 `style.css` 與 `app.js`，不要為單一頁面另外建立 CSS 或 JS。

## 整體風格

- 深色終端機風格，青色（`--accent`）為主色，標題與程式碼使用等寬字。
- 所有顏色、字體、版面寬度都定義在 `style.css` 的 `:root`。要調整配色只改變數，不要在個別頁面寫 inline 色碼。
- 教材文字使用正式的教材語體，避免口語化與比喻式說法；不使用破折號、emoji 與少見標點。

## 頁面結構規範

每個 Lab 頁面依下列順序組成，區塊名稱與 class 需保持一致，供全站樣式與 app.js 正確套用。

1. `<nav class="nav">`：頂部導覽。brand 固定，`.nav-links` 需列出所有 Lab 頁面。新增 Lab 時，要同步在每一頁的 `.nav-links` 加入連結，並在 `index.html` 的 Lab 列表新增一張 `.card`。
2. 頁首：`.kicker`（// LAB 0N）、`<h1 class="title">`、`.lead`（一段攻擊概述）、嚴重度與 port 的 `.badge`。
3. `<h2>漏洞原理</h2>`：說明成因，必要時用 `.panel` 放靶機資訊表格。
4. `<h2>操作步驟</h2>`：用 `<ol class="steps">`，每一步一個 `<li>`，步驟內附對應的指令卡。
5. `<h2>防禦修補</h2>`：說明修補原則，附正確寫法的程式碼卡。
6. `.pager`：上一頁／下一頁導覽。
7. `<footer class="foot">` 與 `<script src="app.js">`。

`<h2>` 前綴的 `//` 由 CSS 自動加上，標題文字不要自己加。

## 可複製指令卡（核心元件）

這是本站最重要的元件。任何要讓學員複製的指令、payload、程式碼，都用下列結構。app.js 會自動為每個 `.cmd` 綁定複製行為，不需另寫 JavaScript。

```html
<div class="cmd">
  <div class="cmd-head"><span>這段的用途標籤</span><button class="copy">Copy</button></div>
  <pre>要被複製的內容</pre>
</div>
```

規則：

- `<pre>` 內就是實際會被複製的文字，原樣呈現，不做縮排美化。
- HTML 類 payload（含 `<` `>`）在 `<pre>` 內要以 `&lt;` `&gt;` 轉義，否則會被瀏覽器解析。複製時 app.js 取的是 `innerText`，貼出來仍是原始字元。
- 每個 payload 用獨立的一張 `.cmd`，不要把多個不相關的指令塞進同一張。
- 靶機網址每次開課都會變，頁面範例一律用 `<靶機網址>`、`<Collector_4444網址>` 這類佔位符，不要寫死某次的 trycloudflare 網址。

## 提示框

補充說明用 `.note`，三種語氣：一般（預設）、`.note.warn`（注意事項）、`.note.danger`（課堂禁止操作）。內部第一行用 `<span class="label">標題</span>`。

## AI 新增或修改內容時需遵守的規則

- 內容只寫課堂授權靶機環境的攻防演練，不針對真實或未授權系統。
- 不要改動 `app.js` 與 `style.css` 的既有行為來遷就單一頁面；頁面照既有 class 寫即可自動生效。
- 新增一個 Lab 時，完成三件事才算完整：建立 `labN-slug.html`、更新所有頁面 `.nav-links`、在 `index.html` 新增對應 `.card`。
- 沿用既有頁面的區塊順序與 class 名稱，維持全站一致。
- 技術內容以講師提供的靶機實際行為為準，不自行杜撰 payload 或結果。

## 新增一個 Lab 的範例流程

以新增「Lab 04 CSRF」為例，AI 應：

1. 複製 `lab3-ssti.html` 作為骨架，另存為 `lab4-csrf.html`。
2. 置換頁首的 kicker、title、lead、badge。
3. 依漏洞原理、操作步驟、防禦修補三段改寫內容，操作步驟內的每個 payload 用一張 `.cmd` 指令卡。
4. 在 `index.html`、`lab1`～`lab4` 的 `.nav-links` 全部加入 `<a href="lab4-csrf.html">04 CSRF</a>`。
5. 在 `index.html` 的 `.grid` 內新增一張 `.card` 指向 `lab4-csrf.html`。
6. 更新前後頁面的 `.pager` 連結，讓上一頁／下一頁串起來。
