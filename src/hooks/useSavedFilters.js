import { useEffect, useState } from 'react'
import { validateRange } from '../utils/dateUtils.js'

const STORAGE_KEY = 'lyse-reporting-filters'

function readFilters() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function useSavedFilters(bounds) {
  const [saved, setSaved] = useState(readFilters)
  const period = bounds && (saved && !validateRange(saved, bounds) ? saved : bounds)

  useEffect(() => {
    try {
      if (saved) localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Reporting remains available when browser storage is disabled.
    }
  }, [saved])

  return { period, apply: setSaved, reset: () => setSaved(null) }
}
