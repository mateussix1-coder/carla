import { randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { cleanText, rejectMethod, sendJson } from '../_lib/http.js'

export default async function handler(request, response) {
  const session = await requireUser(request, response)
  if (!session) return
  if (request.method !== 'DELETE') return rejectMethod(response, ['DELETE'])

  const postId = cleanText(request.query.id, 80)
  const sql = getSql()
  const rows = await sql`
    UPDATE posts
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE
      id = ${postId}
      AND deleted_at IS NULL
      AND (
        author_id = ${session.user.id}
        OR ${session.user.role} = 'teacher'
      )
    RETURNING id
  `
  if (!rows[0]) {
    return sendJson(response, 404, { error: 'Publicação não encontrada ou sem permissão.' })
  }

  await sql`
    INSERT INTO audit_events (
      id, user_id, event_type, entity_type, entity_id, metadata
    )
    VALUES (
      ${randomUUID()},
      ${session.user.id},
      'post_archived',
      'post',
      ${postId},
      '{}'::jsonb
    )
  `

  return sendJson(response, 200, { ok: true })
}
