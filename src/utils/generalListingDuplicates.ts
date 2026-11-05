import type { Property } from '../types/property'

export interface GeneralListingDuplicateCandidate {
  leftId: string
  rightId: string
  confidence: number
  matchBasis: string[]
}

const normalizeText = (value: string | null | undefined) => (value ?? '')
  .normalize('NFKC')
  .replaceAll('台', '臺')
  .toLocaleLowerCase('zh-TW')
  .replace(/[\s,，.。／/\-–—號之]/g, '')

const close = (left: number | null, right: number | null, tolerance: number) => {
  if (left == null || right == null || left <= 0 || right <= 0) return false
  return Math.abs(left - right) / Math.max(left, right) <= tolerance
}

const comparableArea = (item: Property) => item.property_category === 'land'
  ? item.land_area_ping
  : item.building_area_ping

function comparePair(left: Property, right: Property): GeneralListingDuplicateCandidate | null {
  if (normalizeText(left.source_name) === normalizeText(right.source_name)) return null
  const sameLocation = normalizeText(left.county) && normalizeText(left.county) === normalizeText(right.county)
    && normalizeText(left.district) && normalizeText(left.district) === normalizeText(right.district)
  if (!sameLocation) return null

  let score = 0.1
  const matchBasis = ['同縣市行政區']
  const leftAddress = normalizeText(left.address)
  const rightAddress = normalizeText(right.address)
  const addressMatch = leftAddress.length >= 5 && leftAddress === rightAddress
  if (addressMatch) { score += 0.35; matchBasis.push('標準化地址相同') }
  if (close(comparableArea(left), comparableArea(right), 0.05)) { score += 0.2; matchBasis.push('坪數差距 5% 內') }
  if (close(left.total_price, right.total_price, 0.1)) { score += 0.15; matchBasis.push('開價差距 10% 內') }
  if (normalizeText(left.floor) && normalizeText(left.floor) === normalizeText(right.floor)) { score += 0.08; matchBasis.push('樓層相同') }
  if (normalizeText(left.building_type) && normalizeText(left.building_type) === normalizeText(right.building_type)) { score += 0.06; matchBasis.push('房屋類型相同') }
  if (left.rooms != null && left.rooms === right.rooms) { score += 0.06; matchBasis.push('房間數相同') }

  const evidenceCount = matchBasis.length - 1
  const minimumScore = addressMatch ? 0.68 : 0.65
  if (score + Number.EPSILON < minimumScore || evidenceCount < (addressMatch ? 3 : 5)) return null
  return { leftId: left.id, rightId: right.id, confidence: Math.round(score * 100) / 100, matchBasis }
}

export function findGeneralListingDuplicateCandidates(listings: Property[]) {
  const candidates: GeneralListingDuplicateCandidate[] = []
  const locationBuckets = new Map<string, Property[]>()
  listings.forEach(item => {
    const county = normalizeText(item.county)
    const district = normalizeText(item.district)
    if (!county || !district) return
    const key = `${county}|${district}`
    locationBuckets.set(key, [...(locationBuckets.get(key) ?? []), item])
  })
  locationBuckets.forEach(items => {
    for (let leftIndex = 0; leftIndex < items.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < items.length; rightIndex += 1) {
        const candidate = comparePair(items[leftIndex], items[rightIndex])
        if (candidate) candidates.push(candidate)
      }
    }
  })
  return candidates.sort((left, right) => right.confidence - left.confidence)
}

export function duplicateCandidatesByListing(candidates: GeneralListingDuplicateCandidate[]) {
  const result = new Map<string, GeneralListingDuplicateCandidate[]>()
  candidates.forEach(candidate => {
    result.set(candidate.leftId, [...(result.get(candidate.leftId) ?? []), candidate])
    result.set(candidate.rightId, [...(result.get(candidate.rightId) ?? []), candidate])
  })
  return result
}
