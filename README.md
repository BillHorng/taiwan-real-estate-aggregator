# 台灣全國不動產資訊整合平台

以來源可追溯、欄位不推測為原則的 React + TypeScript 靜態平台。Phase 2 現在整合五個官方開放資料來源，包含國產署待標售與開標結果、行政執行署拍定結果、臺灣銀行及臺北市財政局；民間房仲、法院現行法拍與金拍來源尚未宣稱整合。

## 已完成

- 16,375 筆官方資料快照與五個可重跑的 Python connector
- 統一資料 schema、標準化、Pydantic 驗證
- Dashboard、組合搜尋、篩選、排序、分頁、詳細頁
- 官方文件連結、來源狀態、查核時間、缺值標示
- LocalStorage 收藏、深淺色、響應式介面
- 多來源篩選、拍定價／底價區分、CSV 匯出、保守的疑似重複標記
- 最多四筆物件比較、快照紀錄數與來源同步健康顯示
- Vitest / pytest 測試與 GitHub Actions 部署、排程更新

## 尚未完成（Phase 2/3）

- 民間房源授權整合、法院現行法拍／金拍 connector
- Leaflet 地圖、座標地理編碼、實價登錄分析
- 更完整的跨來源模糊去重、通知與會員

## 快速開始

```bash
npm install
npm run dev
npm test
npm run build
```

資料更新：

```bash
python -m venv .venv
pip install -r requirements.txt
python scripts/update_data.py
python scripts/validate_snapshot.py
pytest
```

更完整說明請見 [交接手冊](docs/HANDOFF.md)、[Architecture](docs/ARCHITECTURE.md)、[Data Sources](docs/DATA_SOURCES.md)、[Deployment](docs/DEPLOYMENT.md)。

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

程式碼採 MIT License。國產署資料依政府資料開放授權條款第 1 版使用，須保留資料提供機關顯名。資訊僅供查詢；投標前請核對官方公告、謄本及現場狀況。
