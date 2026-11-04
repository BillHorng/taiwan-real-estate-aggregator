import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PropertyCard } from '../components/PropertyCard'
import { useFavorites } from '../hooks/useFavorites'
import { loadDataset } from '../services/data'
import type { Property } from '../types/property'

export default function Favorites() {
  const { favorites, toggle } = useFavorites()
  const [items, setItems] = useState<Property[]>([])
  useEffect(() => { loadDataset().then(data => setItems(data.records.filter(item => favorites.includes(item.id)))) }, [favorites])
  return <><section className="page-header"><span className="eyebrow accent">SAVED LOCALLY</span><h1>我的收藏</h1><p>收藏只保存在這個瀏覽器，不會上傳個人資料。</p></section>{items.length ? <div className="property-grid">{items.map(item => <PropertyCard key={item.id} property={item} favorite onFavorite={() => toggle(item.id)}/>)}</div> : <div className="state-panel"><Heart/><h2>還沒有收藏</h2><p>在列表中按下愛心，即可建立自己的追蹤清單。</p><Link className="primary-button" to="/properties">瀏覽標售物件</Link></div>}</>
}
