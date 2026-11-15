# CLAUDE.md

本檔案提供給 AI（Claude Code 等）閱讀，用以理解本專案的目的、結構與開發規則。新增或修改內容前請先完整讀過本檔，並依此處規範進行。

## 專案目的

這是 ESAM「AI 資安進駐 Web 攻防」課程的一站式教學網站。每個 Web 攻擊手法對應一個 Lab 頁面，內容包含漏洞原理、可在瀏覽器內直接操作的模擬練習，以及修補方式。

網站的核心是「邊看邊打」：學員讀完原理，就在同一頁的模擬練習區貼上或填入 payload、按下執行，立即看到攻擊結果。所有攻擊練習都在使用者自己的瀏覽器內以 JavaScript 模擬，不連任何真實靶機，也不對外發送請求。

目前收錄 Lab 01 SQL Injection、Lab 02 XSS、Lab 03 SSTI。本專案設計為可持續擴充，之後新增的攻擊手法都應沿用同一套結構新增頁面。

## 技術與部署

- 純靜態網站，只有 HTML、CSS、原生 JavaScript，無框架、無建置流程、無後端。
- 以 GitHub Pages 部署，根目錄即網站根目錄，`index.html` 為首頁。
- 所有模擬練習的邏輯都在 `app.js`，以頁面上是否存在對應容器 id 來判斷要不要啟用。

## 檔案結構

```
/
├── index.html          首頁，Lab 列表與使用說明
├── lab1-sqli.html      Lab 01 SQL Injection
├── lab2-xss.html       Lab 02 XSS
├── lab3-ssti.html      Lab 03 SSTI
├── style.css           全站共用樣式，配色集中在 :root 變數
├── app.js              共用互動 + 各 Lab 的模擬練習邏輯
├── CLAUDE.md
└── README.md
```

## 檔案命名規則

- Lab 頁面一律命名為 `labN-slug.html`，N 為兩位內的序號，slug 為攻擊手法英文簡稱小寫，例如 `lab4-csrf.html`。
- 新檔一律放在根目錄；共用資源為根目錄的 `style.css` 與 `app.js`，不要為單一頁面另外建立 CSS 或 JS。

## 整體風格

- 淺色乾淨的教學平台風格：淺灰藍底、白色卡片、海軍藍標題、青色（`--accent`）主色與按鈕。
- 所有顏色、字體、版面寬度都定義在 `style.css` 的 `:root`。要調整配色只改變數，不要在個別頁面寫 inline 色碼。
- 教材文字使用正式的教材語體，避免口語化與比喻式說法；不使用破折號、emoji 與少見標點。

## 頁面結構規範

每個 Lab 頁面依下列順序組成，區塊名稱與 class 需保持一致，供全站樣式與 app.js 正確套用。

1. `<nav class="nav">` 與其下的 `<div class="sandbox-bar">`。brand 固定，`.nav-links` 需列出所有 Lab 頁面；新增 Lab 時要同步更新每一頁的 `.nav-links`，並在 `index.html` 的 `.grid` 新增一張 `.card`。
2. 頁首：`.kicker`、`<h1 class="title">`、`.lead`（攻擊概述）、嚴重度與類型的 `.badge`。
3. `<h2>漏洞原理</h2>`：說明成因，必要時用 `.cmd` 指令卡放有漏洞的程式碼。
4. `<h2>模擬練習</h2>`：放一個 `.sim` 互動模擬區（見下）。
5. `<h2>防禦修補</h2>`：說明修補原則，附正確寫法的 `.cmd` 程式碼卡。
6. `.pager`：上一頁／下一頁導覽。
7. `<footer class="foot">` 與 `<script src="app.js">`。

## 可複製指令卡（.cmd）

供學員複製的指令、程式碼或有漏洞查詢，用此結構。app.js 會自動為每個 `.cmd` 綁定複製行為。

```html
<div class="cmd">
  <div class="cmd-head"><span>用途標籤</span><button class="copy">複製</button></div>
  <pre>要被複製的內容</pre>
</div>
```

`<pre>` 內即實際複製的文字。含 `<` `>` 的內容要以 `&lt;` `&gt;` 轉義。

## 互動模擬練習區（.sim，核心元件）

這是本站最重要的元件：讓學員直接操作攻擊。一個 Lab 一個 `.sim`，內含輸入欄、執行按鈕、結果輸出，以及可一鍵填入輸入欄的 payload 清單。對應的邏輯寫在 `app.js`，以容器 id 啟用。

共用慣例：

- payload「填入」按鈕用 `<button class="use" data-target="輸入欄id" data-value="payload">填入</button>`，app.js 會把 `data-value` 塞進 `#data-target` 欄位，不需另寫 JavaScript。payload 中的 HTML 以 `&lt;` 轉義。
- 結果輸出容器用 `<div class="sim-out" id="..."></div>`，由 app.js 加上 `show` 與 `ok` / `bad` / `info` 類別控制顯示與顏色。
- 每個 Lab 的模擬邏輯是一個 `initXxx()` 函式，開頭以 `document.getElementById("容器id")` 判斷當前頁面是否有此模擬，沒有就直接 return。新增 Lab 時在 `app.js` 新增一個 `initXxx()` 並在 `DOMContentLoaded` 裡呼叫。
- 既有三個模擬的容器 id：`sqli-sim`、`xss-sim`、`ssti-sim`。

模擬必須完全在前端完成，不得對外發送真實請求；攻擊效果以頁面內的假資料呈現（例如假的使用者資料表、假的 Collector 紀錄、假的指令輸出）。

## 提示框（.note）

補充說明用 `.note`，三種語氣：一般、`.note.warn`、`.note.danger`。內部第一行用 `<span class="label">標題</span>`。

## AI 新增或修改內容時需遵守的規則

- 內容只寫課堂授權情境的攻防演練；模擬一律在前端完成，不對真實系統發動攻擊、不發出真實請求。
- 不要為了單一頁面改動 `app.js`、`style.css` 的既有共用行為；頁面照既有 class / id 寫即可自動生效。
- 新增一個 Lab 需完成：建立 `labN-slug.html`、更新所有頁面 `.nav-links`、在 `index.html` 新增 `.card`、在 `app.js` 新增該 Lab 的 `initXxx()` 並於 `DOMContentLoaded` 呼叫、更新前後頁面的 `.pager`。
- 技術內容以講師提供的靶機實際行為為準，不自行杜撰結果。

## 新增一個 Lab 的範例流程

以新增「Lab 04 CSRF」為例，AI 應：

1. 複製 `lab3-ssti.html` 作為骨架，另存為 `lab4-csrf.html`，置換頁首與各區段內容。
2. 在「模擬練習」段放一個 `.sim`（例如一個模擬銀行轉帳表單與攻擊者頁面），容器 id 取 `csrf-sim`。
3. 在 `app.js` 新增 `initCsrf()`，開頭以 `document.getElementById("csrf-sim")` 判斷，並在 `DOMContentLoaded` 裡呼叫。
4. 在 `index.html`、`lab1`～`lab4` 的 `.nav-links` 加入連結，`index.html` 的 `.grid` 新增一張 `.card`。
5. 更新前後頁面的 `.pager` 連結。
