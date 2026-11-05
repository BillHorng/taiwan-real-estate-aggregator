import { AlertTriangle, ExternalLink, KeyRound, MapPinned, ScanLine, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserListings } from '../hooks/useUserListings'
import { loadAdminCentroids } from '../services/data'
import { loadGoogleMaps } from '../services/googleMaps'
import type { AdminCentroidDataset } from '../types/property'
import { groupListingsByDistrict, rectangleBounds } from '../utils/mapListings'

type MapStatus = 'loading' | 'ready' | 'missing-key' | 'error'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? ''

export default function MapSearch() {
  const { listings } = useUserListings()
  const [dataset, setDataset] = useState<AdminCentroidDataset | null>(null)
  const [dataError, setDataError] = useState('')
  const [mapError, setMapError] = useState('')
  const [mapStatus, setMapStatus] = useState<MapStatus>(apiKey ? 'loading' : 'missing-key')
  const [county, setCounty] = useState('')
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set())
  const [selectedBounds, setSelectedBounds] = useState<[number, number, number, number] | null>(null)
  const [drawing, setDrawing] = useState(false)
  const mapElement = useRef<HTMLDivElement>(null)
  const drawingRef = useRef(false)
  const firstCorner = useRef<google.maps.LatLng | null>(null)

  useEffect(() => { loadAdminCentroids().then(setDataset).catch(reason => setDataError(reason instanceof Error ? reason.message : String(reason))) }, [])
  const mapped = useMemo(() => groupListingsByDistrict(listings, dataset?.records ?? []), [dataset, listings])
  const counties = useMemo(() => [...new Set(mapped.groups.map(item => item.county))].sort((a, b) => a.localeCompare(b, 'zh-Hant')), [mapped.groups])
  const filteredGroups = useMemo(() => mapped.groups.filter(item => !county || item.county === county), [county, mapped.groups])
  const visibleGroups = mapStatus === 'ready' ? filteredGroups.filter(item => visibleCodes.has(item.town_code)) : filteredGroups

  useEffect(() => {
    if (!mapElement.current || !dataset || !apiKey) return
    let cancelled = false
    const circles: google.maps.Circle[] = []
    const listeners: google.maps.MapsEventListener[] = []
    let selectionShape: google.maps.Rectangle | null = null
    let cornerMarker: google.maps.Circle | null = null
    setMapStatus('loading')
    setMapError('')

    const initialize = async () => {
      try {
        await loadGoogleMaps(apiKey)
        await google.maps.importLibrary('maps')
        if (cancelled || !mapElement.current) return

        const map = new google.maps.Map(mapElement.current, {
          center: { lat: 23.75, lng: 121 },
          zoom: 7,
          mapTypeControl: true,
          mapTypeControlOptions: { mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'] },
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: 'greedy',
        })
        const infoWindow = new google.maps.InfoWindow()
        const bounds = new google.maps.LatLngBounds()

        filteredGroups.forEach(group => {
          const center = { lat: group.latitude, lng: group.longitude }
          bounds.extend(center)
          const circle = new google.maps.Circle({
            map,
            center,
            radius: Math.min(4_000, 1_000 + group.listings.length * 240),
            strokeColor: '#102008',
            strokeOpacity: 0.95,
            strokeWeight: 2,
            fillColor: '#b7f34a',
            fillOpacity: 0.78,
          })
          circles.push(circle)
          listeners.push(circle.addListener('click', () => {
            const popup = document.createElement('div')
            popup.className = 'google-map-popup'
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
            infoWindow.setContent(popup)
            infoWindow.setPosition(center)
            infoWindow.open({ map })
          }))
        })

        if (selectedBounds) {
          const area = { south: selectedBounds[0], west: selectedBounds[1], north: selectedBounds[2], east: selectedBounds[3] }
          selectionShape = new google.maps.Rectangle({ map, bounds: area, strokeColor: '#d49b22', strokeWeight: 2, fillColor: '#e8b650', fillOpacity: 0.1 })
          map.fitBounds(area, 48)
        } else if (county && !bounds.isEmpty()) {
          map.fitBounds(bounds, 60)
        }

        const updateVisible = () => {
          const current = selectedBounds
            ? new google.maps.LatLngBounds({ lat: selectedBounds[0], lng: selectedBounds[1] }, { lat: selectedBounds[2], lng: selectedBounds[3] })
            : map.getBounds()
          if (!current) return
          setVisibleCodes(new Set(filteredGroups.filter(item => current.contains({ lat: item.latitude, lng: item.longitude })).map(item => item.town_code)))
        }
        listeners.push(map.addListener('idle', updateVisible))
        listeners.push(map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (!drawingRef.current || !event.latLng) return
          if (!firstCorner.current) {
            firstCorner.current = event.latLng
            cornerMarker?.setMap(null)
            cornerMarker = new google.maps.Circle({ map, center: event.latLng, radius: 250, fillColor: '#e8b650', fillOpacity: 1, strokeColor: '#8c6511', strokeWeight: 2 })
            return
          }
          const area = rectangleBounds([firstCorner.current.lat(), firstCorner.current.lng()], [event.latLng.lat(), event.latLng.lng()])
          drawingRef.current = false
          firstCorner.current = null
          setDrawing(false)
          setSelectedBounds(area)
        }))
        setMapStatus('ready')
        updateVisible()
      } catch (reason) {
        if (cancelled) return
        setMapStatus('error')
        setMapError(reason instanceof Error ? reason.message : String(reason))
      }
    }
    void initialize()
    return () => {
      cancelled = true
      listeners.forEach(listener => listener.remove())
      circles.forEach(circle => circle.setMap(null))
      selectionShape?.setMap(null)
      cornerMarker?.setMap(null)
    }
  }, [county, dataset, filteredGroups, selectedBounds])

  const beginRectangle = () => {
    drawingRef.current = true
    firstCorner.current = null
    setDrawing(true)
  }
  const clearRectangle = () => { drawingRef.current = false; firstCorner.current = null; setDrawing(false); setSelectedBounds(null) }

  return <>
    <section className="page-header"><span className="eyebrow accent">GOOGLE MAPS</span><h1>Google Maps 地圖搜尋</h1><p>將你保存的一般房源依行政區呈現，協助比較區域分布；不推測門牌或建物座標。</p></section>
    <div className="map-disclosure"><AlertTriangle/><div><strong>位置精度：行政區代表點</strong><p>同一行政區的房源會落在同一個幾何中心。此位置不能用於導航、現勘或判斷物件實際街廓。</p></div></div>
    {dataError ? <div className="state-panel error"><h2>行政區資料無法載入</h2><p>{dataError}</p></div> : !dataset ? <div className="state-panel"><div className="loader"/><p>載入官方行政區資料…</p></div> : <>
      <section className="map-toolbar" aria-label="地圖篩選"><label>縣市<select value={county} onChange={event => { setCounty(event.target.value); clearRectangle() }}><option value="">全部縣市</option>{counties.map(item => <option key={item}>{item}</option>)}</select></label><span>{listings.length} 筆房源／{mapped.groups.length} 個行政區可定位</span><div className="map-draw-actions"><button className={drawing ? 'active' : ''} disabled={mapStatus !== 'ready'} onClick={beginRectangle}><ScanLine/>{drawing ? '請在地圖點選兩個角' : '框選矩形範圍'}</button>{selectedBounds && <button onClick={clearRectangle}><X/>清除框選</button>}</div>{mapped.unmatched > 0 && <small>{mapped.unmatched} 筆缺少可識別的縣市或行政區，未顯示於地圖。</small>}</section>
      {mapStatus === 'missing-key' && <div className="state-panel map-key-state"><KeyRound/><h2>Google Maps 尚未設定</h2><p>請在本機設定 <code>VITE_GOOGLE_MAPS_API_KEY</code>，並在 GitHub Repository 建立 <code>GOOGLE_MAPS_API_KEY</code> Actions secret。未設定前，下面仍會顯示可定位的房源清單。</p></div>}
      {mapStatus === 'error' && <div className="state-panel error"><AlertTriangle/><h2>Google Maps 載入失敗</h2><p>{mapError || '請檢查 API Key、Maps JavaScript API、帳務與 HTTP referrer 限制。'}</p></div>}
      <div className={`map-stage ${mapStatus}`}>
        {mapStatus === 'loading' && <div className="state-panel map-loading"><div className="loader"/><p>載入 Google Maps…</p></div>}
        <div ref={mapElement} className="listing-map" role="region" aria-label="Google Maps 一般房源行政區地圖"/>
      </div>
      {!listings.length ? <div className="state-panel compact-state"><MapPinned/><h2>尚未加入一般房源</h2><p>先加入房源與縣市、行政區，Google Maps 就會顯示區域分布。</p><Link className="primary-button" to="/general-listings">前往一般房源</Link></div> : <section className="map-results"><div className="section-heading"><div><span className="eyebrow">CURRENT MAP BOUNDS</span><h2>{selectedBounds ? '矩形框選內的房源' : mapStatus === 'ready' ? '目前地圖範圍內的房源' : '可定位的房源'}</h2></div><span>{visibleGroups.reduce((sum, item) => sum + item.listings.length, 0)} 筆</span></div><div className="map-result-grid">{visibleGroups.flatMap(group => group.listings.map(item => <article key={item.id}><small>{group.county}{group.district} · 行政區代表點</small><h3>{item.title}</h3><p>{item.source_name}</p><div><Link to={`/general-listings/${item.id}`}>查看比較資料</Link><a href={item.source_url} target="_blank" rel="noopener noreferrer">原始來源 <ExternalLink size={13}/></a></div></article>))}</div></section>}
      <p className="map-attribution">行政區代表座標由<a href={dataset.source_url} target="_blank" rel="noopener noreferrer">內政部國土測繪中心鄉鎮市區界線資料</a>計算；互動底圖使用 Google Maps。</p>
    </>}
  </>
}
