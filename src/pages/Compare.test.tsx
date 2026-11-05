import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { loadDataset } from '../services/data'
import type { Property } from '../types/property'
import Compare from './Compare'

vi.mock('../services/data', () => ({ loadDataset: vi.fn() }))

const listing = {
  id: 'user-one', source_id: 'user-entry', source_name: '房仲來源', source_url: 'https://example.com/one', title: '一般房源 A',
  transaction_type: 'sale', listing_status: 'unknown', county: '臺北市', district: '中山區', total_price: 12_800_000,
  unit_price: 400_000, building_area_ping: 32, building_age: 20, rooms: 3, bathrooms: 2, parking: '平面',
  property_category: 'building', building_type: '住宅大樓', floor: '8／15 樓', reserve_price: null, final_price: null, land_area_ping: 5,
} as Property

describe('general listing comparison', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(loadDataset).mockReset()
  })

  it('compares local general listings without loading the government snapshot', async () => {
    localStorage.setItem('trea-general-listings-v1', JSON.stringify([listing]))
    localStorage.setItem('trea-compare-v1', JSON.stringify([listing.id]))
    render(<MemoryRouter><Compare/></MemoryRouter>)
    expect(await screen.findByText('一般房源 A')).toBeInTheDocument()
    expect(screen.getByText('使用者自行記錄')).toBeInTheDocument()
    expect(screen.getByText('平面')).toBeInTheDocument()
    expect(screen.getByText('住宅大樓')).toBeInTheDocument()
    expect(screen.getByText('8／15 樓')).toBeInTheDocument()
    expect(loadDataset).not.toHaveBeenCalled()
  })
})
