import test from 'node:test'
import assert from 'node:assert/strict'
import {
  expectedBirthDate,
  gestationDetails,
  lotStatus,
  nextWeighing,
  totalBorn,
} from './calculations.js'

test('previsão de parto soma 114 dias', () => {
  assert.equal(expectedBirthDate('2026-01-01'), '2026-04-25')
})

test('detalhes gestacionais calculam progresso e fase', () => {
  const result = gestationDetails('2026-01-01', '2026-04-20')
  assert.equal(result.elapsed, 109)
  assert.equal(result.remaining, 5)
  assert.equal(result.stage, 'Próximo ao parto')
})

test('gestação atrasada não é classificada como próxima', () => {
  const result = gestationDetails('2026-01-01', '2026-04-27')
  assert.equal(result.elapsed, 116)
  assert.equal(result.remaining, -2)
  assert.equal(result.progress, 100)
  assert.equal(result.stage, 'Atrasada')
})

test('gestação com mais de sete dias fica dentro do prazo', () => {
  const result = gestationDetails('2026-03-01', '2026-04-01')
  assert.equal(result.stage, 'Dentro do prazo')
})

test('limite de alerta pode ser configurado', () => {
  const result = gestationDetails('2026-01-01', '2026-04-15', 10)
  assert.equal(result.remaining, 10)
  assert.equal(result.stage, 'Próximo ao parto')
})

test('total nascido soma todos os resultados', () => {
  assert.equal(totalBorn({ alive: 10, stillborn: 1, mummified: 2 }), 13)
})

test('próxima pesagem e status acompanham fases', () => {
  assert.equal(nextWeighing({ PN: 1.4, P07: 2.6 }), 'P14')
  assert.equal(lotStatus({ PN: 1.4, P07: 2.6 }), 'Em acompanhamento')
  assert.equal(lotStatus({ PN: 1.4, PD: 7.8 }), 'Desmamado')
})
