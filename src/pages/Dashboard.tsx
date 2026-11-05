import { ArrowRight, Database, GitCompareArrows, HousePlus, Link2, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PropertyCard } from '../components/PropertyCard'
import { useCompare } from '../hooks/useCompare'
import { useFavorites } from '../hooks/useFavorites'
import { useUserListings } from '../hooks/useUserListings'
import { loadCurrentDataset, loadDatasetManifest, loadSourceRegistry } from '../services/data'
import type { Dataset, DatasetManifest } from '../types/property'

export default function Dashboard() {
  const [dataset, setDataset] = useState<Dataset>()
  const [manifest, setManifest] = useState<DatasetManifest>()
  const [generalSourceCount, setGeneralSourceCount] = useState(0)
  const [secondaryError, setSecondaryError] = useState('')
  const { listings } = useUserListings()
  const { compareIds } = useCompare()
  const { favorites, toggle } = useFavorites()

  useEffect(() => {
    loadSourceRegistry().then(registry => setGeneralSourceCount(registry.sources.filter((source: { data_type: string[] }) => source.data_type.includes('一般房源')).length)).catch(() => setGeneralSourceCount(0))
    Promise.all([loadCurrentDataset(), loadDatasetManifest()]).then(([current, index]) => { setDataset(current); setManifest(index) }).catch(error => setSecondaryError(String(error)))
  }, [])

  const upcoming = (dataset?.records ?? []).filter(item => item.listing_status === 'upcoming').sort((a, b) => (a.auction_date ?? '9999').localeCompare(b.auction_date ?? '9999'))
  const selectedGeneralCount = compareIds.filter(id => listings.some(item => item.id === id)).length

  return <>
    <section className="hero general-hero">
      <div><span className="eyebrow accent">COMPARE HOMES · KEEP THE SOURCE</span><h1>跨網站整理房源，<br/><em>把比較放回中心。</em></h1><p>將不同房仲網站看到的候選物件放進同一個比較工作台，對照總價、單價、坪數、屋齡與格局，同時保留原始頁面供你查證。</p><div className="hero-actions"><Link className="primary-button" to="/general-listings">開始整理一般房源<ArrowRight/></Link><Link className="text-link" to="/compare">開啟比較表</Link></div></div>
      <div className="hero-orbit"><div className="orbit core"><GitCompareArrows/></div><div className="orbit ring-one"/><div className="orbit ring-two"/><span className="orbit-label one">來源網址保留</span><span className="orbit-label two">資料存在本機</span><span className="orbit-label three">欄位並排比較</span></div>
    </section>
    <section className="metrics general-metrics">
      <article><span><HousePlus/></span><div><small>我的候選房源</small><strong>{listings.length}</strong></div></article>
      <article><span><GitCompareArrows/></span><div><small>已選比較</small><strong>{selectedGeneralCount} / 4</strong></div></article>
      <article><span><Link2/></span><div><small>一般房源官方入口</small><strong>{generalSourceCount || '—'}</strong></div></article>
      <article><span><ShieldCheck/></span><div><small>授權自動接入</small><strong>0</strong></div></article>
    </section>
    <section className="section-heading"><div><span className="eyebrow">HOW IT WORKS</span><h2>三步建立你的比較清單</h2><p>不等待資料合作，也不使用未授權擷取</p></div></section>
    <section className="comparison-steps">
      <article><span>01</span><HousePlus/><h3>加入候選房源</h3><p>貼上原始網址，輸入價格、坪數與格局等主要條件。</p></article>
      <article><span>02</span><GitCompareArrows/><h3>選擇最多四筆</h3><p>從不同來源挑選候選物件，加入同一張比較表。</p></article>
      <article><span>03</span><ShieldCheck/><h3>回原站查證</h3><p>比較協助決策，物件狀態與內容仍以原始刊登為準。</p></article>
    </section>
    <section className="section-heading secondary-section"><div><span className="eyebrow">SECONDARY PUBLIC DATA MODULE</span><h2>政府標售與拍賣</h2><p>保留既有官方資料，但不再作為產品主軸</p></div><Link to="/properties">查看標售拍賣 <ArrowRight size={17}/></Link></section>
    {secondaryError ? <div className="state-panel error"><p>政府資料模組暫時無法載入：{secondaryError}</p></div> : !dataset ? <div className="state-panel"><span className="loader"/>正在載入政府資料模組…</div> : <div className="property-grid">{upcoming.slice(0, 3).map(item => <PropertyCard key={item.id} property={item} favorite={favorites.includes(item.id)} onFavorite={() => toggle(item.id)}/>)}</div>}
    {manifest && <section className="data-banner"><div><Database/><span><strong>政府公開資料模組</strong><small>{manifest.summary.records.toLocaleString()} 筆標售／拍賣紀錄 · 產製時間 {new Date(manifest.generated_at).toLocaleString('zh-TW')}</small></span></div><Link to="/sources">檢視資料來源 <ArrowRight size={17}/></Link></section>}
  </>
}
