import { randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { listFeed } from '../_lib/feed.js'
import { cleanText, readBody, rejectMethod, sendJson } from '../_lib/http.js'

export default async function handler(request, response) {
  const session = await requireUser(request, response)
  if (!session) return

  if (request.method === 'GET') {
    const classId = cleanText(request.query.classId, 120)
    if (classId && session.user.role !== 'teacher') {
      const sql = getSql()
      const membership = await sql`
        SELECT 1
        FROM class_memberships
        WHERE class_id = ${classId} AND user_id = ${session.user.id} AND status = 'active'
        LIMIT 1
      `
      if (!membership[0]) return sendJson(response, 403, { error: 'Você não participa desta turma.' })
    }
    const posts = await listFeed(session.user.id, {
      role: session.user.role,
      classId,
    })
    return sendJson(response, 200, { posts })
  }

  if (request.method === 'POST') {
    const body = readBody(request)
    const activity = cleanText(body.activity, 160)
    const related = cleanText(body.related, 180)
    const text = cleanText(body.text, 3000)
    const imagePath = cleanText(body.imagePath, 1200)
    const classId = cleanText(body.classId, 120)

    if (activity.length < 3 || text.length < 3) {
      return sendJson(response, 400, { error: 'Descreva a atividade realizada.' })
    }

    const sql = getSql()
    if (classId) {
      const allowed = session.user.role === 'teacher'
        ? await sql`SELECT settings FROM classes WHERE id = ${classId} LIMIT 1`
        : await sql`
            SELECT c.settings
            FROM class_memberships cm
            JOIN classes c ON c.id = cm.class_id
            WHERE
              cm.class_id = ${classId}
              AND cm.user_id = ${session.user.id}
              AND cm.status = 'active'
            LIMIT 1
          `
      if (!allowed[0]) return sendJson(response, 403, { error: 'Você não pode publicar nesta turma.' })
      if (
        session.user.role === 'student' &&
        imagePath &&
        allowed[0].settings?.allowAttachments === false
      ) {
        return sendJson(response, 403, { error: 'O envio de anexos está desativado nesta turma.' })
      }
    }
    const postId = randomUUID()
    await sql`
      INSERT INTO posts (
        id, author_id, class_id, activity, related, body, image_path
      )
      VALUES (
        ${postId},
        ${session.user.id},
        ${classId || null},
        ${activity},
        ${related},
        ${text},
        ${imagePath}
      )
    `
    await sql`
      INSERT INTO audit_events (
        id, user_id, event_type, entity_type, entity_id, metadata
      )
      VALUES (
        ${randomUUID()},
        ${session.user.id},
        'post_created',
        'post',
        ${postId},
        ${JSON.stringify({ classId: classId || null })}::jsonb
      )
    `

    const posts = await listFeed(session.user.id, {
      role: session.user.role,
      classId,
    })
    return sendJson(response, 201, {
      post: posts.find((post) => post.id === postId),
    })
  }

  return rejectMethod(response, ['GET', 'POST'])
}
