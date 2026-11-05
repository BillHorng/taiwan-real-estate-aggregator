import type { Property } from '../types/property'

export type GeneralListingFilters = {
  query: string; source: string; county: string; district: string; minPriceWan: string; maxPriceWan: string
  minArea: string; maxArea: string; maxAge: string; rooms: string; bathrooms: string; parking: string
  sort: 'newest' | 'price_asc' | 'price_desc' | 'unit_asc' | 'area_desc'
}

export const emptyGeneralListingFilters: GeneralListingFilters = {
  query: '', source: '', county: '', district: '', minPriceWan: '', maxPriceWan: '', minArea: '', maxArea: '', maxAge: '', rooms: '', bathrooms: '', parking: '', sort: 'newest',
}

const lower = (value: string | null | undefined) => (value ?? '').toLocaleLowerCase('zh-TW')
const minimum = (value: string, scale = 1) => value.trim() ? Number(value) * scale : Number.NEGATIVE_INFINITY
const maximum = (value: string, scale = 1) => value.trim() ? Number(value) * scale : Number.POSITIVE_INFINITY

export function filterGeneralListings(listings: Property[], filters: GeneralListingFilters) {
  const query = lower(filters.query.trim())
  const filtered = listings.filter(item => {
    const haystack = lower([item.title, item.source_name, item.county, item.district, item.address].filter(Boolean).join(' '))
    const price = item.total_price
    const area = item.building_area_ping
    return (!query || haystack.includes(query))
      && (!filters.source || item.source_name === filters.source)
      && (!filters.county || item.county === filters.county)
      && (!filters.district || item.district === filters.district)
      && (price != null && price >= minimum(filters.minPriceWan, 10_000) && price <= maximum(filters.maxPriceWan, 10_000) || !filters.minPriceWan && !filters.maxPriceWan)
      && (area != null && area >= minimum(filters.minArea) && area <= maximum(filters.maxArea) || !filters.minArea && !filters.maxArea)
      && (!filters.maxAge || item.building_age != null && item.building_age <= Number(filters.maxAge))
      && (!filters.rooms || item.rooms != null && item.rooms >= Number(filters.rooms))
      && (!filters.bathrooms || item.bathrooms != null && item.bathrooms >= Number(filters.bathrooms))
      && (!filters.parking || lower(item.parking).includes(lower(filters.parking)))
  })
  return filtered.sort((left, right) => {
    if (filters.sort === 'price_asc') return (left.total_price ?? Infinity) - (right.total_price ?? Infinity)
    if (filters.sort === 'price_desc') return (right.total_price ?? -1) - (left.total_price ?? -1)
    if (filters.sort === 'unit_asc') return (left.unit_price ?? Infinity) - (right.unit_price ?? Infinity)
    if (filters.sort === 'area_desc') return (right.building_area_ping ?? -1) - (left.building_area_ping ?? -1)
    return right.last_seen_at.localeCompare(left.last_seen_at)
  })
}
