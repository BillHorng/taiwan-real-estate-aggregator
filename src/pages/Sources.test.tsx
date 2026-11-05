import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadDatasetManifest, loadSourceRegistry, loadSyncStatus } from '../services/data'
import Sources from './Sources'

vi.mock('../services/data', () => ({
  loadDatasetManifest: vi.fn(),
  loadSourceRegistry: vi.fn(),
  loadSyncStatus: vi.fn(),
}))

const generalIds = ['591', 'yungching', 'sinyi', 'taiwan-realty', 'hbhousing', 'cthouse', 'etwarm', 'u-trust', 'pacific']
const source = (id: string, name = id) => ({
  id, name, organization: name, official_url: `https://example.com/${id}`,
  data_type: ['一般房源'], access_method: '待授權／官方入口', integration_status: 'official_link_only',
  license: '未取得資料合作授權', update_frequency: '不適用', notes: '未匯入物件資料。', last_successful_sync: null,
})

describe('source coverage disclosure', () => {
  beforeEach(() => {
    vi.mocked(loadSourceRegistry).mockResolvedValue({
      sources: [
        ...generalIds.map(id => source(id)),
        { ...source('government', '政府來源'), data_type: ['政府標售'], integration_status: 'integrated' },
      ],
    })
    vi.mocked(loadDatasetManifest).mockResolvedValue({
      schema_version: '1.0.0', dataset_schema_version: '2.3.0', generated_at: '2026-11-04T00:00:00+08:00',
      source_attribution: 'official', current_path: 'data/properties/current.json', chunks: [], source_counts: { government: 10 },
      summary: { records: 10, statuses: { upcoming: 10, ended: 0, suspended: 0, unknown: 0 }, with_final_price: 0, total_value: 0, counties: 1 },
    })
    vi.mocked(loadSyncStatus).mockResolvedValue({ schema_version: '1.0.0', generated_at: '2026-11-04T00:00:00+08:00', overall: 'healthy', sources: {}, history: [] })
  })

  it('states that none of the nine general listing sources is integrated', async () => {
    render(<Sources/>)
    expect(await screen.findByText('0 / 9')).toBeInTheDocument()
    expect(screen.getByText('一般房源目前為 0 筆整合資料')).toBeInTheDocument()
    expect(screen.getAllByText('平台物件：0 筆')).toHaveLength(9)
  })
})
