import { requireUser } from '../../_lib/auth.js'
import { getSql } from '../../_lib/db.js'
import { cleanText, rejectMethod, sendJson } from '../../_lib/http.js'

export default async function handler(request, response) {
  const session = await requireUser(request, response)
  if (!session) return
  if (request.method !== 'POST') return rejectMethod(response, ['POST'])

  const postId = cleanText(request.query.id, 80)
  const sql = getSql()
  const allowed = await sql`
    SELECT 1
    FROM posts p
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
  if (!allowed[0]) {
    return sendJson(response, 404, { error: 'Publicação não encontrada.' })
  }
  const existing = await sql`
    SELECT 1
    FROM post_likes
    WHERE post_id = ${postId} AND user_id = ${session.user.id}
    LIMIT 1
  `

  if (existing.length) {
    await sql`
      DELETE FROM post_likes
      WHERE post_id = ${postId} AND user_id = ${session.user.id}
    `
  } else {
    await sql`
      INSERT INTO post_likes (post_id, user_id)
      VALUES (${postId}, ${session.user.id})
      ON CONFLICT DO NOTHING
    `
  }

  return sendJson(response, 200, { liked: !existing.length })
}
