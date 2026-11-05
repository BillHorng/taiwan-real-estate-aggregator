import { RotateCcw, Search } from 'lucide-react'
import type { Filters, Property } from '../types/property'

export const emptyFilters: Filters = {
  query: '', source: '', transactionType: '', county: '', district: '', minPrice: '', maxPrice: '', minUnitPrice: '', maxUnitPrice: '',
  minBuildingArea: '', maxBuildingArea: '', minLandArea: '', maxLandArea: '', maxBuildingAge: '', floor: '', minRooms: '', minBathrooms: '', parking: '', category: '', status: '', agency: '', auctionRound: '',
  minDeposit: '', maxDeposit: '', handover: '', ownershipShare: '', useZone: '', auctionDateFrom: '', auctionDateTo: '', sort: 'auction_asc',
}

export function SearchFilters({ filters, onChange, properties }: { filters: Filters, onChange: (filters: Filters) => void, properties: Property[] }) {
  const counties = [...new Set(properties.map(item => item.county).filter((value): value is string => Boolean(value)))].sort()
  const sources = [...new Map(properties.map(item => [item.source_id, item.source_name])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'zh-TW'))
  const districts = [...new Set(properties.filter(item => !filters.county || item.county === filters.county).map(item => item.district).filter((value): value is string => Boolean(value)))].sort()
  const agencies = [...new Set(properties.map(item => item.source_details?.agency).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, 'zh-TW'))
  const useZones = [...new Set(properties.map(item => item.source_details?.use).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, 'zh-TW'))
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
      <label>最低單價<input inputMode="numeric" value={filters.minUnitPrice} onChange={event => field('minUnitPrice', event.target.value)} placeholder="元／坪"/></label>
      <label>最高單價<input inputMode="numeric" value={filters.maxUnitPrice} onChange={event => field('maxUnitPrice', event.target.value)} placeholder="元／坪"/></label>
      <label>最小建物坪數<input type="number" min="0" value={filters.minBuildingArea} onChange={event => field('minBuildingArea', event.target.value)}/></label>
      <label>最大建物坪數<input type="number" min="0" value={filters.maxBuildingArea} onChange={event => field('maxBuildingArea', event.target.value)}/></label>
      <label>最小土地坪數<input type="number" min="0" value={filters.minLandArea} onChange={event => field('minLandArea', event.target.value)}/></label>
      <label>最大土地坪數<input type="number" min="0" value={filters.maxLandArea} onChange={event => field('maxLandArea', event.target.value)}/></label>
      <label>最高屋齡<input type="number" min="0" value={filters.maxBuildingAge} onChange={event => field('maxBuildingAge', event.target.value)}/></label><label>樓層<input value={filters.floor} onChange={event => field('floor', event.target.value)} placeholder="例如 5 樓"/></label>
      <label>至少房數<input type="number" min="0" value={filters.minRooms} onChange={event => field('minRooms', event.target.value)}/></label><label>至少衛浴<input type="number" min="0" value={filters.minBathrooms} onChange={event => field('minBathrooms', event.target.value)}/></label><label>車位<input value={filters.parking} onChange={event => field('parking', event.target.value)} placeholder="平面／機械"/></label>
      <label>標的類型<select value={filters.category} onChange={event => field('category', event.target.value)}><option value="">全部類型</option><option value="land">土地</option><option value="building">建物</option><option value="mixed">房地</option></select></label>
      <label>案件狀態<select value={filters.status} onChange={event => field('status', event.target.value)}><option value="">全部狀態</option><option value="upcoming">待開標</option><option value="ended">已結束</option><option value="suspended">已停標</option></select></label>
      <label>拍賣／標售機關<select value={filters.agency} onChange={event => field('agency', event.target.value)}><option value="">全部機關</option>{agencies.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>拍次<input type="number" min="1" value={filters.auctionRound} onChange={event => field('auctionRound', event.target.value)}/></label>
      <label>最低保證金<input inputMode="numeric" value={filters.minDeposit} onChange={event => field('minDeposit', event.target.value)}/></label><label>最高保證金<input inputMode="numeric" value={filters.maxDeposit} onChange={event => field('maxDeposit', event.target.value)}/></label>
      <label>點交狀態<input value={filters.handover} onChange={event => field('handover', event.target.value)} placeholder="點交／不點交"/></label><label>產權持分<input value={filters.ownershipShare} onChange={event => field('ownershipShare', event.target.value)} placeholder="全部／部分"/></label>
      <label>使用分區<select value={filters.useZone} onChange={event => field('useZone', event.target.value)}><option value="">全部使用分區</option>{useZones.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>開標日自<input type="date" value={filters.auctionDateFrom} onChange={event => field('auctionDateFrom', event.target.value)}/></label><label>開標日至<input type="date" value={filters.auctionDateTo} onChange={event => field('auctionDateTo', event.target.value)}/></label>
      <label>排序<select value={filters.sort} onChange={event => field('sort', event.target.value)}><option value="auction_asc">最近開標</option><option value="newest">最近查核</option><option value="price_asc">底價低至高</option><option value="price_desc">底價高至低</option><option value="unit_asc">單價低至高</option><option value="land_area_desc">土地坪數大至小</option><option value="building_area_desc">建物坪數大至小</option></select></label>
      <button className="clear-button" onClick={() => onChange(emptyFilters)}><RotateCcw size={16}/>清除條件</button>
    </div>
  </section>
}
