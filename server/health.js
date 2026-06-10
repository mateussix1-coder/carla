import { getSql } from './_lib/db.js'
import { rejectMethod, sendJson } from './_lib/http.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') return rejectMethod(response, ['GET'])

  try {
    const sql = getSql()
    await sql`SELECT 1`

    sendJson(response, 200, {
      status: 'ok',
      database: 'ready',
      mediaStorage: process.env.BLOB_READ_WRITE_TOKEN ? 'ready' : 'unavailable',
    })
  } catch {
    sendJson(response, 503, {
      status: 'unavailable',
      database: 'unavailable',
      mediaStorage: process.env.BLOB_READ_WRITE_TOKEN ? 'ready' : 'unavailable',
    })
  }
}
