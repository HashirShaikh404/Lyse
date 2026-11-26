export const NORTHWIND_URL = 'https://services.odata.org/V4/Northwind/Northwind.svc/'

const queries = {
  Orders: 'Orders?$select=OrderID,OrderDate,CustomerID,EmployeeID&$filter=OrderDate%20ne%20null&$expand=Customer($select=CompanyName,Country),Employee($select=FirstName,LastName)',
  Order_Details: 'Order_Details?$select=OrderID,ProductID,UnitPrice,Quantity,Discount',
  Products: 'Products?$select=ProductID,ProductName&$expand=Category($select=CategoryName)',
}

const isText = value => typeof value === 'string'
const isNumber = value => Number.isFinite(value)
const validators = {
  Orders: row => Number.isInteger(row.OrderID) && isText(row.OrderDate) && Number.isFinite(Date.parse(row.OrderDate)) &&
    (row.CustomerID === null || isText(row.CustomerID)) && (row.EmployeeID === null || Number.isInteger(row.EmployeeID)) &&
    (row.Customer === null || (isText(row.Customer?.CompanyName) && (row.Customer.Country === null || isText(row.Customer.Country)))) &&
    (row.Employee === null || (isText(row.Employee?.FirstName) && isText(row.Employee.LastName))),
  Order_Details: row => Number.isInteger(row.OrderID) && Number.isInteger(row.ProductID) &&
    isNumber(row.UnitPrice) && Number.isInteger(row.Quantity) && isNumber(row.Discount),
  Products: row => Number.isInteger(row.ProductID) && isText(row.ProductName) &&
    (row.Category === null || isText(row.Category?.CategoryName)),
}

function validateRows(entity, rows) {
  if (!Array.isArray(rows) || !rows.every(row => row && validators[entity](row))) {
    throw new Error(`Northwind returned an invalid ${entity.replaceAll('_', ' ').toLowerCase()} response.`)
  }
}

async function fetchCollection(entity) {
  let url = new URL(queries[entity], NORTHWIND_URL)
  const seen = new Set()
  const rows = []

  while (url) {
    if (!url.href.startsWith(NORTHWIND_URL) || seen.has(url.href)) {
      throw new Error('Northwind returned an invalid pagination link.')
    }
    seen.add(url.href)
    let response
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      })
    } catch {
      throw new Error('Could not reach the Northwind service. Check your connection and try again.')
    }
    if (!response.ok) throw new Error(`The Northwind service returned HTTP ${response.status}. Please try again.`)
    const page = await response.json().catch(() => null)
    validateRows(entity, page?.value)
    rows.push(...page.value)

    const next = page['@odata.nextLink']
    if (next == null) break
    if (typeof next !== 'string' || !next.trim()) throw new Error('Northwind returned an invalid pagination link.')
    url = new URL(next, url)
    // Some OData feeds emit an absolute HTTP next link even for an HTTPS request.
    if (url.hostname === 'services.odata.org') url.protocol = 'https:'
  }
  return rows
}

// Keep successful collections and share in-flight requests across renders and retries.
const collectionCache = new Map()

export function clearNorthwindCache() {
  collectionCache.clear()
}

function getCollection(entity) {
  if (!collectionCache.has(entity)) {
    const request = fetchCollection(entity).catch(error => {
      collectionCache.delete(entity)
      throw error
    })
    collectionCache.set(entity, request)
  }
  return collectionCache.get(entity)
}

export async function getNorthwindData(source) {
  if (source === 'archive') {
    const { default: archive } = await import('../data/northwindArchive.json')
    validateRows('Orders', archive.orders)
    validateRows('Order_Details', archive.details)
    validateRows('Products', archive.products)
    return archive
  }

  const [orders, details, products] = await Promise.all(Object.keys(queries).map(getCollection))
  return { orders, details, products }
}
