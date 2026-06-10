import { randomUUID } from 'node:crypto'
import { createSession, hashPassword, publicUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import {
  cleanText,
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
    const body = readBody(request)
    const name = cleanText(body.name, 120)
    const email = normalizeEmail(body.email)
    const password = String(body.password || '')
    const className = cleanText(body.className, 120)
    const inviteToken = cleanText(body.inviteToken, 120)
    const identifier = getClientIp(request) || 'unknown'
    const allowed = await checkRateLimit(identifier, 'register', 5, 60)
    if (!allowed) {
      return sendJson(response, 429, {
        error: 'Limite de cadastros atingido. Tente novamente mais tarde.',
      })
    }

    if (name.length < 3 || !email.includes('@') || className.length < 2) {
      await recordAuthAttempt(identifier, 'register', false)
      return sendJson(response, 400, { error: 'Preencha nome, e-mail e turma.' })
    }
    if (password.length < 8) {
      await recordAuthAttempt(identifier, 'register', false)
      return sendJson(response, 400, {
        error: 'A senha precisa ter pelo menos 8 caracteres.',
      })
    }

    const sql = getSql()
    const existing = await sql`
      SELECT id
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `
    if (existing.length) {
      await recordAuthAttempt(identifier, 'register', false)
      return sendJson(response, 409, { error: 'Este e-mail já está cadastrado.' })
    }

    let invitedClass = null
    if (inviteToken) {
      const invitationRows = await sql`
        SELECT c.*
        FROM class_invitations ci
        JOIN classes c ON c.id = ci.class_id
        WHERE
          ci.token = ${inviteToken}
          AND ci.active = TRUE
          AND c.status = 'active'
          AND (ci.expires_at IS NULL OR ci.expires_at > NOW())
          AND COALESCE((c.settings->>'linkActive')::boolean, TRUE) = TRUE
        LIMIT 1
      `
      invitedClass = invitationRows[0]
      if (!invitedClass) {
        await recordAuthAttempt(identifier, 'register', false)
        return sendJson(response, 404, { error: 'O convite da turma não está mais disponível.' })
      }
    }

    const requiresApproval = Boolean(
      invitedClass &&
      invitedClass.settings?.manualApproval !== false,
    )
    const userStatus = requiresApproval ? 'pending' : 'active'
    const userId = randomUUID()
    const rows = await sql`
      INSERT INTO users (
        id, name, email, password_hash, role, class_name,
        responsibility, status, setup_complete
      )
      VALUES (
        ${userId},
        ${name},
        ${email},
        ${hashPassword(password)},
        'student',
        ${className},
        'Aluno',
        ${userStatus},
        TRUE
      )
      RETURNING *
    `
    const user = rows[0]

    if (invitedClass) {
      await sql`
        INSERT INTO class_memberships (
          class_id, user_id, role, status, progress, approved_at
        )
        VALUES (
          ${invitedClass.id},
          ${userId},
          'student',
          ${requiresApproval ? 'pending' : 'active'},
          0,
          ${requiresApproval ? null : new Date().toISOString()}
        )
        ON CONFLICT (class_id, user_id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = NOW()
      `
    }
    await recordAuthAttempt(identifier, 'register', true)

    await sql`
      INSERT INTO audit_events (
        id, user_id, event_type, entity_type, entity_id, metadata
      )
      VALUES (
        ${randomUUID()},
        ${userId},
        'student_registered',
        'user',
        ${userId},
        ${JSON.stringify({ className, classId: invitedClass?.id || null, requiresApproval })}::jsonb
      )
    `
    if (requiresApproval) {
      return sendJson(response, 201, {
        user: null,
        pendingApproval: true,
        class: {
          id: invitedClass.id,
          name: invitedClass.name,
          code: invitedClass.code,
        },
        message: 'Solicitação enviada. A professora precisa aprovar sua entrada.',
      })
    }

    await createSession(response, user, request, 'registration')
    sendJson(response, 201, {
      user: publicUser(user),
      pendingApproval: false,
    })
  } catch (error) {
    sendJson(response, 503, { error: error.message || 'Não foi possível criar a conta.' })
  }
}
