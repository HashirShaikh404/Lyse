
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import Workspace, { pages } from '../components/layout/Workspace.jsx'
import DateFilters from '../components/filters/DateFilters.jsx'
import MetricCards from '../components/dashboard/MetricCards.jsx'
import DataState from '../components/common/DataState.jsx'
import PerformanceReports from '../components/reports/PerformanceReports.jsx'
import InvoicesTable from '../components/tables/InvoicesTable.jsx'
import { useRetailDataset, useSalesAnalytics } from '../hooks/useSalesAnalytics.js'
import { useSavedFilters } from '../hooks/useSavedFilters.js'
import { calculateAnalytics } from '../utils/analyticsCalculations.js'
import { exportInvoicesCSV } from '../utils/exportCSV.js'

const SalesCharts = lazy(() => import('../components/charts/SalesCharts.jsx'))

function currentPage() {
  const hash = window.location.hash === '#orders' ? '#invoices' : window.location.hash
  return pages.find(item => `#${item.id}` === hash) ?? pages[0]
}

export default function Dashboard() {
  const [page, setPage] = useState(currentPage)
  const dataset = useRetailDataset()
  const bounds = dataset.dataset?.bounds
  const { period, defaults, apply, reset } = useSavedFilters(bounds)
  const sales = useSalesAnalytics(dataset.dataset, period)
  const start = period?.start
  const end = period?.end
  const market = period?.market
  const analytics = useMemo(() => sales.data ? calculateAnalytics(sales.data, { start, end, market }) : null, [sales.data, start, end, market])
  const error = dataset.error || sales.error
  const loading = !sales.data && !error
  const hasResults = Boolean(analytics?.invoices.length)
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

  return <Workspace page={page} period={period} bounds={bounds} onExport={hasResults ? () => exportInvoicesCSV(analytics.invoices, period) : undefined}>
    <DateFilters key={bounds?.end ?? 'unavailable'} bounds={bounds} period={period} defaults={defaults} markets={sales.data?.markets} onApply={apply} onReset={reset} />
    {error && <DataState status="error" error={error} onRetry={dataset.error ? dataset.retry : sales.retry} />}
    {loading && <DataState status="loading" />}
    {overview && <MetricCards analytics={analytics} loading={loading} />}
    {analytics && !hasResults && <DataState status="empty" />}
    {hasResults && <>
      {(overview || page.id === 'sales') && <Suspense fallback={<div className="panel chart-loading" role="status">Loading charts…</div>}><SalesCharts analytics={analytics} showHeading={overview} /></Suspense>}
      {(overview || page.id === 'reports') && <PerformanceReports analytics={analytics} showHeading={overview} />}
      {(overview || page.id === 'invoices') && <InvoicesTable key={`${start}:${end}:${market}`} invoices={analytics.invoices} showHeading={overview} />}
    </>}
  </Workspace>
}
