import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatMonth } from '../../utils/dateUtils.js'
import { formatAmount, formatCompact, formatNumber, formatPercent } from '../../utils/formatters.js'

const blue = '#2855d9'
const orderBlue = '#6b91ed'
const palette = ['#2855d9', '#4f76e2', '#81a2f0', '#244180', '#66758d', '#19a298', '#9c6bd6', '#bd791c', '#859fbf']
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

function MonthlyChart({ data, measure }) {
  const isRevenue = measure === 'revenue'
  const title = isRevenue ? 'Revenue over time' : 'Orders over time'
  const label = isRevenue ? 'Revenue' : 'Orders'
  const color = isRevenue ? blue : orderBlue
  const Chart = isRevenue ? LineChart : BarChart

  return <ChartCard title={title} description={isRevenue ? 'Monthly revenue after discounts' : 'Unique orders by month'} legend={<ChartKey label={label} color={color} />}>
    <div className="trend-chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <Chart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }} accessibilityLayer aria-label={title}>
          <CartesianGrid vertical={false} stroke="#e4eaf3" strokeDasharray="4 4" />
          <XAxis dataKey="month" tickFormatter={formatMonth} tick={tick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={20} tickMargin={10} />
          <YAxis width={47} tickFormatter={formatCompact} tick={tick} axisLine={false} tickLine={false} allowDecimals={isRevenue} />
          <Tooltip {...tooltip} labelFormatter={formatMonth} formatter={value => [isRevenue ? formatAmount(value) : formatNumber(value), label]} />
          {isRevenue
            ? <Line type="linear" name={label} dataKey={measure} stroke={color} strokeWidth={2.5} dot={data.length === 1} activeDot={{ r: 5 }} isAnimationActive={false} />
            : <Bar name={label} dataKey={measure} fill={color} maxBarSize={23} radius={[3, 3, 0, 0]} isAnimationActive={false} />}
        </Chart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
}

function CategoryChart({ categories, revenue }) {
  return <ChartCard title="Revenue by product category" description="Category share of total net revenue">
    <div className="category-layout">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart accessibilityLayer aria-label="Revenue share by product category">
            <Pie data={categories} dataKey="revenue" nameKey="name" innerRadius="65%" outerRadius="95%" stroke="#fff" strokeWidth={2} isAnimationActive={false}>
              {categories.map((category, index) => <Cell key={category.name} fill={palette[index % palette.length]} />)}
            </Pie>
            <Tooltip {...tooltip} formatter={(value, name) => [`${formatAmount(value)} (${formatPercent(revenue ? value / revenue : 0)})`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center" aria-hidden="true"><strong>{formatCompact(revenue)}</strong><span>Net revenue</span></div>
      </div>
      <ul className="category-legend" aria-label="Category shares">
        {categories.map((category, index) => <li key={category.name}><ChartKey label={category.name} color={palette[index % palette.length]} /><strong>{formatPercent(revenue ? category.revenue / revenue : 0)}</strong></li>)}
      </ul>
    </div>
  </ChartCard>
}

function CountryChart({ countries }) {
  // A fixed number of rows keeps the chart readable while exposing the full ranking.
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? countries.length : Math.min(7, countries.length)
  return <ChartCard title="Sales by country" description={`Customer markets ranked by net revenue · ${countries.length} total`}>
    <div className="country-chart" style={{ height: Math.max(220, visible * 29 + 32) }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={countries.slice(0, visible)} layout="vertical" margin={{ top: 5, right: 14, bottom: 0, left: 0 }} accessibilityLayer aria-label="Revenue ranked by customer country">
          <CartesianGrid horizontal={false} stroke="#e4eaf3" strokeDasharray="4 4" />
          <XAxis type="number" tickFormatter={formatCompact} tick={tick} axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis type="category" dataKey="name" width={103} tick={tick} axisLine={false} tickLine={false} interval={0} />
          <Tooltip {...tooltip} formatter={value => [formatAmount(value), 'Revenue']} />
          <Bar dataKey="revenue" name="Revenue" fill={blue} barSize={13} radius={[0, 3, 3, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    {countries.length > 7 && <button type="button" className="text-button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Show top 7 countries' : `Show all ${countries.length} countries`}</button>}
  </ChartCard>
}

export default function SalesCharts({ analytics, showHeading = true }) {
  return <section className="dashboard-section" aria-label="Sales analytics">
    {showHeading && <div className="section-heading"><h2>Sales analytics</h2><span>Revenue in source units</span></div>}
    <div className="chart-grid">
      <MonthlyChart data={analytics.monthly} measure="revenue" />
      <MonthlyChart data={analytics.monthly} measure="orders" />
      <CategoryChart categories={analytics.categories} revenue={analytics.revenue} />
      <CountryChart countries={analytics.countries} />
    </div>
  </section>
}
