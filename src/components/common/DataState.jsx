
import { AlertCircle, CalendarX2, LoaderCircle, RotateCcw } from 'lucide-react'

export default function DataState({ status, error, onRetry }) {
  if (status === 'loading') {
    return <div className="state-banner" role="status"><LoaderCircle className="spin" size={21} aria-hidden="true" /><div><strong>Loading retail data</strong><p>Retrieving invoices for your reporting period.</p></div></div>
  }
  if (status === 'error') {
    return (
      <div className="state-banner error-banner" role="alert">
        <AlertCircle size={22} aria-hidden="true" /><div><strong>Could not load retail data</strong><p>{error}</p></div>
        <div className="state-actions"><button type="button" className="button secondary" onClick={onRetry}><RotateCcw size={15} aria-hidden="true" />Retry</button></div>
      </div>
    )
  }
  return (
    <div className="panel empty-state" role="status">
      <span className="icon-tile"><CalendarX2 size={24} aria-hidden="true" /></span>
      <h2>No invoices match these filters</h2>
      <p>Choose a wider date range or switch to all markets.</p>
    </div>
  )
}
