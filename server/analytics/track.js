import { randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import {
  cleanText,
  getClientIp,
  readBody,
  rejectMethod,
  sendJson,
} from '../_lib/http.js'

export default async function handler(request, response) {
  const session = await requireUser(request, response)
  if (!session) return
  if (request.method !== 'POST') return rejectMethod(response, ['POST'])

  const route = cleanText(readBody(request).route, 240)
  if (!route.startsWith('/')) return sendJson(response, 400, { error: 'Rota inválida.' })

  const sql = getSql()
  const recent = await sql`
    SELECT 1
    FROM access_events
    WHERE
      user_id = ${session.user.id}
      AND event_type = 'page_view'
      AND route = ${route}
      AND created_at > NOW() - INTERVAL '2 minutes'
    LIMIT 1
  `

  if (!recent.length) {
    await sql`
      INSERT INTO access_events (
        id, user_id, event_type, route, user_agent, ip_address, metadata
      )
      VALUES (
        ${randomUUID()},
        ${session.user.id},
        'page_view',
        ${route},
        ${String(request.headers['user-agent'] || '').slice(0, 500)},
        ${getClientIp(request)},
        '{}'::jsonb
      )
    `
  }

  return sendJson(response, 200, { ok: true })
}
