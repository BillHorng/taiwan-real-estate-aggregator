import { describe, expect, it } from 'vitest'
import type { RealPriceRecord } from '../types/property'
import { annualTrend, emptyRealPriceFilters, filterRealPrice, median, realPriceSummary, trendForLocation } from './realPrice'

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
})
