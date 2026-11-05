import type { AdminCentroidDataset, Dataset, DatasetManifest, RealPriceDataset, RealPriceHistoryDataset } from '../types/property'
import type { SyncStatus } from '../types/property'

let cache: Promise<Dataset> | undefined
let currentCache: Promise<Dataset> | undefined
let legacyCache: Promise<Dataset> | undefined
let manifestCache: Promise<DatasetManifest | null> | undefined
let realPriceCache: Promise<RealPriceDataset> | undefined
let realPriceHistoryCache: Promise<RealPriceHistoryDataset> | undefined
let adminCentroidCache: Promise<AdminCentroidDataset> | undefined

async function fetchDataset(path: string): Promise<Dataset> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`)
  if (!response.ok) throw new Error(`資料載入失敗（HTTP ${response.status}）`)
  return response.json() as Promise<Dataset>
}

function loadLegacyDataset(): Promise<Dataset> {
  if (!legacyCache) legacyCache = fetchDataset('data/properties.json')
  return legacyCache
}

async function loadOptionalManifest(): Promise<DatasetManifest | null> {
  if (!manifestCache) {
    manifestCache = fetch(`${import.meta.env.BASE_URL}data/property-manifest.json`).then(async response => {
      if (response.status === 404) return null
      if (!response.ok) throw new Error(`資料索引載入失敗（HTTP ${response.status}）`)
      return response.json() as Promise<DatasetManifest>
    })
  }
  return manifestCache
}

export async function loadDatasetManifest(): Promise<DatasetManifest> {
  const manifest = await loadOptionalManifest()
  if (manifest) return manifest
  const dataset = await loadLegacyDataset()
  const statuses = { upcoming: 0, ended: 0, suspended: 0, unknown: 0 }
  const sourceCounts: Record<string, number> = {}
  dataset.records.forEach(item => {
    statuses[item.listing_status] += 1
    sourceCounts[item.source_id] = (sourceCounts[item.source_id] ?? 0) + 1
  })
  return {
    schema_version: 'legacy', dataset_schema_version: dataset.schema_version, generated_at: dataset.generated_at,
    source_attribution: dataset.source_attribution, current_path: 'data/properties.json', chunks: [], source_counts: sourceCounts,
    summary: {
      records: dataset.records.length, statuses,
      with_final_price: dataset.records.filter(item => item.final_price != null).length,
      total_value: dataset.records.reduce((sum, item) => sum + (item.final_price ?? item.reserve_price ?? 0), 0),
      counties: new Set(dataset.records.map(item => item.county).filter(Boolean)).size,
    },
  }
}

export function loadDataset(): Promise<Dataset> {
  if (!cache) {
    cache = loadOptionalManifest().then(async manifest => {
      if (!manifest?.chunks.length) return loadLegacyDataset()
      const datasets = await Promise.all(manifest.chunks.map(chunk => fetchDataset(chunk.path)))
      return {
        schema_version: manifest.dataset_schema_version,
        generated_at: manifest.generated_at,
        source_attribution: manifest.source_attribution,
        records: datasets.flatMap(dataset => dataset.records),
      }
    })
  }
  return cache
}

export function loadCurrentDataset(): Promise<Dataset> {
  if (!currentCache) {
    currentCache = loadOptionalManifest().then(async manifest => {
      if (!manifest) {
        const dataset = await loadLegacyDataset()
        return { ...dataset, records: dataset.records.filter(item => item.listing_status !== 'ended') }
      }
      return fetchDataset(manifest.current_path)
    })
  }
  return currentCache
}

export async function loadSourceRegistry() {
  const response = await fetch(`${import.meta.env.BASE_URL}data/source-registry.json`)
  if (!response.ok) throw new Error('來源登錄表載入失敗')
  return response.json()
}

export async function loadSyncStatus(): Promise<SyncStatus | null> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/sync-status.json`)
  if (response.status === 404) return null
  if (!response.ok) throw new Error('同步狀態載入失敗')
  return response.json()
}

export function loadRealPriceDataset(): Promise<RealPriceDataset> {
  if (!realPriceCache) {
    realPriceCache = fetch(`${import.meta.env.BASE_URL}data/real-price.json`).then(response => {
      if (!response.ok) throw new Error(`實價登錄資料載入失敗（HTTP ${response.status}）`)
      return response.json() as Promise<RealPriceDataset>
    })
  }
  return realPriceCache
}

export function loadRealPriceHistory(): Promise<RealPriceHistoryDataset> {
  if (!realPriceHistoryCache) {
    realPriceHistoryCache = fetch(`${import.meta.env.BASE_URL}data/real-price-history.json`).then(response => {
      if (!response.ok) throw new Error(`實價登錄趨勢載入失敗（HTTP ${response.status}）`)
      return response.json() as Promise<RealPriceHistoryDataset>
    })
  }
  return realPriceHistoryCache
}

export function loadAdminCentroids(): Promise<AdminCentroidDataset> {
  if (!adminCentroidCache) {
    adminCentroidCache = fetch(`${import.meta.env.BASE_URL}data/admin-centroids.json`).then(response => {
      if (!response.ok) throw new Error(`行政區座標資料載入失敗（HTTP ${response.status}）`)
      return response.json() as Promise<AdminCentroidDataset>
    })
  }
  return adminCentroidCache
}
