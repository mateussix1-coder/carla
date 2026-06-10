import assert from 'node:assert/strict'
import test from 'node:test'
import { mediaUrl } from './api.js'

test('gera URL autenticada apenas para arquivos privados', () => {
  assert.equal(mediaUrl('/images/aurora.jpg'), '/images/aurora.jpg')
  assert.equal(
    mediaUrl('avatars/user/photo.jpg'),
    '/api/media/avatars/user/photo.jpg',
  )
})
