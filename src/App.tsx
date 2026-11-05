import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Favorites from './pages/Favorites'
import Properties from './pages/Properties'
import PropertyDetail from './pages/PropertyDetail'
import Sources from './pages/Sources'
import Compare from './pages/Compare'
import GeneralListings from './pages/GeneralListings'
import GeneralListingDetail from './pages/GeneralListingDetail'
import RealPriceAnalytics from './pages/RealPriceAnalytics'
import AuctionCategory from './pages/AuctionCategory'

const MapSearch = lazy(() => import('./pages/MapSearch'))

export default function App() {
  return <Routes><Route element={<Layout/>}><Route index element={<Dashboard/>}/><Route path="general-listings" element={<GeneralListings/>}/><Route path="general-listings/:id" element={<GeneralListingDetail/>}/><Route path="map" element={<Suspense fallback={<div className="state-panel"><div className="loader"/><p>載入地圖模組…</p></div>}><MapSearch/></Suspense>}/><Route path="real-price" element={<RealPriceAnalytics/>}/><Route path="properties" element={<Properties/>}/><Route path="properties/:id" element={<PropertyDetail/>}/><Route path="judicial-auctions" element={<AuctionCategory kind="judicial"/>}/><Route path="enforcement-auctions" element={<AuctionCategory kind="enforcement"/>}/><Route path="financial-auctions" element={<AuctionCategory kind="financial"/>}/><Route path="favorites" element={<Favorites/>}/><Route path="compare" element={<Compare/>}/><Route path="sources" element={<Sources/>}/><Route path="*" element={<Dashboard/>}/></Route></Routes>
}
