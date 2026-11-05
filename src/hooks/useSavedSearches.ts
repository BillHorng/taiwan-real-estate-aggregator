import { useEffect, useState } from 'react'
import type { GeneralListingFilters } from '../utils/generalListings'

const STORAGE_KEY = 'trea-saved-searches-v1'
const EVENT_NAME = 'trea-saved-searches-changed'

export interface SavedSearch { id: string; name: string; filters: GeneralListingFilters; created_at: string }

const read = (): SavedSearch[] => {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); return Array.isArray(value) ? value : [] } catch { return [] }
}
const write = (items: SavedSearch[]) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); window.dispatchEvent(new Event(EVENT_NAME)) }

export function savedSearchName(filters: GeneralListingFilters) {
  return [filters.query, filters.county, filters.district, filters.buildingType, filters.category, filters.maxPriceWan ? `${filters.maxPriceWan}萬以下` : ''].filter(Boolean).join(' · ') || '全部一般房源'
}

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(read)
  useEffect(() => { const sync = () => setSavedSearches(read()); window.addEventListener(EVENT_NAME, sync); return () => window.removeEventListener(EVENT_NAME, sync) }, [])
  const saveSearch = (filters: GeneralListingFilters) => {
    const serialized = JSON.stringify(filters)
    const current = read()
    if (current.some(item => JSON.stringify(item.filters) === serialized)) return false
    write([{ id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()), name: savedSearchName(filters), filters: { ...filters }, created_at: new Date().toISOString() }, ...current])
    return true
  }
  const removeSearch = (id: string) => write(read().filter(item => item.id !== id))
  return { savedSearches, saveSearch, removeSearch }
}
