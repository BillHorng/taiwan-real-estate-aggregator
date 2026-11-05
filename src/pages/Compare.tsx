import { GitCompareArrows, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCompare } from '../hooks/useCompare'
import { useUserListings } from '../hooks/useUserListings'
import { loadDataset } from '../services/data'
import type { Property } from '../types/property'
import { formatCurrency, formatPing, statusLabel } from '../utils/property'

export default function Compare() {
  const { compareIds, toggleCompare, clearCompare } = useCompare()
  const { listings } = useUserListings()
  const [items, setItems] = useState<Property[]>([])
  useEffect(() => {
    const localById = new Map(listings.map(item => [item.id, item]))
    const missingIds = compareIds.filter(id => !localById.has(id))
    if (!missingIds.length) {
      setItems(compareIds.map(id => localById.get(id)).filter((item): item is Property => Boolean(item)))
      return
    }
    loadDataset().then(dataset => {
      const allById = new Map([...dataset.records, ...listings].map(item => [item.id, item]))
      setItems(compareIds.map(id => allById.get(id)).filter((item): item is Property => Boolean(item)))
    })
  }, [compareIds, listings])
  const rows: [string, (item: Property) => string][] = [
    ['資料來源', item => item.source_name], ['資料狀態', item => item.transaction_type === 'sale' ? '使用者自行記錄' : statusLabel[item.listing_status]], ['縣市／行政區', item => [item.county, item.district].filter(Boolean).join(' ') || '未提供'],
    ['物件類型', item => item.building_type || ({ building: '建物', land: '土地', mixed: '房地', unknown: '未分類' }[item.property_category])], ['樓層', item => item.floor || '未提供'],
    ['一般房源開價', item => formatCurrency(item.total_price)], ['每坪單價', item => item.unit_price == null ? '未提供' : `${formatCurrency(item.unit_price)}／${item.property_category === 'land' ? '土地坪' : '建坪'}`], ['建物面積', item => formatPing(item.building_area_ping)],
    ['屋齡', item => item.building_age == null ? '未提供' : `${item.building_age} 年`], ['房間／衛浴', item => item.rooms == null && item.bathrooms == null ? '未提供' : `${item.rooms ?? '—'} 房／${item.bathrooms ?? '—'} 衛`], ['車位', item => item.parking || '未提供'],
    ['土地面積', item => formatPing(item.land_area_ping)], ['標售底價', item => formatCurrency(item.reserve_price)], ['拍定價格', item => formatCurrency(item.final_price)],
  ]
  return <>
    <section className="page-header"><span className="eyebrow accent">SIDE-BY-SIDE HOME REVIEW</span><h1>一般房源比較</h1><p>最多選擇 4 筆，優先比較開價、單價、坪數、屋齡與格局；標售底價與拍定價仍分開顯示。</p></section>
    {!items.length ? <div className="state-panel"><GitCompareArrows/><h2>尚未選擇比較項目</h2><p>先加入一般房源，再把候選物件放進比較表。</p><Link className="primary-button" to="/general-listings">前往一般房源工作台</Link></div> : <>
      <div className="compare-toolbar"><span>已選擇 {items.length} / 4 筆</span><button onClick={clearCompare}><Trash2 size={15}/>清除全部</button></div>
      <div className="compare-wrap"><table className="compare-table"><thead><tr><th>比較欄位</th>{items.map(item => <th key={item.id}><button onClick={() => toggleCompare(item.id)} aria-label="移除此比較項目"><X/></button>{item.source_id === 'user-entry' ? <Link to={`/general-listings/${item.id}`}>{item.title}</Link> : <Link to={`/properties/${item.id}`}>{item.title}</Link>}</th>)}</tr></thead><tbody>{rows.map(([label, read]) => <tr key={label}><th>{label}</th>{items.map(item => <td key={item.id}>{read(item)}</td>)}</tr>)}<tr><th>原始來源</th>{items.map(item => <td key={item.id}><a href={item.source_url} target="_blank" rel="noopener noreferrer">開啟原始頁面</a></td>)}</tr></tbody></table></div>
    </>}
  </>
}
