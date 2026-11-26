import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Archive } from 'lucide-react'
import Workspace, { pages } from '../components/layout/Workspace.jsx'
import DateFilters from '../components/filters/DateFilters.jsx'
import MetricCards from '../components/dashboard/MetricCards.jsx'
import DataState from '../components/common/DataState.jsx'
import PerformanceReports from '../components/reports/PerformanceReports.jsx'
import OrdersTable from '../components/tables/OrdersTable.jsx'
import { useSalesAnalytics } from '../hooks/useSalesAnalytics.js'
import { useSavedFilters } from '../hooks/useSavedFilters.js'
import { calculateAnalytics } from '../utils/analyticsCalculations.js'
import { exportOrdersCSV } from '../utils/exportCSV.js'

const SalesCharts = lazy(() => import('../components/charts/SalesCharts.jsx'))

function currentPage() {
  return pages.find(item => `#${item.id}` === window.location.hash) ?? pages[0]
}

export default function Dashboard() {
  const [page, setPage] = useState(currentPage)
  const { orders, bounds, status, error, source, load } = useSalesAnalytics()
  const { period, apply, reset } = useSavedFilters(bounds)
  const start = period?.start
  const end = period?.end
  const analytics = useMemo(() => start && end ? calculateAnalytics(orders, { start, end }) : null, [orders, start, end])
  const hasResults = Boolean(analytics?.orderCount)
  const overview = page.id === 'overview'

  useEffect(() => {
    const navigate = () => {
      setPage(currentPage())
      window.scrollTo(0, 0)
      document.getElementById('main-content')?.focus({ preventScroll: true })
    }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])

  return <Workspace page={page} period={period} bounds={bounds} onExport={hasResults ? () => exportOrdersCSV(analytics.filteredOrders, period) : undefined}>
    {status !== 'success' && <DataState status={status} error={error} source={source} onLoad={load} />}
    {status === 'success' && source === 'archive' && <div className="state-banner archive-banner" role="status">
      <Archive size={20} aria-hidden="true" /><div><strong>Northwind sample archive</strong><p>Reporting from Microsoft’s historical Northwind records.</p></div>
      <div className="state-actions"><button type="button" className="button secondary" onClick={() => load('api')}>Retry API</button></div>
    </div>}
    <DateFilters key={bounds ? `${bounds.start}:${bounds.end}` : 'unavailable'} bounds={bounds} period={period} onApply={apply} onReset={reset} />
    {overview && <MetricCards analytics={analytics} loading={status === 'loading'} />}
    {status === 'success' && !hasResults && <DataState status="empty" hasDataset={Boolean(bounds)} />}
    {hasResults && <>
      {(overview || page.id === 'sales') && <Suspense fallback={<div className="panel chart-loading" role="status">Loading charts…</div>}><SalesCharts analytics={analytics} showHeading={overview} /></Suspense>}
      {(overview || page.id === 'reports') && <PerformanceReports analytics={analytics} showHeading={overview} />}
      {(overview || page.id === 'orders') && <OrdersTable key={`${start}:${end}`} orders={analytics.filteredOrders} showHeading={overview} />}
    </>}
  </Workspace>
}
