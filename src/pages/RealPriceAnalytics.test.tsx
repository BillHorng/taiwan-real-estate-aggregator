import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadRealPriceDataset } from '../services/data'
import type { RealPriceDataset, RealPriceHistoryDataset } from '../types/property'
import RealPriceAnalytics from './RealPriceAnalytics'

const dataset: RealPriceDataset = {
  schema_version: '1.0.0', generated_at: '2026-11-04T00:00:00Z', source_name: '內政部不動產交易實價登錄',
  source_url: 'https://plvr.land.moi.gov.tw/opendata/lvr_landAcsv.zip', license: '政府資料開放授權條款-第1版', period: '測試揭露期間',
  records: [{ id:'moi-lvr:1', source_id:'moi-lvr', source_url:'https://data.gov.tw/dataset/25119', county:'臺北市', district:'大安區', address:'和平東路', transaction_date:'2026-10-01', transaction_target:'房地(土地+建物)', building_type:'住宅大樓', primary_use:'住家用', total_price:24_000_000, unit_price_sqm:240_000, unit_price_ping:793_388, building_area_ping:30.25, land_area_ping:5, building_age:10, floor:'五層', total_floors:'十二層', rooms:3, halls:2, bathrooms:2, parking_type:'坡道平面', parking_price:2_000_000, notes:null, external_id:'ABC' }],
}
const history: RealPriceHistoryDataset = { schema_version:'1.0.0', generated_at:'2026-11-04T00:00:00Z', source_name:'內政部非本期實價批次資料', source_url:'https://data.gov.tw/dataset/18703', license:'政府資料開放授權條款-第1版', basis:'官方發布季度', seasons:['114S1','114S2'], failures:{}, points:[{ season:'114S1', label:'2025 Q1', county:'全台', district:'全部', building_type:'全部', count:100, median_unit_price:500_000, median_total_price:15_000_000, min_unit_price:100_000, max_unit_price:1_000_000 }, { season:'114S2', label:'2025 Q2', county:'全台', district:'全部', building_type:'全部', count:120, median_unit_price:550_000, median_total_price:16_000_000, min_unit_price:100_000, max_unit_price:1_100_000 }] }

vi.mock('../services/data', () => ({ loadRealPriceDataset: vi.fn(), loadRealPriceHistory: vi.fn() }))

describe('real-price analytics page', () => {
  beforeEach(async () => { vi.mocked(loadRealPriceDataset).mockResolvedValue(dataset); const service = await import('../services/data'); vi.mocked(service.loadRealPriceHistory).mockResolvedValue(history) })
  it('renders the official period, summary, and transaction table', async () => {
    render(<MemoryRouter><RealPriceAnalytics/></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: '實價登錄成交行情' })).toBeInTheDocument()
    expect(screen.getByText(/測試揭露期間/)).toBeInTheDocument()
    expect(screen.getByText('1 筆')).toBeInTheDocument()
    expect(screen.getByText('和平東路')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^官方資料集/ })).toHaveAttribute('href', 'https://data.gov.tw/dataset/25119')
    expect(screen.getByRole('heading', { name: '發布季度每坪成交中位數' })).toBeInTheDocument()
    expect(screen.getByText('2025 年指標')).toBeInTheDocument()
  })
})
