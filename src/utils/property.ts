import type { Filters, Property } from '../types/property'

export const formatCurrency = (value: number | null) =>
  value == null ? '未提供' : new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(value)

export const formatPing = (value: number | null) => value == null ? '未提供' : `${value.toLocaleString('zh-TW', { maximumFractionDigits: 2 })} 坪`

export const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00+08:00`)) : '未提供'

export const statusLabel: Record<Property['listing_status'], string> = {
  upcoming: '待開標', ended: '已結束', suspended: '已停標', unknown: '待確認',
}

const inRange = (value: number | null, minimum: string, maximum: string) => (!minimum && !maximum)
  || value != null && value >= (minimum ? Number(minimum) : Number.NEGATIVE_INFINITY) && value <= (maximum ? Number(maximum) : Number.POSITIVE_INFINITY)
const includesText = (value: string | null | undefined, query: string) => !query || (value ?? '').toLocaleLowerCase('zh-TW').includes(query.toLocaleLowerCase('zh-TW'))

export function filterProperties(properties: Property[], filters: Filters) {
  const q = filters.query.trim().toLocaleLowerCase('zh-TW')
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
      && inRange(price, filters.minPrice, filters.maxPrice)
      && inRange(item.unit_price, filters.minUnitPrice, filters.maxUnitPrice)
      && inRange(item.building_area_ping, filters.minBuildingArea, filters.maxBuildingArea)
      && inRange(item.land_area_ping, filters.minLandArea, filters.maxLandArea)
      && (!filters.maxBuildingAge || item.building_age != null && item.building_age <= Number(filters.maxBuildingAge))
      && includesText(item.floor, filters.floor)
      && (!filters.minRooms || item.rooms != null && item.rooms >= Number(filters.minRooms))
      && (!filters.minBathrooms || item.bathrooms != null && item.bathrooms >= Number(filters.minBathrooms))
      && includesText(item.parking, filters.parking)
      && (!filters.agency || item.source_details?.agency === filters.agency)
      && (!filters.auctionRound || item.auction_round === Number(filters.auctionRound))
      && inRange(item.deposit, filters.minDeposit, filters.maxDeposit)
      && includesText(item.handover_status, filters.handover)
      && includesText(item.ownership_share, filters.ownershipShare)
      && (!filters.useZone || item.source_details?.use === filters.useZone)
      && (!filters.auctionDateFrom || item.auction_date != null && item.auction_date >= filters.auctionDateFrom)
      && (!filters.auctionDateTo || item.auction_date != null && item.auction_date <= filters.auctionDateTo)
  })
  return filtered.sort((a, b) => {
    const ap = a.final_price ?? a.reserve_price ?? a.total_price ?? Number.POSITIVE_INFINITY
    const bp = b.final_price ?? b.reserve_price ?? b.total_price ?? Number.POSITIVE_INFINITY
    if (filters.sort === 'price_asc') return ap - bp
    if (filters.sort === 'price_desc') return bp - ap
    if (filters.sort === 'unit_asc') return (a.unit_price ?? Infinity) - (b.unit_price ?? Infinity)
    if (filters.sort === 'land_area_desc') return (b.land_area_ping ?? -1) - (a.land_area_ping ?? -1)
    if (filters.sort === 'building_area_desc') return (b.building_area_ping ?? -1) - (a.building_area_ping ?? -1)
    if (filters.sort === 'newest') return b.last_verified_at.localeCompare(a.last_verified_at)
    return (a.auction_date ?? '9999').localeCompare(b.auction_date ?? '9999')
  })
}
