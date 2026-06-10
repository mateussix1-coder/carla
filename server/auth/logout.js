import { clearSessionCookie, destroySession } from '../_lib/auth.js'
import { isSameOrigin, rejectMethod, sendJson } from '../_lib/http.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') return rejectMethod(response, ['POST'])
  if (!isSameOrigin(request)) {
    return sendJson(response, 403, { error: 'Origem da solicitação não autorizada.' })
  }

  try {
    await destroySession(request)
  } finally {
    clearSessionCookie(response, request)
  }

  sendJson(response, 200, { ok: true })
}
