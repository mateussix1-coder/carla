import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_MONITOR_MODULES,
  accessModulesForRole,
  firstAllowedPath,
  hasModuleAccess,
  normalizeAccessModules,
} from './access.js'

test('normaliza módulos sem aceitar valores desconhecidos', () => {
  assert.deepEqual(
    normalizeAccessModules(['matrizes', 'matrizes', 'inexistente']),
    ['matrizes'],
  )
  assert.deepEqual(normalizeAccessModules('["partos","leitoes"]'), ['partos', 'leitoes'])
})

test('monitor recebe todos os módulos quando nenhum foi escolhido', () => {
  assert.deepEqual(accessModulesForRole([], 'monitor'), DEFAULT_MONITOR_MODULES)
})

test('calcula acesso e primeira tela permitida', () => {
  const user = { role: 'student', accessModules: ['leitoes'] }
  assert.equal(hasModuleAccess(user, 'leitoes'), true)
  assert.equal(hasModuleAccess(user, 'matrizes'), false)
  assert.equal(firstAllowedPath(user), '/leitoes')
  assert.equal(hasModuleAccess({ role: 'teacher' }, 'relatorios'), true)
})
