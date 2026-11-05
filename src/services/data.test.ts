import { beforeEach, describe, expect, it, vi } from 'vitest'

const manifest = {
  schema_version: '1.0.0',
  dataset_schema_version: '2.3.0',
  generated_at: '2026-11-04T00:00:00+08:00',
  source_attribution: 'official data',
  current_path: 'data/properties/current.json',
  summary: { records: 2, statuses: { upcoming: 1, ended: 1, suspended: 0, unknown: 0 }, with_final_price: 1, total_value: 3, counties: 1 },
  source_counts: { first: 1, second: 1 },
  chunks: [
    { source_id: 'first', path: 'data/properties/first.json', records: 1, current_records: 1, ended_records: 0 },
    { source_id: 'second', path: 'data/properties/second.json', records: 1, current_records: 0, ended_records: 1 },
  ],
}

const dataset = (id: string) => ({ schema_version: '2.3.0', generated_at: manifest.generated_at, source_attribution: 'official data', records: [{ id }] })

function jsonResponse(value: unknown) {
  return new Response(JSON.stringify(value), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

describe('lazy dataset loading', () => {
  beforeEach(() => vi.resetModules())

  it('loads the manifest and current records without requesting the full dataset', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const path = String(input)
      if (path.endsWith('data/property-manifest.json')) return jsonResponse(manifest)
      if (path.endsWith(manifest.current_path)) return jsonResponse(dataset('current'))
      throw new Error(`unexpected request: ${path}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    const { loadCurrentDataset, loadDatasetManifest } = await import('./data')

    const [current, index] = await Promise.all([loadCurrentDataset(), loadDatasetManifest()])

    expect(current.records).toEqual([{ id: 'current' }])
    expect(index.summary.records).toBe(2)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls.flat().map(String).some(path => path.endsWith('data/properties.json'))).toBe(false)
  })

  it('loads source chunks only when the full dataset is requested', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const path = String(input)
      if (path.endsWith('data/property-manifest.json')) return jsonResponse(manifest)
      const chunk = manifest.chunks.find(item => path.endsWith(item.path))
      if (chunk) return jsonResponse(dataset(chunk.source_id))
      throw new Error(`unexpected request: ${path}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    const { loadDataset } = await import('./data')

    const full = await loadDataset()

    expect(full.records).toEqual([{ id: 'first' }, { id: 'second' }])
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
