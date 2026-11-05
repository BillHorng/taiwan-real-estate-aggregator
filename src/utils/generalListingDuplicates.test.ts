import { describe, expect, it } from 'vitest'
import type { Property } from '../types/property'
import { findGeneralListingDuplicateCandidates } from './generalListingDuplicates'

const base = {
  id: 'a', source_name: '來源 A', county: '台北市', district: '中山區', address: '民權東路三段 1 號',
  property_category: 'building', building_type: '住宅大樓', building_area_ping: 30, land_area_ping: 5,
  total_price: 12_000_000, floor: '8／15 樓', rooms: 3,
} as Property

describe('general listing duplicate candidates', () => {
  it('flags a cross-source pair only when multiple facts agree', () => {
    const candidates = findGeneralListingDuplicateCandidates([base, { ...base, id: 'b', source_name: '來源 B', county: '臺北市', building_area_ping: 30.8, total_price: 12_500_000 }])
    expect(candidates).toHaveLength(1)
    expect(candidates[0].confidence).toBeGreaterThanOrEqual(.68)
    expect(candidates[0].matchBasis).toContain('標準化地址相同')
    expect(candidates[0].matchBasis).toContain('坪數差距 5% 內')
  })

  it('does not flag records from the same source or from address alone', () => {
    expect(findGeneralListingDuplicateCandidates([base, { ...base, id: 'same', total_price: 30_000_000 }])).toHaveLength(0)
    const addressOnly = { ...base, id: 'b', source_name: '來源 B', building_area_ping: 50, total_price: 30_000_000, floor: '2 樓', building_type: '公寓', rooms: 1 }
    expect(findGeneralListingDuplicateCandidates([base, addressOnly])).toHaveLength(0)
  })

  it('requires five supporting facts when an address is unavailable', () => {
    const noAddress = { ...base, address: null }
    const other = { ...noAddress, id: 'b', source_name: '來源 B', building_area_ping: 31, total_price: 12_500_000 }
    expect(findGeneralListingDuplicateCandidates([noAddress, other])).toHaveLength(1)
    expect(findGeneralListingDuplicateCandidates([noAddress, { ...other, floor: null }])).toHaveLength(0)
  })
})
