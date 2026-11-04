export type PropertyCategory = 'land' | 'building' | 'mixed' | 'unknown'
export type ListingStatus = 'upcoming' | 'ended' | 'suspended' | 'unknown'

export interface Property {
  id: string
  source_id: string
  source_name: string
  source_url: string
  external_listing_id: string
  title: string
  description: string | null
  property_category: PropertyCategory
  transaction_type: 'government_sale' | 'auction' | 'sale'
  county: string | null
  district: string | null
  address: string | null
  address_precision: 'land_parcel' | 'district' | 'unknown'
  latitude: number | null
  longitude: number | null
  location_precision: 'exact' | 'approximate' | 'district' | 'none'
  total_price: number | null
  unit_price: number | null
  building_area_ping: number | null
  land_area_ping: number | null
  building_age: number | null
  floor: string | null
  rooms: number | null
  bathrooms: number | null
  parking: string | null
  auction_type: string | null
  auction_round: number | null
  auction_date: string | null
  reserve_price: number | null
  final_price: number | null
  deposit: number | null
  case_number: string | null
  ownership_share: string | null
  handover_status: string | null
  listing_status: ListingStatus
  first_seen_at: string
  last_seen_at: string
  last_verified_at: string
  source_updated_at: string | null
  data_quality_score: number
  duplicate_group_id?: string | null
  duplicate_confidence?: number | null
  duplicate_match_basis?: string[]
  source_details?: Record<string, string | null>
}

export interface SyncSourceStatus {
  status: 'success' | 'stale' | 'failed'
  records: number
  attempted_at: string
  last_success_at: string | null
  duration_ms: number
  error: string | null
}

export interface SyncStatus {
  schema_version: string
  generated_at: string
  overall: 'healthy' | 'degraded' | 'stale'
  sources: Record<string, SyncSourceStatus>
  history: { at: string, overall: string, records: number, sources: Record<string, string> }[]
}

export interface Dataset {
  schema_version: string
  generated_at: string
  source_attribution: string
  records: Property[]
}

export interface Filters {
  query: string
  source: string
  transactionType: string
  county: string
  district: string
  minPrice: string
  maxPrice: string
  category: string
  status: string
  sort: 'auction_asc' | 'newest' | 'price_asc' | 'price_desc' | 'area_desc'
}
