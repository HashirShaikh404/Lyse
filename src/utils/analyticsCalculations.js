export function prepareOrders({ orders, details, products }) {
  const productsById = new Map(products.map(product => [product.ProductID, product]))
  const linesByOrder = new Map()
  const seenLines = new Set()

  for (const line of details) {
    const key = `${line.OrderID}:${line.ProductID}`
    if (seenLines.has(key)) continue
    seenLines.add(key)
    const product = productsById.get(line.ProductID)
    const orderLines = linesByOrder.get(line.OrderID) ?? []
    orderLines.push({
      productId: line.ProductID,
      name: product?.ProductName ?? `Product ${line.ProductID}`,
      category: product?.Category?.CategoryName ?? 'Uncategorized',
      units: line.Quantity,
      revenue: line.UnitPrice * line.Quantity * (1 - line.Discount),
    })
    linesByOrder.set(line.OrderID, orderLines)
  }

  const uniqueOrders = new Map(orders.map(order => [order.OrderID, order]))
  return [...uniqueOrders.values()].map(order => {
    const lines = linesByOrder.get(order.OrderID)
    if (!lines) throw new Error(`Northwind returned no line items for order ${order.OrderID}. Please try again.`)
    return {
      id: order.OrderID,
      date: new Date(order.OrderDate).toISOString().slice(0, 10),
      customerId: order.CustomerID,
      customer: order.Customer?.CompanyName ?? order.CustomerID ?? 'Unknown customer',
      employeeId: order.EmployeeID,
      employee: order.Employee ? `${order.Employee.FirstName} ${order.Employee.LastName}` : 'Unassigned',
      country: order.Customer?.Country ?? 'Unknown country',
      revenue: lines.reduce((sum, line) => sum + line.revenue, 0),
      lines,
    }
  }).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
}

function getGroup(groups, key, initial) {
  if (!groups.has(key)) groups.set(key, initial)
  return groups.get(key)
}

const rankByRevenue = groups => [...groups.values()].sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name))

export function calculateAnalytics(orders, { start, end }) {
  const filteredOrders = orders.filter(order => order.date >= start && order.date <= end)
  const months = new Map()
  const categories = new Map()
  const countries = new Map()
  const products = new Map()
  const customers = new Map()
  const employees = new Map()
  let revenue = 0

  // Include months with no orders so the charts retain the full reporting period.
  const monthDate = new Date(`${start.slice(0, 7)}-01`)
  while (monthDate.toISOString().slice(0, 10) <= end) {
    const month = monthDate.toISOString().slice(0, 7)
    months.set(month, { month, orders: 0, revenue: 0 })
    monthDate.setUTCMonth(monthDate.getUTCMonth() + 1)
  }

  for (const order of filteredOrders) {
    revenue += order.revenue
    const month = months.get(order.date.slice(0, 7))
    month.orders += 1
    month.revenue += order.revenue
    getGroup(countries, order.country, { name: order.country, revenue: 0 }).revenue += order.revenue

    if (order.customerId != null) {
      const customer = getGroup(customers, order.customerId, {
        id: order.customerId, name: order.customer, country: order.country, orders: 0, revenue: 0,
      })
      customer.orders += 1
      customer.revenue += order.revenue
    }

    const employee = getGroup(employees, order.employeeId, {
      id: order.employeeId, name: order.employee, orders: 0, revenue: 0,
    })
    employee.orders += 1
    employee.revenue += order.revenue

    for (const line of order.lines) {
      getGroup(categories, line.category, { name: line.category, revenue: 0 }).revenue += line.revenue
      const product = getGroup(products, line.productId, {
        id: line.productId, name: line.name, category: line.category, units: 0, revenue: 0,
      })
      product.units += line.units
      product.revenue += line.revenue
    }
  }

  return {
    filteredOrders, revenue, orderCount: filteredOrders.length, customerCount: customers.size,
    averageOrderValue: filteredOrders.length ? revenue / filteredOrders.length : 0,
    monthly: [...months.values()], categories: rankByRevenue(categories), countries: rankByRevenue(countries),
    products: [...products.values()].sort((a, b) => b.units - a.units || b.revenue - a.revenue || a.name.localeCompare(b.name)),
    customers: rankByRevenue(customers), employees: rankByRevenue(employees),
  }
}
