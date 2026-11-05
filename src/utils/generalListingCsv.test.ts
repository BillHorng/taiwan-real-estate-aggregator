import { describe, expect, it } from 'vitest'
import type { Property } from '../types/property'
import { exportGeneralListingsCsv, parseGeneralListingCsv } from './generalListingCsv'

describe('general listing CSV', () => {
  it('parses quoted text and converts ten-thousand TWD units', () => {
    const csv = 'source_name,source_url,title,county,district,address,total_price_wan,building_area_ping,building_age,rooms,bathrooms,parking\n信義,https://example.com/1,"三房,有車位",臺北市,中山區,,1280,32,20,3,2,平面\n'
    const [item] = parseGeneralListingCsv(csv)
    expect(item.title).toBe('三房,有車位')
    expect(item.total_price).toBe(12_800_000)
  })

  it('exports a spreadsheet-safe UTF-8 CSV that can be imported again', () => {
    const item = { source_name: '來源', source_url: 'https://example.com/1', title: '候選 A', county: '臺北市', district: '中山區', address: null, total_price: 10_000_000, building_area_ping: 25, building_age: 10, rooms: 2, bathrooms: 1, parking: '無' } as Property
    const csv = exportGeneralListingsCsv([item])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(parseGeneralListingCsv(csv)[0].total_price).toBe(10_000_000)
  })
})
