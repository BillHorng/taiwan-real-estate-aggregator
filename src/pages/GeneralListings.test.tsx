import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import GeneralListings from './GeneralListings'

describe('general listing workspace', () => {
  beforeEach(() => localStorage.clear())

  it('stores a user-entered listing locally and adds it to comparison', async () => {
    render(<MemoryRouter><GeneralListings/></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('來源網站 *'), { target: { value: '信義房屋' } })
    fireEvent.change(screen.getByLabelText('原始物件網址 *'), { target: { value: 'https://example.com/listing/123' } })
    fireEvent.change(screen.getByLabelText('物件名稱 *'), { target: { value: '中山區三房候選' } })
    fireEvent.change(screen.getByLabelText('總價（萬元）'), { target: { value: '1280' } })
    fireEvent.change(screen.getByLabelText('建物坪數'), { target: { value: '32' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存到瀏覽器' }))

    expect(await screen.findByText('中山區三房候選')).toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem('trea-general-listings-v1') ?? '[]')
    expect(stored[0].total_price).toBe(12_800_000)
    expect(stored[0].unit_price).toBe(400_000)

    fireEvent.click(screen.getByRole('button', { name: '加入比較' }))
    expect(JSON.parse(localStorage.getItem('trea-compare-v1') ?? '[]')).toEqual([stored[0].id])
  })

  it('rejects non-http source links', async () => {
    render(<MemoryRouter><GeneralListings/></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('來源網站 *'), { target: { value: '不明來源' } })
    fireEvent.change(screen.getByLabelText('原始物件網址 *'), { target: { value: 'javascript:alert(1)' } })
    fireEvent.change(screen.getByLabelText('物件名稱 *'), { target: { value: '測試物件' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存到瀏覽器' }))
    expect(await screen.findByText('來源網址只允許 HTTP 或 HTTPS')).toBeInTheDocument()
    expect(localStorage.getItem('trea-general-listings-v1')).toBeNull()
  })

  it('records price history when a listing is edited', async () => {
    render(<MemoryRouter><GeneralListings/></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('來源網站 *'), { target: { value: '來源 A' } })
    fireEvent.change(screen.getByLabelText('原始物件網址 *'), { target: { value: 'https://example.com/listing/price' } })
    fireEvent.change(screen.getByLabelText('物件名稱 *'), { target: { value: '價格追蹤物件' } })
    fireEvent.change(screen.getByLabelText('總價（萬元）'), { target: { value: '1500' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存到瀏覽器' }))
    fireEvent.click(await screen.findByRole('button', { name: '編輯價格追蹤物件' }))
    fireEvent.change(screen.getByLabelText('總價（萬元）'), { target: { value: '1450' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存變更' }))

    const stored = JSON.parse(localStorage.getItem('trea-general-listings-v1') ?? '[]')
    expect(stored[0].total_price).toBe(14_500_000)
    expect(stored[0].price_history.map((entry: { price: number }) => entry.price)).toEqual([15_000_000, 14_500_000])
    expect(await screen.findByText(/降價/)).toBeInTheDocument()
  })

  it('rejects a duplicate URL after normalizing its hash and trailing slash', async () => {
    render(<MemoryRouter><GeneralListings/></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('來源網站 *'), { target: { value: '來源 A' } })
    fireEvent.change(screen.getByLabelText('原始物件網址 *'), { target: { value: 'https://example.com/listing/duplicate/' } })
    fireEvent.change(screen.getByLabelText('物件名稱 *'), { target: { value: '第一筆' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存到瀏覽器' }))
    fireEvent.click(await screen.findByRole('button', { name: '加入房源' }))
    fireEvent.change(screen.getByLabelText('來源網站 *'), { target: { value: '來源 B' } })
    fireEvent.change(screen.getByLabelText('原始物件網址 *'), { target: { value: 'https://EXAMPLE.com/listing/duplicate#photo' } })
    fireEvent.change(screen.getByLabelText('物件名稱 *'), { target: { value: '重複筆' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存到瀏覽器' }))
    expect(await screen.findByText('這個來源網址已經加入，請編輯既有房源。')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('trea-general-listings-v1') ?? '[]')).toHaveLength(1)
  })

  it('filters locally stored listings by keyword', () => {
    const base = {
      source_id: 'user-entry', source_name: '來源 A', source_url: 'https://example.com/a', external_listing_id: '', description: null,
      property_category: 'building', transaction_type: 'sale', county: '臺北市', district: '大安區', address: null, address_precision: 'unknown',
      latitude: null, longitude: null, location_precision: 'none', total_price: 10_000_000, unit_price: 500_000, building_area_ping: 20,
      land_area_ping: null, building_age: 10, floor: null, rooms: 2, bathrooms: 1, parking: null, auction_type: null, auction_round: null,
      auction_date: null, reserve_price: null, final_price: null, deposit: null, case_number: null, ownership_share: null, handover_status: null,
      listing_status: 'unknown', first_seen_at: '2026-11-01T00:00:00Z', last_seen_at: '2026-11-01T00:00:00Z', last_verified_at: '2026-11-01T00:00:00Z', source_updated_at: null, data_quality_score: .8,
    }
    localStorage.setItem('trea-general-listings-v1', JSON.stringify([{ ...base, id: 'user-a', title: '大安兩房' }, { ...base, id: 'user-b', title: '信義三房', district: '信義區', source_url: 'https://example.com/b' }]))
    render(<MemoryRouter><GeneralListings/></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText('搜尋名稱、來源、地址或行政區…'), { target: { value: '信義' } })
    expect(screen.getByText('信義三房')).toBeInTheDocument()
    expect(screen.queryByText('大安兩房')).not.toBeInTheDocument()
    expect(screen.getByText(/符合 1／共 2 筆/)).toBeInTheDocument()
  })
})
