import { AlertTriangle, ArrowLeft, CalendarDays, ExternalLink, FileText, Heart, MapPin, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFavorites } from '../hooks/useFavorites'
import { loadDataset } from '../services/data'
import type { Property } from '../types/property'
import { formatCurrency, formatDate, formatPing, statusLabel } from '../utils/property'

export default function PropertyDetail() {
  const { id } = useParams()
  const [item, setItem] = useState<Property>()
  const [loaded, setLoaded] = useState(false)
  const { favorites, toggle } = useFavorites()
  useEffect(() => { loadDataset().then(data => { setItem(data.records.find(entry => entry.id === id)); setLoaded(true) }) }, [id])
  if (!loaded) return <div className="state-panel">載入中…</div>
  if (!item) return <div className="state-panel"><h1>找不到這筆物件</h1><Link to="/properties">返回列表</Link></div>
  const details = [
    ['土地面積', formatPing(item.land_area_ping)], ['建物面積', formatPing(item.building_area_ping)], ['使用分區', item.source_details?.use || '未提供'], ['權利範圍', item.ownership_share || '未提供'],
    ['資料提供機關', item.source_details?.agency || item.source_name], ['標號／案號', item.case_number || '未提供'], ['保證金', formatCurrency(item.deposit)], ['點交狀態', item.handover_status || '未確認'],
  ]
  if (item.duplicate_group_id) details.push(['重複判定信心', item.duplicate_confidence != null ? `${Math.round(item.duplicate_confidence * 100)}%` : '未評分'])
  return <>
    <Link className="back-link" to="/properties"><ArrowLeft/>返回搜尋結果</Link>
    <section className="detail-header"><div><div className="card-meta"><span className="source-pill">{item.source_name}</span>{item.duplicate_group_id && <span className="duplicate-pill">疑似重複刊登</span>}<span className={`status ${item.listing_status}`}>{statusLabel[item.listing_status]}</span></div><h1>{item.title}</h1><p><MapPin size={17}/>{item.address || '地址未提供'}</p></div><button className={favorites.includes(item.id) ? 'favorite active large' : 'favorite large'} onClick={() => toggle(item.id)}><Heart fill={favorites.includes(item.id) ? 'currentColor' : 'none'}/>{favorites.includes(item.id) ? '已收藏' : '加入收藏'}</button></section>
    <div className="detail-layout"><div>
      <section className="price-panel"><div><small>{item.final_price != null ? '拍定價格（實際結果）' : '標售底價（非成交價）'}</small><strong>{formatCurrency(item.final_price ?? item.reserve_price)}</strong>{item.final_price != null && item.reserve_price != null && <small>原拍賣底價 {formatCurrency(item.reserve_price)}</small>}</div><div><small>{item.final_price != null ? '拍定日期' : '開標日期'}</small><strong><CalendarDays/>{formatDate(item.auction_date)}</strong></div></section>
      <section className="content-panel"><h2>標的資訊</h2><div className="detail-grid">{details.map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div></section>
      <section className="content-panel"><h2>官方備註</h2><p className="description">{item.description || '官方開放資料未提供備註。'}</p></section>
      <section className="warning-panel"><AlertTriangle/><div><strong>投標風險提醒</strong><p>點交、占用、地上物、權利範圍與現況等資訊必須以官方公告、謄本與現場查證為準。本平台未提供法律、估價或投資建議。</p></div></section>
      {item.duplicate_group_id && <section className="warning-panel duplicate-warning"><AlertTriangle/><div><strong>疑似重複資料，不代表已合併</strong><p>判定依據：{item.duplicate_match_basis?.join('、') || '穩定識別鍵相同'}。平台保留每一筆官方來源紀錄，請自行核對標的範圍與案件編號。</p></div></section>}
    </div><aside className="source-card"><ShieldCheck/><h2>來源可追溯</h2><p>此筆資料由官方開放資料轉換，未推測缺漏欄位。</p><dl><div><dt>最後查核</dt><dd>{new Date(item.last_verified_at).toLocaleString('zh-TW')}</dd></div><div><dt>資料品質分數</dt><dd>{Math.round(item.data_quality_score * 100)} / 100</dd></div><div><dt>位置精度</dt><dd>地號級文字，無座標</dd></div></dl><a className="primary-button" href={item.source_url} target="_blank" rel="noopener noreferrer"><FileText/>開啟官方公告<ExternalLink/></a>{item.source_details?.notice_url && <a className="secondary-link" href={item.source_details.notice_url} target="_blank" rel="noopener noreferrer">查看投標須知 <ExternalLink size={14}/></a>}</aside></div>
  </>
}
