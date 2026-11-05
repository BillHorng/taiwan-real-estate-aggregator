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
import MapSearch from './pages/MapSearch'

export default function App() {
  return <Routes><Route element={<Layout/>}><Route index element={<Dashboard/>}/><Route path="general-listings" element={<GeneralListings/>}/><Route path="general-listings/:id" element={<GeneralListingDetail/>}/><Route path="map" element={<MapSearch/>}/><Route path="real-price" element={<RealPriceAnalytics/>}/><Route path="properties" element={<Properties/>}/><Route path="properties/:id" element={<PropertyDetail/>}/><Route path="favorites" element={<Favorites/>}/><Route path="compare" element={<Compare/>}/><Route path="sources" element={<Sources/>}/><Route path="*" element={<Dashboard/>}/></Route></Routes>
}
