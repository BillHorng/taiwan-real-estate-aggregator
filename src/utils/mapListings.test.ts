import { describe, expect, it } from 'vitest'
import type { AdminCentroid, Property } from '../types/property'
import { groupListingsByDistrict, normalizePlaceName } from './mapListings'

const centroid: AdminCentroid = {
  source_id: 'nlsc-town-boundaries', town_code: '6300100', county: '臺北市', district: '松山區',
  latitude: 25.05, longitude: 121.56, location_precision: 'district',
}
const listing = { id: 'one', county: '台北市', district: '松山區' } as Property

describe('map listing grouping', () => {
  it('normalizes 台 and 臺 without changing precision', () => {
    expect(normalizePlaceName(' 台北市 ')).toBe('臺北市')
    const result = groupListingsByDistrict([listing], [centroid])
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].listings[0].id).toBe('one')
    expect(result.groups[0].location_precision).toBe('district')
  })

  it('keeps incomplete locations out of the map', () => {
    const result = groupListingsByDistrict([{ ...listing, district: null }], [centroid])
    expect(result.groups).toHaveLength(0)
    expect(result.unmatched).toBe(1)
  })
})
