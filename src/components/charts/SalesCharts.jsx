
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate, formatMonth, formatShortDate } from '../../utils/dateUtils.js'
import { formatAmount, formatCompact, formatCompactAmount, formatNumber, formatPercent } from '../../utils/formatters.js'

const blue = '#2855d9'
const orderBlue = '#6087e8'
const creditColor = '#ad6726'
const mixColors = { Sale: blue, 'Credit / cancellation': creditColor, Other: '#687a97' }
const tick = { fill: '#53647b', fontSize: 12 }
const tooltip = { contentStyle: { border: '1px solid #dae2ee', borderRadius: 8, fontSize: 13 }, labelStyle: { color: '#17243c', fontWeight: 650 } }

function ChartCard({ title, description, legend, children }) {
  return <article className="panel chart-card">
    <div className="chart-heading"><div><h3>{title}</h3><p>{description}</p></div>{legend}</div>
    {children}
  </article>
}

function ChartKey({ label, color }) {
  return <span className="chart-key"><i style={{ backgroundColor: color }} aria-hidden="true" />{label}</span>
}

function TrendChart({ data, scale, measure }) {
  const revenue = measure === 'revenue'
  const title = revenue ? 'Net sales trend' : 'Invoice volume'
  const label = revenue ? 'Net sales' : 'Sales invoices'
  const color = revenue ? blue : orderBlue
  const Chart = revenue ? LineChart : BarChart
  const interval = { day: 'Daily', week: 'Weekly', month: 'Monthly' }[scale]
  const shortLabel = scale === 'month' ? formatMonth : formatShortDate
  const tooltipLabel = date => scale === 'month' ? formatMonth(date) : scale === 'week' ? `Week starting ${formatDate(date)}` : formatDate(date)

  return <ChartCard title={title} description={revenue ? `${interval} sales after credits` : `${interval} sales invoice count`} legend={<ChartKey label={label} color={color} />}>
    <div className="trend-chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <Chart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 0 }} accessibilityLayer aria-label={title}>
          <CartesianGrid vertical={false} stroke="#e4eaf3" strokeDasharray="4 4" />
          <XAxis dataKey="date" tickFormatter={shortLabel} tick={tick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={18} tickMargin={10} />
          <YAxis width={62} tickFormatter={revenue ? formatCompactAmount : formatCompact} tick={tick} axisLine={false} tickLine={false} allowDecimals={revenue} />
          <Tooltip {...tooltip} labelFormatter={tooltipLabel} formatter={value => [revenue ? formatAmount(value) : formatNumber(value), label]} />
          {revenue
            ? <Line type="linear" name={label} dataKey={measure} stroke={color} strokeWidth={2.5} dot={data.length === 1} activeDot={{ r: 5 }} isAnimationActive={false} />
            : <Bar name={label} dataKey={measure} fill={color} maxBarSize={28} radius={[3, 3, 0, 0]} isAnimationActive={false} />}
        </Chart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
}

function InvoiceMixChart({ mix, total }) {
  return <ChartCard title="Invoice mix" description="Sales, credit notes, and zero-value invoices">
    <div className="category-layout">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart accessibilityLayer aria-label="Breakdown of invoices by type">
            <Pie data={mix} dataKey="count" nameKey="name" innerRadius="65%" outerRadius="95%" stroke="#fff" strokeWidth={2} isAnimationActive={false}>
              {mix.map(item => <Cell key={item.name} fill={mixColors[item.name]} />)}
            </Pie>
            <Tooltip {...tooltip} formatter={(value, name) => [`${formatNumber(value)} (${formatPercent(value / total)})`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center" aria-hidden="true"><strong>{formatCompact(total)}</strong><span>Invoices</span></div>
      </div>
      <ul className="category-legend" aria-label="Invoice shares">
        {mix.map(item => <li key={item.name}><ChartKey label={item.name} color={mixColors[item.name]} /><strong>{formatPercent(item.count / total)}</strong></li>)}
      </ul>
    </div>
  </ChartCard>
}

function MarketChart({ countries }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? countries.length : Math.min(7, countries.length)
  const values = countries.slice(0, visible)
  return <ChartCard title="Sales by market" description={`Customer markets ranked by net sales · ${countries.length} total`}>
    <div className="country-chart" style={{ height: Math.max(165, visible * 30 + 40) }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={values} layout="vertical" margin={{ top: 5, right: 18, bottom: 0, left: 0 }} accessibilityLayer aria-label="Net sales ranked by customer market">
          <CartesianGrid horizontal={false} stroke="#e4eaf3" strokeDasharray="4 4" />
          <XAxis type="number" tickFormatter={formatCompactAmount} tick={tick} axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis type="category" dataKey="name" width={112} tick={tick} axisLine={false} tickLine={false} interval={0} />
          <ReferenceLine x={0} stroke="#c7d2e2" />
          <Tooltip {...tooltip} formatter={value => [formatAmount(value), 'Net sales']} />
          <Bar dataKey="revenue" name="Net sales" barSize={14} radius={2} isAnimationActive={false}>
            {values.map(item => <Cell key={item.name} fill={item.revenue < 0 ? creditColor : blue} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    {countries.length > 7 && <button type="button" className="text-button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Show top 7 markets' : `Show all ${countries.length} markets`}</button>}
  </ChartCard>
}

export default function SalesCharts({ analytics }) {
  return <section className="dashboard-section" aria-label="Sales analytics">
    <div className="chart-grid">
      <TrendChart data={analytics.timeline} scale={analytics.scale} measure="revenue" />
      <TrendChart data={analytics.timeline} scale={analytics.scale} measure="orders" />
      <InvoiceMixChart mix={analytics.invoiceMix} total={analytics.invoices.length} />
      <MarketChart countries={analytics.countries} />
    </div>
  </section>
}
