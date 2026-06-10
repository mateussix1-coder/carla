import { randomUUID } from 'node:crypto'
import { hashPassword, publicUser, requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import {
  cleanText,
  normalizeEmail,
  readBody,
  rejectMethod,
  sendJson,
} from '../_lib/http.js'

export default async function handler(request, response) {
  const session = await requireUser(request, response, 'teacher')
  if (!session) return

  const sql = getSql()

  if (request.method === 'GET') {
    const rows = await sql`
      SELECT *
      FROM users
      WHERE role = 'student'
      ORDER BY
        CASE status WHEN 'active' THEN 0 WHEN 'invited' THEN 1 ELSE 2 END,
        name ASC
    `
    return sendJson(response, 200, {
      users: rows.map((user) => publicUser(user, true)),
    })
  }

  if (request.method === 'POST') {
    const body = readBody(request)
    const name = cleanText(body.name, 120)
    const email = normalizeEmail(body.email)
    const className = cleanText(body.className, 120)
    const responsibility = cleanText(body.responsibility, 120)
    const privateNotes = cleanText(body.privateNotes, 1000)
    const password = String(body.password || '')

    if (name.length < 3 || !email.includes('@') || className.length < 2) {
      return sendJson(response, 400, { error: 'Preencha nome, e-mail e turma.' })
    }
    if (password && password.length < 8) {
      return sendJson(response, 400, {
        error: 'A senha provisória precisa ter pelo menos 8 caracteres.',
      })
    }

    const duplicate = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
    if (duplicate.length) {
      return sendJson(response, 409, { error: 'Este e-mail já está cadastrado.' })
    }

    const userId = randomUUID()
    const rows = await sql`
      INSERT INTO users (
        id, name, email, password_hash, role, class_name,
        responsibility, private_notes, status, setup_complete
      )
      VALUES (
        ${userId},
        ${name},
        ${email},
        ${password ? hashPassword(password) : null},
        'student',
        ${className},
        ${responsibility || 'Aluno'},
        ${privateNotes},
        ${password ? 'active' : 'invited'},
        ${Boolean(password)}
      )
      RETURNING *
    `

    await sql`
      INSERT INTO audit_events (
        id, user_id, event_type, entity_type, entity_id, metadata
      )
      VALUES (
        ${randomUUID()},
        ${session.user.id},
        'student_created',
        'user',
        ${userId},
        ${JSON.stringify({ email, className })}::jsonb
      )
    `

    return sendJson(response, 201, { user: publicUser(rows[0], true) })
  }

  return rejectMethod(response, ['GET', 'POST'])
}
