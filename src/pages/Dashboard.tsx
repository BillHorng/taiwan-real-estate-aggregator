import { ArrowRight, CalendarClock, Database, Gavel, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PropertyCard } from '../components/PropertyCard'
import { useFavorites } from '../hooks/useFavorites'
import { loadDataset } from '../services/data'
import type { Dataset } from '../types/property'

export default function Dashboard() {
  const [dataset, setDataset] = useState<Dataset>()
  const [error, setError] = useState('')
  const { favorites, toggle } = useFavorites()
  useEffect(() => { loadDataset().then(setDataset).catch(error => setError(String(error))) }, [])
  if (error) return <div className="state-panel error"><h1>資料暫時無法載入</h1><p>{error}</p></div>
  if (!dataset) return <div className="state-panel"><span className="loader"/>正在載入官方資料…</div>
  const upcoming = dataset.records.filter(item => item.listing_status === 'upcoming')
  const completed = dataset.records.filter(item => item.final_price != null)
  const sources = new Set(dataset.records.map(item => item.source_id)).size
  const counties = new Set(dataset.records.map(item => item.county).filter(Boolean)).size
  const totalValue = dataset.records.reduce((sum, item) => sum + (item.final_price ?? item.reserve_price ?? 0), 0)
  return <>
    <section className="hero">
      <div><span className="eyebrow accent">PUBLIC DATA · TRACEABLE SOURCES</span><h1>把散落的標售資訊，<br/><em>整理成決策視野。</em></h1><p>以可追溯的政府開放資料，統一整理標的、底價、日期與官方公告。沒有來源，就不下結論。</p><div className="hero-actions"><Link className="primary-button" to="/properties">探索標售物件<ArrowRight/></Link><Link className="text-link" to="/sources">查看資料透明度</Link></div></div>
      <div className="hero-orbit"><div className="orbit core"><Gavel/></div><div className="orbit ring-one"/><div className="orbit ring-two"/><span className="orbit-label one">來源可追溯</span><span className="orbit-label two">欄位不推測</span><span className="orbit-label three">定期同步</span></div>
    </section>
    <section className="metrics">
      <article><span><Database/></span><div><small>官方資料／來源</small><strong>{dataset.records.length.toLocaleString()} / {sources}</strong></div></article>
      <article><span><CalendarClock/></span><div><small>待開標案件</small><strong>{upcoming.length.toLocaleString()}</strong></div></article>
      <article><span><ShieldCheck/></span><div><small>已拍定歷史紀錄</small><strong>{completed.length.toLocaleString()}</strong></div></article>
      <article><span>NT$</span><div><small>底價／拍定價合計</small><strong>{(totalValue / 100000000).toFixed(1)} 億</strong></div></article>
    </section>
    <section className="section-heading"><div><span className="eyebrow">UPCOMING AUCTIONS</span><h2>近期開標</h2><p>依官方資料所載開標日期排序</p></div><Link to="/properties">查看全部 <ArrowRight size={17}/></Link></section>
    <div className="property-grid">{upcoming.slice(0, 6).map(item => <PropertyCard key={item.id} property={item} favorite={favorites.includes(item.id)} onFavorite={() => toggle(item.id)}/>)}</div>
    <section className="data-banner"><div><Database/><span><strong>多來源資料快照</strong><small>產製時間 {new Date(dataset.generated_at).toLocaleString('zh-TW')} · {sources} 個已驗證官方來源 · 涵蓋 {counties} 縣市</small></span></div><Link to="/sources">檢視同步與限制 <ArrowRight size={17}/></Link></section>
  </>
}
