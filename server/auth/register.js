import { randomUUID } from 'node:crypto'
import {
  createSession,
  hashPassword,
  hydrateUserAccess,
  publicUser,
  verifyPassword,
} from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import {
  cleanText,
  getClientIp,
  isSameOrigin,
  normalizeEmail,
  readBody,
  rejectMethod,
  sendJson,
} from '../_lib/http.js'
import { checkRateLimit, recordAuthAttempt } from '../_lib/rateLimit.js'
import { accessModulesForRole } from '../../src/utils/access.js'

function invitationClassIds(invitation) {
  const ids = Array.isArray(invitation?.class_ids) ? invitation.class_ids : []
  return [...new Set([...ids, invitation?.class_id].filter(Boolean))]
}

async function loadInvitation(sql, token) {
  if (!token) return null
  const rows = await sql`
    SELECT
      ci.*,
      c.name AS primary_class_name,
      c.code AS primary_class_code
    FROM class_invitations ci
    JOIN classes c ON c.id = ci.class_id
    WHERE
      ci.token = ${token}
      AND ci.active = TRUE
      AND (ci.expires_at IS NULL OR ci.expires_at > NOW())
      AND COALESCE((c.settings->>'linkActive')::boolean, TRUE) = TRUE
    LIMIT 1
  `
  const invitation = rows[0]
  if (!invitation) return null

  const classIds = invitationClassIds(invitation)
  const classes = await sql`
    SELECT id, name, code, description, settings
    FROM classes
    WHERE id = ANY(${classIds}::text[]) AND status = 'active'
    ORDER BY created_at ASC
  `
  if (classes.length !== classIds.length) return null

  return {
    ...invitation,
    classes,
    role: invitation.role === 'monitor' ? 'monitor' : 'student',
    moduleAccess: accessModulesForRole(
      invitation.module_access,
      invitation.role === 'monitor' ? 'monitor' : 'student',
    ),
  }
}

async function addMemberships(sql, userId, invitation) {
  const results = []
  for (const classItem of invitation.classes) {
    const requiresApproval = classItem.settings?.manualApproval !== false
    const membershipStatus = requiresApproval ? 'pending' : 'active'
    const rows = await sql`
      INSERT INTO class_memberships (
        class_id,
        user_id,
        role,
        module_access,
        status,
        progress,
        approved_at
      )
      VALUES (
        ${classItem.id},
        ${userId},
        ${invitation.role},
        ${JSON.stringify(invitation.moduleAccess)}::jsonb,
        ${membershipStatus},
        0,
        ${requiresApproval ? null : new Date().toISOString()}
      )
      ON CONFLICT (class_id, user_id) DO UPDATE SET
        role = CASE
          WHEN class_memberships.role = 'monitor' THEN 'monitor'
          ELSE EXCLUDED.role
        END,
        module_access = class_memberships.module_access || EXCLUDED.module_access,
        status = CASE
          WHEN class_memberships.status = 'active' THEN 'active'
          ELSE EXCLUDED.status
        END,
        approved_at = CASE
          WHEN class_memberships.status = 'active' THEN class_memberships.approved_at
          ELSE EXCLUDED.approved_at
        END,
        updated_at = NOW()
      RETURNING status
    `
    results.push({
      classId: classItem.id,
      className: classItem.name,
      status: rows[0].status,
    })
  }
  return results
}

async function updateUserStatus(sql, user) {
  if (user.status === 'blocked') return user
  if (user.status === 'active') return user
  const rows = await sql`
    SELECT
      BOOL_OR(status = 'active') AS has_active,
      BOOL_OR(status = 'pending') AS has_pending
    FROM class_memberships
    WHERE user_id = ${user.id}
  `
  const nextStatus = rows[0]?.has_active
    ? 'active'
    : rows[0]?.has_pending
      ? 'pending'
      : user.status
  const updated = await sql`
    UPDATE users
    SET status = ${nextStatus}, updated_at = NOW()
    WHERE id = ${user.id}
    RETURNING *
  `
  return updated[0]
}

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

    if (!email.includes('@')) {
      await recordAuthAttempt(identifier, 'register', false)
      return sendJson(response, 400, { error: 'Informe um e-mail válido.' })
    }
    if (password.length < 8) {
      await recordAuthAttempt(identifier, 'register', false)
      return sendJson(response, 400, {
        error: 'A senha precisa ter pelo menos 8 caracteres.',
      })
    }

    const sql = getSql()
    const invitation = await loadInvitation(sql, inviteToken)
    if (inviteToken && !invitation) {
      await recordAuthAttempt(identifier, 'register', false)
      return sendJson(response, 404, { error: 'Este convite de acesso não está mais disponível.' })
    }

    const existingRows = await sql`
      SELECT *
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `
    let user = existingRows[0]
    const existingAccount = Boolean(user)

    if (existingAccount) {
      if (!invitation) {
        await recordAuthAttempt(identifier, 'register', false)
        return sendJson(response, 409, {
          error: 'Este e-mail já está cadastrado. Entre com sua conta ou abra o link de convite.',
        })
      }
      if (!user.password_hash && user.status === 'invited') {
        const rows = await sql`
          UPDATE users
          SET
            name = ${name.length >= 3 ? name : user.name},
            class_name = ${className.length >= 2 ? className : user.class_name},
            password_hash = ${hashPassword(password)},
            setup_complete = TRUE,
            updated_at = NOW()
          WHERE id = ${user.id}
          RETURNING *
        `
        user = rows[0]
      } else if (!verifyPassword(password, user.password_hash)) {
        await recordAuthAttempt(identifier, 'register', false)
        return sendJson(response, 401, {
          error: 'Este e-mail já possui conta. Informe a senha atual para aceitar o convite.',
        })
      }
      if (user.status === 'blocked') {
        await recordAuthAttempt(identifier, 'register', false)
        return sendJson(response, 403, {
          error: 'Este acesso está bloqueado. Procure a professora responsável.',
        })
      }
    } else {
      if (name.length < 3 || className.length < 2) {
        await recordAuthAttempt(identifier, 'register', false)
        return sendJson(response, 400, { error: 'Preencha nome, e-mail e turma ou curso.' })
      }
      const userId = randomUUID()
      const initialStatus = invitation ? 'pending' : 'active'
      const rows = await sql`
        INSERT INTO users (
          id,
          name,
          email,
          password_hash,
          role,
          class_name,
          responsibility,
          status,
          setup_complete
        )
        VALUES (
          ${userId},
          ${name},
          ${email},
          ${hashPassword(password)},
          'student',
          ${className},
          ${invitation?.role === 'monitor' ? 'Monitor' : 'Aluno'},
          ${initialStatus},
          TRUE
        )
        RETURNING *
      `
      user = rows[0]
    }

    const memberships = invitation
      ? await addMemberships(sql, user.id, invitation)
      : []

    if (invitation?.role === 'monitor' && user.responsibility !== 'Monitor') {
      const rows = await sql`
        UPDATE users
        SET responsibility = 'Monitor', updated_at = NOW()
        WHERE id = ${user.id}
        RETURNING *
      `
      user = rows[0]
    }

    user = await updateUserStatus(sql, user)
    await recordAuthAttempt(identifier, 'register', true)

    await sql`
      INSERT INTO audit_events (
        id,
        user_id,
        event_type,
        entity_type,
        entity_id,
        metadata
      )
      VALUES (
        ${randomUUID()},
        ${user.id},
        ${existingAccount ? 'access_invite_accepted' : 'student_registered'},
        'user',
        ${user.id},
        ${JSON.stringify({
          className: user.class_name,
          classIds: invitation?.classes.map((item) => item.id) || [],
          role: invitation?.role || 'student',
          moduleAccess: invitation?.moduleAccess || ['academic'],
          existingAccount,
        })}::jsonb
      )
    `

    const hydratedUser = await hydrateUserAccess(user)
    const pendingMemberships = memberships.filter((item) => item.status === 'pending')
    const pendingApproval = user.status !== 'active'
    if (!pendingApproval) {
      await createSession(
        response,
        hydratedUser,
        request,
        existingAccount ? 'invite_accepted' : 'registration',
      )
    }

    return sendJson(response, 201, {
      user: pendingApproval ? null : publicUser(hydratedUser),
      existingAccount,
      pendingApproval,
      membershipPending: pendingMemberships.length > 0,
      classes: invitation?.classes.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
      })) || [],
      message: pendingApproval
        ? 'Solicitação enviada. A professora precisa aprovar seu acesso.'
        : pendingMemberships.length
          ? 'Convite aceito. As novas turmas aguardam aprovação, e seu acesso atual continua disponível.'
          : existingAccount
            ? 'Convite aceito e novos acessos liberados na sua conta.'
            : 'Conta criada e acesso liberado.',
    })
  } catch (error) {
    return sendJson(response, 503, {
      error: error.message || 'Não foi possível criar ou atualizar a conta.',
    })
  }
}
