import { createSession, publicUser, verifyPassword } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import {
  normalizeEmail,
  readBody,
  rejectMethod,
  sendJson,
  getClientIp,
  isSameOrigin,
} from '../_lib/http.js'
import { checkRateLimit, recordAuthAttempt } from '../_lib/rateLimit.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') return rejectMethod(response, ['POST'])
  if (!isSameOrigin(request)) {
    return sendJson(response, 403, { error: 'Origem da solicitação não autorizada.' })
  }

  try {
    const sql = getSql()
    const body = readBody(request)
    const identifier = `${getClientIp(request)}:${body.quickTeacher ? 'teacher' : normalizeEmail(body.email)}`
    const allowed = await checkRateLimit(identifier, 'login', 8, 15)
    if (!allowed) {
      return sendJson(response, 429, {
        error: 'Muitas tentativas. Aguarde alguns minutos para tentar novamente.',
      })
    }
    let user

    if (body.quickTeacher === true) {
      const rows = await sql`
        SELECT *
        FROM users
        WHERE
          role = 'teacher'
          AND status = 'active'
          AND password_hash IS NULL
          AND setup_complete = FALSE
        ORDER BY created_at ASC
        LIMIT 1
      `
      user = rows[0]
      if (!user) {
        await recordAuthAttempt(identifier, 'login', false)
        return sendJson(response, 403, {
          error: 'O acesso direto já foi protegido. Entre com e-mail e senha.',
        })
      }
    } else {
      const email = normalizeEmail(body.email)
      const rows = await sql`
        SELECT *
        FROM users
        WHERE email = ${email}
        LIMIT 1
      `
      user = rows[0]
      if (!user || !verifyPassword(String(body.password || ''), user.password_hash)) {
        await recordAuthAttempt(identifier, 'login', false)
        return sendJson(response, 401, { error: 'E-mail ou senha incorretos.' })
      }
      if (user.status !== 'active') {
        await recordAuthAttempt(identifier, 'login', false)
        const messages = {
          pending: 'Sua solicitação ainda aguarda aprovação da professora.',
          blocked: 'Seu acesso está bloqueado. Procure a professora responsável.',
          archived: 'Seu acesso foi removido. Procure a professora responsável.',
          invited: 'Seu cadastro ainda não foi concluído.',
        }
        return sendJson(response, 403, {
          error: messages[user.status] || 'Este acesso não está disponível.',
        })
      }
    }

    await recordAuthAttempt(identifier, 'login', true)
    await createSession(
      response,
      user,
      request,
      body.quickTeacher === true ? 'teacher_quick_login' : 'login',
    )
    sendJson(response, 200, { user: publicUser(user) })
  } catch (error) {
    sendJson(response, 503, { error: error.message || 'Não foi possível entrar.' })
  }
}
