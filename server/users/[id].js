import { randomUUID } from 'node:crypto'
import { publicUser, requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { cleanText, readBody, rejectMethod, sendJson } from '../_lib/http.js'

export default async function handler(request, response) {
  const session = await requireUser(request, response, 'teacher')
  if (!session) return

  const userId = cleanText(request.query.id, 80)
  const sql = getSql()

  if (request.method === 'PATCH') {
    const body = readBody(request)
    const rows = await sql`
      UPDATE users
      SET
        name = ${cleanText(body.name, 120)},
        class_name = ${cleanText(body.className, 120)},
        responsibility = ${cleanText(body.responsibility, 120)},
        private_notes = ${cleanText(body.privateNotes, 1000)},
        avatar_path = ${cleanText(body.avatarPath, 1000)},
        status = ${body.status === 'active' ? 'active' : 'invited'},
        updated_at = NOW()
      WHERE id = ${userId} AND role = 'student' AND status <> 'archived'
      RETURNING *
    `
    if (!rows[0]) return sendJson(response, 404, { error: 'Aluno não encontrado.' })
    return sendJson(response, 200, { user: publicUser(rows[0], true) })
  }

  if (request.method === 'DELETE') {
    const rows = await sql`
      UPDATE users
      SET status = 'archived', updated_at = NOW()
      WHERE id = ${userId} AND role = 'student' AND status <> 'archived'
      RETURNING id, name
    `
    if (!rows[0]) return sendJson(response, 404, { error: 'Aluno não encontrado.' })

    await sql`DELETE FROM sessions WHERE user_id = ${userId}`
    await sql`
      INSERT INTO audit_events (
        id, user_id, event_type, entity_type, entity_id, metadata
      )
      VALUES (
        ${randomUUID()},
        ${session.user.id},
        'student_archived',
        'user',
        ${userId},
        ${JSON.stringify({ name: rows[0].name })}::jsonb
      )
    `
    return sendJson(response, 200, {
      ok: true,
      message: 'Acesso do aluno removido. O histórico foi preservado.',
    })
  }

  return rejectMethod(response, ['PATCH', 'DELETE'])
}
