import { Download, ExternalLink, FileDown, FileUp, GitCompareArrows, Heart, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCompare } from '../hooks/useCompare'
import { useFavorites } from '../hooks/useFavorites'
import { listingCompleteness, propertyToInput, type UserListingInput, useUserListings } from '../hooks/useUserListings'
import type { Property } from '../types/property'
import { emptyGeneralListingCsv, exportGeneralListingsCsv, parseGeneralListingCsv } from '../utils/generalListingCsv'
import { emptyGeneralListingFilters, filterGeneralListings, type GeneralListingFilters } from '../utils/generalListings'
import { formatCurrency, formatPing } from '../utils/property'

const emptyForm: UserListingInput = {
  source_name: '', source_url: '', title: '', county: '', district: '', address: '', total_price: null,
  building_area_ping: null, building_age: null, rooms: null, bathrooms: null, parking: '',
}
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
  const { listings, addListing, updateListing, importListings, removeListing } = useUserListings()
  const { compareIds, toggleCompare, isFull } = useCompare()
  const { favorites, toggle: toggleFavorite } = useFavorites()
  const [showForm, setShowForm] = useState(!listings.length)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [filters, setFilters] = useState<GeneralListingFilters>(emptyGeneralListingFilters)
  const [page, setPage] = useState(1)
  const importRef = useRef<HTMLInputElement>(null)
  const editing = listings.find(item => item.id === editingId)
  const formValue = editing ? propertyToInput(editing) : emptyForm
  const sources = [...new Set(listings.map(item => item.source_name))].sort((a, b) => a.localeCompare(b, 'zh-TW'))
  const counties = [...new Set(listings.map(item => item.county).filter((value): value is string => Boolean(value)))].sort()
  const districts = [...new Set(listings.filter(item => !filters.county || item.county === filters.county).map(item => item.district).filter((value): value is string => Boolean(value)))].sort()
  const results = useMemo(() => filterGeneralListings(listings, filters), [listings, filters])
  const updateFilter = (name: keyof GeneralListingFilters, value: string) => { setFilters(current => ({ ...current, [name]: value, ...(name === 'county' ? { district: '' } : {}) })); setPage(1) }

  const beginAdd = () => { setEditingId(null); setMessage(''); setShowForm(true) }
  const beginEdit = (item: Property) => { setEditingId(item.id); setMessage(''); setShowForm(true) }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const priceWan = readNumber(data.get('total_price_wan'))
    const input: UserListingInput = {
      source_name: String(data.get('source_name') ?? ''), source_url: String(data.get('source_url') ?? ''), title: String(data.get('title') ?? ''),
      county: String(data.get('county') ?? ''), district: String(data.get('district') ?? ''), address: String(data.get('address') ?? ''),
      total_price: priceWan == null ? null : priceWan * 10_000, building_area_ping: readNumber(data.get('building_area_ping')),
      building_age: readNumber(data.get('building_age')), rooms: readNumber(data.get('rooms')), bathrooms: readNumber(data.get('bathrooms')),
      parking: String(data.get('parking') ?? ''),
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
        <button className="workspace-button" onClick={() => downloadText('general-listings-template.csv', emptyGeneralListingCsv())}><FileDown/>下載範本</button>
        <button className="workspace-button" disabled={!listings.length} onClick={() => downloadText('general-listings.csv', exportGeneralListingsCsv(listings))}><Download/>匯出 CSV</button>
        <Link className="text-link" to="/compare">比較清單（{compareIds.length}）</Link>
        <input ref={importRef} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={importCsv}/>
      </div>
    </section>
    <section className="local-data-notice"><ShieldCheck/><div><strong>使用者輸入模式</strong><p>請從原始頁面自行核對價格與內容。本功能不代表平台已獲得該網站資料授權，也不會複製照片或完整文案。</p></div></section>
    {showForm && <form key={editingId ?? 'new'} className="listing-form" onSubmit={submit}>
      <div className="form-heading"><div><span className="eyebrow">{editing ? 'EDIT CANDIDATE' : 'ADD A CANDIDATE'}</span><h2>{editing ? '編輯候選房源' : '加入候選房源'}</h2></div><small>* 為必填欄位</small></div>
      <div className="listing-form-grid">
        <label>來源網站 *<input name="source_name" required defaultValue={formValue.source_name} placeholder="例如：信義房屋"/></label>
        <label className="span-two">原始物件網址 *<input name="source_url" required type="url" defaultValue={formValue.source_url} placeholder="https://..."/></label>
        <label className="span-three">物件名稱 *<input name="title" required defaultValue={formValue.title} placeholder="方便辨識的物件名稱"/></label>
        <label>縣市<input name="county" defaultValue={formValue.county} placeholder="臺北市"/></label><label>行政區<input name="district" defaultValue={formValue.district} placeholder="中山區"/></label><label>地址／路段<input name="address" defaultValue={formValue.address} placeholder="可只填路段"/></label>
        <label>總價（萬元）<input name="total_price_wan" min="0" step="0.1" type="number" defaultValue={formValue.total_price == null ? '' : formValue.total_price / 10_000}/></label><label>建物坪數<input name="building_area_ping" min="0" step="0.01" type="number" defaultValue={formValue.building_area_ping ?? ''}/></label><label>屋齡（年）<input name="building_age" min="0" step="0.1" type="number" defaultValue={formValue.building_age ?? ''}/></label>
        <label>房間<input name="rooms" min="0" step="1" type="number" defaultValue={formValue.rooms ?? ''}/></label><label>衛浴<input name="bathrooms" min="0" step="1" type="number" defaultValue={formValue.bathrooms ?? ''}/></label><label>車位<input name="parking" defaultValue={formValue.parking} placeholder="平面／機械／無"/></label>
      </div>
      {message && <p className="form-message">{message}</p>}
      <div className="form-actions"><button type="button" onClick={() => { setShowForm(false); setEditingId(null) }}>取消</button><button className="primary-button" type="submit">{editing ? '儲存變更' : '儲存到瀏覽器'}</button></div>
    </form>}
    {!showForm && message && <p className="form-message standalone">{message}</p>}
    {listings.length > 0 && <section className="general-filter-panel" aria-label="一般房源篩選"><input className="general-search" value={filters.query} onChange={event => updateFilter('query', event.target.value)} placeholder="搜尋名稱、來源、地址或行政區…"/><div className="general-filter-grid">
      <label>來源<select value={filters.source} onChange={event => updateFilter('source', event.target.value)}><option value="">全部</option>{sources.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>縣市<select value={filters.county} onChange={event => updateFilter('county', event.target.value)}><option value="">全台灣</option>{counties.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>行政區<select value={filters.district} onChange={event => updateFilter('district', event.target.value)}><option value="">全部</option>{districts.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>最低總價（萬）<input type="number" min="0" value={filters.minPriceWan} onChange={event => updateFilter('minPriceWan', event.target.value)}/></label><label>最高總價（萬）<input type="number" min="0" value={filters.maxPriceWan} onChange={event => updateFilter('maxPriceWan', event.target.value)}/></label>
      <label>最低坪數<input type="number" min="0" value={filters.minArea} onChange={event => updateFilter('minArea', event.target.value)}/></label><label>最高坪數<input type="number" min="0" value={filters.maxArea} onChange={event => updateFilter('maxArea', event.target.value)}/></label>
      <label>最高屋齡<input type="number" min="0" value={filters.maxAge} onChange={event => updateFilter('maxAge', event.target.value)}/></label><label>至少房數<input type="number" min="0" value={filters.rooms} onChange={event => updateFilter('rooms', event.target.value)}/></label><label>至少衛浴數<input type="number" min="0" value={filters.bathrooms} onChange={event => updateFilter('bathrooms', event.target.value)}/></label><label>車位<input value={filters.parking} onChange={event => updateFilter('parking', event.target.value)} placeholder="平面／機械／無"/></label>
      <label>排序<select value={filters.sort} onChange={event => updateFilter('sort', event.target.value)}><option value="newest">最近更新</option><option value="price_asc">總價低至高</option><option value="price_desc">總價高至低</option><option value="unit_asc">單價低至高</option><option value="area_desc">坪數大至小</option></select></label>
      <button type="button" onClick={() => { setFilters(emptyGeneralListingFilters); setPage(1) }}>清除條件</button>
    </div></section>}
    <section className="section-heading"><div><span className="eyebrow">YOUR CANDIDATES</span><h2>候選房源</h2><p>{listings.length ? `符合 ${results.length}／共 ${listings.length} 筆，選取後可並排比較` : '尚未加入任何一般房源'}</p></div></section>
    {!listings.length ? <div className="state-panel"><GitCompareArrows/><h2>先加入第一筆候選房源</h2><p>開啟房仲網站的物件頁，將網址與主要條件填入即可開始。</p><button className="primary-button" onClick={beginAdd}>加入房源</button></div> : !results.length ? <div className="state-panel"><h2>找不到符合條件的房源</h2><button className="primary-button" onClick={() => setFilters(emptyGeneralListingFilters)}>清除篩選</button></div> : <><div className="general-listing-grid">{results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(item => {
      const selected = compareIds.includes(item.id)
      const favorite = favorites.includes(item.id)
      const completeness = listingCompleteness(item)
      const history = item.price_history ?? []
      const previousPrice = history.length > 1 ? history.at(-2)?.price : null
      const priceDelta = previousPrice != null && item.total_price != null ? item.total_price - previousPrice : null
      return <article className="general-listing-card" key={item.id}>
        <div className="card-meta"><span className="source-pill">{item.source_name}</span><span className="completeness" title="主要比較欄位完整度">{completeness}% 完整</span><button className={favorite ? 'favorite active' : 'favorite'} onClick={() => toggleFavorite(item.id)} aria-label={favorite ? `取消收藏${item.title}` : `收藏${item.title}`}><Heart fill={favorite ? 'currentColor' : 'none'}/></button></div>
        <h3><Link to={`/general-listings/${item.id}`}>{item.title}</Link></h3><p>{[item.county, item.district, item.address].filter(Boolean).join(' ') || '地點未填寫'}</p>
        <div className="general-price"><strong>{formatCurrency(item.total_price)}</strong><small>{item.unit_price ? `${formatCurrency(item.unit_price)}／坪` : '單價待補'}</small>{priceDelta !== null && <span className={priceDelta <= 0 ? 'price-down' : 'price-up'}>{priceDelta <= 0 ? '降價' : '漲價'} {formatCurrency(Math.abs(priceDelta))} · 共 {history.length} 次紀錄</span>}</div>
        <dl><div><dt>建物</dt><dd>{formatPing(item.building_area_ping)}</dd></div><div><dt>屋齡</dt><dd>{item.building_age == null ? '未填' : `${item.building_age} 年`}</dd></div><div><dt>格局</dt><dd>{item.rooms == null ? '未填' : `${item.rooms} 房`}</dd></div></dl>
        <div className="general-card-actions"><a href={item.source_url} target="_blank" rel="noopener noreferrer">原始頁面 <ExternalLink/></a><button className={selected ? 'compare-button active' : 'compare-button'} disabled={!selected && isFull} onClick={() => toggleCompare(item.id)}><GitCompareArrows/>{selected ? '已選比較' : '加入比較'}</button><button className="edit-listing" onClick={() => beginEdit(item)} aria-label={`編輯${item.title}`}><Pencil/></button><button className="delete-listing" onClick={() => remove(item)} aria-label={`刪除${item.title}`}><Trash2/></button></div>
      </article>
    })}</div>{results.length > PAGE_SIZE && <div className="pagination"><button disabled={page === 1} onClick={() => setPage(value => value - 1)}>上一頁</button><span>第 {page} / {Math.ceil(results.length / PAGE_SIZE)} 頁</span><button disabled={page * PAGE_SIZE >= results.length} onClick={() => setPage(value => value + 1)}>下一頁</button></div>}</>}
  </>
}
