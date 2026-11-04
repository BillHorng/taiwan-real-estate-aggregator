import { Building2, Database, GitCompareArrows, Heart, Home, ListFilter, Moon, Sun } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

const links = [
  ['/', '總覽', Home],
  ['/properties', '標售與拍賣', ListFilter],
  ['/favorites', '我的收藏', Heart],
  ['/compare', '物件比較', GitCompareArrows],
  ['/sources', '資料來源', Database],
] as const

export default function Layout() {
  const { theme, toggleTheme } = useTheme()
  return <div className="app-shell">
    <aside className="sidebar">
      <NavLink className="brand" to="/" aria-label="回到首頁"><span className="brand-mark"><Building2 /></span><span><strong>地產透鏡</strong><small>Realty Lens Taiwan</small></span></NavLink>
      <nav aria-label="主要導覽">{links.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-note"><span className="pulse"/>多來源同步架構<small>已驗證 5 個官方來源</small></div>
    </aside>
    <div className="main-column">
      <header className="topbar"><div><span className="eyebrow">TAIWAN REAL ESTATE INTELLIGENCE</span></div><button className="icon-button" onClick={toggleTheme} aria-label="切換深淺色模式">{theme === 'dark' ? <Sun/> : <Moon/>}</button></header>
      <main><Outlet /></main>
      <footer>資料僅供資訊整合與查詢，投標前請以官方公告及現場查證為準。本站非政府機關。</footer>
    </div>
  </div>
}
