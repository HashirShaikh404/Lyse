
import { useState } from 'react'
import { CalendarRange, ChevronDown, RotateCcw } from 'lucide-react'
import { formatPeriod, validateRange } from '../../utils/dateUtils.js'

export default function DateFilters({ bounds, period, defaults, markets = [], onApply, onReset }) {
  const [draft, setDraft] = useState(period ?? { start: '', end: '', market: '' })
  const [error, setError] = useState('')
  const options = [...new Set([...markets, draft.market].filter(Boolean))].sort()

  function submit(event) {
    event.preventDefault()
    const message = validateRange(draft, bounds)
    setError(message)
    if (!message) onApply(draft)
  }

  function reset() {
    setDraft(defaults)
    setError('')
    onReset()
  }

  return (
    <section className="panel filters" aria-label="Reporting period and market">
      <div className="filter-intro">
        <div className="icon-tile"><CalendarRange size={20} aria-hidden="true" /></div>
        <div><h2>Reporting period</h2><p aria-live="polite">{period ? formatPeriod(period) : 'Awaiting dataset dates'}</p>
          {period && <p className="active-market">{period.market || 'All markets'}</p>}
        </div>
      </div>
      <form onSubmit={submit} noValidate>
        <fieldset disabled={!bounds}>
          {['start', 'end'].map(field => (
            <label key={field}>{field === 'start' ? 'Start date' : 'End date'}
              <input type="date" required min={bounds?.start} max={bounds?.end} value={draft[field]}
                aria-invalid={Boolean(error)} aria-describedby={error ? 'date-error' : undefined}
                onChange={event => {
                  setDraft({ ...draft, [field]: event.target.value })
                  setError('')
                }} />
            </label>
          ))}
          <div className="market-field"><label htmlFor="market-filter">Market</label>
            <span className="market-select">
              <select id="market-filter" value={draft.market} onChange={event => setDraft({ ...draft, market: event.target.value })}>
                <option value="">All markets</option>
                {options.map(market => <option key={market}>{market}</option>)}
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </span>
          </div>
          <div className="filter-actions">
            <button className="button secondary" type="button" onClick={reset}><RotateCcw size={15} aria-hidden="true" />Reset Filters</button>
            <button className="button primary" type="submit">Apply Filters</button>
          </div>
        </fieldset>
        {error && <p id="date-error" className="field-error" role="alert">{error}</p>}
      </form>
    </section>
  )
}
