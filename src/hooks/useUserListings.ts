import { useEffect, useState } from 'react'
import type { Property, PropertyCategory } from '../types/property'

const STORAGE_KEY = 'trea-general-listings-v1'
const EVENT_NAME = 'trea-general-listings-changed'

export type UserListingInput = {
  source_name: string
  source_url: string
  title: string
  county: string
  district: string
  address: string
  property_category: PropertyCategory
  building_type: string
  total_price: number | null
  building_area_ping: number | null
  land_area_ping: number | null
  building_age: number | null
  floor: string
  rooms: number | null
  bathrooms: number | null
  parking: string
  availability: 'active' | 'ended' | 'unknown'
}

export type ImportResult = { added: number, duplicates: number, errors: string[] }
export type RefreshResult = { added: number, matched: number, priceChanges: number, statusChanges: number, missingUnchanged: number, errors: string[] }

export function normalizeListingUrl(value: string) {
  const url = new URL(value.trim())
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('來源網址只允許 HTTP 或 HTTPS')
  url.hash = ''
  url.hostname = url.hostname.toLowerCase()
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '')
  return url.toString()
}

function read(): Property[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(value) ? value : []
  } catch { return [] }
}

function write(listings: Property[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings))
  window.dispatchEvent(new Event(EVENT_NAME))
}

function makeId() {
  return `user-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
}

function buildListing(input: UserListingInput, existing?: Property): Property {
  const now = new Date().toISOString()
  const sourceUrl = normalizeListingUrl(input.source_url)
  const oldHistory = existing?.price_history ?? []
  const priceChanged = Boolean(existing && existing.total_price !== input.total_price)
  const previousHistory = oldHistory.length ? oldHistory : existing?.total_price == null ? [] : [{ price: existing.total_price, recorded_at: existing.first_seen_at }]
  const priceHistory = priceChanged
    ? [...previousHistory, { price: input.total_price, recorded_at: now }]
    : oldHistory.length ? oldHistory : input.total_price == null ? [] : [{ price: input.total_price, recorded_at: now }]
  const unitArea = input.property_category === 'land' ? input.land_area_ping : input.building_area_ping
  return {
    id: existing?.id ?? makeId(), source_id: 'user-entry', source_name: input.source_name.trim(), source_url: sourceUrl, external_listing_id: '',
    title: input.title.trim(), description: null, property_category: input.property_category, building_type: input.building_type.trim() || null, transaction_type: 'sale',
    county: input.county.trim() || null, district: input.district.trim() || null, address: input.address.trim() || null,
    address_precision: input.address.trim() ? 'unknown' : 'district', latitude: null, longitude: null, location_precision: 'none',
    total_price: input.total_price, unit_price: input.total_price && unitArea ? input.total_price / unitArea : null,
    building_area_ping: input.building_area_ping, land_area_ping: input.land_area_ping, building_age: input.building_age, floor: input.floor.trim() || null,
    rooms: input.rooms, bathrooms: input.bathrooms, parking: input.parking.trim() || null,
    auction_type: null, auction_round: null, auction_date: null, reserve_price: null, final_price: null, deposit: null,
    case_number: null, ownership_share: null, handover_status: null, listing_status: input.availability === 'ended' ? 'ended' : 'unknown',
    first_seen_at: existing?.first_seen_at ?? now, last_seen_at: now, last_verified_at: now, source_updated_at: null, data_quality_score: listingCompleteness(input) / 100,
    source_details: { agency: '使用者自行輸入', input_mode: 'browser_local', unit_price_basis: input.property_category === 'land' ? 'land_area_ping' : 'building_area_ping', availability: input.availability }, price_history: priceHistory,
  }
}

function assertUniqueUrl(listings: Property[], sourceUrl: string, exceptId?: string) {
  const normalized = normalizeListingUrl(sourceUrl)
  if (listings.some(item => item.id !== exceptId && normalizeListingUrl(item.source_url) === normalized)) {
    throw new Error('這個來源網址已經加入，請編輯既有房源。')
  }
}

export function listingCompleteness(input: UserListingInput | Property) {
  const commonFields = ['source_name', 'source_url', 'title', 'county', 'district', 'property_category', 'building_type', 'total_price', 'building_age', 'floor', 'rooms', 'bathrooms', 'parking'] as const
  const area = input.property_category === 'land' ? input.land_area_ping : input.building_area_ping
  const filled = commonFields.filter(key => input[key] !== null && input[key] !== '' && input[key] !== undefined).length + Number(area !== null && area !== undefined)
  return Math.round(filled / (commonFields.length + 1) * 100)
}

export function propertyToInput(item: Property): UserListingInput {
  return {
    source_name: item.source_name, source_url: item.source_url, title: item.title, county: item.county ?? '', district: item.district ?? '',
    address: item.address ?? '', property_category: item.property_category, building_type: item.building_type ?? '', total_price: item.total_price,
    building_area_ping: item.building_area_ping, land_area_ping: item.land_area_ping, building_age: item.building_age, floor: item.floor ?? '',
    rooms: item.rooms, bathrooms: item.bathrooms, parking: item.parking ?? '', availability: (item.source_details?.availability as UserListingInput['availability']) ?? (item.listing_status === 'ended' ? 'ended' : 'unknown'),
  }
}

export function applyListingRefresh(current: Property[], inputs: UserListingInput[]) {
  const next = [...current]
  const seen = new Set<string>()
  const result: RefreshResult = { added: 0, matched: 0, priceChanges: 0, statusChanges: 0, missingUnchanged: 0, errors: [] }
  inputs.forEach((input, index) => {
    try {
      const url = normalizeListingUrl(input.source_url)
      seen.add(url)
      const existingIndex = next.findIndex(item => normalizeListingUrl(item.source_url) === url)
      if (existingIndex < 0) { next.unshift(buildListing(input)); result.added += 1; return }
      const existing = next[existingIndex]
      const oldAvailability = existing.source_details?.availability ?? (existing.listing_status === 'ended' ? 'ended' : 'unknown')
      if (existing.total_price !== input.total_price) result.priceChanges += 1
      if (oldAvailability !== input.availability) result.statusChanges += 1
      next[existingIndex] = buildListing(input, existing)
      result.matched += 1
    } catch (error) { result.errors.push(`第 ${index + 2} 列：${error instanceof Error ? error.message : String(error)}`) }
  })
  result.missingUnchanged = current.filter(item => !seen.has(normalizeListingUrl(item.source_url))).length
  return { records: next, result }
}

export function useUserListings() {
  const [listings, setListings] = useState<Property[]>(read)
  useEffect(() => {
    const sync = () => setListings(read())
    window.addEventListener(EVENT_NAME, sync)
    return () => window.removeEventListener(EVENT_NAME, sync)
  }, [])

  const addListing = (input: UserListingInput) => {
    const current = read()
    assertUniqueUrl(current, input.source_url)
    const listing = buildListing(input)
    write([listing, ...current])
    return listing
  }

  const updateListing = (id: string, input: UserListingInput) => {
    const current = read()
    const existing = current.find(item => item.id === id)
    if (!existing) throw new Error('找不到要編輯的房源。')
    assertUniqueUrl(current, input.source_url, id)
    const listing = buildListing(input, existing)
    write(current.map(item => item.id === id ? listing : item))
    return listing
  }

  const importListings = (inputs: UserListingInput[]): ImportResult => {
    const current = read()
    const next = [...current]
    const result: ImportResult = { added: 0, duplicates: 0, errors: [] }
    inputs.forEach((input, index) => {
      try {
        assertUniqueUrl(next, input.source_url)
        next.unshift(buildListing(input))
        result.added += 1
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (message.includes('已經加入')) result.duplicates += 1
        else result.errors.push(`第 ${index + 2} 列：${message}`)
      }
    })
    if (result.added) write(next)
    return result
  }

  const refreshListings = (inputs: UserListingInput[]): RefreshResult => {
    const current = read()
    const { records, result } = applyListingRefresh(current, inputs)
    if (result.added || result.matched) write(records)
    return result
  }

  const removeListing = (id: string) => write(read().filter(item => item.id !== id))
  const clearListings = () => write([])
  return { listings, addListing, updateListing, importListings, refreshListings, removeListing, clearListings }
}
