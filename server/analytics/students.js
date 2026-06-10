import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { rejectMethod, sendJson } from '../_lib/http.js'

export default async function handler(request, response) {
  const session = await requireUser(request, response, 'teacher')
  if (!session) return
  if (request.method !== 'GET') return rejectMethod(response, ['GET'])

  const sql = getSql()
  const rows = await sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.class_name,
      u.responsibility,
      u.avatar_path,
      u.status,
      u.created_at,
      u.last_login_at,
      COUNT(DISTINCT ae.id) FILTER (WHERE ae.event_type = 'page_view')::int AS page_views,
      COUNT(DISTINCT ae.id) FILTER (
        WHERE ae.event_type IN ('login', 'registration', 'teacher_quick_login')
      )::int AS logins,
      COUNT(DISTINCT DATE(ae.created_at))::int AS active_days,
      COUNT(DISTINCT p.id)::int AS posts,
      COUNT(DISTINCT pc.id)::int AS comments,
      COUNT(DISTINCT pl.post_id || ':' || pl.user_id)::int AS likes_received,
      MAX(ae.created_at) AS last_access
    FROM users u
    LEFT JOIN access_events ae ON ae.user_id = u.id
    LEFT JOIN posts p ON p.author_id = u.id AND p.deleted_at IS NULL
    LEFT JOIN post_comments pc ON pc.author_id = u.id AND pc.deleted_at IS NULL
    LEFT JOIN posts liked_post ON liked_post.author_id = u.id AND liked_post.deleted_at IS NULL
    LEFT JOIN post_likes pl ON pl.post_id = liked_post.id
    WHERE u.role = 'student'
    GROUP BY u.id
    ORDER BY u.status ASC, u.name ASC
  `

  const students = rows.map((student) => {
    const score = Math.round(
      Number(student.active_days) * 4 +
      Number(student.page_views) +
      Number(student.posts) * 10 +
      Number(student.comments) * 3 +
      Number(student.likes_received) * 2,
    )
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      className: student.class_name || '',
      responsibility: student.responsibility || '',
      avatarPath: student.avatar_path || '',
      status: student.status,
      createdAt: student.created_at,
      lastLoginAt: student.last_login_at,
      lastAccess: student.last_access,
      pageViews: Number(student.page_views),
      logins: Number(student.logins),
      activeDays: Number(student.active_days),
      posts: Number(student.posts),
      comments: Number(student.comments),
      likesReceived: Number(student.likes_received),
      engagementScore: score,
    }
  })

  return sendJson(response, 200, { students })
}
