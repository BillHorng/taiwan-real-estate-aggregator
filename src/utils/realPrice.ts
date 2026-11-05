import type { RealPriceRecord, RealPriceTrendPoint } from '../types/property'

export type RealPriceFilters = { county: string; district: string; buildingType: string; minArea: string; maxArea: string }
export const emptyRealPriceFilters: RealPriceFilters = { county: '', district: '', buildingType: '', minArea: '', maxArea: '' }

export function filterRealPrice(records: RealPriceRecord[], filters: RealPriceFilters) {
  const minimum = filters.minArea ? Number(filters.minArea) : 0
  const maximum = filters.maxArea ? Number(filters.maxArea) : Infinity
  return records.filter(item => item.building_area_ping != null && item.building_area_ping > 0 && item.unit_price_ping != null && item.unit_price_ping > 0
    && item.transaction_target !== '車位'
    && (!filters.county || item.county === filters.county)
    && (!filters.district || item.district === filters.district)
    && (!filters.buildingType || item.building_type === filters.buildingType)
    && item.building_area_ping >= minimum && item.building_area_ping <= maximum)
}

export function median(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function realPriceSummary(records: RealPriceRecord[]) {
  const unitPrices = records.map(item => item.unit_price_ping).filter((value): value is number => value != null)
  const totals = records.map(item => item.total_price)
  return { count: records.length, medianUnitPrice: median(unitPrices), minUnitPrice: unitPrices.length ? Math.min(...unitPrices) : null,
    maxUnitPrice: unitPrices.length ? Math.max(...unitPrices) : null, medianTotalPrice: median(totals) }
}

export function trendForLocation(points: RealPriceTrendPoint[], filters: Pick<RealPriceFilters, 'county' | 'district' | 'buildingType'>) {
  const county = filters.county || '全台'
  const district = filters.district || '全部'
  const buildingType = filters.buildingType || '全部'
  return points.filter(point => point.county === county && point.district === district && point.building_type === buildingType)
    .sort((left, right) => left.season.localeCompare(right.season))
}

export function annualTrend(points: RealPriceTrendPoint[]) {
  const years = new Map<string, { weighted: number; count: number; quarters: number }>()
  points.forEach(point => {
    const year = point.label.slice(0, 4)
    const current = years.get(year) ?? { weighted: 0, count: 0, quarters: 0 }
    current.weighted += point.median_unit_price * point.count
    current.count += point.count
    current.quarters += 1
    years.set(year, current)
  })
  return [...years.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([year, value]) => ({ year, count: value.count, quarters: value.quarters, weightedQuarterMedian: value.count ? value.weighted / value.count : null }))
}
