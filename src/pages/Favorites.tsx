import { ExternalLink, Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PropertyCard } from '../components/PropertyCard'
import { useFavorites } from '../hooks/useFavorites'
import { useUserListings } from '../hooks/useUserListings'
import { loadDataset } from '../services/data'
import type { Property } from '../types/property'
import { formatCurrency, formatPing } from '../utils/property'

export default function Favorites() {
  const { favorites, toggle } = useFavorites()
  const { listings } = useUserListings()
  const [officialItems, setOfficialItems] = useState<Property[]>([])
  const localItems = listings.filter(item => favorites.includes(item.id))

  useEffect(() => {
    const localIds = new Set(listings.map(item => item.id))
    const officialIds = favorites.filter(id => !localIds.has(id))
    if (!officialIds.length) { setOfficialItems([]); return }
    loadDataset().then(data => setOfficialItems(data.records.filter(item => officialIds.includes(item.id))))
  }, [favorites, listings])

  const hasItems = localItems.length || officialItems.length
  return <><section className="page-header"><span className="eyebrow accent">SAVED LOCALLY</span><h1>我的收藏</h1><p>一般房源與政府資料收藏都只保存在這個瀏覽器，不會上傳個人資料。</p></section>
    {hasItems ? <>
      {localItems.length > 0 && <><section className="section-heading compact"><div><span className="eyebrow">GENERAL LISTINGS</span><h2>一般房源</h2></div><Link to="/general-listings">管理候選房源</Link></section><div className="general-listing-grid">{localItems.map(item => <article className="general-listing-card" key={item.id}><div className="card-meta"><span className="source-pill">{item.source_name}</span><button className="favorite active" onClick={() => toggle(item.id)} aria-label={`取消收藏${item.title}`}><Heart fill="currentColor"/></button></div><h3><Link to={`/general-listings/${item.id}`}>{item.title}</Link></h3><p>{[item.county, item.district].filter(Boolean).join(' ') || '地點未填寫'}</p><div className="general-price"><strong>{formatCurrency(item.total_price)}</strong><small>{formatPing(item.building_area_ping)}</small></div><div className="general-card-actions"><a href={item.source_url} target="_blank" rel="noopener noreferrer">原始頁面 <ExternalLink/></a><Link to={`/general-listings/${item.id}`}>查看詳情</Link></div></article>)}</div></>}
      {officialItems.length > 0 && <><section className="section-heading compact"><div><span className="eyebrow">PUBLIC DATA</span><h2>標售與拍賣</h2></div></section><div className="property-grid">{officialItems.map(item => <PropertyCard key={item.id} property={item} favorite onFavorite={() => toggle(item.id)}/>)}</div></>}
    </> : <div className="state-panel"><Heart/><h2>還沒有收藏</h2><p>在一般房源工作台按下愛心，即可建立自己的追蹤清單。</p><Link className="primary-button" to="/general-listings">前往一般房源</Link></div>}
  </>
}
