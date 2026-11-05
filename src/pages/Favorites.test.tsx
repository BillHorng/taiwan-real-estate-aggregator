import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { loadDataset } from '../services/data'
import type { Property } from '../types/property'
import Favorites from './Favorites'

vi.mock('../services/data', () => ({ loadDataset: vi.fn() }))

describe('general listing favorites', () => {
  beforeEach(() => { localStorage.clear(); vi.mocked(loadDataset).mockReset() })

  it('shows local favorites without loading the government snapshot', async () => {
    const item = { id: 'user-favorite', source_id: 'user-entry', source_name: '來源', source_url: 'https://example.com/favorite', title: '收藏的一般房源', county: '臺北市', district: '中山區', total_price: 10_000_000, building_area_ping: 25 } as Property
    localStorage.setItem('trea-general-listings-v1', JSON.stringify([item]))
    localStorage.setItem('trea-favorites-v1', JSON.stringify([item.id]))
    render(<MemoryRouter><Favorites/></MemoryRouter>)
    expect(await screen.findByText('收藏的一般房源')).toBeInTheDocument()
    expect(loadDataset).not.toHaveBeenCalled()
  })
})
