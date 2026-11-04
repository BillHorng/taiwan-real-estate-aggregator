// One-time/offline snapshot builder for environments without Python.
// Production updates use scripts/update_data.py.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const [existingPath, mojPath, botPath, taipeiPath, outputPath = existingPath] = process.argv.slice(2)
if (!existingPath || !mojPath || !botPath || !taipeiPath) throw new Error('Usage: node bootstrap_phase2.mjs existing.json moj.json bot.json taipei.csv [output.json]')
const existing = JSON.parse(readFileSync(existingPath, 'utf8'))
const mojRows = JSON.parse(readFileSync(mojPath, 'utf8').replace(/^\uFEFF/, ''))
const botPayload = JSON.parse(readFileSync(botPath, 'utf8'))
const botRows = botPayload?.result?.records
const csvText = new TextDecoder('big5').decode(readFileSync(taipeiPath))
const parseCsv = text => { const rows=[]; let row=[], field='', quoted=false; for(let i=0;i<text.length;i++){ const char=text[i]; if(char==='"'){ if(quoted&&text[i+1]==='"'){field+='"';i++}else quoted=!quoted } else if(char===','&&!quoted){row.push(field);field=''} else if((char==='\n'||char==='\r')&&!quoted){ if(char==='\r'&&text[i+1]==='\n')i++; row.push(field); if(row.some(Boolean))rows.push(row); row=[];field='' } else field+=char } if(field||row.length){row.push(field);rows.push(row)} return rows }
const taipeiRows = parseCsv(csvText).slice(1)
if (!Array.isArray(mojRows) || !Array.isArray(botRows) || !taipeiRows.length) throw new Error('Unexpected official source payload')
const syncedAt = new Date().toISOString()
const number = value => value == null || value === '' || Number.isNaN(Number(String(value).replaceAll(',', ''))) ? null : Number(String(value).replaceAll(',', ''))
const digest = value => createHash('sha256').update(value).digest('hex').slice(0, 20)
const rocDate = value => { const parts = String(value ?? '').split('/').map(Number); return parts.length === 3 && parts.every(Number.isFinite) ? `${parts[0] + 1911}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}` : null }
const compactRocDate = value => { const digits=String(value??'').replace(/\D/g,''); return digits.length===7 ? `${Number(digits.slice(0,3))+1911}-${digits.slice(3,5)}-${digits.slice(5)}` : null }
const geography = value => String(value ?? '').replace(/^土地：/, '').match(/^(.+?[縣市])(.+?[區鄉鎮市])/)?.slice(1, 3) ?? [null, null]

const fnp = existing.records.filter(item => item.source_id === 'fnp-9655').map(item => ({ ...item, final_price: null, duplicate_group_id: null }))
const moj = mojRows.map(row => {
  const caseNumber = ['執行案號-年度', '執行案號-案件種類代碼', '執行案號-流水號'].map(key => row[key] ?? '').join('')
  const address = String(row['地址'] ?? '').trim() || null
  const parcel = String(row['地號'] ?? '').trim()
  const title = address || parcel || `行政執行拍賣紀錄 ${caseNumber}`
  const id = digest([caseNumber, row['標別'] ?? '', title, row['地號'] ?? '', row['面積-平方公尺'] ?? '', row['拍賣底價'] ?? '', row['拍定金額'] ?? '', row['拍定日期'] ?? ''].join('|'))
  const areaSqm = number(row['面積-平方公尺']); const areaPing = number(row['面積-坪']) ?? (areaSqm == null ? null : Math.round(areaSqm * .3025 * 10000) / 10000)
  const reserve = number(row['拍賣底價']); const finalPrice = number(row['拍定金額'])
  const present = [address, row['縣市'], row['鄉鎮區'], reserve, finalPrice, areaPing, row['拍定日期'], row['網址']].filter(value => value != null && value !== '').length
  return { id:`moj-${id}`, source_id:'moj-enforcement-177351', source_name:'法務部行政執行署', source_url:row['網址'] || 'https://data.gov.tw/dataset/177351', external_listing_id:id, title, description:null,
    property_category:row['拍賣類別'] === '土地' ? 'land' : 'unknown', transaction_type:'auction', county:row['縣市'] || null, district:row['鄉鎮區'] || null, address:address || parcel || null,
    address_precision:parcel ? 'land_parcel' : row['鄉鎮區'] ? 'district' : 'unknown', latitude:null, longitude:null, location_precision:'none', total_price:finalPrice,
    unit_price:finalPrice && areaPing ? Math.round(finalPrice / areaPing * 100) / 100 : null, building_area_ping:null, land_area_ping:areaPing, building_age:null, floor:null, rooms:null, bathrooms:null, parking:null,
    auction_type:row['拍賣類別'] || '行政執行拍賣', auction_round:null, auction_date:rocDate(row['拍定日期']), reserve_price:reserve, final_price:finalPrice, deposit:null, case_number:caseNumber || null,
    ownership_share:null, handover_status:null, listing_status:'ended', first_seen_at:syncedAt, last_seen_at:syncedAt, last_verified_at:syncedAt, source_updated_at:null,
    data_quality_score:Math.round(present / 8 * 1000) / 1000, duplicate_group_id:null, source_details:{ agency:row['分署別'] ?? null, division:row['股別'] ?? null, sale_label:row['標別'] ?? null, purpose:row['用途'] ?? null, auction_round_text:row['拍次'] ?? null, dataset_url:'https://data.gov.tw/dataset/177351' } }
})
const bot = botRows.map(row => {
  const mark = String(row['不動產標示'] ?? '').trim(); const [county, district] = geography(mark); const id = digest([row['年度批號'] ?? '', row['編號'] ?? '', mark].join('|'))
  const landSqm=number(row['土地持分面積[平方公尺]']); const buildingSqm=number(row['建物持分面積[平方公尺]']); const reserve=number(row['標售底價[新台幣元]'])
  const year = String(row['年度批號'] ?? '').match(/(\d{3})年度/)?.[1]
  return { id:`bot-${id}`, source_id:'bot-37335', source_name:'臺灣銀行', source_url:'https://data.gov.tw/dataset/37335', external_listing_id:id, title:mark || '臺灣銀行不動產標售', description:row['備註'] || null,
    property_category:landSqm && buildingSqm ? 'mixed' : buildingSqm ? 'building' : landSqm ? 'land' : 'unknown', transaction_type:'government_sale', county, district, address:mark || null,
    address_precision:mark ? 'land_parcel':'unknown', latitude:null, longitude:null, location_precision:'none', total_price:reserve, unit_price:reserve && (landSqm || buildingSqm) ? Math.round(reserve / ((landSqm || buildingSqm) * .3025) * 100) / 100:null,
    building_area_ping:buildingSqm == null ? null : Math.round(buildingSqm*.3025*10000)/10000, land_area_ping:landSqm == null ? null : Math.round(landSqm*.3025*10000)/10000,
    building_age:null, floor:null, rooms:null, bathrooms:null, parking:null, auction_type:'臺灣銀行不動產標售', auction_round:null, auction_date:null, reserve_price:reserve, final_price:null,
    deposit:number(row['保證金金額[新台幣元]']), case_number:String(row['編號'] ?? '') || null, ownership_share:null, handover_status:null, listing_status:'ended', first_seen_at:syncedAt, last_seen_at:syncedAt,
    last_verified_at:syncedAt, source_updated_at:year ? `${Number(year)+1911}-01-01`:null, data_quality_score:.75, duplicate_group_id:null,
    source_details:{agency:'臺灣銀行股份有限公司', batch:row['年度批號'] ?? null, use:row['使用分區[僅供參考]'] ?? null, dataset_url:'https://data.gov.tw/dataset/37335'} }
})

const taipei = taipeiRows.filter(row => row[9] !== '標租').map(row => {
  const [announcementDate,tenderName,landMark,landAreaValue,buildingMark,buildingAreaValue,addressValue,reserveValue,finalValue,outcome] = row
  const address=String(addressValue??'').trim()||null; const mark=[landMark,buildingMark].filter(Boolean).join('、'); const id=digest([announcementDate,tenderName,landMark,buildingMark,address].join('|'))
  const landSqm=number(landAreaValue), buildingSqm=number(buildingAreaValue), reserve=number(reserveValue), finalPrice=number(finalValue)
  const district=(address||mark).match(/([\u4e00-\u9fff]{2,4}區)/)?.[1]??null
  const status=outcome==='招標中'?'upcoming':['已標脫','再標售'].includes(outcome)?'ended':'unknown'
  const present=[address,mark,landSqm,buildingSqm,reserve,announcementDate,tenderName,outcome].filter(value=>value!=null&&value!=='').length
  return { id:`taipei-${id}`,source_id:'taipei-finance-121364',source_name:'臺北市政府財政局',source_url:'https://data.gov.tw/dataset/121364',external_listing_id:id,title:address||mark||tenderName||'臺北市市有房地標售',description:tenderName||null,
    property_category:landSqm&&buildingSqm?'mixed':buildingSqm?'building':landSqm?'land':'unknown',transaction_type:'government_sale',county:'臺北市',district,address:address||mark||null,address_precision:mark?'land_parcel':address?'district':'unknown',
    latitude:null,longitude:null,location_precision:'none',total_price:finalPrice||reserve,unit_price:(finalPrice||reserve)&&(buildingSqm||landSqm)?Math.round((finalPrice||reserve)/((buildingSqm||landSqm)*.3025)*100)/100:null,
    building_area_ping:buildingSqm==null?null:Math.round(buildingSqm*.3025*10000)/10000,land_area_ping:landSqm==null?null:Math.round(landSqm*.3025*10000)/10000,building_age:null,floor:null,rooms:null,bathrooms:null,parking:null,
    auction_type:'臺北市市有房地公開標售',auction_round:null,auction_date:null,reserve_price:reserve,final_price:finalPrice,deposit:null,case_number:null,ownership_share:null,handover_status:null,listing_status:status,
    first_seen_at:syncedAt,last_seen_at:syncedAt,last_verified_at:syncedAt,source_updated_at:compactRocDate(announcementDate),data_quality_score:Math.round(present/8*1000)/1000,duplicate_group_id:null,
    source_details:{agency:'臺北市政府財政局',land_mark:landMark||null,building_mark:buildingMark||null,outcome:outcome||null,dataset_url:'https://data.gov.tw/dataset/121364'} }
})

const records = [...fnp, ...moj, ...bot, ...taipei]
const groups = new Map()
for (const item of records) {
  const address = String(item.address ?? '').replace(/[\s－-]|土地：/g, '')
  const area = item.land_area_ping ?? item.building_area_ping; const price = item.reserve_price ?? item.final_price
  if (!address || !area || !price) continue
  const key = `${address}|${Math.round(area * 10) / 10}|${Math.round(price / 1000) * 1000}`
  groups.set(key, [...(groups.get(key) ?? []), item])
}
for (const [key, items] of groups) if (items.length > 1) for (const item of items) item.duplicate_group_id = `dup-${digest(key).slice(0, 12)}`
const idTotals = new Map(); const idSeen = new Map()
for (const item of records) idTotals.set(item.id, (idTotals.get(item.id) ?? 0) + 1)
for (const item of records) if (idTotals.get(item.id) > 1) { const original=item.id; const ordinal=(idSeen.get(original) ?? 0)+1; idSeen.set(original, ordinal); item.id=`${original}-${ordinal}`; item.duplicate_group_id ||= `dup-${original.split('-').at(-1).slice(0,12)}` }
const payload = { schema_version:'2.1.0', generated_at:syncedAt, source_attribution:'財政部國有財產署、法務部行政執行署、臺灣銀行、臺北市政府財政局（政府資料開放授權條款第1版）', records }
writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8')
console.log(JSON.stringify({fnp:fnp.length, moj:moj.length, bot:bot.length, taipei:taipei.length, total:records.length, duplicates:records.filter(item => item.duplicate_group_id).length}))
