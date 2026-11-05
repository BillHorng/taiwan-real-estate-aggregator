import { ArrowLeft, ExternalLink, GitCompareArrows, Heart, MapPin, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useCompare } from '../hooks/useCompare'
import { useFavorites } from '../hooks/useFavorites'
import { listingCompleteness, useUserListings } from '../hooks/useUserListings'
import { formatCurrency, formatPing } from '../utils/property'

export default function GeneralListingDetail() {
  const { id } = useParams()
  const { listings } = useUserListings()
  const { favorites, toggle: toggleFavorite } = useFavorites()
  const { compareIds, toggleCompare, isFull } = useCompare()
  const item = listings.find(listing => listing.id === id)

  if (!item) return <div className="state-panel"><h1>找不到這筆一般房源</h1><p>這筆資料可能已從目前瀏覽器移除，或網址不正確。</p><Link className="primary-button" to="/general-listings">返回一般房源</Link></div>

  const favorite = favorites.includes(item.id)
  const selected = compareIds.includes(item.id)
  const location = [item.county, item.district, item.address].filter(Boolean).join(' ') || '地點未填寫'
  const details = [
    ['建物面積', formatPing(item.building_area_ping)],
    ['每坪單價', formatCurrency(item.unit_price)],
    ['屋齡', item.building_age == null ? '未提供' : `${item.building_age} 年`],
    ['房間', item.rooms == null ? '未提供' : `${item.rooms} 房`],
    ['衛浴', item.bathrooms == null ? '未提供' : `${item.bathrooms} 衛`],
    ['車位', item.parking || '未提供'],
    ['資料完整度', `${listingCompleteness(item)}%`],
    ['最後編輯', new Date(item.last_seen_at).toLocaleString('zh-TW')],
  ]
  const history = [...(item.price_history ?? [])].reverse()

  return <>
    <Link className="back-link" to="/general-listings"><ArrowLeft/>返回一般房源搜尋</Link>
    <section className="detail-header general-detail-header"><div><div className="card-meta"><span className="source-pill">{item.source_name}</span><span className="local-pill">瀏覽器本機資料</span></div><h1>{item.title}</h1><p><MapPin size={17}/>{location}</p></div><div className="detail-actions"><button className={favorite ? 'favorite active large' : 'favorite large'} onClick={() => toggleFavorite(item.id)}><Heart fill={favorite ? 'currentColor' : 'none'}/>{favorite ? '已收藏' : '加入收藏'}</button><button className={selected ? 'compare-button active detail-compare' : 'compare-button detail-compare'} disabled={!selected && isFull} onClick={() => toggleCompare(item.id)}><GitCompareArrows/>{selected ? '已加入比較' : '加入比較'}</button></div></section>
    <div className="detail-layout"><div>
      <section className="price-panel"><div><small>一般房源開價（非成交價）</small><strong>{formatCurrency(item.total_price)}</strong></div><div><small>每坪開價</small><strong>{formatCurrency(item.unit_price)}</strong></div></section>
      <section className="content-panel"><h2>房源資訊</h2><div className="detail-grid">{details.map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div></section>
      <section className="content-panel"><h2>手動價格歷程</h2>{history.length ? <ol className="price-history">{history.map((entry, index) => <li key={`${entry.recorded_at}-${index}`}><div><strong>{formatCurrency(entry.price)}</strong><small>{new Date(entry.recorded_at).toLocaleString('zh-TW')}</small></div>{index === history.length - 1 ? <span>最初記錄</span> : index === 0 ? <span className="current">目前開價</span> : null}</li>)}</ol> : <p className="description">尚未記錄價格。編輯房源並填入開價後，系統會在此保存本機價格歷程。</p>}</section>
      <section className="local-data-notice detail-notice"><ShieldCheck/><div><strong>資料性質與查核方式</strong><p>此筆資料由你在目前瀏覽器自行輸入或匯入，平台未向原始網站自動擷取，也未驗證物件是否仍在售。價格為房源開價，不是實際成交價；請以原始頁面及房仲提供的最新資訊為準。</p></div></section>
    </div><aside className="source-card"><ShieldCheck/><h2>保留原始來源</h2><p>平台只保存你輸入的欄位與來源連結，未複製原站圖片或受保護文案。</p><dl><div><dt>來源網站</dt><dd>{item.source_name}</dd></div><div><dt>首次加入</dt><dd>{new Date(item.first_seen_at).toLocaleString('zh-TW')}</dd></div><div><dt>資料保存位置</dt><dd>目前瀏覽器 LocalStorage</dd></div></dl><a className="primary-button" href={item.source_url} target="_blank" rel="noopener noreferrer">開啟原始物件頁<ExternalLink/></a><Link className="secondary-link" to="/general-listings">返回工作台編輯</Link></aside></div>
  </>
}
