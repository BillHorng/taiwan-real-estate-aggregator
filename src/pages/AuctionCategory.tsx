import { AlertTriangle, ExternalLink, Gavel, Landmark, Scale } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PropertyCard } from '../components/PropertyCard'
import { useFavorites } from '../hooks/useFavorites'
import { loadDataset } from '../services/data'
import type { Property } from '../types/property'

type Kind = 'judicial' | 'enforcement' | 'financial'
const configs = {
  judicial: { title:'法院法拍', eyebrow:'JUDICIAL FORECLOSURE', icon:Scale, url:'https://aomp.judicial.gov.tw/abbs/wkw/WHD2A00.jsp', sourceId:'', status:'官方資料端點待恢復', description:'司法院 dataset 22892 的下載資源目前失效，因此不展示推測或過期案件。', records:'目前 0 筆正式接入' },
  enforcement: { title:'行政執行拍賣', eyebrow:'ADMINISTRATIVE ENFORCEMENT', icon:Gavel, url:'https://www.tpkonsale.moj.gov.tw/', sourceId:'moj-enforcement-177351', status:'已接入歷史拍定結果', description:'目前資料是行政執行署已拍定歷史紀錄，不是仍可投標的待拍清單。', records:'2,319 筆歷史拍定紀錄' },
  financial: { title:'金拍屋與公正第三人拍賣', eyebrow:'FINANCIAL ASSET AUCTION', icon:Landmark, url:'https://www.tfasc.com.tw/', sourceId:'', status:'官方連結模式', description:'台灣金服尚未提供本專案可合法自動整合的正式 feed，請由官方入口查詢。', records:'目前 0 筆正式接入' },
} as const

export default function AuctionCategory({ kind }: { kind: Kind }) {
  const config = configs[kind]
  const Icon = config.icon
  const [items, setItems] = useState<Property[]>([])
  const [error, setError] = useState('')
  const { favorites, toggle } = useFavorites()
  useEffect(() => {
    if (!config.sourceId) return
    loadDataset().then(data => setItems(data.records.filter(item => item.source_id === config.sourceId))).catch(reason => setError(String(reason)))
  }, [config.sourceId])
  return <>
    <section className="page-header"><span className="eyebrow accent">{config.eyebrow}</span><h1>{config.title}</h1><p>{config.description}</p></section>
    <section className="auction-source-status"><Icon/><div><strong>{config.status}</strong><span>{config.records}</span></div><a href={config.url} target="_blank" rel="noopener noreferrer">開啟官方入口 <ExternalLink/></a></section>
    <section className="auction-risk-panel"><AlertTriangle/><div><strong>投標前必須自行確認</strong><p>點交、占用、持分、拍次、保證金、權利瑕疵與最新拍賣日期只有官方公告可以確認。來源沒有提供的欄位一律視為未確認。</p></div></section>
    {error ? <div className="state-panel error">{error}</div> : config.sourceId && items.length ? <><div className="result-bar"><strong>{items.length.toLocaleString()} 筆歷史資料</strong><Link to="/properties">使用完整進階搜尋</Link></div><div className="property-grid">{items.slice(0, 24).map(item => <PropertyCard key={item.id} property={item} favorite={favorites.includes(item.id)} onFavorite={() => toggle(item.id)}/>)}</div>{items.length > 24 && <p className="category-more-note">此專頁先顯示 24 筆；完整 {items.length.toLocaleString()} 筆請使用政府標售與拍賣搜尋。</p>}</> : <div className="state-panel compact-state"><Icon/><h2>沒有可合法展示的案件資料</h2><p>保留官方入口與接入狀態，不以示範資料冒充即時案件。</p></div>}
  </>
}
