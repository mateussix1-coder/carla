import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'
import {
  ACCESS_MODULE_KEYS,
  accessModulesForRole,
} from '../../src/utils/access.js'
import { getSql } from './db.js'
import { isSameOrigin, parseCookies, sendJson } from './http.js'

const COOKIE_NAME = 'ciclo114_session'
const SESSION_DAYS = 30

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false
  const [salt, expectedHex] = stored.split(':')
  const actual = scryptSync(password, salt, 64)
  const expected = Buffer.from(expectedHex, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function publicUser(user, includePrivate = false) {
  if (!user) return null
  const membershipRole = user.role === 'teacher'
    ? 'teacher'
    : user.membership_role || 'student'
  const result = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    className: user.class_name || '',
    responsibility: user.responsibility || '',
    notes: user.notes || '',
    avatarPath: user.avatar_path || '',
    status: user.status,
    setupComplete: Boolean(user.setup_complete),
    membershipRole,
    accessModules: user.role === 'teacher'
      ? [...ACCESS_MODULE_KEYS]
      : accessModulesForRole(user.access_modules, membershipRole),
    classIds: Array.isArray(user.class_ids) ? user.class_ids : [],
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
  }
  if (includePrivate) result.privateNotes = user.private_notes || ''
  return result
}

export async function hydrateUserAccess(user) {
  if (!user) return null
  if (user.role === 'teacher') {
    return {
      ...user,
      membership_role: 'teacher',
      access_modules: [...ACCESS_MODULE_KEYS],
      class_ids: [],
    }
  }

  const sql = getSql()
  const memberships = await sql`
    SELECT class_id, role, module_access
    FROM class_memberships
    WHERE user_id = ${user.id} AND status = 'active'
    ORDER BY approved_at ASC NULLS LAST, requested_at ASC
  `
  const membershipRole = memberships.some((item) => item.role === 'monitor')
    ? 'monitor'
    : 'student'
  const accessModules = [...new Set(
    memberships.flatMap((item) => accessModulesForRole(item.module_access, item.role)),
  )]

  return {
    ...user,
    membership_role: membershipRole,
    access_modules: accessModules,
    class_ids: memberships.map((item) => item.class_id),
  }
}

export async function createSession(response, user, request, eventType = 'login') {
  const sql = getSql()
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const sessionId = randomUUID()

  await sql`
    INSERT INTO sessions (id, token_hash, user_id, expires_at, last_seen_at)
    VALUES (
      ${sessionId},
      ${tokenHash},
      ${user.id},
      NOW() + (${SESSION_DAYS} || ' days')::interval,
      NOW()
    )
  `
  await sql`
    UPDATE users
    SET last_login_at = NOW(), updated_at = NOW()
    WHERE id = ${user.id}
  `
  await sql`
    INSERT INTO access_events (
      id, user_id, event_type, route, user_agent, ip_address, metadata
    )
    VALUES (
      ${randomUUID()},
      ${user.id},
      ${eventType},
      '/entrar',
      ${String(request.headers['user-agent'] || '').slice(0, 500)},
      ${String(request.headers['x-forwarded-for'] || '').split(',')[0].trim().slice(0, 80)},
      '{}'::jsonb
    )
  `

  const secure = process.env.VERCEL || request.headers['x-forwarded-proto'] === 'https'
  response.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`,
  )
}

export function clearSessionCookie(response, request) {
  const secure = process.env.VERCEL || request?.headers['x-forwarded-proto'] === 'https'
  response.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax; Max-Age=0`,
  )
}

export async function getSession(request) {
  const token = parseCookies(request)[COOKIE_NAME]
  if (!token) return null

  const sql = getSql()
  const rows = await sql`
    SELECT
      s.id AS session_id,
      s.expires_at,
      s.last_seen_at,
      u.*
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE
      s.token_hash = ${hashToken(token)}
      AND s.expires_at > NOW()
      AND u.status = 'active'
    LIMIT 1
  `
  const session = rows[0]
  if (!session) return null

  if (
    !session.last_seen_at ||
    Date.now() - new Date(session.last_seen_at).getTime() > 10 * 60 * 1000
  ) {
    await sql`
      UPDATE sessions
      SET last_seen_at = NOW()
      WHERE id = ${session.session_id}
    `
  }

  return {
    id: session.session_id,
    user: await hydrateUserAccess(session),
  }
}

export async function destroySession(request) {
  const token = parseCookies(request)[COOKIE_NAME]
  if (!token) return
  const sql = getSql()
  await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`
}

export async function requireUser(request, response, role) {
  try {
    if (request.method !== 'GET' && !isSameOrigin(request)) {
      sendJson(response, 403, { error: 'Origem da solicitação não autorizada.' })
      return null
    }
    const session = await getSession(request)
    if (!session) {
      sendJson(response, 401, { error: 'Faça login para continuar.' })
      return null
    }
    if (role && session.user.role !== role) {
      sendJson(response, 403, { error: 'Você não tem permissão para esta ação.' })
      return null
    }
    return session
  } catch (error) {
    sendJson(response, 503, { error: error.message || 'Serviço indisponível.' })
    return null
  }
}
