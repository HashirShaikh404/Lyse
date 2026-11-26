import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils.js'
import { formatAmount, formatNumber } from '../../utils/formatters.js'

const columns = [['id', 'Invoice ID'], ['date', 'Invoice date'], ['customer', 'Customer ID'], ['country', 'Market'], ['type', 'Type'], ['revenue', 'Net value']]
const pageSize = 10
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true })

export default function InvoicesTable({ invoices, showHeading = true }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'date', direction: 'descending' })
  const [page, setPage] = useState(1)

  const results = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matching = invoices.filter(invoice => !query || [invoice.id, invoice.date, invoice.customer, invoice.country, invoice.type].some(value => String(value).toLowerCase().includes(query)))
    return matching.sort((a, b) => {
      const left = a[sort.key]
      const right = b[sort.key]
      const comparison = typeof left === 'number' ? left - right : collator.compare(left, right)
      return (comparison || collator.compare(a.id, b.id)) * (sort.direction === 'ascending' ? 1 : -1)
    })
  }, [invoices, search, sort])

  const pageCount = Math.max(1, Math.ceil(results.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const offset = (currentPage - 1) * pageSize
  const visible = results.slice(offset, offset + pageSize)

  function sortBy(key) {
    setSort({ key, direction: sort.key === key && sort.direction === 'ascending' ? 'descending' : 'ascending' })
    setPage(1)
  }

  return <section className="dashboard-section" aria-label="Invoice records">
    {showHeading && <div className="section-heading"><h2>Invoice detail</h2></div>}
    <div className="panel table-panel">
      <div className="orders-toolbar">
        <label className="order-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search invoices</span><input type="search" placeholder="Search invoices…" value={search} onChange={event => {
          setSearch(event.target.value)
          setPage(1)
        }} /></label>
        <span aria-live="polite">{formatNumber(results.length)} {results.length === 1 ? 'invoice' : 'invoices'}</span>
      </div>
      {visible.length ? <div className="table-scroll" tabIndex={0} role="region" aria-label="Invoice details">
        <table className="orders-table">
          <caption className="sr-only">Invoices for the selected reporting period</caption>
          <thead><tr>{columns.map(([key, label]) => {
            const direction = sort.key === key ? sort.direction : undefined
            const Icon = direction === 'ascending' ? ArrowUp : direction === 'descending' ? ArrowDown : ArrowUpDown
            return <th key={key} scope="col" className={key === 'revenue' ? 'numeric' : undefined} aria-sort={direction}>
              <button type="button" className="sort-button" onClick={() => sortBy(key)}>{label}<Icon size={13} aria-hidden="true" /></button>
            </th>
          })}</tr></thead>
          <tbody>{visible.map(invoice => <tr key={invoice.id}>
            <th scope="row" className="order-id">#{invoice.id}</th><td>{formatDate(invoice.date)}</td><td>{invoice.customer}</td><td>{invoice.country}</td><td><span className="invoice-type" data-type={invoice.type}>{invoice.type}</span></td><td className="numeric">{formatAmount(invoice.revenue)}</td>
          </tr>)}</tbody>
        </table>
      </div> : <p className="table-empty" role="status">No invoices match your search. Try another invoice ID, customer ID, or market.</p>}
      {results.length > 0 && <div className="table-footer">
        <span aria-live="polite">{formatNumber(offset + 1)}–{formatNumber(offset + visible.length)} of {formatNumber(results.length)} invoices</span>
        <div className="pagination" aria-label="Invoice pagination">
          <button type="button" className="icon-button pager" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={17} /></button>
          <span>Page {currentPage} of {pageCount}</span>
          <button type="button" className="icon-button pager" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={17} /></button>
        </div>
      </div>}
    </div>
  </section>
}
