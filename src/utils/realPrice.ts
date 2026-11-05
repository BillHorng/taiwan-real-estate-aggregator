import type { Property, RealPriceRecord, RealPriceTrendPoint } from '../types/property'

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

const typeFamily = (value: string | null | undefined) => {
  const text = value ?? ''
  if (text.includes('大樓')) return '大樓'
  if (text.includes('華廈')) return '華廈'
  if (text.includes('公寓')) return '公寓'
  if (text.includes('透天') || text.includes('別墅')) return '透天'
  if (text.includes('套房')) return '套房'
  if (text.includes('店面')) return '店面'
  if (text.includes('辦公')) return '辦公'
  if (text.includes('廠')) return '廠房'
  return ''
}

export interface SimilarTransaction { record: RealPriceRecord; score: number; matchBasis: string[] }

export function similarTransactionsForListing(listing: Property, records: RealPriceRecord[], limit = 5): SimilarTransaction[] {
  if (!listing.county || !listing.district || !listing.building_area_ping) return []
  const listingFamily = typeFamily(listing.building_type)
  return records.flatMap(record => {
    if (record.county !== listing.county || record.district !== listing.district || !record.building_area_ping || !record.unit_price_ping) return []
    const areaDifference = Math.abs(record.building_area_ping - listing.building_area_ping!) / listing.building_area_ping!
    if (areaDifference > .25) return []
    let score = 55 + (1 - areaDifference / .25) * 25
    const matchBasis = ['同縣市行政區', `建坪差 ${Math.round(areaDifference * 100)}%`]
    const recordFamily = typeFamily(record.building_type)
    if (listingFamily && recordFamily === listingFamily) { score += 10; matchBasis.push('建物型態相近') }
    if (listing.building_age != null && record.building_age != null) {
      const ageDifference = Math.abs(record.building_age - listing.building_age)
      if (ageDifference <= 10) { score += 5 * (1 - ageDifference / 10); matchBasis.push(`屋齡差 ${ageDifference.toFixed(1)} 年`) }
    }
    if (listing.rooms != null && record.rooms === listing.rooms) { score += 5; matchBasis.push('房間數相同') }
    return [{ record, score: Math.round(score), matchBasis }]
  }).sort((left, right) => right.score - left.score || right.record.transaction_date.localeCompare(left.record.transaction_date)).slice(0, limit)
}
