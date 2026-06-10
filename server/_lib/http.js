export function sendJson(response, status, body) {
  response.status(status)
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.json(body)
}

export function rejectMethod(response, allowed) {
  response.setHeader('Allow', allowed.join(', '))
  sendJson(response, 405, { error: 'Método não permitido.' })
}

export function readBody(request) {
  if (!request.body) return {}
  if (typeof request.body === 'string') return JSON.parse(request.body)
  return request.body
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function cleanText(value, maxLength = 500) {
  return String(value || '').trim().slice(0, maxLength)
}

export function parseCookies(request) {
  const header = request.headers.cookie || ''
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf('=')
        return [
          decodeURIComponent(part.slice(0, separator)),
          decodeURIComponent(part.slice(separator + 1)),
        ]
      }),
  )
}

export function getClientIp(request) {
  const forwarded = request.headers['x-forwarded-for']
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || '')
    .split(',')[0]
    .trim()
    .slice(0, 80)
}

export function isSameOrigin(request) {
  const origin = request.headers.origin
  if (!origin) return true
  try {
    return new URL(origin).host === request.headers.host
  } catch {
    return false
  }
}
