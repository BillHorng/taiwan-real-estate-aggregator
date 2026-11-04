import type { Filters, Property } from '../types/property'

export const formatCurrency = (value: number | null) =>
  value == null ? '未提供' : new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(value)

export const formatPing = (value: number | null) => value == null ? '未提供' : `${value.toLocaleString('zh-TW', { maximumFractionDigits: 2 })} 坪`

export const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00+08:00`)) : '未提供'

export const statusLabel: Record<Property['listing_status'], string> = {
  upcoming: '待開標', ended: '已結束', suspended: '已停標', unknown: '待確認',
}

export function filterProperties(properties: Property[], filters: Filters) {
  const q = filters.query.trim().toLocaleLowerCase('zh-TW')
  const minPrice = Number(filters.minPrice) || 0
  const maxPrice = Number(filters.maxPrice) || Number.POSITIVE_INFINITY
  const hasPriceFilter = filters.minPrice.trim() !== '' || filters.maxPrice.trim() !== ''
  const filtered = properties.filter(item => {
    const haystack = [item.title, item.address, item.county, item.district, item.case_number, item.description].filter(Boolean).join(' ').toLocaleLowerCase('zh-TW')
    const price = item.final_price ?? item.reserve_price ?? item.total_price
    return (!q || haystack.includes(q))
      && (!filters.source || item.source_id === filters.source)
      && (!filters.transactionType || item.transaction_type === filters.transactionType)
      && (!filters.county || item.county === filters.county)
      && (!filters.district || item.district === filters.district)
      && (!filters.category || item.property_category === filters.category)
      && (!filters.status || item.listing_status === filters.status)
      && (!hasPriceFilter && price == null || price != null && price >= minPrice && price <= maxPrice)
  })
  return filtered.sort((a, b) => {
    const ap = a.final_price ?? a.reserve_price ?? a.total_price ?? Number.POSITIVE_INFINITY
    const bp = b.final_price ?? b.reserve_price ?? b.total_price ?? Number.POSITIVE_INFINITY
    if (filters.sort === 'price_asc') return ap - bp
    if (filters.sort === 'price_desc') return bp - ap
    if (filters.sort === 'area_desc') return (b.land_area_ping ?? 0) - (a.land_area_ping ?? 0)
    if (filters.sort === 'newest') return b.last_verified_at.localeCompare(a.last_verified_at)
    return (a.auction_date ?? '9999').localeCompare(b.auction_date ?? '9999')
  })
}
