import { randomBytes, randomUUID } from 'node:crypto'
import { put } from '@vercel/blob'
import { requireUser } from './_lib/auth.js'
import { getSql } from './_lib/db.js'
import { cleanText, readBody, rejectMethod, sendJson } from './_lib/http.js'

const MIME_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export default async function handler(request, response) {
  const session = await requireUser(request, response)
  if (!session) return
  if (request.method !== 'POST') return rejectMethod(response, ['POST'])

  try {
    const sql = getSql()
    const recentUploads = await sql`
      SELECT COUNT(*)::int AS total
      FROM audit_events
      WHERE
        user_id = ${session.user.id}
        AND event_type = 'image_uploaded'
        AND created_at > NOW() - INTERVAL '1 hour'
    `
    if (Number(recentUploads[0]?.total || 0) >= 30) {
      return sendJson(response, 429, {
        error: 'Limite de imagens por hora atingido. Tente novamente mais tarde.',
      })
    }

    const body = readBody(request)
    const match = String(body.dataUrl || '').match(
      /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/,
    )
    if (!match) {
      return sendJson(response, 400, { error: 'Envie uma imagem JPG, PNG ou WebP.' })
    }

    const mimeType = match[1]
    const buffer = Buffer.from(match[2], 'base64')
    if (!buffer.length || buffer.length > 2.5 * 1024 * 1024) {
      return sendJson(response, 413, {
        error: 'A imagem precisa ter no máximo 2,5 MB após a otimização.',
      })
    }

    const kind = ['avatars', 'feed'].includes(body.kind) ? body.kind : 'misc'
    const extension = MIME_EXTENSIONS[mimeType]
    const pathname = `${kind}/${session.user.id}/${Date.now()}-${randomBytes(6).toString('hex')}.${extension}`
    const blob = await put(pathname, buffer, {
      access: 'private',
      contentType: mimeType,
      addRandomSuffix: false,
      cacheControlMaxAge: 86400,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    await sql`
      INSERT INTO audit_events (
        id, user_id, event_type, entity_type, entity_id, metadata
      )
      VALUES (
        ${randomUUID()},
        ${session.user.id},
        'image_uploaded',
        'blob',
        ${blob.pathname},
        ${JSON.stringify({ kind, bytes: buffer.length })}::jsonb
      )
    `

    return sendJson(response, 201, {
      path: cleanText(blob.pathname, 1200),
      mediaUrl: `/api/media/${blob.pathname
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`,
    })
  } catch (error) {
    return sendJson(response, 503, {
      error: error.message || 'Não foi possível guardar a imagem.',
    })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
}
