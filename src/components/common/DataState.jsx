import { AlertCircle, Archive, CalendarX2, LoaderCircle, RotateCcw } from 'lucide-react'

export default function DataState({ status, error, source, hasDataset, onLoad }) {
  if (status === 'loading') {
    return <div className="state-banner" role="status"><LoaderCircle className="spin" size={21} /><div><strong>Loading Northwind data</strong><p>Retrieving orders, line items, and product information.</p></div></div>
  }
  if (status === 'error') {
    return (
      <div className="state-banner error-banner" role="alert">
        <AlertCircle size={22} /><div><strong>{source === 'api' ? 'Northwind API is unavailable' : 'Could not load the Northwind archive'}</strong><p>{error}</p></div>
        <div className="state-actions">
          <button type="button" className="button secondary" onClick={() => onLoad('api')}><RotateCcw size={15} />Retry API</button>
          {source === 'api' && <button type="button" className="button primary" onClick={() => onLoad('archive')}><Archive size={16} />Use sample archive</button>}
        </div>
      </div>
    )
  }
  return (
    <div className="panel empty-state" role="status">
      <span className="icon-tile"><CalendarX2 size={24} aria-hidden="true" /></span>
      <h2>{hasDataset ? 'No orders in this period' : 'No orders in the dataset'}</h2>
      <p>{hasDataset ? 'Choose a wider date range or reset the reporting filters to view available orders.' : 'Northwind returned no dated order records.'}</p>
    </div>
  )
}
