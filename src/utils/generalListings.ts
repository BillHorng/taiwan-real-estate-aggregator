import type { Property } from '../types/property'

export type GeneralListingFilters = {
  query: string; source: string; county: string; district: string; minPriceWan: string; maxPriceWan: string
  category: string; buildingType: string; minUnitPriceWan: string; maxUnitPriceWan: string
  minArea: string; maxArea: string; minLandArea: string; maxLandArea: string; maxAge: string; floor: string; rooms: string; bathrooms: string; parking: string
  sort: 'newest' | 'price_asc' | 'price_desc' | 'unit_asc' | 'area_desc'
}

export const emptyGeneralListingFilters: GeneralListingFilters = {
  query: '', source: '', county: '', district: '', minPriceWan: '', maxPriceWan: '', category: '', buildingType: '', minUnitPriceWan: '', maxUnitPriceWan: '',
  minArea: '', maxArea: '', minLandArea: '', maxLandArea: '', maxAge: '', floor: '', rooms: '', bathrooms: '', parking: '', sort: 'newest',
}

const lower = (value: string | null | undefined) => (value ?? '').toLocaleLowerCase('zh-TW')
const minimum = (value: string, scale = 1) => value.trim() ? Number(value) * scale : Number.NEGATIVE_INFINITY
const maximum = (value: string, scale = 1) => value.trim() ? Number(value) * scale : Number.POSITIVE_INFINITY
const inRange = (value: number | null, min: string, max: string, scale = 1) => !min && !max || value != null && value >= minimum(min, scale) && value <= maximum(max, scale)

export function filterGeneralListings(listings: Property[], filters: GeneralListingFilters) {
  const query = lower(filters.query.trim())
  const filtered = listings.filter(item => {
    const haystack = lower([item.title, item.source_name, item.county, item.district, item.address, item.building_type, item.floor].filter(Boolean).join(' '))
    const price = item.total_price
    const area = item.building_area_ping
    return (!query || haystack.includes(query))
      && (!filters.source || item.source_name === filters.source)
      && (!filters.county || item.county === filters.county)
      && (!filters.district || item.district === filters.district)
      && (!filters.category || item.property_category === filters.category)
      && (!filters.buildingType || item.building_type === filters.buildingType)
      && inRange(price, filters.minPriceWan, filters.maxPriceWan, 10_000)
      && inRange(item.unit_price, filters.minUnitPriceWan, filters.maxUnitPriceWan, 10_000)
      && inRange(area, filters.minArea, filters.maxArea)
      && inRange(item.land_area_ping, filters.minLandArea, filters.maxLandArea)
      && (!filters.maxAge || item.building_age != null && item.building_age <= Number(filters.maxAge))
      && (!filters.floor || lower(item.floor).includes(lower(filters.floor)))
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
