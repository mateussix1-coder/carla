import { getSql } from '../_lib/db.js'
import { getSession, publicUser } from '../_lib/auth.js'
import { rejectMethod, sendJson } from '../_lib/http.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') return rejectMethod(response, ['GET'])

  try {
    const sql = getSql()
    const [session, teacherRows] = await Promise.all([
      getSession(request),
      sql`
        SELECT password_hash, setup_complete
        FROM users
        WHERE role = 'teacher' AND status = 'active'
        ORDER BY created_at ASC
        LIMIT 1
      `,
    ])
    const teacher = teacherRows[0]

    sendJson(response, 200, {
      user: publicUser(session?.user),
      quickTeacherLoginAvailable: Boolean(
        teacher && !teacher.password_hash && !teacher.setup_complete,
      ),
    })
  } catch (error) {
    sendJson(response, 503, {
      error: error.message || 'Não foi possível consultar a sessão.',
      databaseReady: false,
    })
  }
}
