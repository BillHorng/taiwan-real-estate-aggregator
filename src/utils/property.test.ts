import { describe, expect, it } from 'vitest'
import type { Filters, Property } from '../types/property'
import { filterProperties, formatCurrency } from './property'

const base = { id:'1', title:'臺北市中正區測試段', county:'臺北市', district:'中正區', address:null, case_number:null, description:null, reserve_price:1000000, final_price:null, total_price:1000000, property_category:'land', listing_status:'upcoming', land_area_ping:10, auction_date:'2026-12-01', last_verified_at:'2026-11-01' } as Property
const filters: Filters = { query:'', source:'', transactionType:'', county:'', district:'', minPrice:'', maxPrice:'', category:'', status:'', sort:'price_asc' }
describe('property utilities', () => {
  it('formats TWD without invented decimals', () => expect(formatCurrency(1200000)).toContain('1,200,000'))
  it('combines county and price filters', () => expect(filterProperties([base, {...base,id:'2',county:'臺中市',reserve_price:5000000}], {...filters,county:'臺北市',maxPrice:'2000000'})).toHaveLength(1))
  it('finds parcel text', () => expect(filterProperties([base], {...filters,query:'測試段'})).toHaveLength(1))
  it('filters by source and transaction type', () => expect(filterProperties([{...base, source_id:'moj', transaction_type:'auction'}], {...filters,source:'moj',transactionType:'auction'})).toHaveLength(1))
  it('excludes missing prices when a price range is active', () => {
    const missingPrice = {...base, id:'missing', reserve_price:null, final_price:null, total_price:null}
    expect(filterProperties([base, missingPrice], {...filters,minPrice:'1'})).toEqual([base])
  })
})
