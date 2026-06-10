import { randomUUID } from 'node:crypto'
import { requireUser } from '../../_lib/auth.js'
import { getSql } from '../../_lib/db.js'
import { cleanText, readBody, rejectMethod, sendJson } from '../../_lib/http.js'

export default async function handler(request, response) {
  const session = await requireUser(request, response)
  if (!session) return
  if (request.method !== 'POST') return rejectMethod(response, ['POST'])

  const postId = cleanText(request.query.id, 80)
  const text = cleanText(readBody(request).text, 1000)
  if (!text) return sendJson(response, 400, { error: 'Escreva um comentário.' })

  const sql = getSql()
  const post = await sql`
    SELECT p.class_id, c.settings
    FROM posts p
    LEFT JOIN classes c ON c.id = p.class_id
    WHERE
      p.id = ${postId}
      AND p.deleted_at IS NULL
      AND (
        ${session.user.role} = 'teacher'
        OR p.class_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM class_memberships cm
          WHERE
            cm.class_id = p.class_id
            AND cm.user_id = ${session.user.id}
            AND cm.status = 'active'
        )
      )
    LIMIT 1
  `
  if (!post[0]) return sendJson(response, 404, { error: 'Publicação não encontrada.' })
  if (
    session.user.role === 'student' &&
    post[0].class_id &&
    post[0].settings?.allowComments === false
  ) {
    return sendJson(response, 403, { error: 'Os comentários estão desativados nesta turma.' })
  }

  const commentId = randomUUID()
  await sql`
    INSERT INTO post_comments (id, post_id, author_id, body)
    VALUES (${commentId}, ${postId}, ${session.user.id}, ${text})
  `

  return sendJson(response, 201, {
    comment: {
      id: commentId,
      authorId: session.user.id,
      author: session.user.name,
      text,
      date: new Date().toISOString(),
    },
  })
}
