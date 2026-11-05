import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PropertyCard } from '../components/PropertyCard'
import { emptyFilters, SearchFilters } from '../components/SearchFilters'
import { useFavorites } from '../hooks/useFavorites'
import { loadDataset } from '../services/data'
import type { Filters, Property } from '../types/property'
import { filterProperties } from '../utils/property'

const PAGE_SIZE = 24

function exportCsv(items: Property[]) {
  const columns: [string, (item: Property) => unknown][] = [
    ['來源', item => item.source_name], ['標題', item => item.title], ['縣市', item => item.county], ['行政區', item => item.district],
    ['底價', item => item.reserve_price], ['拍定價', item => item.final_price], ['土地坪數', item => item.land_area_ping], ['狀態', item => item.listing_status],
    ['日期', item => item.auction_date], ['官方連結', item => item.source_url],
  ]
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const csv = '\uFEFF' + [columns.map(([label]) => escape(label)).join(','), ...items.map(item => columns.map(([, read]) => escape(read(item))).join(','))].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = `taiwan-real-estate-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url)
}

export default function Properties() {
  const [items, setItems] = useState<Property[]>([])
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const { favorites, toggle } = useFavorites()
  useEffect(() => { loadDataset().then(data => setItems(data.records)).catch(error => setError(String(error))) }, [])
  const results = useMemo(() => filterProperties(items, filters), [items, filters])
  const updateFilters = (next: Filters) => { setFilters(next); setPage(1) }
  if (error) return <div className="state-panel error">{error}</div>
  return <>
    <section className="page-header"><span className="eyebrow accent">MULTI-SOURCE PROPERTY DATA</span><h1>政府標售與拍賣資料</h1><p>整合國產署待標售案件、行政執行署已拍定紀錄與臺灣銀行歷史標售；不同價格類型分開呈現。</p></section>
    <nav className="auction-category-nav" aria-label="拍賣資料分類"><Link to="/judicial-auctions">法院法拍</Link><Link to="/enforcement-auctions">行政執行拍賣</Link><Link to="/financial-auctions">金拍屋／第三人拍賣</Link></nav>
    <SearchFilters filters={filters} onChange={updateFilters} properties={items}/>
    <div className="result-bar"><strong>{results.length.toLocaleString()} 筆結果</strong><div><span>每頁最多 {PAGE_SIZE} 筆</span><button className="export-button" onClick={() => exportCsv(results)} disabled={!results.length}><Download size={15}/>匯出目前結果</button></div></div>
    {results.length ? <><div className="property-grid">{results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(item => <PropertyCard key={item.id} property={item} favorite={favorites.includes(item.id)} onFavorite={() => toggle(item.id)}/>)}</div><div className="pagination"><button disabled={page === 1} onClick={() => setPage(value => value - 1)}>上一頁</button><span>第 {page} / {Math.ceil(results.length / PAGE_SIZE)} 頁</span><button disabled={page * PAGE_SIZE >= results.length} onClick={() => setPage(value => value + 1)}>下一頁</button></div></> : <div className="state-panel"><h2>找不到符合條件的標的</h2><p>試著清除價格或地區條件。</p></div>}
  </>
}
