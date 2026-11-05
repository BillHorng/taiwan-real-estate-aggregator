import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyGeneralListingFilters } from '../utils/generalListings'
import { savedSearchName, useSavedSearches } from './useSavedSearches'

describe('saved general listing searches', () => {
  beforeEach(() => localStorage.clear())
  it('saves unique filters and removes them locally', () => {
    const { result } = renderHook(() => useSavedSearches())
    const filters = { ...emptyGeneralListingFilters, county:'臺北市', district:'大安區', maxPriceWan:'2000' }
    act(() => expect(result.current.saveSearch(filters)).toBe(true))
    expect(result.current.savedSearches).toHaveLength(1)
    expect(result.current.savedSearches[0].name).toBe('臺北市 · 大安區 · 2000萬以下')
    act(() => expect(result.current.saveSearch(filters)).toBe(false))
    act(() => result.current.removeSearch(result.current.savedSearches[0].id))
    expect(result.current.savedSearches).toHaveLength(0)
  })
  it('provides a readable fallback name', () => expect(savedSearchName(emptyGeneralListingFilters)).toBe('全部一般房源'))
})
