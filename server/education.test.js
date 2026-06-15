import assert from 'node:assert/strict'
import test from 'node:test'
import { groupMemberRows } from './education.js'

function memberRow(overrides = {}) {
  return {
    id: 'USR-CLEITON',
    name: 'Cleiton Luis Santos',
    email: 'cleiton@example.com',
    role: 'student',
    status: 'active',
    responsibility: 'Monitor',
    class_name: 'Zootecnia',
    class_id: 'CLS-MR',
    membership_class_name: 'Manejo de matrizes',
    membership_class_code: 'MR',
    membership_role: 'monitor',
    membership_status: 'active',
    module_access: ['academic', 'matrizes'],
    progress: 80,
    requested_at: '2026-06-10T10:00:00.000Z',
    approved_at: '2026-06-11T10:00:00.000Z',
    ...overrides,
  }
}

test('groups repeated memberships into one person with all active areas', () => {
  const members = groupMemberRows([
    memberRow(),
    memberRow({
      class_id: 'CLS-LD',
      membership_class_name: 'Manejo de leitões',
      membership_class_code: 'LD',
      module_access: ['academic', 'leitoes'],
      progress: 60,
    }),
    memberRow({
      class_id: 'CLS-RP',
      membership_class_name: 'Manejo de reprodução',
      membership_class_code: 'RP',
      module_access: ['academic', 'coberturas'],
      progress: 100,
    }),
  ])

  assert.equal(members.length, 1)
  assert.equal(members[0].name, 'Cleiton Luis Santos')
  assert.equal(members[0].membershipRole, 'monitor')
  assert.equal(members[0].membershipStatus, 'active')
  assert.equal(members[0].classes.length, 3)
  assert.deepEqual(
    members[0].classes.map((item) => item.name),
    ['Manejo de matrizes', 'Manejo de leitões', 'Manejo de reprodução'],
  )
  assert.equal(members[0].progress, 80)
})

test('shows one pending approval even when the person has several memberships', () => {
  const members = groupMemberRows([
    memberRow(),
    memberRow({
      class_id: 'CLS-LD',
      membership_class_name: 'Manejo de leitões',
      membership_class_code: 'LD',
      membership_status: 'pending',
      approved_at: null,
    }),
  ])

  assert.equal(members.length, 1)
  assert.equal(members[0].membershipStatus, 'pending')
})
