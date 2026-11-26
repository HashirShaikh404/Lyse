
import { useEffect, useState } from 'react'
import { shiftDate, validateRange } from '../utils/dateUtils.js'

const STORAGE_KEY = 'lyse-retail-filters'

function readFilters() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function useSavedFilters(bounds) {
  const [saved, setSaved] = useState(readFilters)
  const defaults = bounds && { start: [bounds.start, shiftDate(bounds.end, -59)].sort().at(-1), end: bounds.end, market: '' }
  const period = bounds && (saved && !validateRange(saved, bounds) ? { ...saved, market: typeof saved.market === 'string' ? saved.market : '' } : defaults)

  useEffect(() => {
    try {
      if (saved) localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Reporting remains available when browser storage is disabled.
    }
  }, [saved])

  return { period, defaults, apply: setSaved, reset: () => setSaved(null) }
}
