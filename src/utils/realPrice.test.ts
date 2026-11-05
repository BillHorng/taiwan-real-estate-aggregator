import { describe, expect, it } from 'vitest'
import type { Property, RealPriceRecord } from '../types/property'
import { annualTrend, emptyRealPriceFilters, filterRealPrice, median, realPriceSummary, similarTransactionsForListing, trendForLocation } from './realPrice'

const record = { id:'1', county:'臺北市', district:'大安區', building_type:'住宅大樓', building_area_ping:30, unit_price_ping:800000, total_price:24000000, transaction_target:'房地(土地+建物)' } as RealPriceRecord
describe('real-price analytics', () => {
  it('calculates a median without averaging price meanings', () => {
    expect(median([30, 10, 20])).toBe(20)
    expect(realPriceSummary([record, { ...record, id:'2', unit_price_ping:1_000_000, total_price:30_000_000 }]).medianUnitPrice).toBe(900_000)
  })
  it('filters comparable building transactions and excludes parking-only rows', () => {
    const parking = { ...record, id:'2', transaction_target:'車位' }
    expect(filterRealPrice([record, parking], { ...emptyRealPriceFilters, county:'臺北市', minArea:'25' })).toEqual([record])
  })
  it('selects one location series and calculates labeled annual weighted indicators', () => {
    const points = [{ season:'114S1', label:'2025 Q1', county:'臺北市', district:'大安區', building_type:'全部', count:10, median_unit_price:800_000 }, { season:'114S2', label:'2025 Q2', county:'臺北市', district:'大安區', building_type:'全部', count:30, median_unit_price:1_000_000 }] as never[]
    const trend = trendForLocation(points, { county:'臺北市', district:'大安區', buildingType:'' })
    expect(trend).toHaveLength(2)
    expect(annualTrend(trend)[0]).toMatchObject({ year:'2025', count:40, quarters:2, weightedQuarterMedian:950_000 })
  })
  it('ranks similar transactions by location, area, type, age and rooms', () => {
    const listing = { county:'臺北市', district:'大安區', building_area_ping:30, building_type:'住宅大樓', building_age:10, rooms:3 } as Property
    const close = { ...record, building_area_ping:31, building_type:'住宅大樓(11層含以上有電梯)', building_age:11, rooms:3 } as RealPriceRecord
    const far = { ...record, id:'2', building_area_ping:50 } as RealPriceRecord
    const matches = similarTransactionsForListing(listing, [far, close])
    expect(matches).toHaveLength(1)
    expect(matches[0].record.id).toBe(close.id)
    expect(matches[0].matchBasis).toContain('建物型態相近')
  })
})
