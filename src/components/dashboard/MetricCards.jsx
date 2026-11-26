import { ReceiptText, ShoppingBag, UsersRound, Wallet } from 'lucide-react'
import { formatAmount, formatNumber } from '../../utils/formatters.js'

const cards = [
  { title: 'Total Revenue', key: 'revenue', icon: Wallet, format: formatAmount, note: 'Net of line-item discounts' },
  { title: 'Total Orders', key: 'orderCount', icon: ShoppingBag, format: formatNumber, note: 'Unique orders in this period' },
  { title: 'Average Order Value', key: 'averageOrderValue', icon: ReceiptText, format: formatAmount, note: 'Net revenue per order' },
  { title: 'Total Customers', key: 'customerCount', icon: UsersRound, format: formatNumber, note: 'Customers who placed an order' },
]

export default function MetricCards({ analytics, loading }) {
  return (
    <section className="metric-grid" aria-label="Executive metrics" aria-busy={loading}>
      {cards.map(({ title, key, icon: Icon, format, note }) => (
        <article className="panel metric" key={key}>
          <div className="metric-header"><h2>{title}</h2><span className="icon-tile"><Icon size={18} aria-hidden="true" /></span></div>
          <div className="metric-number">{loading ? <span className="skeleton metric-skeleton" /> : analytics ? format(analytics[key]) : '—'}</div>
          <p>{note}</p>
        </article>
      ))}
    </section>
  )
}
