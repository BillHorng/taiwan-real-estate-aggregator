# Taiwan Real Estate Aggregator 交接手冊

- 最後更新：2026-11-05
- 交接基準：`main` / 2026-11-05 統一上傳批次（最近 tag 仍為 `v1.1.0`）
- Repository：<https://github.com/BillHorng/taiwan-real-estate-aggregator>
- Production：<https://billhorng.github.io/taiwan-real-estate-aggregator/>

## 1. 專案定位

本專案是以 GitHub Pages 為第一階段執行環境的台灣不動產公開資料整合平台。系統目前不需要常駐後端，官方開放資料由 Python connectors 定期同步，標準化及驗證後輸出靜態 JSON，前端使用 React 在瀏覽器內搜尋與篩選。

核心原則：

- 每筆資料必須能追溯至官方來源。
- 缺漏欄位保持 `null`，不得推測價格、座標、點交或成交狀態。
- 開價、底價、拍定價及實價登錄成交價不得混用。
- 未授權的民間房仲網站只提供官方入口，不執行批次擷取。
- 單一來源失敗不得刪除其他來源或上一版有效資料。

## 2. 目前正式狀態

| 項目 | 狀態 |
| --- | --- |
| 應用版本 | `1.1.0`（本次不建立新 tag／Release） |
| 資料 schema | `2.3.0` |
| 正式分支 | `main` |
| 最近正式 tag | `v1.1.0` |
| Repository visibility | Public |
| GitHub Pages | 已啟用，來源為 GitHub Actions |
| 快照紀錄 | 16,375 筆 |
| 已整合資料來源 | 7 個（5 個標售／拍賣、實價登錄、行政區界線） |
| 額外資料 | 本期實價 8,838 筆、歷史趨勢 9,562 點、行政區代表座標 368 筆 |
| Python tests | 27 項 |
| Frontend tests | 28 項 |

以上筆數是 2026-11-04 快照，不是固定契約。正式數量應以 `public/data/properties.json` 與 `public/data/sync-status.json` 為準。

## 3. 系統資料流

主要產品流程：

```text
使用者從一般房仲官方頁面自行查閱
  -> 手動加入候選房源與原始 URL
  -> LocalStorage（不送往伺服器）
  -> 最多四筆跨來源比較
  -> 回到原始頁面查證
```

政府資料是次要獨立模組：

```text
官方開放資料
  -> scripts/connectors/*
  -> scripts/normalize/*
  -> conservative duplicate marking
  -> Pydantic Property validation
  -> public/data/properties.json (相容完整快照)
  -> public/data/property-manifest.json
  -> public/data/properties/current.json + 來源分檔
  -> React 延遲載入與 client-side search
  -> GitHub Pages
```

實價登錄與地圖資料維持獨立 schema，不混入 Property 快照：

```text
內政部實價登錄本期／歷史季度 ZIP
  -> real-price.json / real-price-history.json
  -> 成交行情與一般房源開價比較

國土測繪中心鄉鎮市區界線
  -> admin-centroids.json（行政區幾何中心）
  -> Leaflet + NLSC WMTS（非物件精確位置）
```

同步器對每個來源獨立執行。來源成功時使用新資料；失敗時保留該來源上一次有效資料並標記 `stale`。所有來源都失敗且完全沒有舊快照時才中止，不產生空資料集。

## 4. 目錄與責任範圍

| 路徑 | 用途 |
| --- | --- |
| `src/pages/` | Dashboard、一般房源、成交行情、地圖、搜尋、詳細頁、收藏、比較與來源狀態 |
| `src/components/` | 導覽、物件卡片、篩選器 |
| `src/services/data.ts` | 靜態 JSON 載入與瀏覽器內快取 |
| `src/types/property.ts` | 前端 Property、實價登錄、行政區座標、Dataset 與 SyncStatus 型別 |
| `src/utils/property.ts` | 價格／日期格式化、搜尋、篩選及排序 |
| `scripts/connectors/` | 只負責合法下載與來源格式初步展平 |
| `scripts/normalize/` | 來源欄位映射、日期／坪數／狀態標準化 |
| `scripts/validate/models.py` | 完整 Property Pydantic schema |
| `scripts/update_data.py` | 五個標售／拍賣來源協調、容錯、去重標記、原子寫入與健康紀錄 |
| `scripts/update_real_price*.py` | 本期實價明細與歷史季度趨勢更新 |
| `scripts/update_admin_centroids.py` | 官方界線 ZIP 下載與 368 個行政區代表點產生 |
| `scripts/validate_snapshot.py` | 獨立驗證 committed snapshot |
| `public/data/source-registry.json` | 已研究來源、授權、接入狀態與限制 |
| `public/data/sync-status.json` | 最近同步狀態及最多 90 次歷史 |
| `.github/workflows/` | Pages 部署與排程資料更新 |

## 5. 已整合來源

| Source ID | 來源 | 快照筆數 | 用途 |
| --- | --- | ---: | --- |
| `fnp-9655` | 國產署待標售資訊 | 450 | 近期標售、底價、保證金及公告 |
| `fnp-results-13144` | 國產署開標結果 | 13,335 | 底價、得標價、投標數及未標脫結果 |
| `moj-enforcement-177351` | 行政執行署已拍定資料 | 2,319 | 歷史拍定結果，不是目前待標清單 |
| `bot-37335` | 臺灣銀行標售公告 | 1 | 官方 API 目前僅有一筆歷史公告 |
| `taipei-finance-121364` | 臺北市市有房地標售清冊 | 270 | 市有房地標售與結果 |
| `moi-lvr` | 內政部實價登錄 | 8,838 本期明細／9,562 趨勢點 | 成交行情、區域趨勢與一般房源開價比較 |
| `nlsc-town-boundaries` | 國土測繪中心鄉鎮市區界線 | 368 | 行政區代表座標及地圖群組定位 |

國產署結果資料採「一個標號一筆 Property」。同標號若包含多筆土地或建物，保留在同一筆來源明細內，避免同一底價／得標價被重複計算。

來源詳細授權與端點請查閱 [DATA_SOURCES.md](DATA_SOURCES.md) 及 `public/data/source-registry.json`。

## 6. 尚未整合來源與法律邊界

- 司法院 dataset 22892 的中繼資料仍存在，但 2026-11-04 實測 Fileset 只回傳說明文字，`Foreclosure.json` 回傳 HTTP 404，因此狀態為 `research_required`。
- 台灣金服與民間房仲尚未取得正式 API 或合作授權，只能使用官方連結模式。一般房源登錄已涵蓋 591、永慶、信義、台灣房屋、住商、中信、東森、有巢氏及太平洋，共 9 個入口、0 筆整合物件。
- 民間來源轉為 `integrated` 前，必須符合 [GENERAL_LISTING_ONBOARDING.md](GENERAL_LISTING_ONBOARDING.md) 的書面授權、欄位範圍、照片／文案權利與撤回流程。
- 不得繞過 CAPTCHA、登入、反爬蟲、存取限制或以 IP 輪換規避政策。
- 不得複製未取得權利的物件照片及房仲文案。

## 7. 本機環境

建議版本：

- Node.js 22
- npm（使用 committed `package-lock.json`）
- Python 3.12 或 3.13

首次安裝：

```bash
npm ci
python -m venv .venv
```

Windows PowerShell：

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

macOS / Linux：

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

啟動前端：

```bash
npm run dev
```

正式 build 預覽：

```bash
npm run build
npm run preview
```

## 8. 必跑驗證

任何 connector、normalizer、schema 或前端搜尋修改，交付前至少執行：

```bash
python scripts/validate_snapshot.py
python -m pytest -q
npm run typecheck
npm test
npm run build
```

目前正常基準：

- Snapshot validation：16,375 筆、5 個來源
- Real-price validation：8,838 筆本期明細、7 季、9,562 個趨勢點
- Admin-centroid validation：368 個行政區、22 縣市
- pytest：27 passed
- Vitest：28 passed
- TypeScript：無錯誤
- Vite production build：成功

## 9. 手動資料同步

```bash
python scripts/update_data.py
python scripts/validate_snapshot.py
```

同步成功後檢查：

1. `sync-status.json` 的 `overall`。
2. 每個來源的 `status`、`records`、`last_success_at` 與 `error`。
3. 記錄數是否突然歸零或異常暴增。
4. `properties.json` 的 schema 版本。
5. 完整測試與 production build。

注意：2026-11-04 的同步歷史中有一次全來源 `stale`，原因是本機沙箱禁止網路存取；隨後使用正式網路重跑即恢復 `healthy`。這筆紀錄不應解讀為所有官方來源同時故障。

## 10. GitHub Actions

### `deploy.yml`

- 觸發：push 到 `main` 或手動執行。
- 流程：snapshot validation → npm install → Vitest → TypeScript/build → Pages artifact → deploy。
- Concurrency group：`pages`，新部署會取消舊部署。

### `update-data.yml`

- 排程：UTC 每週一、四 20:23；台北時間為每週二、五 04:23。
- 流程：pytest → 五來源同步 → snapshot validation → 前端測試/build → commit 新快照 → Pages deploy。
- Concurrency group：`data-update`，不會因 Pages 工作互相取消。
- 權限：需要 `contents: write` 才能提交資料快照。

若 branch protection 禁止 bot push，應把資料更新改為自動建立 Pull Request，不要提高 workflow token 到不必要權限。

## 11. Git 與版本發布

正常功能發布流程：

```bash
git status
git add .
git diff --cached --check
git commit -m "feat: describe the change"
git tag -a vX.Y.Z -m "Taiwan Real Estate Aggregator vX.Y.Z"
git push origin main
git push origin vX.Y.Z
```

版本原則：

- Patch：文件、錯字、小型相容修正。
- Minor：新增來源或向下相容功能。
- Major：資料 schema 或部署架構有破壞性變更。

不要重寫已公開的 `v1.0.0`、`v1.1.0` tag。

## 12. 部署驗證

GitHub Actions 成功後，至少確認：

```text
https://billhorng.github.io/taiwan-real-estate-aggregator/
https://billhorng.github.io/taiwan-real-estate-aggregator/data/properties.json
https://billhorng.github.io/taiwan-real-estate-aggregator/data/source-registry.json
https://billhorng.github.io/taiwan-real-estate-aggregator/data/sync-status.json
```

首頁與三個資料端點都應回傳 HTTP 200。子頁面使用 `HashRouter`，正式 URL 形如 `/#/properties/...`，避免 GitHub Pages 重新整理 404。

## 13. 故障處理

### 單一來源失敗

- 查看 `sync-status.json` 的 `error`。
- 確認是來源端錯誤、TLS、格式異動或網路限制。
- 不要刪除舊資料，也不要把存取失敗標成已售出。
- 修正 connector 後先加 fixture test，再執行完整同步。

### 全來源 stale

- 先確認執行環境能否連外。
- 在正式網路重跑 `scripts/update_data.py`。
- 若仍失敗，保留既有 snapshot，停止部署空資料。

### GitHub Pages 失敗

- 確認 Settings → Pages 的 Source 是 GitHub Actions。
- 查看 `actions/configure-pages`、artifact upload 及 deploy job。
- 確認 `dist/index.html` 存在且 Vite `base` 仍為 `./`。

### 中文亂碼

- 原始碼與 JSON 都使用 UTF-8。
- Windows PowerShell 5 讀檔時要使用 `Get-Content -Encoding UTF8`。
- 臺北市 CSV connector 的原始來源是 Big5，解碼不可任意改成 UTF-8。

## 14. 安全與憑證

- 專案目前不需要 API token。
- 不得把 GitHub token、密碼、私鑰或 `.env` 提交到 Repository。
- 只有可公開的 `VITE_*` 設定才能進入前端；任何 `VITE_*` 值都會被打包給瀏覽器。
- 外部 URL 必須來自可信來源，前端連結使用 `noopener noreferrer`。
- GitHub Actions 維持最小必要權限。

## 15. 已知問題與下一步

優先順序建議：

1. **取得第一個一般房源授權 feed（外部授權阻塞）**：本機工作樹已完成接入工具，但真實自動接入仍為 0。這一項不能只靠程式完成；必須由資料提供方提供合作 API、正式 JSON／CSV 與再利用授權，不能改用未授權爬蟲。阻塞期間不妨礙其他模組開發。
2. **確認本次 GitHub Actions**：本批次推送 `main` 後會觸發 Pages workflow；必須以 Actions 結果及正式網址實測為準。本次不建立新 tag 或 Release。
3. **跨裝置保存**：目前一般房源只存在瀏覽器；若需要帳號同步，必須另行設計身分驗證、資料庫、個資告知與刪除流程。
4. **搜尋效能**：政府完整搜尋仍需載入全部來源分檔；資料量增加後，將篩選運算移至 Web Worker，或建立依縣市／狀態拆分的輕量索引。
5. **現行法拍來源**：持續監看司法院 dataset 22892 是否恢復正式下載端點，不得改用未授權爬蟲。
6. **地圖與實價登錄後續**：實價登錄本期資料、2025 Q1 至 2026 Q3 發布季度趨勢及基礎分析已接入；地圖已用官方行政區界線建立 368 個行政區代表點，但仍沒有門牌級可信座標。更長期趨勢由排程逐季累積，成交價必須持續與開價／底價／拍定價分離。
7. **跨來源去重**：目前只標記候選，不自動合併；新增規則時必須保留來源紀錄及判定依據。

## 16. 交接完成檢查表

- [ ] 能從 `main` 執行 `npm ci` 與 `pip install -r requirements.txt`
- [ ] 五項驗證命令全部通過
- [ ] 理解 `integrated`、`official_link_only`、`research_required` 的差異
- [ ] 理解同步失敗時不得清空舊資料
- [ ] 能手動執行兩個 GitHub Actions workflows
- [ ] 能確認 Pages 與三個資料端點 HTTP 200
- [ ] 新來源已確認官方授權、實際端點及可取得欄位
- [ ] 未提交任何憑證、照片或未授權文案

## 17. 與原始需求的差距稽核（2026-11-05）

### 17.1 整體判定

目前專案是「可運作的政府標售／拍賣 MVP，加上一般房源手動比較工作台、實價分析及行政區地圖」，仍不是最初要求的完整全台不動產聚合平台。

依原始規格的高階功能估算：

- 已完成：約 58–62%。
- 部分完成：約 20–25%。
- 尚未開始或受外部條件阻塞：約 20–25%。
- 若只計算核心「一般房源跨平台比較」，約完成 40–45%。

最大的差距是：9 個民間一般房源來源目前全部為 `official_link_only`，正式自動整合的民間物件仍是 0 筆。一般房源工作台中的資料來自使用者手動輸入或 CSV 匯入，不可描述為房仲資料 feed。

### 17.2 已完成能力

- React、TypeScript、Vite、響應式介面與深淺色模式。
- GitHub Pages 與 GitHub Actions 建置、部署及資料更新 workflow。
- 7 個真正接入的政府資料來源：16,375 筆標售／拍賣、8,838 筆本期實價登錄及 368 個行政區代表座標。
- 統一 Property schema、Pydantic 驗證、來源健康狀態及同步失敗保留舊資料。
- 政府資料搜尋、部分組合篩選、排序、分頁與詳細頁。
- 收藏、最多四筆比較及 CSV 匯出。
- 政府資料保守式疑似重複標記，不自動合併來源紀錄。
- 一般房源手動新增、編輯、收藏、比較、CSV 匯入／匯出、網址去重、欄位完整度及手動改價歷史。
- 一般房源關鍵字、來源、縣市、行政區、價格、坪數、屋齡、房間、衛浴與車位組合篩選，以及排序、分頁及專屬詳細頁。
- 內政部買賣實價登錄官方 CSV connector、獨立 schema、區域成交統計、成交明細及一般房源開價／成交中位數比較。
- dataset 18703 七季歷史 CSV 聚合、全台／縣市／行政區季度中位單價圖，以及清楚標示計算方式的年度加權指標。
- Leaflet 行政區層級地圖、NLSC WMTS 底圖、縣市篩選與目前地圖範圍房源列表。
- 授權合作 feed 的 permission manifest 與欄位權利驗證工具。
- CSP、外部連結安全屬性及一般房源 HTTP(S) 網址驗證。
- 本階段共有 27 項 Python 測試及 28 項前端測試通過；TypeScript、production build、地圖資料與本機 HTTP 預覽驗證通過。

### 17.3 尚未完成或未進行

#### 一般房源真實接入

- 591、永慶、信義、台灣房屋、住商、中信、東森、有巢氏及太平洋皆為 0 筆正式接入。
- 尚未取得任何房仲正式 API、合作 JSON／CSV、欄位再利用授權或照片／文案授權。
- `import_authorized_feed.py` 只負責驗證未來取得的合法 feed，不代表已取得合作資料。

#### 一般房源搜尋仍有限制

一般房源的 LocalStorage 工作台已具備關鍵字與組合篩選、排序、分頁及專屬詳細頁，尚未完成：

- 手動／CSV 資料與未來授權 feed 的持久化統一資料集及索引。
- 樓層、房屋類型、地圖範圍與每坪單價區間等進一步條件。
- 更精細的相似成交條件（建物型態、屋齡、坪數容差）自動套用。

#### 進階搜尋

政府資料搜尋尚缺：

- 地圖範圍、每坪單價、建物／土地坪數範圍、屋齡、樓層、房間、衛浴及車位。
- 使用分區、產權持分、拍賣機關、拍賣次別、拍賣日期範圍、保證金及點交狀態。
- 單價及建物坪數排序。

#### 地圖

- Leaflet、NLSC WMTS 底圖、行政區群組標記、縣市篩選及目前地圖範圍房源列表已完成本機實作。
- 代表點由官方 dataset 7441 鄉鎮市區多邊形計算，共 368 區；介面固定標示「行政區代表點，非物件精確位置」。
- 門牌級可信座標、地址地理編碼與真正的建物半徑搜尋仍未完成；不得把行政區代表點改標為精確位置。
- 尚未建立合法地理編碼、位置精度及快取流程。

#### 實價登錄與分析仍有限制

- 已接入 dataset 25119 本期買賣 CSV，提供區域成交件數、每坪中位數／範圍、成交明細與一般房源開價比較。
- 已有 2025 Q1 至 2026 Q3 發布季度趨勢；尚未涵蓋 2024 年以前歷史，也未建立交易日期季度、重複案件修訂或品質異常的跨期校正。
- 相似成交目前以縣市／行政區及使用者篩選條件為基準，尚未自動建立屋齡、樓層、建物型態與坪數容差模型。
- 頁面已揭露資料期間、比較基準及不確定性；尚未提供估值模型，也不應把中位數描述為估價。

#### 法拍與金拍

- 司法院現行法拍尚未接入；先前確認的 dataset 22892 下載資源失效。
- 台灣金服、金拍屋及公正第三人拍賣仍為官方入口模式。
- 未辦繼承不動產及各地方法院個別 connector 尚未建立。
- 只有通用風險提醒，沒有占用、點交、持分及拍次等結構化風險規則。

#### 去重、價格追蹤與失效判斷

- 一般房源目前只有正規化來源網址去重，沒有地址、社區、座標、樓層、面積與格局的跨來源模糊比對。
- 改價歷史只在使用者手動編輯時記錄，不會自動檢查原站價格。
- 尚無來源下架偵測、刊登失效確認、降價通知或自動價格時間線。

#### 會員、訂閱與通知

- 尚無會員登入、跨裝置同步、私人資料庫、個資告知及刪除流程。
- 尚無關鍵字訂閱、Email／LINE／瀏覽器通知及價格變動通知。

#### 資料更新與效能

- 現有排程以整批同步為主，尚未完成真正的增量更新、ETag／Last-Modified 快取及明確來源版本管理。
- 尚無資料異常主動告警、欄位歷史變動紀錄及外部監控。
- 完整政府搜尋仍需載入所有來源分檔；尚無 Web Worker、縣市索引、列表虛擬化及慢速手機網路基準。

#### 測試與品質

- 尚無正式 Playwright E2E 測試。
- 尚未自動驗證 GitHub Pages 子路由重新整理、手機 viewport、真實 CSV 上傳流程及外部連結存活狀態。
- 尚無完整鍵盤操作、無障礙、Lighthouse、套件弱點及安全掃描報告。

#### 尚未建立的主要頁面

- 法院法拍專頁。
- 行政執行拍賣專頁。
- 金拍屋專頁。
- 各政府標售類別專頁。
- 自動來源價格變動時間線（目前只有使用者手動編輯歷程）。

### 17.4 技術選型差異

- 原始預設為 Tailwind CSS，目前採手寫 CSS design system；差異已在 `ARCHITECTURE.md` 說明。
- Leaflet 已用於行政區層級地圖；因一般房源沒有可信門牌座標，目前只顯示官方界線計算的行政區代表點。

### 17.5 本次統一上傳狀態

- 2026-11-05 批次將一般房源工作台、資料分檔、實價分析、行政區地圖、來源透明度及授權 feed 驗證工具統一推送至 `main`。
- 最新正式 tag 維持 `v1.1.0`；本次只更新分支，不建立 tag 或 GitHub Release。
- 推送會觸發 GitHub Pages workflow，但「程式已推送」不等於「部署已成功」；須另外確認 Actions 與正式網址。
- 本節不保存易失真的未提交檔案數；實際狀態一律以 `git status`、`git log` 及 GitHub Actions 為準。

### 17.6 階段判定

| 階段 | 判定 |
| --- | --- |
| Phase 1 政府標售 MVP | 大致完成 |
| Phase 1 一般房源核心 | 部分完成，已有使用者輸入／CSV、搜尋、詳細頁、收藏與比較，但沒有授權 feed |
| Phase 2 多政府來源 | 部分完成 |
| Phase 2 法拍／金拍 | 大部分未完成 |
| Phase 2 地圖 | 行政區層級已完成；精確座標與門牌地理編碼未完成 |
| Phase 2 CSV／比較 | 已完成本機版 |
| Phase 3 實價分析 | 部分完成：本期成交、七季區域趨勢、明細及開價比較；估值模型與更長歷史未完成 |
| Phase 3 價格與訂閱 | 只有手動改價歷史 |
| Phase 3 通知／會員 | 未開始 |

### 17.7 建議優先順序

1. 確認本次 `main` push 的 GitHub Actions、Pages 正式網址與資料端點。
2. 民間授權 feed 維持外部阻塞標記；取得正式資料與授權後再接入，期間不得改用爬蟲。
3. 研究有明確授權與精度回報的門牌地理編碼來源，再擴充目前的行政區層級地圖。
4. 擴充 2024 年以前實價歷史及交易日期季度分析。
5. 補齊 Playwright E2E、無障礙、效能及安全檢查。
6. 最後再評估會員、訂閱與通知後端。

整體仍有約 9–12 個大型功能模組未完成，其中「一般房源真實授權接入、門牌級可信座標、現行法拍／金拍、會員通知後端」是主要缺口。行政區層級地圖已完成，不等於精確物件定位。
