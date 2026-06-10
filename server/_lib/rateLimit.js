import { createHash, randomUUID } from 'node:crypto'
import { getSql } from './db.js'

function identifierHash(identifier) {
  return createHash('sha256').update(identifier).digest('hex')
}

export async function checkRateLimit(identifier, action, maximum, minutes) {
  const sql = getSql()
  const hash = identifierHash(identifier)
  const rows = await sql`
    SELECT COUNT(*)::int AS attempts
    FROM auth_attempts
    WHERE
      identifier_hash = ${hash}
      AND action = ${action}
      AND success = FALSE
      AND created_at > NOW() - (${minutes} || ' minutes')::interval
  `
  return Number(rows[0]?.attempts || 0) < maximum
}

export async function recordAuthAttempt(identifier, action, success) {
  const sql = getSql()
  await sql`
    INSERT INTO auth_attempts (id, identifier_hash, action, success)
    VALUES (
      ${randomUUID()},
      ${identifierHash(identifier)},
      ${action},
      ${Boolean(success)}
    )
  `
}
