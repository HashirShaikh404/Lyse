
import { shiftDate } from './dateUtils.js'

function getGroup(groups, key, initial) {
  if (!groups.has(key)) groups.set(key, initial)
  return groups.get(key)
}

export function prepareRetailData(rows, period, includeLines) {
  const groups = new Map()

  for (const row of rows) {
    const date = row.InvoiceDate?.slice(0, 10)
    const id = row.Invoice
    const quantity = Number(row.Quantity)
    if (!id || !date || typeof row.Price !== 'number' || !Number.isFinite(row.Price) || !Number.isSafeInteger(quantity)) {
      throw new Error('The retail data contains an invalid invoice line.')
    }
    if (date < period.start || date > period.end) continue

    const amount = row.Price * quantity
    const pence = Math.sign(amount) * Math.round(Math.abs(amount) * 100)
    const invoice = getGroup(groups, id, {
      id, date, customerId: row['Customer ID'], country: row.Country?.trim() || 'Unknown market', pence: 0, lines: [],
    })
    invoice.pence += pence
    if (includeLines) invoice.lines.push({ code: row.StockCode, name: row.Description?.trim(), pence, quantity })
  }

  const invoices = [...groups.values()].map(invoice => {
    const type = /^C/i.test(invoice.id) || invoice.pence < 0 ? 'Credit / cancellation' : invoice.pence > 0 ? 'Sale' : 'Other'
    return { ...invoice, type, revenue: invoice.pence / 100, customer: invoice.customerId == null ? 'Unidentified' : String(invoice.customerId) }
  })

  const markets = [...new Set(invoices.map(invoice => invoice.country))].sort()
  return { invoices, markets }
}

function metricsFor(invoices) {
  let net = 0
  let sales = 0
  let count = 0
  const customers = new Set()
  for (const invoice of invoices) {
    net += invoice.pence
    if (invoice.type === 'Sale') {
      sales += invoice.pence
      count += 1
      if (invoice.customerId != null) customers.add(invoice.customerId)
    }
  }
  return {
    revenue: net / 100,
    salesInvoiceValue: sales / 100,
    adjustments: (net - sales) / 100,
    orderCount: count,
    customerCount: customers.size,
    averageOrderValue: count ? sales / count / 100 : 0,
  }
}

function filterByMarket(invoices, market) {
  return market ? invoices.filter(invoice => invoice.country === market) : invoices
}

export function calculateComparisonMetrics(data, market) {
  return metricsFor(filterByMarket(data.invoices, market))
}

function reportingBuckets({ start, end }) {
  const days = (Date.parse(end) - Date.parse(start)) / 86400000 + 1
  const scale = days > 112 ? 'month' : days > 31 ? 'week' : 'day'
  const buckets = new Map()
  const byDay = new Map()
  for (let index = 0, date = start; date <= end; date = shiftDate(date, 1), index += 1) {
    const key = scale === 'month' ? date.slice(0, 7) : scale === 'week' ? shiftDate(start, index - index % 7) : date
    byDay.set(date, key)
    if (!buckets.has(key)) buckets.set(key, { date: key, orders: 0, pence: 0 })
  }
  return { scale, buckets, byDay }
}

const rank = groups => [...groups.values()].sort((a, b) => b.pence - a.pence || a.name.localeCompare(b.name))
  .map(row => ({ ...row, revenue: row.pence / 100 }))

export function calculateAnalytics(data, period) {
  const invoices = filterByMarket(data.invoices, period.market)
  const { scale, buckets, byDay } = reportingBuckets(period)
  const countries = new Map()
  const products = new Map()
  const customers = new Map()
  const credits = new Map()
  const counts = new Map()

  for (const invoice of invoices) {
    const bucket = buckets.get(byDay.get(invoice.date))
    const isSale = invoice.type === 'Sale'
    bucket.pence += invoice.pence
    if (isSale) bucket.orders += 1
    counts.set(invoice.type, (counts.get(invoice.type) ?? 0) + 1)
    getGroup(countries, invoice.country, { name: invoice.country, pence: 0 }).pence += invoice.pence

    if (invoice.customerId != null) {
      const customer = getGroup(customers, invoice.customerId, {
        id: invoice.customerId, name: `Customer ${invoice.customerId}`, country: invoice.country, orders: 0, pence: 0,
      })
      if (customer.country !== invoice.country) customer.country = 'Multiple markets'
      if (isSale) customer.orders += 1
      customer.pence += invoice.pence
    }

    if (invoice.type === 'Credit / cancellation') {
      const credit = getGroup(credits, invoice.country, { id: invoice.country, name: invoice.country, count: 0, pence: 0 })
      credit.count += 1
      credit.pence -= invoice.pence
    }

    for (const line of invoice.lines) {
      // UK Online Retail uses five-digit product codes, with suffixes for some variants.
      if (!/^\d{5}[A-Z]*$/i.test(line.code) || !line.name || line.pence === 0) continue
      const product = getGroup(products, line.code, { id: line.code, name: line.name, units: 0, pence: 0 })
      product.units += line.quantity
      product.pence += line.pence
    }
  }

  return {
    ...metricsFor(invoices),
    invoices, scale,
    timeline: [...buckets.values()].map(bucket => ({ ...bucket, revenue: bucket.pence / 100 })),
    invoiceMix: [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    countries: rank(countries), products: rank(products), customers: rank(customers), credits: rank(credits),
  }
}
