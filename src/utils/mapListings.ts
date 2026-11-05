import type { AdminCentroid, Property } from '../types/property'

export interface DistrictListingGroup extends AdminCentroid {
  listings: Property[]
}

export function normalizePlaceName(value: string | null) {
  return (value ?? '').trim().replaceAll('台', '臺').replace(/\s+/g, '')
}

export function groupListingsByDistrict(listings: Property[], centroids: AdminCentroid[]) {
  const index = new Map(centroids.map(item => [
    `${normalizePlaceName(item.county)}|${normalizePlaceName(item.district)}`,
    item,
  ]))
  const groups = new Map<string, DistrictListingGroup>()
  let unmatched = 0
  listings.forEach(listing => {
    const key = `${normalizePlaceName(listing.county)}|${normalizePlaceName(listing.district)}`
    const centroid = index.get(key)
    if (!listing.county || !listing.district || !centroid) {
      unmatched += 1
      return
    }
    const current = groups.get(key)
    if (current) current.listings.push(listing)
    else groups.set(key, { ...centroid, listings: [listing] })
  })
  return { groups: [...groups.values()], unmatched }
}

export function rectangleBounds(first: [number, number], second: [number, number]): [number, number, number, number] {
  return [Math.min(first[0], second[0]), Math.min(first[1], second[1]), Math.max(first[0], second[0]), Math.max(first[1], second[1])]
}
