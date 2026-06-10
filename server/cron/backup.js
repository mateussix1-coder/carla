import { put } from '@vercel/blob'
import { getSql } from '../_lib/db.js'
import { sendJson } from '../_lib/http.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return sendJson(response, 405, { error: 'Método não permitido.' })
  }
  if (
    !process.env.CRON_SECRET ||
    request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return sendJson(response, 401, { error: 'Não autorizado.' })
  }

  const sql = getSql()
  const [
    appState,
    users,
    posts,
    likes,
    comments,
    classes,
    classInvitations,
    classMemberships,
    classActivities,
    classEvents,
    accessEvents,
    auditEvents,
  ] = await Promise.all([
    sql`SELECT * FROM app_state`,
    sql`
      SELECT
        id, name, email, role, class_name, responsibility, notes, private_notes,
        avatar_path, status, setup_complete, created_at, updated_at, last_login_at
      FROM users
    `,
    sql`SELECT * FROM posts`,
    sql`SELECT * FROM post_likes`,
    sql`SELECT * FROM post_comments`,
    sql`SELECT * FROM classes`,
    sql`SELECT * FROM class_invitations`,
    sql`SELECT * FROM class_memberships`,
    sql`SELECT * FROM class_activities`,
    sql`SELECT * FROM class_events`,
    sql`SELECT * FROM access_events WHERE created_at > NOW() - INTERVAL '180 days'`,
    sql`SELECT * FROM audit_events WHERE created_at > NOW() - INTERVAL '365 days'`,
  ])

  const timestamp = new Date().toISOString()
  const pathname = `backups/ciclo114-${timestamp.slice(0, 10)}.json`
  await put(
    pathname,
    JSON.stringify({
      schemaVersion: 2,
      createdAt: timestamp,
      appState,
      users,
      posts,
      likes,
      comments,
      classes,
      classInvitations,
      classMemberships,
      classActivities,
      classEvents,
      accessEvents,
      auditEvents,
    }),
    {
      access: 'private',
      contentType: 'application/json',
      allowOverwrite: true,
      addRandomSuffix: false,
      cacheControlMaxAge: 60,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    },
  )

  return sendJson(response, 200, { ok: true, pathname, createdAt: timestamp })
}
