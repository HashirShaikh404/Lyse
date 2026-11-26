
const integer = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })
const amount = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })
const compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 1 })
const change = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' })

export const formatNumber = value => integer.format(value)
export const formatAmount = value => amount.format(value)
export const formatCompact = value => compact.format(value)
export const formatCompactAmount = value => `${value < 0 ? '−' : ''}£${formatCompact(Math.abs(value))}`
export const formatPercent = value => percent.format(value)
export const formatChange = value => change.format(value)
