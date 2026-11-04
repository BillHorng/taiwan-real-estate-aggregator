import type { Dataset } from '../types/property'
import type { SyncStatus } from '../types/property'

let cache: Promise<Dataset> | undefined

export function loadDataset(): Promise<Dataset> {
  if (!cache) {
    cache = fetch(`${import.meta.env.BASE_URL}data/properties.json`)
      .then(async response => {
        if (!response.ok) throw new Error(`資料載入失敗（HTTP ${response.status}）`)
        return response.json() as Promise<Dataset>
      })
  }
  return cache
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
