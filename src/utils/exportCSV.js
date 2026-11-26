
const headers = ['Invoice ID', 'Invoice Date', 'Customer ID', 'Market', 'Invoice Type', 'Net Value (GBP)']

function escapeCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

export function createInvoicesCSV(invoices) {
  const rows = invoices.map(invoice => [invoice.id, invoice.date, invoice.customerId ?? '', invoice.country, invoice.type, invoice.revenue.toFixed(2)])
  return [headers, ...rows].map(row => row.map(escapeCell).join(',')).join('\r\n') + '\r\n'
}

export function exportInvoicesCSV(invoices, period) {
  const file = new Blob(['\uFEFF', createInvoicesCSV(invoices)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  const market = period.market ? `_${period.market.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : ''
  link.href = url
  link.download = `lyse-invoices_${period.start}_to_${period.end}${market}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
