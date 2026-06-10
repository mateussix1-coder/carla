import { Readable } from 'node:stream'
import { get } from '@vercel/blob'
import { requireUser } from './_lib/auth.js'
import { cleanText, rejectMethod, sendJson } from './_lib/http.js'

export default async function handler(request, response) {
  const session = await requireUser(request, response)
  if (!session) return
  if (request.method !== 'GET') return rejectMethod(response, ['GET'])

  const pathname = cleanText(request.query.path, 1200)
  if (!pathname || pathname.includes('..')) {
    return sendJson(response, 400, { error: 'Caminho de imagem inválido.' })
  }

  const result = await get(pathname, {
    access: 'private',
    useCache: false,
    ifNoneMatch: request.headers['if-none-match'],
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  if (!result) return sendJson(response, 404, { error: 'Imagem não encontrada.' })

  response.status(result.statusCode)
  response.setHeader('ETag', result.blob.etag)
  response.setHeader('Cache-Control', 'private, max-age=3600')
  if (result.statusCode === 304) return response.end()

  response.setHeader('Content-Type', result.blob.contentType)
  response.setHeader('Content-Length', String(result.blob.size))
  return Readable.fromWeb(result.stream).pipe(response)
}
