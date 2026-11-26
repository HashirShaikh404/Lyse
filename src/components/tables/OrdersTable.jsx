import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils.js'
import { formatAmount, formatNumber } from '../../utils/formatters.js'

const columns = [['id', 'Order ID'], ['date', 'Order date'], ['customer', 'Customer'], ['employee', 'Employee'], ['country', 'Country'], ['revenue', 'Order value']]
const pageSize = 10
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true })

export default function OrdersTable({ orders, showHeading = true }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'date', direction: 'descending' })
  const [page, setPage] = useState(1)

  const results = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matching = orders.filter(order => !query || [order.id, order.date, order.customer, order.employee, order.country].some(value => String(value).toLowerCase().includes(query)))
    return matching.sort((a, b) => {
      const left = a[sort.key]
      const right = b[sort.key]
      const comparison = typeof left === 'number' ? left - right : collator.compare(left, right)
      return (comparison || a.id - b.id) * (sort.direction === 'ascending' ? 1 : -1)
    })
  }, [orders, search, sort])

  const pageCount = Math.max(1, Math.ceil(results.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const offset = (currentPage - 1) * pageSize
  const visible = results.slice(offset, offset + pageSize)

  function sortBy(key) {
    setSort({ key, direction: sort.key === key && sort.direction === 'ascending' ? 'descending' : 'ascending' })
    setPage(1)
  }

  return <section className="dashboard-section" aria-label="Order records">
    {showHeading && <div className="section-heading"><h2>Orders</h2></div>}
    <div className="panel table-panel">
      <div className="orders-toolbar">
        <label className="order-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search orders</span><input type="search" placeholder="Search orders…" value={search} onChange={event => {
          setSearch(event.target.value)
          setPage(1)
        }} /></label>
        <span aria-live="polite">{formatNumber(results.length)} {results.length === 1 ? 'order' : 'orders'}</span>
      </div>
      {visible.length ? <div className="table-scroll" tabIndex={0} role="region" aria-label="Order details">
        <table className="orders-table">
          <caption className="sr-only">Order details for the selected reporting period</caption>
          <thead><tr>{columns.map(([key, label]) => {
            const direction = sort.key === key ? sort.direction : undefined
            const Icon = direction === 'ascending' ? ArrowUp : direction === 'descending' ? ArrowDown : ArrowUpDown
            return <th key={key} scope="col" className={key === 'revenue' ? 'numeric' : undefined} aria-sort={direction}>
              <button type="button" className="sort-button" onClick={() => sortBy(key)}>{label}<Icon size={13} aria-hidden="true" /></button>
            </th>
          })}</tr></thead>
          <tbody>{visible.map(order => <tr key={order.id}>
            <th scope="row" className="order-id">#{order.id}</th><td>{formatDate(order.date)}</td><td>{order.customer}</td><td>{order.employee}</td><td>{order.country}</td><td className="numeric">{formatAmount(order.revenue)}</td>
          </tr>)}</tbody>
        </table>
      </div> : <p className="table-empty" role="status">No orders match your search. Try another name, country, or order ID.</p>}
      {results.length > 0 && <div className="table-footer">
        <span aria-live="polite">{formatNumber(offset + 1)}–{formatNumber(offset + visible.length)} of {formatNumber(results.length)} orders</span>
        <div className="pagination" aria-label="Order pagination">
          <button type="button" className="icon-button pager" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={17} /></button>
          <span>Page {currentPage} of {pageCount}</span>
          <button type="button" className="icon-button pager" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={17} /></button>
        </div>
      </div>}
    </div>
  </section>
}
