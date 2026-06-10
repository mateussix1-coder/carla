import { randomUUID } from 'node:crypto'
import {
  hashPassword,
  publicUser,
  requireUser,
  verifyPassword,
} from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { cleanText, readBody, rejectMethod, sendJson } from '../_lib/http.js'

export default async function handler(request, response) {
  const session = await requireUser(request, response)
  if (!session) return
  if (request.method !== 'PATCH') return rejectMethod(response, ['PATCH'])

  const body = readBody(request)
  const sql = getSql()
  const currentRows = await sql`SELECT * FROM users WHERE id = ${session.user.id} LIMIT 1`
  const current = currentRows[0]
  if (!current) return sendJson(response, 404, { error: 'Perfil não encontrado.' })

  let passwordHash = current.password_hash
  let setupComplete = current.setup_complete
  if (body.newPassword) {
    const newPassword = String(body.newPassword)
    if (newPassword.length < 8) {
      return sendJson(response, 400, {
        error: 'A nova senha precisa ter pelo menos 8 caracteres.',
      })
    }
    if (
      current.password_hash &&
      !verifyPassword(String(body.currentPassword || ''), current.password_hash)
    ) {
      return sendJson(response, 401, { error: 'A senha atual está incorreta.' })
    }
    passwordHash = hashPassword(newPassword)
    setupComplete = true
  }

  const rows = await sql`
    UPDATE users
    SET
      name = ${cleanText(body.name || current.name, 120)},
      class_name = ${cleanText(body.className ?? current.class_name, 120)},
      responsibility = ${cleanText(body.responsibility ?? current.responsibility, 120)},
      notes = ${cleanText(body.notes ?? current.notes, 1000)},
      avatar_path = ${cleanText(body.avatarPath ?? current.avatar_path, 1000)},
      password_hash = ${passwordHash},
      setup_complete = ${setupComplete},
      updated_at = NOW()
    WHERE id = ${current.id}
    RETURNING *
  `

  await sql`
    INSERT INTO audit_events (
      id, user_id, event_type, entity_type, entity_id, metadata
    )
    VALUES (
      ${randomUUID()},
      ${current.id},
      'profile_updated',
      'user',
      ${current.id},
      ${JSON.stringify({ passwordChanged: Boolean(body.newPassword) })}::jsonb
    )
  `

  return sendJson(response, 200, { user: publicUser(rows[0]) })
}
