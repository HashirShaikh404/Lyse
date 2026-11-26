
import { useEffect, useState } from 'react'
import { getRetailDataset, getRetailRows } from '../services/analyticsService.js'
import { prepareRetailData } from '../utils/analyticsCalculations.js'

export function useRetailDataset() {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null)

  useEffect(() => {
    let active = true
    getRetailDataset()
      .then(dataset => { if (active) setResult({ dataset, attempt }) })
      .catch(error => { if (active) setResult({ error: error.message, attempt }) })
    return () => { active = false }
  }, [attempt])

  return { ...(result?.attempt === attempt ? result : null), retry: () => setAttempt(attempt + 1) }
}

export function useSalesAnalytics(dataset, period) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null)
  const start = period?.start
  const end = period?.end

  useEffect(() => {
    if (!dataset || !start || !end) return
    let active = true
    getRetailRows(dataset, start, end)
      .then(({ rows, previousPeriod }) => {
        if (active) setResult({ dataset, start, end, attempt, data: prepareRetailData(rows, { start, end }, previousPeriod) })
      })
      .catch(error => {
        if (active) setResult({ dataset, start, end, attempt, error: error.message })
      })
    return () => { active = false }
  }, [dataset, start, end, attempt])

  const current = result?.dataset === dataset && result?.start === start && result?.end === end && result?.attempt === attempt ? result : null
  return { ...current, retry: () => setAttempt(attempt + 1) }
}
