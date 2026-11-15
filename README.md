# ESAM Web 攻防實戰 Lab 教學站

ESAM「AI 資安進駐 Web 攻防」課程的一站式教學網站。收錄 SQL Injection、XSS + Session Hijacking、SSTI to RCE 三組靶機的漏洞原理、操作步驟與可直接複製的 payload，供學員在課堂上同步演練。

## 專案簡介

純靜態網站（HTML / CSS / 原生 JavaScript），以 GitHub Pages 部署。每個攻擊手法對應一個 Lab 頁面，所有指令與 payload 都附複製按鈕，學員點一下即可貼到瀏覽器或終端機使用。網站設計為可持續擴充，之後新增的攻擊手法沿用同一套頁面結構即可。

## 頁面

- `index.html`：首頁，Lab 列表與使用說明
- `lab1-sqli.html`：SQL Injection
- `lab2-xss.html`：XSS + Session Hijacking
- `lab3-ssti.html`：SSTI to RCE

## 本機預覽

```bash
python3 -m http.server 8080
```

然後開啟 http://localhost:8080 。

## 專案規則

開發規範與「如何新增一個 Lab 頁面」記錄在 [CLAUDE.md](CLAUDE.md)，供 AI 依循同一套結構繼續擴充。

## 使用規範

本站所有技術僅供課堂授權環境內的攻防演練，請勿對未授權系統進行測試。
