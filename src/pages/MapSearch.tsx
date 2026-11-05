import L from 'leaflet'
import { AlertTriangle, ExternalLink, MapPinned } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserListings } from '../hooks/useUserListings'
import { loadAdminCentroids } from '../services/data'
import type { AdminCentroidDataset } from '../types/property'
import { groupListingsByDistrict } from '../utils/mapListings'

export default function MapSearch() {
  const { listings } = useUserListings()
  const [dataset, setDataset] = useState<AdminCentroidDataset | null>(null)
  const [error, setError] = useState('')
  const [county, setCounty] = useState('')
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set())
  const mapElement = useRef<HTMLDivElement>(null)

  useEffect(() => { loadAdminCentroids().then(setDataset).catch(reason => setError(reason instanceof Error ? reason.message : String(reason))) }, [])
  const mapped = useMemo(() => groupListingsByDistrict(listings, dataset?.records ?? []), [dataset, listings])
  const counties = useMemo(() => [...new Set(mapped.groups.map(item => item.county))].sort((a, b) => a.localeCompare(b, 'zh-Hant')), [mapped.groups])
  const filteredGroups = useMemo(() => mapped.groups.filter(item => !county || item.county === county), [county, mapped.groups])
  const visibleGroups = filteredGroups.filter(item => visibleCodes.has(item.town_code))

  useEffect(() => {
    if (!mapElement.current || !dataset) return
    const map = L.map(mapElement.current, { minZoom: 6, maxZoom: 18 }).setView([23.75, 121], 7)
    L.tileLayer('https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}', {
      attribution: '底圖 © 內政部國土測繪中心', maxZoom: 18,
    }).addTo(map)
    const townLayer = L.tileLayer('https://wmts.nlsc.gov.tw/wmts/TOWN/default/GoogleMapsCompatible/{z}/{y}/{x}', {
      attribution: '行政區界 © 內政部國土測繪中心', maxZoom: 18, opacity: 0.45,
    }).addTo(map)
    L.control.layers({}, { '鄉鎮市區界線': townLayer }, { collapsed: true }).addTo(map)

    const bounds = L.latLngBounds([])
    filteredGroups.forEach(group => {
      const point = L.latLng(group.latitude, group.longitude)
      bounds.extend(point)
      const marker = L.circleMarker(point, {
        radius: Math.min(16, 7 + group.listings.length), color: '#102008', weight: 2,
        fillColor: '#c7ff65', fillOpacity: 0.9,
      }).addTo(map)
      const popup = document.createElement('div')
      const heading = document.createElement('strong')
      heading.textContent = `${group.county}${group.district}（${group.listings.length} 筆）`
      const note = document.createElement('p')
      note.textContent = '行政區代表點，非物件精確位置。'
      popup.append(heading, note)
      group.listings.slice(0, 5).forEach(listing => {
        const link = document.createElement('a')
        link.href = `${import.meta.env.BASE_URL}#/general-listings/${encodeURIComponent(listing.id)}`
        link.textContent = listing.title
        link.className = 'map-popup-link'
        popup.append(link)
      })
      marker.bindPopup(popup)
    })
    if (county && bounds.isValid()) map.fitBounds(bounds.pad(0.35), { maxZoom: 11 })
    const updateVisible = () => {
      const current = map.getBounds()
      setVisibleCodes(new Set(filteredGroups.filter(item => current.contains([item.latitude, item.longitude])).map(item => item.town_code)))
    }
    map.on('moveend zoomend', updateVisible)
    updateVisible()
    return () => { map.off(); map.remove() }
  }, [county, dataset, filteredGroups])

  return <>
    <section className="page-header"><span className="eyebrow accent">DISTRICT-LEVEL MAP</span><h1>一般房源地圖搜尋</h1><p>將你保存的一般房源依行政區呈現，協助比較區域分布；不推測門牌或建物座標。</p></section>
    <div className="map-disclosure"><AlertTriangle/><div><strong>位置精度：行政區代表點</strong><p>同一行政區的房源會落在同一個幾何中心。此位置不能用於導航、現勘或判斷物件實際街廓。</p></div></div>
    {error ? <div className="state-panel error"><h2>地圖資料無法載入</h2><p>{error}</p></div> : !dataset ? <div className="state-panel"><div className="loader"/><p>載入官方行政區資料…</p></div> : <>
      <section className="map-toolbar" aria-label="地圖篩選"><label>縣市<select value={county} onChange={event => setCounty(event.target.value)}><option value="">全部縣市</option>{counties.map(item => <option key={item}>{item}</option>)}</select></label><span>{listings.length} 筆房源／{mapped.groups.length} 個行政區可定位</span>{mapped.unmatched > 0 && <small>{mapped.unmatched} 筆缺少可識別的縣市或行政區，未顯示於地圖。</small>}</section>
      <div ref={mapElement} className="listing-map" role="region" aria-label="一般房源行政區地圖"/>
      {!listings.length ? <div className="state-panel compact-state"><MapPinned/><h2>尚未加入一般房源</h2><p>先加入房源與縣市、行政區，地圖就會顯示區域分布。</p><Link className="primary-button" to="/general-listings">前往一般房源</Link></div> : <section className="map-results"><div className="section-heading"><div><span className="eyebrow">CURRENT MAP BOUNDS</span><h2>目前範圍內的房源</h2></div><span>{visibleGroups.reduce((sum, item) => sum + item.listings.length, 0)} 筆</span></div><div className="map-result-grid">{visibleGroups.flatMap(group => group.listings.map(item => <article key={item.id}><small>{group.county}{group.district} · 行政區代表點</small><h3>{item.title}</h3><p>{item.source_name}</p><div><Link to={`/general-listings/${item.id}`}>查看比較資料</Link><a href={item.source_url} target="_blank" rel="noopener noreferrer">原始來源 <ExternalLink size={13}/></a></div></article>))}</div></section>}
      <p className="map-attribution">行政區代表座標由<a href={dataset.source_url} target="_blank" rel="noopener noreferrer">內政部國土測繪中心鄉鎮市區界線資料</a>計算；底圖與界線圖磚由國土測繪中心提供。</p>
    </>}
  </>
}
