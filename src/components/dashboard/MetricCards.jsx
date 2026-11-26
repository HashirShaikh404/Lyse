
import { ReceiptText, ShoppingBag, UsersRound, Wallet } from 'lucide-react'
import { formatAmount, formatChange, formatNumber } from '../../utils/formatters.js'
import { formatPeriod } from '../../utils/dateUtils.js'

const cards = [
  { title: 'Net Sales', key: 'revenue', icon: Wallet, format: formatAmount, note: 'After credits and adjustments' },
  { title: 'Sales Invoices', key: 'orderCount', icon: ShoppingBag, format: formatNumber, note: 'Positive sales invoices' },
  { title: 'Average Invoice Value', key: 'averageOrderValue', icon: ReceiptText, format: formatAmount, note: 'Per sales invoice before credits' },
  { title: 'Active Customers', key: 'customerCount', icon: UsersRound, format: formatNumber, note: 'Identified customers with a sale' },
]

export default function MetricCards({ analytics, loading, previous, previousPeriod }) {
  return (
    <section className="metric-grid" aria-label="Executive metrics" aria-busy={loading}>
      {cards.map(({ title, key, icon: Icon, format, note }) => {
        const prior = previous?.[key]
        const change = prior > 0 ? (analytics[key] - prior) / prior : null
        return <article className="panel metric" key={key}>
          <div className="metric-header"><h2>{title}</h2><span className="icon-tile"><Icon size={18} aria-hidden="true" /></span></div>
          <div className="metric-number">{loading ? <span className="skeleton metric-skeleton" /> : analytics ? format(analytics[key]) : '—'}</div>
          <p>{note}</p>
          {change != null && <p className="metric-comparison" title={formatPeriod(previousPeriod)}><strong>{formatChange(change)}</strong> vs prior period</p>}
        </article>
      })}
    </section>
  )
}
