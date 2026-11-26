const headers = ['Order ID', 'Order Date', 'Customer', 'Employee', 'Country', 'Total Order Value']

function escapeCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

export function createOrdersCSV(orders) {
  const rows = orders.map(order => [order.id, order.date, order.customer, order.employee, order.country, order.revenue.toFixed(2)])
  return [headers, ...rows].map(row => row.map(escapeCell).join(',')).join('\r\n') + '\r\n'
}

export function exportOrdersCSV(orders, period) {
  const file = new Blob(['\uFEFF', createOrdersCSV(orders)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = `lyse-orders_${period.start}_to_${period.end}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
