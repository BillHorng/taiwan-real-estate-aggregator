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
  price_history?: { price: number | null, recorded_at: string }[]
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

export interface DatasetChunk {
  source_id: string
  path: string
  records: number
  current_records: number
  ended_records: number
}

export interface DatasetManifest {
  schema_version: string
  dataset_schema_version: string
  generated_at: string
  source_attribution: string
  current_path: string
  summary: {
    records: number
    statuses: Record<ListingStatus, number>
    with_final_price: number
    total_value: number
    counties: number
  }
  source_counts: Record<string, number>
  chunks: DatasetChunk[]
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

export interface RealPriceRecord {
  id: string
  source_id: 'moi-lvr'
  source_url: string
  county: string
  district: string
  address: string | null
  transaction_date: string
  transaction_target: string
  building_type: string | null
  primary_use: string | null
  total_price: number
  unit_price_sqm: number | null
  unit_price_ping: number | null
  building_area_ping: number | null
  land_area_ping: number | null
  building_age: number | null
  floor: string | null
  total_floors: string | null
  rooms: number | null
  halls: number | null
  bathrooms: number | null
  parking_type: string | null
  parking_price: number | null
  notes: string | null
  external_id: string
}

export interface RealPriceDataset {
  schema_version: string
  generated_at: string
  source_name: string
  source_url: string
  license: string
  period: string | null
  records: RealPriceRecord[]
}

export interface RealPriceTrendPoint {
  season: string
  label: string
  county: string
  district: string
  building_type: string
  count: number
  median_unit_price: number
  median_total_price: number
  min_unit_price: number
  max_unit_price: number
}

export interface RealPriceHistoryDataset {
  schema_version: string
  generated_at: string
  source_name: string
  source_url: string
  license: string
  basis: string
  seasons: string[]
  failures: Record<string, string>
  points: RealPriceTrendPoint[]
}

export interface AdminCentroid {
  source_id: 'nlsc-town-boundaries'
  town_code: string
  county: string
  district: string
  latitude: number
  longitude: number
  location_precision: 'district'
}

export interface AdminCentroidDataset {
  schema_version: string
  generated_at: string
  source_name: string
  source_url: string
  license: string
  coordinate_reference: string
  precision: 'district'
  records: AdminCentroid[]
}
