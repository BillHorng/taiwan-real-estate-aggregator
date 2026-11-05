import { CheckCircle2, ExternalLink, Link2, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { loadDatasetManifest, loadSourceRegistry, loadSyncStatus } from '../services/data'
import type { SyncStatus } from '../types/property'

type Source = {
  id: string; name: string; organization: string; official_url: string; data_type: string[]
  access_method: string; integration_status: string; license: string; update_frequency: string
  notes: string; last_successful_sync: string | null
}

export default function Sources() {
  const [sources, setSources] = useState<Source[]>([])
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({})
  const [generatedAt, setGeneratedAt] = useState('')
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([loadSourceRegistry(), loadDatasetManifest(), loadSyncStatus()])
      .then(([registry, manifest, health]) => {
        setSources(registry.sources)
        setGeneratedAt(manifest.generated_at)
        setRecordCounts(manifest.source_counts)
        setSyncStatus(health)
      })
      .catch(cause => setError(cause instanceof Error ? cause.message : String(cause)))
  }, [])

  if (error) return <div className="state-panel error"><h1>資料來源狀態暫時無法載入</h1><p>{error}</p></div>

  const integratedCount = sources.filter(source => source.integration_status === 'integrated').length
  const generalSources = sources.filter(source => source.data_type.includes('一般房源'))
  const integratedGeneralCount = generalSources.filter(source => source.integration_status === 'integrated').length
  const officialLinkCount = sources.filter(source => source.integration_status === 'official_link_only').length
  const researchCount = sources.filter(source => source.integration_status === 'research_required').length
  const orderedSources = [...generalSources, ...sources.filter(source => !source.data_type.includes('一般房源'))]
  return <>
    <section className="page-header">
      <span className="eyebrow accent">DATA SOURCE REGISTRY</span>
      <h1>資料來源與透明度</h1>
      <p>目前已有 {integratedCount} 個經實際下載驗證的政府來源；一般房源尚無授權資料接入。資料快照 {generatedAt ? new Date(generatedAt).toLocaleString('zh-TW') : '載入中'}。</p>
    </section>
    <section className="source-coverage" aria-label="資料來源涵蓋摘要">
      <article><small>實際整合來源</small><strong>{integratedCount}</strong><span>已有資料與連接器</span></article>
      <article className="warning"><small>一般房源接入</small><strong>{integratedGeneralCount} / {generalSources.length}</strong><span>目前僅提供官方入口</span></article>
      <article><small>官方連結模式</small><strong>{officialLinkCount}</strong><span>未複製物件資料</span></article>
      <article><small>研究／授權中</small><strong>{researchCount}</strong><span>不宣稱已完成</span></article>
    </section>
    <section className="coverage-disclosure">
      <ShieldAlert/>
      <div><strong>一般房源目前為 0 筆整合資料</strong><p>下列房仲入口僅供使用者前往官方網站。本平台尚未取得 API、資料檔或合作授權，因此不會在統一搜尋中顯示這些網站的物件。</p></div>
    </section>
    <section className="principles">
      <article><CheckCircle2/><h3>優先官方開放資料</h3><p>使用正式 API 或明確授權下載，並保留顯名與原始連結。</p></article>
      <article><Link2/><h3>無權擷取則只連結</h3><p>民間網站不因公開可讀就自動批次擷取。</p></article>
      <article><ShieldAlert/><h3>未知就是未知</h3><p>沒有座標、點交或成交資訊時，不用推測值補齊。</p></article>
    </section>
    <div className="source-table-wrap">
      <table className="source-table">
        <thead><tr><th>來源</th><th>資料類型</th><th>接入方式</th><th>授權／條件</th><th>狀態／健康</th><th/></tr></thead>
        <tbody>{orderedSources.map(source => {
          const count = recordCounts[source.id] ?? 0
          const health = syncStatus?.sources[source.id]
          const isGeneralListing = source.data_type.includes('一般房源')
          const status = source.integration_status === 'integrated' ? health?.status === 'stale' ? '沿用舊資料' : health?.status === 'failed' ? '同步失敗' : count ? '同步成功' : '資料異常' : source.integration_status === 'official_link_only' ? '未接入｜官方入口' : '待驗證／授權'
          return <tr key={source.id}>
            <td><strong>{source.name}</strong>{isGeneralListing && <span className="source-kind">一般房源</span>}<small>{source.organization}</small><small>{source.notes}</small></td>
            <td>{source.data_type.join('、')}</td><td>{source.access_method}</td><td>{source.license}</td>
            <td><span className={`integration ${source.integration_status} ${health?.status ?? ''}`}>{status}</span>{source.integration_status === 'integrated' && <small>快照紀錄：{count.toLocaleString()} 筆</small>}{isGeneralListing && source.integration_status !== 'integrated' && <small>平台物件：0 筆</small>}<small>{health?.last_success_at ? `上次成功：${new Date(health.last_success_at).toLocaleString('zh-TW')}` : source.last_successful_sync ? `登錄時間：${new Date(source.last_successful_sync).toLocaleString('zh-TW')}` : source.update_frequency}</small>{health?.error && <small className="health-error">{health.error}</small>}</td>
            <td><a href={source.official_url} target="_blank" rel="noopener noreferrer" aria-label={`前往${source.name}官方網站`} title="開啟官方網站"><ExternalLink/></a></td>
          </tr>
        })}</tbody>
      </table>
    </div>
    {syncStatus && <section className="health-history"><div><span className={`health-dot ${syncStatus.overall}`}/><strong>整體同步狀態：{syncStatus.overall === 'healthy' ? '正常' : syncStatus.overall === 'degraded' ? '部分來源沿用舊資料' : '全部沿用舊資料'}</strong><small>最近保留 {syncStatus.history.length} 次執行紀錄</small></div><div className="health-runs">{syncStatus.history.slice(-12).map(run => <span key={run.at} className={run.overall} title={`${new Date(run.at).toLocaleString('zh-TW')} · ${run.records} 筆`}/>)}</div></section>}
    <section className="license-note"><h2>顯名與免責</h2><p>已整合資料均依「政府資料開放授權條款第 1 版」利用；本平台標示提供機關、資料集與原始公告。同步成功僅代表最新快照含有效紀錄，不代表官方來源持續可用。</p></section>
  </>
}
