const dayFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
})

const monthFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short', year: '2-digit', timeZone: 'UTC',
})

export const formatDate = date => dayFormat.format(new Date(date))
export const formatMonth = month => monthFormat.format(new Date(`${month}-01`))
export const formatPeriod = ({ start, end }) => `${formatDate(start)} – ${formatDate(end)}`

export function validateRange(period, bounds) {
  const { start, end } = period ?? {}
  const validDate = date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date

  if (!validDate(start) || !validDate(end)) return 'Enter a valid start and end date.'
  if (start > end) return 'The start date must be on or before the end date.'
  if (start < bounds.start || end > bounds.end) return 'Choose dates within the available dataset range.'
  return ''
}
