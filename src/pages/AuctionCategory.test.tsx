import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { loadDataset } from '../services/data'
import AuctionCategory from './AuctionCategory'

vi.mock('../services/data', () => ({ loadDataset: vi.fn() }))

describe('auction category pages', () => {
  beforeEach(() => { localStorage.clear(); vi.mocked(loadDataset).mockReset() })
  it('keeps judicial auctions in transparent official-link mode', () => {
    render(<MemoryRouter><AuctionCategory kind="judicial"/></MemoryRouter>)
    expect(screen.getByRole('heading', { name:'法院法拍' })).toBeInTheDocument()
    expect(screen.getByText('目前 0 筆正式接入')).toBeInTheDocument()
    expect(screen.getByRole('link', { name:/開啟官方入口/ })).toHaveAttribute('href', expect.stringContaining('judicial.gov.tw'))
    expect(loadDataset).not.toHaveBeenCalled()
  })
  it('loads the integrated administrative-enforcement source separately', async () => {
    vi.mocked(loadDataset).mockResolvedValue({ schema_version:'x', generated_at:'', source_attribution:'', records:[] })
    render(<MemoryRouter><AuctionCategory kind="enforcement"/></MemoryRouter>)
    expect(await screen.findByText('沒有可合法展示的案件資料')).toBeInTheDocument()
    expect(loadDataset).toHaveBeenCalledOnce()
  })
})
