import { RotateCcw, Search } from 'lucide-react'
import type { Filters, Property } from '../types/property'

export const emptyFilters: Filters = { query: '', source: '', transactionType: '', county: '', district: '', minPrice: '', maxPrice: '', category: '', status: '', sort: 'auction_asc' }

export function SearchFilters({ filters, onChange, properties }: { filters: Filters, onChange: (filters: Filters) => void, properties: Property[] }) {
  const counties = [...new Set(properties.map(item => item.county).filter((value): value is string => Boolean(value)))].sort()
  const sources = [...new Map(properties.map(item => [item.source_id, item.source_name])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'zh-TW'))
  const districts = [...new Set(properties.filter(item => !filters.county || item.county === filters.county).map(item => item.district).filter((value): value is string => Boolean(value)))].sort()
  const field = (name: keyof Filters, value: string) => onChange({ ...filters, [name]: value, ...(name === 'county' ? { district: '' } : {}) })
  return <section className="filter-panel" aria-label="搜尋篩選">
    <label className="search-box"><Search size={19}/><input value={filters.query} onChange={event => field('query', event.target.value)} placeholder="搜尋地段、地號、案件或備註…"/><kbd>⌘ K</kbd></label>
    <div className="filters-grid">
      <label>資料來源<select value={filters.source} onChange={event => field('source', event.target.value)}><option value="">全部來源</option>{sources.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label>資料類型<select value={filters.transactionType} onChange={event => field('transactionType', event.target.value)}><option value="">全部類型</option><option value="government_sale">政府標售</option><option value="auction">拍賣／拍定</option><option value="sale">一般出售</option></select></label>
      <label>縣市<select value={filters.county} onChange={event => field('county', event.target.value)}><option value="">全台灣</option>{counties.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>行政區<select value={filters.district} onChange={event => field('district', event.target.value)}><option value="">全部行政區</option>{districts.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>最低底價<input inputMode="numeric" value={filters.minPrice} onChange={event => field('minPrice', event.target.value)} placeholder="例如 1000000"/></label>
      <label>最高底價<input inputMode="numeric" value={filters.maxPrice} onChange={event => field('maxPrice', event.target.value)} placeholder="不限"/></label>
      <label>標的類型<select value={filters.category} onChange={event => field('category', event.target.value)}><option value="">全部類型</option><option value="land">土地</option><option value="building">建物</option><option value="mixed">房地</option></select></label>
      <label>案件狀態<select value={filters.status} onChange={event => field('status', event.target.value)}><option value="">全部狀態</option><option value="upcoming">待開標</option><option value="ended">已結束</option><option value="suspended">已停標</option></select></label>
      <label>排序<select value={filters.sort} onChange={event => field('sort', event.target.value)}><option value="auction_asc">最近開標</option><option value="newest">最近查核</option><option value="price_asc">底價低至高</option><option value="price_desc">底價高至低</option><option value="area_desc">土地坪數</option></select></label>
      <button className="clear-button" onClick={() => onChange(emptyFilters)}><RotateCcw size={16}/>清除條件</button>
    </div>
  </section>
}
