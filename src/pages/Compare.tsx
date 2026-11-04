import { GitCompareArrows, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCompare } from '../hooks/useCompare'
import { loadDataset } from '../services/data'
import type { Property } from '../types/property'
import { formatCurrency, formatDate, formatPing, statusLabel } from '../utils/property'

export default function Compare() {
  const { compareIds, toggleCompare, clearCompare } = useCompare()
  const [items, setItems] = useState<Property[]>([])
  useEffect(() => { loadDataset().then(dataset => setItems(compareIds.map(id => dataset.records.find(item => item.id === id)).filter((item): item is Property => Boolean(item)))) }, [compareIds])
  const rows: [string, (item: Property) => string][] = [
    ['資料來源', item => item.source_name], ['案件狀態', item => statusLabel[item.listing_status]], ['縣市／行政區', item => [item.county, item.district].filter(Boolean).join(' ') || '未提供'],
    ['標售底價', item => formatCurrency(item.reserve_price)], ['拍定價格', item => formatCurrency(item.final_price)], ['土地面積', item => formatPing(item.land_area_ping)],
    ['建物面積', item => formatPing(item.building_area_ping)], ['公告／拍定日期', item => formatDate(item.auction_date ?? item.source_updated_at)], ['資料品質', item => `${Math.round(item.data_quality_score * 100)} / 100`],
  ]
  return <>
    <section className="page-header"><span className="eyebrow accent">SIDE-BY-SIDE REVIEW</span><h1>物件比較</h1><p>最多選擇 4 筆；底價與拍定價分列，避免把不同價格意義混在一起。</p></section>
    {!items.length ? <div className="state-panel"><GitCompareArrows/><h2>尚未選擇比較項目</h2><p>在物件卡片按下「比較」加入清單。</p><Link className="primary-button" to="/properties">前往搜尋</Link></div> : <>
      <div className="compare-toolbar"><span>已選擇 {items.length} / 4 筆</span><button onClick={clearCompare}><Trash2 size={15}/>清除全部</button></div>
      <div className="compare-wrap"><table className="compare-table"><thead><tr><th>比較欄位</th>{items.map(item => <th key={item.id}><button onClick={() => toggleCompare(item.id)} aria-label="移除此比較項目"><X/></button><Link to={`/properties/${item.id}`}>{item.title}</Link></th>)}</tr></thead><tbody>{rows.map(([label, read]) => <tr key={label}><th>{label}</th>{items.map(item => <td key={item.id}>{read(item)}</td>)}</tr>)}<tr><th>官方來源</th>{items.map(item => <td key={item.id}><a href={item.source_url} target="_blank" rel="noopener noreferrer">開啟官方資料</a></td>)}</tr></tbody></table></div>
    </>}
  </>
}
