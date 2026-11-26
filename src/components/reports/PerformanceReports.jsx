import { useState } from 'react'
import { formatAmount, formatNumber } from '../../utils/formatters.js'

const reports = [
  { key: 'products', label: 'Top-selling products', description: 'Ranked by units sold', columns: [['name', 'Product'], ['category', 'Category'], ['units', 'Units sold'], ['revenue', 'Net revenue']] },
  { key: 'customers', label: 'Top customers', description: 'Ranked by net revenue', columns: [['name', 'Customer'], ['country', 'Country'], ['orders', 'Orders'], ['revenue', 'Net revenue']] },
  { key: 'employees', label: 'Employee performance', description: 'Ranked by net revenue', columns: [['name', 'Employee'], ['orders', 'Orders handled'], ['revenue', 'Net revenue']] },
]

export default function PerformanceReports({ analytics, showHeading = true }) {
  const [report, setReport] = useState(reports[0])
  const [expanded, setExpanded] = useState(false)
  const rows = analytics[report.key]
  const visible = expanded ? rows : rows.slice(0, 8)

  return <section className="dashboard-section" aria-label="Performance reports">
    {showHeading && <div className="section-heading"><h2>Performance reports</h2></div>}
    <div className="panel table-panel">
      <div className="report-tabs" role="group" aria-label="Choose a performance report">
        {reports.map(item => <button type="button" key={item.key} aria-pressed={item === report} onClick={() => {
          setReport(item)
          setExpanded(false)
        }}>{item.label}</button>)}
      </div>
      <div className="report-summary"><span>{report.description}</span><span>{formatNumber(rows.length)} ranked</span></div>
      {rows.length === 0 ? <p className="table-empty">No identified {report.key} in this period.</p> : <div className="table-scroll" tabIndex={0} role="region" aria-label={report.label}>
        <table>
          <caption className="sr-only">{report.label}. {report.description}.</caption>
          <thead><tr><th className="rank-cell" scope="col">Rank</th>{report.columns.map(([key, label]) => <th key={key} scope="col" className={['units', 'orders', 'revenue'].includes(key) ? 'numeric' : undefined}>{label}</th>)}</tr></thead>
          <tbody>{visible.map((row, index) => <tr key={row.id ?? 'unassigned'}>
            <td className="rank-cell">{index + 1}</td>
            {report.columns.map(([key]) => key === 'name'
              ? <th key={key} scope="row" className="row-name">{row[key]}</th>
              : <td key={key} className={typeof row[key] === 'number' ? 'numeric' : undefined}>{key === 'revenue' ? formatAmount(row[key]) : typeof row[key] === 'number' ? formatNumber(row[key]) : row[key]}</td>)}
          </tr>)}</tbody>
        </table>
      </div>}
      {rows.length > 8 && <div className="table-footer"><span>Showing {visible.length} of {rows.length}</span><button className="text-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Show top 8' : 'Show all results'}</button></div>}
    </div>
  </section>
}
