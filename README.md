# ESAM Web 攻防實戰 Lab

ESAM「AI 資安進駐 Web 攻防」課程的一站式教學網站。收錄 SQL Injection、XSS、SSTI 三組攻擊的漏洞原理、可在瀏覽器內直接操作的模擬練習，以及修補方式。

## 專案簡介

純靜態網站（HTML / CSS / 原生 JavaScript），以 GitHub Pages 部署。每個 Lab 頁面都內嵌一個模擬練習區，學員貼上或填入 payload、按下執行，即可在同一頁看到攻擊結果。所有攻擊練習都在瀏覽器內以 JavaScript 模擬，不連任何真實靶機，也不對外發送請求。

## 頁面

- `index.html`：總覽與 Lab 列表
- `lab1-sqli.html`：SQL Injection，模擬登入與資料表
- `lab2-xss.html`：XSS 留言板與 Collector 模擬
- `lab3-ssti.html`：SSTI 模板求值到指令執行

## 本機預覽

```bash
python3 -m http.server 8080
```

然後開啟 http://localhost:8080 。

## 專案規則

開發規範與「如何新增一個 Lab 頁面」記錄在 [CLAUDE.md](CLAUDE.md)。

## 使用規範

本站所有攻擊練習皆在使用者瀏覽器內模擬，不對任何真實系統發動攻擊。所學技術僅限用於授權環境。
