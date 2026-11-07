import { describe, expect, it } from 'vitest'
import type { Property } from '../types/property'
import { applyListingRefresh, listingCompleteness, propertyToInput } from './useUserListings'

const current = {
  id:'one', source_url:'https://example.com/one', source_name:'來源', title:'房源', property_category:'building', building_type:'住宅大樓',
  county:'臺北市', district:'大安區', address:null, total_price:10_000_000, building_area_ping:20, land_area_ping:null, building_age:10,
  floor:'5 樓', rooms:2, bathrooms:1, parking:'無', listing_status:'unknown', first_seen_at:'2026-01-01T00:00:00Z', last_seen_at:'2026-01-01T00:00:00Z',
  source_details:{ availability:'active' }, price_history:[{ price:10_000_000, recorded_at:'2026-01-01T00:00:00Z' }],
} as unknown as Property

describe('general listing snapshot refresh', () => {
  it('updates matched price and status while retaining price history', () => {
    const input = { ...propertyToInput(current), total_price:9_500_000, availability:'ended' as const }
    const { records, result } = applyListingRefresh([current], [input])
    expect(result).toMatchObject({ matched:1, priceChanges:1, statusChanges:1, missingUnchanged:0 })
    expect(records[0].listing_status).toBe('ended')
    expect(records[0].price_history?.map(item => item.price)).toEqual([10_000_000, 9_500_000])
  })

  it('does not mark records missing from a snapshot as ended', () => {
    const { records, result } = applyListingRefresh([current], [])
    expect(result.missingUnchanged).toBe(1)
    expect(records[0].listing_status).toBe('unknown')
  })
})

describe('general listing completeness', () => {
  it('uses land area instead of building area for land listings', () => {
    const base = propertyToInput(current)
    const withLandArea = { ...base, property_category:'land' as const, building_area_ping:null, land_area_ping:20 }
    const buildingAreaOnly = { ...base, property_category:'land' as const, building_area_ping:20, land_area_ping:null }
    expect(listingCompleteness(withLandArea)).toBeGreaterThan(listingCompleteness(buildingAreaOnly))
  })
})
