# Taiwan Real Estate Aggregator 交接手冊

- 最後更新：2026-11-04
- 交接基準：`v1.1.0` / commit `e509c70`
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
| 應用版本 | `1.1.0` |
| 資料 schema | `2.3.0` |
| 正式分支 | `main` |
| 最近正式 tag | `v1.1.0` |
| Repository visibility | Public |
| GitHub Pages | 已啟用，來源為 GitHub Actions |
| 快照紀錄 | 16,375 筆 |
| 已整合來源 | 5 個 |
| 快照大小 | 約 23.32 MiB（緊湊 JSON） |
| Python tests | 15 項 |
| Frontend tests | 5 項 |

以上筆數是 2026-11-04 快照，不是固定契約。正式數量應以 `public/data/properties.json` 與 `public/data/sync-status.json` 為準。

## 3. 系統資料流

```text
官方開放資料
  -> scripts/connectors/*
  -> scripts/normalize/*
  -> conservative duplicate marking
  -> Pydantic Property validation
  -> public/data/properties.json
  -> React client-side search
  -> GitHub Pages
```

同步器對每個來源獨立執行。來源成功時使用新資料；失敗時保留該來源上一次有效資料並標記 `stale`。所有來源都失敗且完全沒有舊快照時才中止，不產生空資料集。

## 4. 目錄與責任範圍

| 路徑 | 用途 |
| --- | --- |
| `src/pages/` | Dashboard、搜尋、詳細頁、收藏、比較與來源狀態 |
| `src/components/` | 導覽、物件卡片、篩選器 |
| `src/services/data.ts` | 靜態 JSON 載入與瀏覽器內快取 |
| `src/types/property.ts` | 前端 Property、Dataset、SyncStatus 型別 |
| `src/utils/property.ts` | 價格／日期格式化、搜尋、篩選及排序 |
| `scripts/connectors/` | 只負責合法下載與來源格式初步展平 |
| `scripts/normalize/` | 來源欄位映射、日期／坪數／狀態標準化 |
| `scripts/validate/models.py` | 完整 Property Pydantic schema |
| `scripts/update_data.py` | 五來源協調、容錯、去重標記、原子寫入與健康紀錄 |
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

國產署結果資料採「一個標號一筆 Property」。同標號若包含多筆土地或建物，保留在同一筆來源明細內，避免同一底價／得標價被重複計算。

來源詳細授權與端點請查閱 [DATA_SOURCES.md](DATA_SOURCES.md) 及 `public/data/source-registry.json`。

## 6. 尚未整合來源與法律邊界

- 司法院 dataset 22892 的中繼資料仍存在，但 2026-11-04 實測 Fileset 只回傳說明文字，`Foreclosure.json` 回傳 HTTP 404，因此狀態為 `research_required`。
- 台灣金服與民間房仲尚未取得正式 API 或合作授權，只能使用官方連結模式。
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
- pytest：15 passed
- Vitest：5 passed
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

1. **資料分檔與延遲載入**：`properties.json` 約 23.32 MiB，公開站完整下載與 PowerShell 解析實測約 8.26 秒；手機網路可能更慢。先拆分目前案件與歷史結果，再做摘要 index。
2. **搜尋效能**：資料量增加後，將篩選運算移至 Web Worker 或建立輕量索引。
3. **現行法拍來源**：持續監看司法院 dataset 22892 是否恢復正式下載端點，不得改用未授權爬蟲。
4. **地圖**：只有取得合法且可靠座標後才加入 Leaflet；不得虛構標記。
5. **實價登錄**：確認批次下載授權與更新流程後，成交價必須與開價／底價／拍定價分離。
6. **跨來源去重**：目前只標記候選，不自動合併；新增規則時必須保留來源紀錄及判定依據。

## 16. 交接完成檢查表

- [ ] 能從 `main` 執行 `npm ci` 與 `pip install -r requirements.txt`
- [ ] 五項驗證命令全部通過
- [ ] 理解 `integrated`、`official_link_only`、`research_required` 的差異
- [ ] 理解同步失敗時不得清空舊資料
- [ ] 能手動執行兩個 GitHub Actions workflows
- [ ] 能確認 Pages 與三個資料端點 HTTP 200
- [ ] 新來源已確認官方授權、實際端點及可取得欄位
- [ ] 未提交任何憑證、照片或未授權文案
