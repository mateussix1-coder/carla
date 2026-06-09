const DAY_IN_MS = 24 * 60 * 60 * 1000

export function toLocalDate(value = new Date()) {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  const [year, month, day] = String(value).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toISODate(value = new Date()) {
  const date = toLocalDate(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(value, amount) {
  const date = toLocalDate(value)
  date.setDate(date.getDate() + amount)
  return toISODate(date)
}

export function differenceInDays(later, earlier) {
  return Math.round((toLocalDate(later) - toLocalDate(earlier)) / DAY_IN_MS)
}

export function formatDate(value, options = {}) {
  if (!value) return 'Não informado'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: options.shortYear ? '2-digit' : 'numeric',
    ...options,
  }).format(toLocalDate(value))
}

export function formatShortDate(value) {
  if (!value) return '--'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
    .format(toLocalDate(value))
    .replace('.', '')
}

export function startOfMonth(value = new Date()) {
  const date = toLocalDate(value)
  return toISODate(new Date(date.getFullYear(), date.getMonth(), 1))
}

export function isWithinNextDays(value, days, reference = new Date()) {
  const difference = differenceInDays(value, reference)
  return difference >= 0 && difference <= days
}
