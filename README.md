# 台灣全國不動產資訊整合平台

以一般房源跨來源比較為主軸、政府標售與拍賣為次要資料模組的 React + TypeScript 靜態平台。使用者可將不同網站的候選房源保存在瀏覽器並並排比較；民間房仲尚未取得授權 feed，因此不宣稱已自動整合其物件資料。

## 已完成

- 16,375 筆政府標售／拍賣快照、8,838 筆本期實價登錄、368 個官方行政區代表座標與可重跑的 Python connector
- 統一資料 schema、標準化、Pydantic 驗證
- Dashboard、組合搜尋、篩選、排序、分頁、詳細頁
- 一般房源工作台：手動加入來源網址、物件／房屋類型、價格、建物／土地坪數、樓層、屋齡、格局與車位
- 一般房源關鍵字與組合篩選（含每坪單價與土地坪數區間）、排序、分頁、專屬詳細頁及手動價格時間線
- 最多四筆一般房源跨來源比較，資料只保存在瀏覽器 LocalStorage
- 一般房源編輯、CSV 匯入／匯出、正規化網址去重與欄位完整度
- 一般房源收藏及改價歷史；收藏或比較一般房源時不下載政府完整快照
- 一般房源跨來源疑似重複提示：多項證據評分、顯示判定理由，但不自動合併或刪除
- 內政部買賣實價登錄：區域／建物／坪數篩選、成交中位數、明細與一般房源開價比較
- 2024 Q1 至 2026 Q3 官方歷史實價聚合：11 季、15,122 個趨勢點
- Google Maps 一般房源地圖：使用行政區代表座標，支援地圖視窗與兩點矩形框選；需自行設定受限制的瀏覽器 API Key
- 一般房源 CSV 快照更新：保留改價歷史與人工狀態，缺少紀錄不自動判定下架
- 本機保存搜尋條件與目前符合筆數，作為訂閱功能第一版
- 法院法拍、行政執行拍賣與金拍屋專頁；無 feed 的來源維持透明官方連結模式
- Playwright 桌面／手機 E2E，涵蓋新增、舊 CSV、進階搜尋、來源空狀態及路由重新整理
- 授權合作 feed 的 permission manifest、欄位權利與 Property 驗證工具
- 官方文件連結、來源狀態、查核時間、缺值標示
- LocalStorage 收藏、深淺色、響應式介面
- 多來源篩選、拍定價／底價區分、CSV 匯出、保守的疑似重複標記
- 政府標售／拍賣獨立資料模組、快照紀錄數與來源同步健康顯示
- 九個主要一般房仲官方入口與「0 筆已接入」透明揭露
- Vitest / pytest 測試與 GitHub Actions 部署、排程更新

## 尚未完成（Phase 2/3）

- 第一個民間房源授權 feed（外部授權阻塞）、法院現行法拍／金拍 connector
- 門牌級合法地理編碼、精確物件座標、更長期與更精細的實價趨勢
- 社區名稱／座標層級的進一步模糊去重、通知與會員

## 快速開始

```bash
npm install
npm run dev
npm test
npm run build
```

Google Maps 本機設定：複製 `.env.example` 為 `.env.local`，填入 `VITE_GOOGLE_MAPS_API_KEY`。這是瀏覽器端金鑰，必須在 Google Cloud 限制為 Maps JavaScript API，並限制 HTTP referrer；不得提交 `.env.local`。

資料更新：

```bash
python -m venv .venv
pip install -r requirements.txt
python scripts/update_data.py
python scripts/update_real_price.py
python scripts/update_real_price_history.py
python scripts/validate_snapshot.py
python scripts/validate_real_price.py
pytest
```

更完整說明請見 [交接手冊](docs/HANDOFF.md)、[Architecture](docs/ARCHITECTURE.md)、[Data Sources](docs/DATA_SOURCES.md)、[一般房源合作接入規格](docs/GENERAL_LISTING_ONBOARDING.md)、[Deployment](docs/DEPLOYMENT.md)。

## 建立自己的 GitHub repository

```bash
git init
git add .
git commit -m "feat: initial Taiwan real-estate aggregator MVP"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/taiwan-real-estate-aggregator.git
git push -u origin main
```

## 授權與免責

程式碼採 MIT License。國產署、內政部實價登錄及國土測繪中心行政區資料依政府資料開放授權條款第 1 版使用，須保留資料提供機關顯名。資訊僅供查詢；投標或購屋前請核對官方資料、謄本及現場狀況。
