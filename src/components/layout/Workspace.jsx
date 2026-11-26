import { useEffect, useRef, useState } from 'react'
import { BarChart3, CalendarDays, ChevronRight, ClipboardList, Database, Download, LayoutDashboard, Menu, Table2, X } from 'lucide-react'
import { formatPeriod } from '../../utils/dateUtils.js'

export const pages = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard, title: 'Executive Overview', description: 'Track revenue, orders, and customer activity across your reporting period.' },
  { id: 'sales', name: 'Sales Analytics', icon: BarChart3, title: 'Sales Analytics', description: 'Explore monthly sales trends, product categories, and customer markets.' },
  { id: 'reports', name: 'Performance Reports', icon: ClipboardList, title: 'Performance Reports', description: 'Review your leading products, customers, and sales employees.' },
  { id: 'orders', name: 'Orders', icon: Table2, title: 'Orders', description: 'Search, sort, and export individual orders for your reporting period.' },
]

export default function Workspace({ page, period, bounds, onExport, children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef(null)
  const closeButton = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const mobile = window.matchMedia('(max-width: 760px)')
    const onEscape = event => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        requestAnimationFrame(() => menuButton.current?.focus())
      }
    }
    const closeOnResize = event => { if (!event.matches) setMenuOpen(false) }
    if (mobile.matches) closeButton.current?.focus()
    window.addEventListener('keydown', onEscape)
    mobile.addEventListener('change', closeOnResize)
    return () => {
      window.removeEventListener('keydown', onEscape)
      mobile.removeEventListener('change', closeOnResize)
    }
  }, [menuOpen])

  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content" onClick={event => {
        event.preventDefault()
        document.getElementById('main-content')?.focus()
      }}>Skip to content</a>
      {menuOpen && <div className="overlay" aria-hidden="true" onClick={() => {
        setMenuOpen(false)
        requestAnimationFrame(() => menuButton.current?.focus())
      }} />}
      <aside id="workspace-sidebar" className={`sidebar${menuOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <a className="wordmark" href="#overview" onClick={() => setMenuOpen(false)} aria-label="Lyse overview">
            <span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>Lyse<span className="wordmark-dot">.</span>
          </a>
          <button ref={closeButton} className="icon-button close-menu" type="button" aria-label="Close menu" onClick={() => {
            setMenuOpen(false)
            requestAnimationFrame(() => menuButton.current?.focus())
          }}><X size={20} /></button>
        </div>
        <div className="nav-label">Workspace</div>
        <nav aria-label="Workspace navigation">
          {pages.map(({ id, name, icon: Icon }) => (
            <a key={id} href={`#${id}`} aria-current={page.id === id ? 'page' : undefined} onClick={() => setMenuOpen(false)}>
              <Icon size={18} aria-hidden="true" />{name}
            </a>
          ))}
        </nav>
        <div className="sidebar-source">
          <div className="source-icon"><Database size={17} aria-hidden="true" /></div>
          <div><strong>Northwind</strong><span>Historical sample data</span></div>
        </div>
      </aside>
      <div className="work-area" inert={menuOpen || undefined}>
        <header className="topbar">
          <div className="breadcrumb">
            <button ref={menuButton} className="icon-button open-menu" type="button" aria-expanded={menuOpen} aria-controls="workspace-sidebar" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
            <span>Workspace</span><ChevronRight size={14} aria-hidden="true" /><strong>{page.name}</strong>
          </div>
          <div className="topbar-actions">
            {period && <span className="top-period" title="Active reporting period"><CalendarDays size={15} aria-hidden="true" />{formatPeriod(period)}</span>}
            <button type="button" className="button primary export-button" disabled={!onExport} onClick={onExport}><Download size={16} aria-hidden="true" />Export CSV</button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <header className="page-heading">
            <div><h1>{page.title}</h1><p>{page.description}</p></div>
            <div className="dataset-heading"><span className="data-badge"><Database size={14} aria-hidden="true" /> Historical dataset</span>{bounds && <small>{formatPeriod(bounds)}</small>}</div>
          </header>
          {children}
          <footer className="footer"><span>Lyse <span aria-hidden="true">·</span> Sales Intelligence</span><span>Historical Northwind reporting</span></footer>
        </main>
      </div>
    </div>
  )
}
