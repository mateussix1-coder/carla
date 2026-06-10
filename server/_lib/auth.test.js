import assert from 'node:assert/strict'
import test from 'node:test'
import { hashPassword, verifyPassword } from './auth.js'

test('senha é armazenada com salt e não em texto puro', () => {
  const stored = hashPassword('segredo-forte')
  assert.notEqual(stored, 'segredo-forte')
  assert.equal(verifyPassword('segredo-forte', stored), true)
  assert.equal(verifyPassword('senha-errada', stored), false)
})
