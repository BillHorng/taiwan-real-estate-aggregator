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

## Registry policy

`public/data/source-registry.json` records researched candidates. `integrated` means a real connector produced and validated the committed snapshot. `official_link_only` means the project has no permission or reliable supported interface for automated ingestion. `research_required` is not a claim of permission.

Source failure must not imply a sale or completed auction. FNP status derives only from the stop flag and published bid date; an elapsed date is labeled “ended”, not “sold”. Administrative Enforcement Agency rows include an explicit final price and are labeled completed results.
