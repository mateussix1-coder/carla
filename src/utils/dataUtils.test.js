import test from 'node:test'
import assert from 'node:assert/strict'
import {
  generateId,
  isValidHttpUrl,
  sanitizeInput,
  videoEmbedUrl,
} from './dataUtils.js'

test('gera identificadores com prefixo', () => {
  assert.match(generateId('ANX'), /^ANX-/)
})

test('remove caracteres perigosos e limita o tamanho', () => {
  assert.equal(sanitizeInput('  <script>teste</script>  ', 12), 'scriptteste/')
})

test('aceita apenas URLs HTTP ou HTTPS', () => {
  assert.equal(isValidHttpUrl('https://example.com/foto.jpg'), true)
  assert.equal(isValidHttpUrl('javascript:alert(1)'), false)
})

test('converte links de vídeo conhecidos para incorporação segura', () => {
  assert.equal(
    videoEmbedUrl('https://youtu.be/abc123'),
    'https://www.youtube-nocookie.com/embed/abc123',
  )
})
