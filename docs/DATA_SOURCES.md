# Data sources

## Integrated: National Property Administration dataset 9655

- Dataset: 國有非公用財產標售不動產資訊
- Publisher: 財政部國有財產署
- Registry: <https://data.gov.tw/dataset/9655>
- OAS document: <https://od.fnp.gov.tw/swagger/v1/swagger.json>
- Endpoint: `https://od.fnp.gov.tw/api/Json/9655`
- License: 政府資料開放授權條款第 1 版; attribution is mandatory.
- Published frequency: irregular.

The connector stores no protected listing photos. The source's image-reference field is retained as provenance metadata only and is not rendered.

## Integrated: National Property Administration tender results dataset 13144

- Dataset: 國有非公用財產標售不動產開標結果
- Registry: <https://data.gov.tw/dataset/13144>
- Official JSON resource: `https://esvc.fnp.gov.tw/openDataSource?area=all&format=json&source=CftResult`
- License: 政府資料開放授權條款第 1 版
- Snapshot: 13,335 tender-result rows from 896 official bulletins

One normalized record represents one tender number. If a tender number contains several land or building entries, their provenance is retained together instead of duplicating the same reserve and awarded price across several property rows. `reserve_price` and `final_price` remain separate; an empty awarded price is not treated as a sale.

## Integrated: Administrative Enforcement Agency dataset 177351

- Dataset: 115年至第一季止所屬分署已拍定不動產
- Registry: <https://data.gov.tw/dataset/177351>
- License: 政府資料開放授權條款第 1 版
- Snapshot: 2,319 cumulative completed-auction records

These records are historical auction results, not currently purchasable listings. `final_price` and `reserve_price` remain separate.

## Integrated: Bank of Taiwan dataset 37335

- Dataset: 臺灣銀行不動產標售公告
- Registry: <https://data.gov.tw/dataset/37335>
- Endpoint: `https://govdata.bot.com.tw/37335/2`
- License: 政府資料開放授權條款第 1 版

The endpoint currently returns one 2019 historical announcement. It is retained for source transparency and labeled ended.

## Judicial auction dataset: confirmed metadata, unavailable resource

The former Judicial Yuan auction datasets 45094 and 49108 were retired, but the Judicial Yuan now lists dataset 22892, `法拍屋動產及不動產待拍公告資料集`, under Open Government Data License 1.0. Its metadata API currently reports fileSetId 31675 and describes case, sale-date, address, area, rights, and reserve-price fields.

The resource is not integrated yet: on 2026-11-04, the Fileset API returned only explanatory text and the listed `Foreclosure.json` URL returned HTTP 404. The project therefore records this source as `research_required`, links to the official dataset, and does not scrape the interactive auction application or present stale retired data as current listings.

## Integrated: Taipei Department of Finance dataset 121364

- Dataset: 臺北市政府財政局經管市有閒置房地公開標售清冊
- Registry: <https://data.gov.tw/dataset/121364>
- Format: official data.taipei Big5 CSV
- License: 政府資料開放授權條款第 1 版
- Snapshot: 275 raw rows; 270 sale rows after excluding five lease records

Only the ten rows explicitly marked `招標中` are treated as upcoming. Rows marked `再標售` are historical records without a verified future bid date and remain ended instead of being guessed active.

## Integrated: MOI real-price registration dataset 25119

- Dataset: 本期發布之不動產買賣實價登錄批次資料
- Publisher: 內政部地政司
- Registry: <https://data.gov.tw/dataset/25119>
- Official CSV ZIP: `https://plvr.land.moi.gov.tw/opendata/lvr_landAcsv.zip`
- License: 政府資料開放授權條款第 1 版; attribution is mandatory.
- Official release schedule: each month on the 1st, 11th, and 21st.

The connector reads the archive manifest and every county main CSV, skips the embedded English-label row, converts ROC dates and square metres, and validates records with a dedicated `RealPriceRecord` model. The generated `real-price.json` is intentionally separate from purchasable `Property` records: reported transaction price is historical evidence, not an asking price or available listing. The first verified local snapshot contains 8,838 records across 21 counties for the official period published on 2026-11-01.

Historical trends use MOI dataset 18703, `非本期發布之實價批次資料`, also licensed under the Open Government Data License 1.0. The pipeline reads only the completed-building sale main files from each official quarterly archive. It does not commit the large source ZIPs or historical transaction rows. Instead, `real-price-history.json` contains validated aggregates at national, county, and district levels by building type. The current local series covers 2024 Q1 through 2026 Q3: 11 official quarters were reduced to 15,122 validated trend points.

## Integrated: NLSC township boundaries (dataset 7441)

- Registry: <https://data.gov.tw/dataset/7441>
- Publisher: 內政部國土測繪中心
- Download: official `鄉鎮市區界線(TWD97經緯度).zip`
- License: 政府資料開放授權條款第 1 版
- Output: `public/data/admin-centroids.json` (368 administrative areas)
- Interactive map: Google Maps JavaScript API, loaded directly by the browser with a restricted browser key; NLSC data is used only for the committed district representative coordinates

The connector selects the nationwide TOWN shapefile (the archive also contains a one-record correction layer), computes polygon centroids, validates Taiwan coordinate bounds and writes only district-level representative points. These points are not property coordinates and are always labelled accordingly in the UI.

Trend labels refer to the official **publication quarter**, not necessarily the transaction quarter. The yearly indicator is a sample-count-weighted average of quarterly medians and is explicitly not presented as an exact annual transaction median.

## Registry policy

`public/data/source-registry.json` records researched candidates. `integrated` means a real connector produced and validated the committed snapshot. `official_link_only` means the project has no permission or reliable supported interface for automated ingestion. `research_required` is not a claim of permission.

Source failure must not imply a sale or completed auction. FNP status derives only from the stop flag and published bid date; an elapsed date is labeled “ended”, not “sold”. Administrative Enforcement Agency rows include an explicit final price and are labeled completed results.

## Private-market listing coverage

The registry includes nine general-listing services: 591, 永慶房屋, 信義房屋, 台灣房屋, 住商不動產, 中信房屋, 東森房屋, 有巢氏房屋, and 太平洋房屋. None currently provides this project with a licensed API, download, or cooperation feed, so all nine are `official_link_only` and contribute zero records to the unified search.

Official pages were rechecked on 2026-11-04. In particular, the current Taiwan Realty entry is `https://www.twhg.com.tw/`; the similarly named `taiwanhouse.com.tw` is not used. See `GENERAL_LISTING_ONBOARDING.md` for the evidence and validation required before a private source can be marked integrated.
