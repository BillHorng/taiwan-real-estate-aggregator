import { describe, expect, it } from 'vitest'
import type { Property } from '../types/property'
import { emptyGeneralListingFilters, filterGeneralListings } from './generalListings'

const base = { id: '1', title: '中山三房', source_name: '來源 A', county: '臺北市', district: '中山區', address: '民權東路', total_price: 12_000_000, unit_price: 400_000, building_area_ping: 30, building_age: 20, rooms: 3, bathrooms: 2, parking: '平面', last_seen_at: '2026-11-04T00:00:00Z' } as Property

describe('general listing filters', () => {
  it('combines keyword, price, area, room and bathroom filters', () => {
    const filters = { ...emptyGeneralListingFilters, query: '民權', maxPriceWan: '1300', minArea: '25', rooms: '3', bathrooms: '2' }
    expect(filterGeneralListings([base, { ...base, id: '2', total_price: 20_000_000 }, { ...base, id: '3', bathrooms: 1 }], filters)).toEqual([base])
  })
  it('sorts missing prices after known prices', () => {
    const items = [base, { ...base, id: '2', total_price: null }]
    expect(filterGeneralListings(items, { ...emptyGeneralListingFilters, sort: 'price_asc' }).map(item => item.id)).toEqual(['1', '2'])
  })
})
