import { useState } from 'react'
import { CalendarRange, RotateCcw } from 'lucide-react'
import { formatPeriod, validateRange } from '../../utils/dateUtils.js'

export default function DateFilters({ bounds, period, onApply, onReset }) {
  const [draft, setDraft] = useState(period ?? { start: '', end: '' })
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    const message = validateRange(draft, bounds)
    setError(message)
    if (!message) onApply(draft)
  }

  function reset() {
    setDraft(bounds)
    setError('')
    onReset()
  }

  return (
    <section className="panel filters" aria-label="Reporting period">
      <div className="filter-intro">
        <div className="icon-tile"><CalendarRange size={20} aria-hidden="true" /></div>
        <div><h2>Reporting period</h2><p aria-live="polite">{period ? formatPeriod(period) : 'Awaiting dataset dates'}</p></div>
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
