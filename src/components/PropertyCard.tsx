import { CalendarDays, ExternalLink, GitCompareArrows, Heart, MapPin, Ruler } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Property } from '../types/property'
import { formatCurrency, formatDate, formatPing, statusLabel } from '../utils/property'
import { useCompare } from '../hooks/useCompare'

export function PropertyCard({ property, favorite, onFavorite }: { property: Property, favorite: boolean, onFavorite: () => void }) {
  const { compareIds, toggleCompare, isFull } = useCompare()
  const comparing = compareIds.includes(property.id)
  const displayedPrice = property.final_price ?? property.reserve_price ?? property.total_price
  const priceLabel = property.final_price != null ? '拍定價格' : property.reserve_price != null ? '標售底價' : '價格'
  return <article className="property-card">
    <div className="property-visual" aria-hidden="true"><span>{property.property_category === 'land' ? '地' : '產'}</span><div className="parcel-lines"/></div>
    <div className="card-body">
      <div className="card-meta"><span className="source-pill">{property.source_name}</span>{property.duplicate_group_id && <span className="duplicate-pill">疑似重複</span>}<span className={`status ${property.listing_status}`}>{statusLabel[property.listing_status]}</span></div>
      <Link to={`/properties/${property.id}`} className="card-title">{property.title}</Link>
      <p className="location"><MapPin size={15}/>{[property.county, property.district].filter(Boolean).join(' ') || '位置未完整提供'}</p>
      <div className="price"><small>{priceLabel}</small><strong>{formatCurrency(displayedPrice)}</strong></div>
      <div className="card-facts"><span><Ruler size={15}/>{formatPing(property.land_area_ping)}</span><span><CalendarDays size={15}/>{formatDate(property.auction_date)}</span></div>
      <div className="card-actions"><button className={favorite ? 'favorite active' : 'favorite'} onClick={onFavorite} aria-label={favorite ? '移除收藏' : '加入收藏'}><Heart size={17} fill={favorite ? 'currentColor' : 'none'}/>{favorite ? '已收藏' : '收藏'}</button><button className={comparing ? 'compare-button active' : 'compare-button'} disabled={!comparing && isFull} onClick={() => toggleCompare(property.id)}><GitCompareArrows size={15}/>{comparing ? '已比較' : '比較'}</button><a href={property.source_url} target="_blank" rel="noopener noreferrer">官方公告<ExternalLink size={15}/></a></div>
    </div>
  </article>
}
