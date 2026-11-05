import { AlertTriangle, BookmarkPlus, Download, ExternalLink, FileDown, FileUp, GitCompareArrows, Heart, Pencil, Plus, ShieldCheck, Trash2, X } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCompare } from '../hooks/useCompare'
import { useFavorites } from '../hooks/useFavorites'
import { listingCompleteness, propertyToInput, type UserListingInput, useUserListings } from '../hooks/useUserListings'
import { useSavedSearches } from '../hooks/useSavedSearches'
import type { Property } from '../types/property'
import { emptyGeneralListingCsv, exportGeneralListingsCsv, parseGeneralListingCsv } from '../utils/generalListingCsv'
import { duplicateCandidatesByListing, findGeneralListingDuplicateCandidates } from '../utils/generalListingDuplicates'
import { emptyGeneralListingFilters, filterGeneralListings, type GeneralListingFilters } from '../utils/generalListings'
import { formatCurrency, formatPing } from '../utils/property'

const emptyForm: UserListingInput = {
  source_name: '', source_url: '', title: '', county: '', district: '', address: '', total_price: null,
  property_category: 'building', building_type: '', building_area_ping: null, land_area_ping: null, building_age: null,
  floor: '', rooms: null, bathrooms: null, parking: '',
  availability: 'unknown',
}
const categoryLabels = { building: '建物', land: '土地', mixed: '房地', unknown: '未分類' } as const
const buildingTypeSuggestions = ['住宅大樓', '華廈', '公寓', '透天厝', '別墅', '套房', '店面', '辦公商業大樓', '廠房', '土地', '其他']
const readNumber = (value: FormDataEntryValue | null) => value === null || value === '' ? null : Number(value)
const PAGE_SIZE = 18

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function GeneralListings() {
  const { listings, addListing, updateListing, importListings, refreshListings, removeListing } = useUserListings()
  const { compareIds, toggleCompare, isFull } = useCompare()
  const { favorites, toggle: toggleFavorite } = useFavorites()
  const { savedSearches, saveSearch, removeSearch } = useSavedSearches()
  const [showForm, setShowForm] = useState(!listings.length)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [filters, setFilters] = useState<GeneralListingFilters>(emptyGeneralListingFilters)
  const [page, setPage] = useState(1)
  const importRef = useRef<HTMLInputElement>(null)
  const refreshRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const editing = listings.find(item => item.id === editingId)
  const formValue = editing ? propertyToInput(editing) : emptyForm
  const sources = [...new Set(listings.map(item => item.source_name))].sort((a, b) => a.localeCompare(b, 'zh-TW'))
  const counties = [...new Set(listings.map(item => item.county).filter((value): value is string => Boolean(value)))].sort()
  const districts = [...new Set(listings.filter(item => !filters.county || item.county === filters.county).map(item => item.district).filter((value): value is string => Boolean(value)))].sort()
  const buildingTypes = [...new Set(listings.map(item => item.building_type).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, 'zh-TW'))
  const results = useMemo(() => filterGeneralListings(listings, filters), [listings, filters])
  const duplicateCandidates = useMemo(() => findGeneralListingDuplicateCandidates(listings), [listings])
  const duplicateIndex = useMemo(() => duplicateCandidatesByListing(duplicateCandidates), [duplicateCandidates])
  const updateFilter = (name: keyof GeneralListingFilters, value: string) => { setFilters(current => ({ ...current, [name]: value, ...(name === 'county' ? { district: '' } : {}) })); setPage(1) }

  const focusForm = () => requestAnimationFrame(() => formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }))
  const beginAdd = () => { setEditingId(null); setMessage(''); setShowForm(true); focusForm() }
  const beginEdit = (item: Property) => { setEditingId(item.id); setMessage(''); setShowForm(true); focusForm() }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const priceWan = readNumber(data.get('total_price_wan'))
    const input: UserListingInput = {
      source_name: String(data.get('source_name') ?? ''), source_url: String(data.get('source_url') ?? ''), title: String(data.get('title') ?? ''),
      county: String(data.get('county') ?? ''), district: String(data.get('district') ?? ''), address: String(data.get('address') ?? ''),
      property_category: String(data.get('property_category') ?? 'building') as UserListingInput['property_category'], building_type: String(data.get('building_type') ?? ''),
      total_price: priceWan == null ? null : priceWan * 10_000, building_area_ping: readNumber(data.get('building_area_ping')),
      land_area_ping: readNumber(data.get('land_area_ping')), building_age: readNumber(data.get('building_age')), floor: String(data.get('floor') ?? ''), rooms: readNumber(data.get('rooms')), bathrooms: readNumber(data.get('bathrooms')),
      parking: String(data.get('parking') ?? ''),
      availability: String(data.get('availability') ?? 'unknown') as UserListingInput['availability'],
    }
    try {
      const listing = editingId ? updateListing(editingId, input) : addListing(input)
      setMessage(editingId ? `已更新「${listing.title}」，價格變更會保留歷史。` : `已加入「${listing.title}」，可繼續加入其他來源後比較。`)
      setEditingId(null)
      setShowForm(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const result = importListings(parseGeneralListingCsv(await file.text()))
      const errors = result.errors.length ? `，錯誤 ${result.errors.length} 筆：${result.errors.slice(0, 2).join('；')}` : ''
      setMessage(`CSV 匯入完成：新增 ${result.added} 筆、略過重複 ${result.duplicates} 筆${errors}`)
    } catch (error) {
      setMessage(`CSV 匯入失敗：${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const refreshCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const result = refreshListings(parseGeneralListingCsv(await file.text()))
      const errors = result.errors.length ? `，錯誤 ${result.errors.length} 筆` : ''
      setMessage(`快照更新：比對 ${result.matched} 筆、新增 ${result.added} 筆、價格變動 ${result.priceChanges} 筆、狀態變動 ${result.statusChanges} 筆；檔案未包含的 ${result.missingUnchanged} 筆維持原狀${errors}`)
    } catch (error) { setMessage(`快照更新失敗：${error instanceof Error ? error.message : String(error)}`) }
  }

  const remove = (item: Property) => {
    if (compareIds.includes(item.id)) toggleCompare(item.id)
    if (favorites.includes(item.id)) toggleFavorite(item.id)
    removeListing(item.id)
    setMessage(`已移除「${item.title}」。`)
  }

  return <>
    <section className="page-header general-header">
      <span className="eyebrow accent">GENERAL LISTING WORKSPACE</span>
      <h1>一般房源比較工作台</h1>
      <p>把不同房仲網站的候選物件集中在同一張比較表。資料只保存在你的瀏覽器，不會擷取或上傳外站內容。</p>
      <div className="general-actions">
        <button className="primary-button" onClick={beginAdd}><Plus/>加入房源</button>
        <button className="workspace-button" onClick={() => importRef.current?.click()}><FileUp/>匯入 CSV</button>
        <button className="workspace-button" onClick={() => refreshRef.current?.click()}><FileUp/>更新 CSV 快照</button>
        <button className="workspace-button" onClick={() => downloadText('general-listings-template.csv', emptyGeneralListingCsv())}><FileDown/>下載範本</button>
        <button className="workspace-button" disabled={!listings.length} onClick={() => downloadText('general-listings.csv', exportGeneralListingsCsv(listings))}><Download/>匯出 CSV</button>
        <Link className="text-link" to="/compare">比較清單（{compareIds.length}）</Link>
        <input ref={importRef} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={importCsv}/>
        <input ref={refreshRef} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={refreshCsv}/>
      </div>
    </section>
    <section className="local-data-notice"><ShieldCheck/><div><strong>一般房源目前採合法的手動／CSV 整理模式</strong><p>平台尚未取得房仲網站的資料合作授權，所以不會自動顯示或擷取 591、永慶、信義等物件。請從原始頁面加入網址與比較欄位，或匯入 CSV；資料只保存在這個瀏覽器。</p><Link className="text-link" to="/sources">查看房仲官方入口與接入狀態</Link></div></section>
    {showForm && <form ref={formRef} key={editingId ?? 'new'} className="listing-form" onSubmit={submit}>
      <div className="form-heading"><div><span className="eyebrow">{editing ? 'EDIT CANDIDATE' : 'ADD A CANDIDATE'}</span><h2>{editing ? '編輯候選房源' : '加入候選房源'}</h2></div><small>* 為必填欄位</small></div>
      <div className="listing-form-grid">
        <label>來源網站 *<input name="source_name" required defaultValue={formValue.source_name} placeholder="例如：信義房屋"/></label>
        <label className="span-two">原始物件網址 *<input name="source_url" required type="url" defaultValue={formValue.source_url} placeholder="https://..."/></label>
        <label className="span-three">物件名稱 *<input name="title" required defaultValue={formValue.title} placeholder="方便辨識的物件名稱"/></label>
        <label>縣市<input name="county" defaultValue={formValue.county} placeholder="臺北市"/></label><label>行政區<input name="district" defaultValue={formValue.district} placeholder="中山區"/></label><label>地址／路段<input name="address" defaultValue={formValue.address} placeholder="可只填路段"/></label>
        <label>物件大類<select name="property_category" defaultValue={formValue.property_category}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>房屋類型<input name="building_type" list="building-type-suggestions" defaultValue={formValue.building_type} placeholder="住宅大樓／公寓／透天"/><datalist id="building-type-suggestions">{buildingTypeSuggestions.map(value => <option key={value} value={value}/>)}</datalist></label><label>樓層<input name="floor" defaultValue={formValue.floor} placeholder="例如：8／15 樓、整棟"/></label>
        <label>總價（萬元）<input name="total_price_wan" min="0" step="0.1" type="number" defaultValue={formValue.total_price == null ? '' : formValue.total_price / 10_000}/></label><label>建物坪數<input name="building_area_ping" min="0" step="0.01" type="number" defaultValue={formValue.building_area_ping ?? ''}/></label><label>土地坪數<input name="land_area_ping" min="0" step="0.01" type="number" defaultValue={formValue.land_area_ping ?? ''}/></label>
        <label>屋齡（年）<input name="building_age" min="0" step="0.1" type="number" defaultValue={formValue.building_age ?? ''}/></label>
        <label>房間<input name="rooms" min="0" step="1" type="number" defaultValue={formValue.rooms ?? ''}/></label><label>衛浴<input name="bathrooms" min="0" step="1" type="number" defaultValue={formValue.bathrooms ?? ''}/></label><label>車位<input name="parking" defaultValue={formValue.parking} placeholder="平面／機械／無"/></label><label>刊登狀態<select name="availability" defaultValue={formValue.availability}><option value="unknown">待確認</option><option value="active">使用者確認刊登中</option><option value="ended">使用者確認已結束</option></select></label>
      </div>
      {message && <p className="form-message">{message}</p>}
      <div className="form-actions"><button type="button" onClick={() => { setShowForm(false); setEditingId(null) }}>取消</button><button className="primary-button" type="submit">{editing ? '儲存變更' : '儲存到瀏覽器'}</button></div>
    </form>}
    {!showForm && message && <p className="form-message standalone">{message}</p>}
    {duplicateCandidates.length > 0 && <section className="duplicate-summary"><AlertTriangle/><div><strong>發現 {duplicateCandidates.length} 組疑似跨來源重複房源</strong><p>系統只依多項條件提示候選，不會自動合併或刪除。請開啟原始頁面逐筆確認。</p></div></section>}
    {listings.length > 0 && <section className="general-filter-panel" aria-label="一般房源篩選"><input className="general-search" value={filters.query} onChange={event => updateFilter('query', event.target.value)} placeholder="搜尋名稱、來源、地址或行政區…"/><div className="general-filter-grid">
      <label>來源<select value={filters.source} onChange={event => updateFilter('source', event.target.value)}><option value="">全部</option>{sources.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>縣市<select value={filters.county} onChange={event => updateFilter('county', event.target.value)}><option value="">全台灣</option>{counties.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>行政區<select value={filters.district} onChange={event => updateFilter('district', event.target.value)}><option value="">全部</option>{districts.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>物件大類<select value={filters.category} onChange={event => updateFilter('category', event.target.value)}><option value="">全部</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>房屋類型<select value={filters.buildingType} onChange={event => updateFilter('buildingType', event.target.value)}><option value="">全部</option>{buildingTypes.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>最低總價（萬）<input type="number" min="0" value={filters.minPriceWan} onChange={event => updateFilter('minPriceWan', event.target.value)}/></label><label>最高總價（萬）<input type="number" min="0" value={filters.maxPriceWan} onChange={event => updateFilter('maxPriceWan', event.target.value)}/></label>
      <label>最低單價（萬／坪）<input type="number" min="0" value={filters.minUnitPriceWan} onChange={event => updateFilter('minUnitPriceWan', event.target.value)}/></label><label>最高單價（萬／坪）<input type="number" min="0" value={filters.maxUnitPriceWan} onChange={event => updateFilter('maxUnitPriceWan', event.target.value)}/></label>
      <label>最低坪數<input type="number" min="0" value={filters.minArea} onChange={event => updateFilter('minArea', event.target.value)}/></label><label>最高坪數<input type="number" min="0" value={filters.maxArea} onChange={event => updateFilter('maxArea', event.target.value)}/></label>
      <label>最低土地坪數<input type="number" min="0" value={filters.minLandArea} onChange={event => updateFilter('minLandArea', event.target.value)}/></label><label>最高土地坪數<input type="number" min="0" value={filters.maxLandArea} onChange={event => updateFilter('maxLandArea', event.target.value)}/></label>
      <label>最高屋齡<input type="number" min="0" value={filters.maxAge} onChange={event => updateFilter('maxAge', event.target.value)}/></label><label>樓層<input value={filters.floor} onChange={event => updateFilter('floor', event.target.value)} placeholder="8 樓／整棟"/></label><label>至少房數<input type="number" min="0" value={filters.rooms} onChange={event => updateFilter('rooms', event.target.value)}/></label><label>至少衛浴數<input type="number" min="0" value={filters.bathrooms} onChange={event => updateFilter('bathrooms', event.target.value)}/></label><label>車位<input value={filters.parking} onChange={event => updateFilter('parking', event.target.value)} placeholder="平面／機械／無"/></label>
      <label>排序<select value={filters.sort} onChange={event => updateFilter('sort', event.target.value)}><option value="newest">最近更新</option><option value="price_asc">總價低至高</option><option value="price_desc">總價高至低</option><option value="unit_asc">單價低至高</option><option value="area_desc">坪數大至小</option></select></label>
      <button type="button" onClick={() => { setFilters(emptyGeneralListingFilters); setPage(1) }}>清除條件</button>
    </div><div className="saved-search-actions"><button type="button" onClick={() => setMessage(saveSearch(filters) ? '已將目前條件保存為本機搜尋。' : '相同搜尋條件已經保存。')}><BookmarkPlus/>儲存目前搜尋</button><small>保存在目前瀏覽器，不會背景追蹤外站。</small></div>{savedSearches.length > 0 && <div className="saved-search-list">{savedSearches.map(saved => { const count = filterGeneralListings(listings, saved.filters).length; return <div key={saved.id}><button onClick={() => { setFilters(saved.filters); setPage(1) }}><strong>{saved.name}</strong><span>{count} 筆目前符合</span></button><button aria-label={`刪除搜尋${saved.name}`} onClick={() => removeSearch(saved.id)}><X/></button></div> })}</div>}</section>}
    <section className="section-heading"><div><span className="eyebrow">YOUR CANDIDATES</span><h2>候選房源</h2><p>{listings.length ? `符合 ${results.length}／共 ${listings.length} 筆，選取後可並排比較` : '尚未加入任何一般房源'}</p></div></section>
    {!listings.length ? <div className="state-panel"><GitCompareArrows/><h2>先加入第一筆候選房源</h2><p>1. 開啟上方的房仲官方入口　2. 複製物件網址與主要條件　3. 回來加入並比較。也可以直接下載 CSV 範本批次整理。</p><div className="hero-actions"><button className="primary-button" onClick={beginAdd}>開啟加入表單</button><Link className="workspace-button" to="/sources">選擇房仲網站</Link></div></div> : !results.length ? <div className="state-panel"><h2>找不到符合條件的房源</h2><button className="primary-button" onClick={() => setFilters(emptyGeneralListingFilters)}>清除篩選</button></div> : <><div className="general-listing-grid">{results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(item => {
      const selected = compareIds.includes(item.id)
      const favorite = favorites.includes(item.id)
      const completeness = listingCompleteness(item)
      const history = item.price_history ?? []
      const itemCandidates = duplicateIndex.get(item.id) ?? []
      const previousPrice = history.length > 1 ? history.at(-2)?.price : null
      const priceDelta = previousPrice != null && item.total_price != null ? item.total_price - previousPrice : null
      return <article className="general-listing-card" key={item.id}>
        <div className="card-meta"><span className="source-pill">{item.source_name}</span><span className="listing-type-pill">{item.building_type || categoryLabels[item.property_category]}</span>{item.source_details?.availability === 'ended' && <span className="listing-ended-pill">已結束</span>}<span className="completeness" title="主要比較欄位完整度">{completeness}% 完整</span><button className={favorite ? 'favorite active' : 'favorite'} onClick={() => toggleFavorite(item.id)} aria-label={favorite ? `取消收藏${item.title}` : `收藏${item.title}`}><Heart fill={favorite ? 'currentColor' : 'none'}/></button></div>
        <h3><Link to={`/general-listings/${item.id}`}>{item.title}</Link></h3><p>{[item.county, item.district, item.address].filter(Boolean).join(' ') || '地點未填寫'}</p>
        <div className="general-price"><strong>{formatCurrency(item.total_price)}</strong><small>{item.unit_price ? `${formatCurrency(item.unit_price)}／${item.property_category === 'land' ? '土地坪' : '建坪'}` : '單價待補'}</small>{priceDelta !== null && <span className={priceDelta <= 0 ? 'price-down' : 'price-up'}>{priceDelta <= 0 ? '降價' : '漲價'} {formatCurrency(Math.abs(priceDelta))} · 共 {history.length} 次紀錄</span>}</div>
        <dl><div><dt>{item.property_category === 'land' ? '土地' : '建物'}</dt><dd>{formatPing(item.property_category === 'land' ? item.land_area_ping : item.building_area_ping)}</dd></div><div><dt>樓層／屋齡</dt><dd>{item.floor || (item.building_age == null ? '未填' : `${item.building_age} 年`)}</dd></div><div><dt>格局</dt><dd>{item.rooms == null ? '未填' : `${item.rooms} 房`}</dd></div></dl>
        {itemCandidates.length > 0 && <div className="duplicate-card-warning"><AlertTriangle/><span>疑似與 {itemCandidates.length} 筆其他來源房源重複</span>{itemCandidates.slice(0, 2).map(candidate => { const otherId = candidate.leftId === item.id ? candidate.rightId : candidate.leftId; const other = listings.find(listing => listing.id === otherId); return other ? <Link key={otherId} to={`/general-listings/${otherId}`}>{other.source_name} · {Math.round(candidate.confidence * 100)}%</Link> : null })}</div>}
        <div className="general-card-actions"><a href={item.source_url} target="_blank" rel="noopener noreferrer">原始頁面 <ExternalLink/></a><button className={selected ? 'compare-button active' : 'compare-button'} disabled={!selected && isFull} onClick={() => toggleCompare(item.id)}><GitCompareArrows/>{selected ? '已選比較' : '加入比較'}</button><button className="edit-listing" onClick={() => beginEdit(item)} aria-label={`編輯${item.title}`}><Pencil/></button><button className="delete-listing" onClick={() => remove(item)} aria-label={`刪除${item.title}`}><Trash2/></button></div>
      </article>
    })}</div>{results.length > PAGE_SIZE && <div className="pagination"><button disabled={page === 1} onClick={() => setPage(value => value - 1)}>上一頁</button><span>第 {page} / {Math.ceil(results.length / PAGE_SIZE)} 頁</span><button disabled={page * PAGE_SIZE >= results.length} onClick={() => setPage(value => value + 1)}>下一頁</button></div>}</>}
  </>
}
