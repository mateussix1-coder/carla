import assert from 'node:assert/strict'
import test from 'node:test'
import {
  cleanText,
  isSameOrigin,
  normalizeEmail,
  parseCookies,
} from './http.js'

test('normaliza e limita dados de entrada', () => {
  assert.equal(normalizeEmail('  Aluno@Escola.COM '), 'aluno@escola.com')
  assert.equal(cleanText('  abcdef  ', 4), 'abcd')
})

test('valida origem e cookies da sessão', () => {
  assert.equal(
    isSameOrigin({ headers: { origin: 'https://ciclo.test', host: 'ciclo.test' } }),
    true,
  )
  assert.equal(
    isSameOrigin({ headers: { origin: 'https://ataque.test', host: 'ciclo.test' } }),
    false,
  )
  assert.deepEqual(
    parseCookies({ headers: { cookie: 'a=1; ciclo114_session=token-seguro' } }),
    { a: '1', ciclo114_session: 'token-seguro' },
  )
})
