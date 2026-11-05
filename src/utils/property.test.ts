import { describe, expect, it } from 'vitest'
import type { Filters, Property } from '../types/property'
import { filterProperties, formatCurrency } from './property'

const base = { id:'1', title:'臺北市中正區測試段', county:'臺北市', district:'中正區', address:null, case_number:null, description:null, reserve_price:1000000, final_price:null, total_price:1000000, property_category:'land', listing_status:'upcoming', land_area_ping:10, auction_date:'2026-12-01', last_verified_at:'2026-11-01' } as Property
const filters: Filters = { query:'', source:'', transactionType:'', county:'', district:'', minPrice:'', maxPrice:'', minUnitPrice:'', maxUnitPrice:'', minBuildingArea:'', maxBuildingArea:'', minLandArea:'', maxLandArea:'', maxBuildingAge:'', floor:'', minRooms:'', minBathrooms:'', parking:'', category:'', status:'', agency:'', auctionRound:'', minDeposit:'', maxDeposit:'', handover:'', ownershipShare:'', useZone:'', auctionDateFrom:'', auctionDateTo:'', sort:'price_asc' }
describe('property utilities', () => {
  it('formats TWD without invented decimals', () => expect(formatCurrency(1200000)).toContain('1,200,000'))
  it('combines county and price filters', () => expect(filterProperties([base, {...base,id:'2',county:'臺中市',reserve_price:5000000}], {...filters,county:'臺北市',maxPrice:'2000000'})).toHaveLength(1))
  it('finds parcel text', () => expect(filterProperties([base], {...filters,query:'測試段'})).toHaveLength(1))
  it('filters by source and transaction type', () => expect(filterProperties([{...base, source_id:'moj', transaction_type:'auction'}], {...filters,source:'moj',transactionType:'auction'})).toHaveLength(1))
  it('excludes missing prices when a price range is active', () => {
    const missingPrice = {...base, id:'missing', reserve_price:null, final_price:null, total_price:null}
    expect(filterProperties([base, missingPrice], {...filters,minPrice:'1'})).toEqual([base])
  })
  it('combines auction-specific ranges without accepting missing values', () => {
    const item = { ...base, auction_round: 2, deposit: 200000, handover_status: '點交', ownership_share: '全部', auction_date: '2026-12-01', unit_price: 100000, building_area_ping: 8, building_age:10, floor:'5 樓', rooms:2, bathrooms:1, parking:'平面', source_details: { agency: '測試機關', use: '住宅區' } }
    const advanced = { ...filters, auctionRound:'2', minDeposit:'100000', maxDeposit:'300000', handover:'點交', ownershipShare:'全部', agency:'測試機關', useZone:'住宅區', auctionDateFrom:'2026-11-01', auctionDateTo:'2026-12-31', minUnitPrice:'90000', minBuildingArea:'5', maxBuildingAge:'15', floor:'5', minRooms:'2', minBathrooms:'1', parking:'平面' }
    expect(filterProperties([item, { ...item, id:'wrong', deposit:null }], advanced)).toEqual([item])
  })
})
