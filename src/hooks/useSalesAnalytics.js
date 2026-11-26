import { useEffect, useState } from 'react'
import { clearNorthwindCache, getNorthwindData } from '../services/analyticsService.js'
import { prepareOrders } from '../utils/analyticsCalculations.js'

export function useSalesAnalytics() {
  const [request, setRequest] = useState({ source: 'api' })
  const [result, setResult] = useState(null)

  useEffect(() => {
    let active = true
    getNorthwindData(request.source)
      .then(data => {
        if (!active) return
        try {
          const orders = prepareOrders(data)
          setResult({ request, status: 'success', orders })
        } catch (error) {
          if (request.source === 'api') clearNorthwindCache()
          throw error
        }
      })
      .catch(error => {
        if (active) setResult({ request, status: 'error', error: error.message })
      })
    return () => { active = false }
  }, [request])

  const current = result?.request === request ? result : { status: 'loading' }
  const orders = current.orders ?? []
  const bounds = orders.length ? { start: orders[0].date, end: orders.at(-1).date } : null

  return { ...current, orders, bounds, source: request.source, load: source => setRequest({ source }) }
}
