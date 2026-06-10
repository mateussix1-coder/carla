import { addDays, differenceInDays, toISODate } from './dateUtils.js'

export const GESTATION_DAYS = 114

export function expectedBirthDate(coverageDate) {
  return addDays(coverageDate, GESTATION_DAYS)
}

export function gestationDetails(coverageDate, reference = toISODate(), alertDays = 7) {
  const expectedDate = expectedBirthDate(coverageDate)
  const elapsed = Math.max(0, differenceInDays(reference, coverageDate))
  const remaining = differenceInDays(expectedDate, reference)
  const progress = Math.min(100, Math.max(0, Math.round((elapsed / GESTATION_DAYS) * 100)))

  let stage = 'Dentro do prazo'
  if (remaining < 0) stage = 'Atrasada'
  else if (remaining <= Number(alertDays || 7)) stage = 'Próximo ao parto'

  return { expectedDate, elapsed, remaining, progress, stage }
}

export function totalBorn({ alive = 0, stillborn = 0, mummified = 0 }) {
  return Number(alive) + Number(stillborn) + Number(mummified)
}

export function stillbornRate(births) {
  const totals = births.reduce(
    (acc, birth) => ({
      total: acc.total + totalBorn(birth),
      stillborn: acc.stillborn + Number(birth.stillborn || 0),
    }),
    { total: 0, stillborn: 0 },
  )
  return totals.total ? (totals.stillborn / totals.total) * 100 : 0
}

export const WEIGHT_PHASES = ['PN', 'P07', 'P14', 'P21', 'PD']

export function nextWeighing(weights = {}) {
  const next = WEIGHT_PHASES.find((phase) => weights[phase] == null || weights[phase] === '')
  return next || null
}

export function currentWeight(weights = {}) {
  return [...WEIGHT_PHASES].reverse().find((phase) => Number(weights[phase]) > 0)
}

export function weightGain(weights = {}) {
  const currentPhase = currentWeight(weights)
  if (!currentPhase || !Number(weights.PN)) return 0
  return Number(weights[currentPhase]) - Number(weights.PN)
}

export function average(values) {
  const valid = values.map(Number).filter((value) => Number.isFinite(value) && value > 0)
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0
}

export function lotStatus(weights = {}) {
  if (Number(weights.PD) > 0) return 'Desmamado'
  if (Number(weights.P21) > 0) return 'Próximo ao desmame'
  if (Number(weights.P07) > 0 || Number(weights.P14) > 0) return 'Em acompanhamento'
  return 'Recém-nascido'
}
