import { formatAmount } from '../../utils/formatters.js'

export default function SalesSummary({ analytics }) {
  return <section className="panel sales-summary" aria-labelledby="sales-summary-title">
    <h2 id="sales-summary-title">Net sales breakdown</h2>
    <dl>
      <div><dt>Sales invoice value</dt><dd>{formatAmount(analytics.salesInvoiceValue)}</dd></div>
      <div><dt>Credits and cancellations</dt><dd>{formatAmount(analytics.adjustments)}</dd></div>
      <div><dt>Net sales</dt><dd>{formatAmount(analytics.revenue)}</dd></div>
    </dl>
  </section>
}
