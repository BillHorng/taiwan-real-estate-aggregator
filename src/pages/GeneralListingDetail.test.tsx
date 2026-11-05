import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { Property } from '../types/property'
import GeneralListingDetail from './GeneralListingDetail'

const listing: Property = {
  id: 'user-detail-1', source_id: 'user-entry', source_name: '測試房仲', source_url: 'https://example.com/home/1', external_listing_id: '',
  title: '大安區三房候選', description: null, property_category: 'building', building_type: '住宅大樓', transaction_type: 'sale', county: '臺北市', district: '大安區', address: '和平東路',
  address_precision: 'unknown', latitude: null, longitude: null, location_precision: 'none', total_price: 25_800_000, unit_price: 860_000,
  building_area_ping: 30, land_area_ping: 5, building_age: 12, floor: '8／15 樓', rooms: 3, bathrooms: 2, parking: '坡道平面', auction_type: null,
  auction_round: null, auction_date: null, reserve_price: null, final_price: null, deposit: null, case_number: null, ownership_share: null, handover_status: null,
  listing_status: 'unknown', first_seen_at: '2026-10-01T00:00:00.000Z', last_seen_at: '2026-11-01T00:00:00.000Z', last_verified_at: '2026-11-01T00:00:00.000Z',
  source_updated_at: null, data_quality_score: 1, price_history: [{ price: 26_800_000, recorded_at: '2026-10-01T00:00:00.000Z' }, { price: 25_800_000, recorded_at: '2026-11-01T00:00:00.000Z' }],
}

describe('general listing detail', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('trea-general-listings-v1', JSON.stringify([listing]))
  })

  it('shows local listing facts, history, and source attribution', () => {
    render(<MemoryRouter initialEntries={[`/general-listings/${listing.id}`]}><Routes><Route path="general-listings/:id" element={<GeneralListingDetail/>}/></Routes></MemoryRouter>)
    expect(screen.getByRole('heading', { name: listing.title })).toBeInTheDocument()
    expect(screen.getByText('一般房源開價（非成交價）')).toBeInTheDocument()
    expect(screen.getAllByText('$25,800,000').length).toBeGreaterThan(0)
    expect(screen.getByText('$26,800,000')).toBeInTheDocument()
    expect(screen.getByText('瀏覽器本機資料')).toBeInTheDocument()
    expect(screen.getByText('住宅大樓')).toBeInTheDocument()
    expect(screen.getByText('8／15 樓')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /開啟原始物件頁/ })).toHaveAttribute('href', listing.source_url)
  })

  it('can add the listing to favorites and comparison', () => {
    render(<MemoryRouter initialEntries={[`/general-listings/${listing.id}`]}><Routes><Route path="general-listings/:id" element={<GeneralListingDetail/>}/></Routes></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: '加入收藏' }))
    fireEvent.click(screen.getByRole('button', { name: '加入比較' }))
    expect(JSON.parse(localStorage.getItem('trea-favorites-v1') ?? '[]')).toContain(listing.id)
    expect(JSON.parse(localStorage.getItem('trea-compare-v1') ?? '[]')).toContain(listing.id)
  })

  it('shows duplicate evidence while preserving the other source record', () => {
    const other = { ...listing, id: 'user-detail-2', source_name: '另一房仲', source_url: 'https://example.com/home/2', title: '另一來源同條件候選', total_price: 26_000_000 }
    localStorage.setItem('trea-general-listings-v1', JSON.stringify([listing, other]))
    render(<MemoryRouter initialEntries={[`/general-listings/${listing.id}`]}><Routes><Route path="general-listings/:id" element={<GeneralListingDetail/>}/></Routes></MemoryRouter>)
    expect(screen.getByText('這筆房源有 1 筆疑似跨來源重複候選')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '另一房仲：另一來源同條件候選' })).toHaveAttribute('href', `/general-listings/${other.id}`)
    expect(JSON.parse(localStorage.getItem('trea-general-listings-v1') ?? '[]')).toHaveLength(2)
  })

  it('shows a recoverable missing state when the local record is absent', () => {
    localStorage.clear()
    render(<MemoryRouter initialEntries={['/general-listings/missing']}><Routes><Route path="general-listings/:id" element={<GeneralListingDetail/>}/></Routes></MemoryRouter>)
    expect(screen.getByRole('heading', { name: '找不到這筆一般房源' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回一般房源' })).toHaveAttribute('href', '/general-listings')
  })
})
