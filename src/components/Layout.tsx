import { BarChart3, Building2, Database, GitCompareArrows, Heart, Home, HousePlus, ListFilter, Map, Moon, Sun } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

const links = [
  ['/', '總覽', Home],
  ['/general-listings', '一般房源', HousePlus],
  ['/map', 'Google Maps', Map],
  ['/real-price', '成交行情', BarChart3],
  ['/compare', '物件比較', GitCompareArrows],
  ['/favorites', '我的收藏', Heart],
  ['/properties', '標售拍賣', ListFilter],
  ['/sources', '資料來源', Database],
] as const

export default function Layout() {
  const { theme, toggleTheme } = useTheme()
  return <div className="app-shell">
    <aside className="sidebar">
      <NavLink className="brand" to="/" aria-label="回到首頁"><span className="brand-mark"><Building2 /></span><span><strong>地產透鏡</strong><small>Realty Lens Taiwan</small></span></NavLink>
      <nav aria-label="主要導覽">{links.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-note"><span className="pulse"/>一般房源比較優先<small>使用者輸入保存在本機</small></div>
    </aside>
    <div className="main-column">
      <header className="topbar"><div><span className="eyebrow">TAIWAN REAL ESTATE INTELLIGENCE</span></div><button className="icon-button" onClick={toggleTheme} aria-label="切換深淺色模式">{theme === 'dark' ? <Sun/> : <Moon/>}</button></header>
      <main><Outlet /></main>
      <footer>一般房源請以原始刊登與現場查證為準；標售與拍賣請核對官方公告。本站不代表任何房仲或政府機關。</footer>
    </div>
  </div>
}
