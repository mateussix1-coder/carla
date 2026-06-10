import { randomUUID } from 'node:crypto'
import { requireUser } from './_lib/auth.js'
import { getSql } from './_lib/db.js'
import { readBody, rejectMethod, sendJson } from './_lib/http.js'

function statePayload(data) {
  const {
    alunos,
    feedPosts,
    ...operationalState
  } = data || {}
  return operationalState
}

export default async function handler(request, response) {
  const session = await requireUser(request, response)
  if (!session) return

  const sql = getSql()

  if (request.method === 'GET') {
    const rows = await sql`
      SELECT data, version, updated_at
      FROM app_state
      WHERE id = 'main'
      LIMIT 1
    `
    const state = rows[0]
    if (!state) return sendJson(response, 404, { error: 'Base operacional não encontrada.' })

    const data = statePayload(state.data)
    const scopedData = session.user.role === 'teacher'
      ? data
      : {
          matrizes: data.matrizes || [],
          lotes: data.lotes || [],
          coberturas: [],
          partos: [],
          varroes: [],
          sanitario: [],
        }

    return sendJson(response, 200, {
      data: scopedData,
      version: Number(state.version),
      updatedAt: state.updated_at,
    })
  }

  if (request.method === 'PUT') {
    if (session.user.role !== 'teacher') {
      return sendJson(response, 403, { error: 'Apenas a professora pode alterar estes dados.' })
    }

    const body = readBody(request)
    const expectedVersion = Number(body.version)
    if (!Number.isFinite(expectedVersion) || !body.data) {
      return sendJson(response, 400, { error: 'Versão ou dados inválidos.' })
    }

    const rows = await sql`
      UPDATE app_state
      SET
        data = ${JSON.stringify(statePayload(body.data))}::jsonb,
        version = version + 1,
        updated_at = NOW(),
        updated_by = ${session.user.id}
      WHERE id = 'main' AND version = ${expectedVersion}
      RETURNING version, updated_at
    `
    if (!rows[0]) {
      return sendJson(response, 409, {
        error: 'Os dados foram atualizados em outro dispositivo. Recarregue a página.',
      })
    }

    await sql`
      INSERT INTO audit_events (
        id, user_id, event_type, entity_type, entity_id, metadata
      )
      VALUES (
        ${randomUUID()},
        ${session.user.id},
        'operational_state_updated',
        'app_state',
        'main',
        ${JSON.stringify({ version: Number(rows[0].version) })}::jsonb
      )
    `

    return sendJson(response, 200, {
      version: Number(rows[0].version),
      updatedAt: rows[0].updated_at,
    })
  }

  return rejectMethod(response, ['GET', 'PUT'])
}
