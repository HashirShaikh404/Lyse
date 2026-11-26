
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import Workspace, { pages } from '../components/layout/Workspace.jsx'
import DateFilters from '../components/filters/DateFilters.jsx'
import MetricCards from '../components/dashboard/MetricCards.jsx'
import SalesSummary from '../components/dashboard/SalesSummary.jsx'
import DataState from '../components/common/DataState.jsx'
import PerformanceReports from '../components/reports/PerformanceReports.jsx'
import InvoicesTable from '../components/tables/InvoicesTable.jsx'
import { useRetailDataset, useSalesAnalytics } from '../hooks/useSalesAnalytics.js'
import { useSavedFilters } from '../hooks/useSavedFilters.js'
import { calculateAnalytics, calculateComparisonMetrics } from '../utils/analyticsCalculations.js'
import { getPreviousPeriod } from '../utils/dateUtils.js'
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
  const previousPeriod = overview && hasResults ? getPreviousPeriod(period, bounds) : null
  const comparison = useSalesAnalytics(dataset.dataset, previousPeriod, false)
  const previous = useMemo(() => comparison.data ? calculateComparisonMetrics(comparison.data, market) : null, [comparison.data, market])

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
    {overview && <>
      <MetricCards analytics={analytics} loading={loading} previous={previous} previousPeriod={previousPeriod} />
      {previousPeriod && !previous && <div className="comparison-status" role="status">
        {comparison.error ? <><span>Could not load the prior-period comparison.</span><button className="text-button" type="button" onClick={comparison.retry}>Retry comparison</button></> : 'Loading prior-period comparison…'}
      </div>}
    </>}
    {analytics && !hasResults && <DataState status="empty" />}
    {hasResults && <>
      {overview && <SalesSummary analytics={analytics} />}
      {page.id === 'sales' && <Suspense fallback={<div className="panel chart-loading" role="status">Loading charts…</div>}><SalesCharts analytics={analytics} /></Suspense>}
      {page.id === 'reports' && <PerformanceReports analytics={analytics} />}
      {page.id === 'invoices' && <InvoicesTable key={`${start}:${end}:${market}`} invoices={analytics.invoices} />}
    </>}
  </Workspace>
}
