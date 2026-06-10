import { readFile } from 'node:fs/promises'
import { createServer as createHttpServer } from 'node:http'
import { createServer as createViteServer } from 'vite'

async function loadLocalEnvironment() {
  try {
    const contents = await readFile(new URL('../.env.local', import.meta.url), 'utf8')
    for (const line of contents.split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue
      const separator = line.indexOf('=')
      if (separator < 1) continue
      const key = line.slice(0, separator).trim()
      let value = line.slice(separator + 1).trim()
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
      process.env[key] = value
    }
  } catch {
    // The interface can still open and present the API error state.
  }
}

async function readRequestBody(request) {
  if (['GET', 'HEAD'].includes(request.method)) return undefined
  const chunks = []
  let total = 0
  for await (const chunk of request) {
    total += chunk.length
    if (total > 15 * 1024 * 1024) throw new Error('Solicitação muito grande.')
    chunks.push(chunk)
  }
  if (!chunks.length) return undefined
  const text = Buffer.concat(chunks).toString('utf8')
  if (String(request.headers['content-type'] || '').includes('application/json')) {
    return JSON.parse(text)
  }
  return text
}

await loadLocalEnvironment()
const { default: apiHandler } = await import('../api/index.js')
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'spa',
})

const server = createHttpServer(async (request, response) => {
  if (!request.url.startsWith('/api')) {
    vite.middlewares(request, response, () => {
      response.statusCode = 404
      response.end('Página não encontrada.')
    })
    return
  }

  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)
    request.query = Object.fromEntries(url.searchParams.entries())
    request.body = await readRequestBody(request)
    response.status = (statusCode) => {
      response.statusCode = statusCode
      return response
    }
    response.json = (payload) => response.end(JSON.stringify(payload))
    await apiHandler(request, response)
  } catch (error) {
    if (!response.headersSent) {
      response.statusCode = 500
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
    }
    if (!response.writableEnded) {
      response.end(JSON.stringify({ error: error.message || 'Erro no servidor local.' }))
    }
  }
})

const port = Number(process.env.PORT || 5173)
server.listen(port, '127.0.0.1', () => {
  console.log(`Ciclo 114 disponível em http://127.0.0.1:${port}`)
})

async function shutdown() {
  await vite.close()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
