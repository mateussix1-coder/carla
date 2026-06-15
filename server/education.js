import { randomUUID } from 'node:crypto'
import { publicUser, requireUser } from './_lib/auth.js'
import { getSql } from './_lib/db.js'
import {
  cleanText,
  readBody,
  rejectMethod,
  sendJson,
} from './_lib/http.js'
import {
  ACCESS_MODULES,
  accessModulesForRole,
} from '../src/utils/access.js'

function classDto(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description || '',
    teacherId: row.teacher_id,
    teacher: row.teacher_name || 'Profª Carla',
    status: row.status,
    color: row.color || 'forest',
    settings: row.settings || {},
    studentCount: Number(row.student_count || 0),
    pendingCount: Number(row.pending_count || 0),
    blockedCount: Number(row.blocked_count || 0),
    activityCount: Number(row.activity_count || 0),
    eventCount: Number(row.event_count || 0),
    inviteToken: row.invite_token || '',
    createdAt: row.created_at,
  }
}

function membershipDto(row) {
  return {
    ...publicUser(row, true),
    membershipRole: row.membership_role || 'student',
    membershipStatus: row.membership_status || 'pending',
    accessModules: accessModulesForRole(
      row.module_access,
      row.membership_role || 'student',
    ),
    progress: Number(row.progress || 0),
    requestedAt: row.requested_at,
    approvedAt: row.approved_at,
  }
}

async function listClasses(sql, user) {
  const rows = user.role === 'teacher'
    ? await sql`
        SELECT
          c.*,
          teacher.name AS teacher_name,
          COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.status = 'active')::int AS student_count,
          COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.status = 'pending')::int AS pending_count,
          COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.status = 'blocked')::int AS blocked_count,
          COUNT(DISTINCT ca.id)::int AS activity_count,
          COUNT(DISTINCT ce.id)::int AS event_count,
          (
            SELECT token
            FROM class_invitations ci
            WHERE
              ci.class_id = c.id
              AND ci.active = TRUE
              AND jsonb_array_length(ci.class_ids) <= 1
            ORDER BY ci.created_at DESC
            LIMIT 1
          ) AS invite_token
        FROM classes c
        JOIN users teacher ON teacher.id = c.teacher_id
        LEFT JOIN class_memberships cm ON cm.class_id = c.id
        LEFT JOIN class_activities ca ON ca.class_id = c.id
        LEFT JOIN class_events ce ON ce.class_id = c.id
        GROUP BY c.id, teacher.name
        ORDER BY c.status ASC, c.created_at DESC
      `
    : await sql`
        SELECT
          c.*,
          teacher.name AS teacher_name,
          cm.status AS membership_status,
          cm.role AS membership_role,
          COUNT(DISTINCT active_cm.user_id) FILTER (WHERE active_cm.status = 'active')::int AS student_count,
          COUNT(DISTINCT ca.id)::int AS activity_count,
          COUNT(DISTINCT ce.id)::int AS event_count
        FROM classes c
        JOIN users teacher ON teacher.id = c.teacher_id
        JOIN class_memberships cm
          ON cm.class_id = c.id
          AND cm.user_id = ${user.id}
          AND cm.status = 'active'
        LEFT JOIN class_memberships active_cm ON active_cm.class_id = c.id
        LEFT JOIN class_activities ca ON ca.class_id = c.id
        LEFT JOIN class_events ce ON ce.class_id = c.id
        GROUP BY c.id, teacher.name, cm.status, cm.role
        ORDER BY c.created_at DESC
      `
  return rows.map(classDto)
}

async function classDetail(sql, classId, user) {
  if (user.role !== 'teacher') {
    const allowed = await sql`
      SELECT 1
      FROM class_memberships
      WHERE class_id = ${classId} AND user_id = ${user.id} AND status = 'active'
      LIMIT 1
    `
    if (!allowed[0]) return null
  }

  const classRows = await sql`
    SELECT
      c.*,
      teacher.name AS teacher_name,
      COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.status = 'active')::int AS student_count,
      COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.status = 'pending')::int AS pending_count,
      COUNT(DISTINCT cm.user_id) FILTER (WHERE cm.status = 'blocked')::int AS blocked_count,
      (
        SELECT token
        FROM class_invitations ci
        WHERE
          ci.class_id = c.id
          AND ci.active = TRUE
          AND jsonb_array_length(ci.class_ids) <= 1
        ORDER BY ci.created_at DESC
        LIMIT 1
      ) AS invite_token
    FROM classes c
    JOIN users teacher ON teacher.id = c.teacher_id
    LEFT JOIN class_memberships cm ON cm.class_id = c.id
    WHERE c.id = ${classId}
    GROUP BY c.id, teacher.name
    LIMIT 1
  `
  if (!classRows[0]) return null

  const [members, activities, events] = await Promise.all([
    user.role === 'teacher'
      ? sql`
          SELECT
            u.*,
            cm.role AS membership_role,
            cm.module_access,
            cm.status AS membership_status,
            cm.progress,
            cm.requested_at,
            cm.approved_at
          FROM class_memberships cm
          JOIN users u ON u.id = cm.user_id
          WHERE cm.class_id = ${classId}
          ORDER BY
            CASE cm.status
              WHEN 'pending' THEN 0
              WHEN 'active' THEN 1
              WHEN 'blocked' THEN 2
              ELSE 3
            END,
            u.name
        `
      : sql`
          SELECT
            u.*,
            cm.role AS membership_role,
            cm.module_access,
            cm.status AS membership_status,
            cm.progress,
            cm.requested_at,
            cm.approved_at
          FROM class_memberships cm
          JOIN users u ON u.id = cm.user_id
          WHERE cm.class_id = ${classId} AND cm.status = 'active'
          ORDER BY u.name
        `,
    sql`
      SELECT *
      FROM class_activities
      WHERE class_id = ${classId}
      ORDER BY due_at ASC NULLS LAST, created_at DESC
    `,
    sql`
      SELECT *
      FROM class_events
      WHERE class_id = ${classId}
      ORDER BY starts_at ASC
    `,
  ])

  return {
    class: classDto(classRows[0]),
    members: members.map(membershipDto),
    activities: activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      status: activity.status,
      dueAt: activity.due_at,
      submissions: Number(activity.submissions || 0),
      createdAt: activity.created_at,
    })),
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      type: event.event_type,
      startsAt: event.starts_at,
      location: event.location,
      notes: event.notes,
    })),
  }
}

async function audit(sql, userId, eventType, entityType, entityId, metadata = {}) {
  await sql`
    INSERT INTO audit_events (
      id, user_id, event_type, entity_type, entity_id, metadata
    )
    VALUES (
      ${randomUUID()},
      ${userId},
      ${eventType},
      ${entityType},
      ${entityId},
      ${JSON.stringify(metadata)}::jsonb
    )
  `
}

async function syncUserStatus(sql, userId) {
  const membershipRows = await sql`
    SELECT
      BOOL_OR(status = 'active') AS has_active,
      BOOL_OR(status = 'pending') AS has_pending
    FROM class_memberships
    WHERE user_id = ${userId}
  `
  const status = membershipRows[0]?.has_active
    ? 'active'
    : membershipRows[0]?.has_pending
      ? 'pending'
      : 'archived'
  await sql`
    UPDATE users
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${userId} AND role = 'student'
  `
  if (status !== 'active') {
    await sql`DELETE FROM sessions WHERE user_id = ${userId}`
  }
  return status
}

export default async function handler(request, response) {
  const path = String(request.query.educationPath || '').replace(/^\/+|\/+$/g, '')
  const sql = getSql()

  const inviteMatch = path.match(/^invite\/([^/]+)$/)
  if (inviteMatch && request.method === 'GET') {
    const rows = await sql`
      SELECT
        ci.class_id,
        ci.class_ids,
        ci.role,
        ci.module_access,
        ci.expires_at
      FROM class_invitations ci
      JOIN classes c ON c.id = ci.class_id
      WHERE
        ci.token = ${decodeURIComponent(inviteMatch[1])}
        AND ci.active = TRUE
        AND c.status = 'active'
        AND (ci.expires_at IS NULL OR ci.expires_at > NOW())
        AND COALESCE((c.settings->>'linkActive')::boolean, TRUE) = TRUE
      LIMIT 1
    `
    if (!rows[0]) return sendJson(response, 404, { error: 'Este convite não está mais disponível.' })
    const invitation = rows[0]
    const classIds = [...new Set([
      ...(Array.isArray(invitation.class_ids) ? invitation.class_ids : []),
      invitation.class_id,
    ].filter(Boolean))]
    const classes = await sql`
      SELECT id, name, code, description
      FROM classes
      WHERE id = ANY(${classIds}::text[]) AND status = 'active'
      ORDER BY created_at ASC
    `
    if (classes.length !== classIds.length) {
      return sendJson(response, 404, { error: 'Este convite não está mais disponível.' })
    }
    const role = invitation.role === 'monitor' ? 'monitor' : 'student'
    return sendJson(response, 200, {
      class: classes[0],
      classes,
      role,
      modules: accessModulesForRole(invitation.module_access, role),
      moduleOptions: ACCESS_MODULES,
    })
  }

  const session = await requireUser(request, response)
  if (!session) return
  const teacher = session.user.role === 'teacher'

  if ((path === '' || path === 'summary') && request.method === 'GET') {
    const classes = await listClasses(sql, session.user)
    const totals = classes.reduce(
      (result, item) => ({
        activeClasses: result.activeClasses + (item.status === 'active' ? 1 : 0),
        students: result.students + item.studentCount,
        pending: result.pending + item.pendingCount,
        activities: result.activities + item.activityCount,
      }),
      { activeClasses: 0, students: 0, pending: 0, activities: 0 },
    )
    return sendJson(response, 200, { classes, totals })
  }

  if (path === 'classes' && request.method === 'GET') {
    return sendJson(response, 200, { classes: await listClasses(sql, session.user) })
  }

  if (path === 'activities' && request.method === 'GET') {
    const rows = teacher
      ? await sql`
          SELECT ca.*, c.name AS class_name, c.code AS class_code
          FROM class_activities ca
          JOIN classes c ON c.id = ca.class_id
          ORDER BY ca.due_at ASC NULLS LAST, ca.created_at DESC
        `
      : await sql`
          SELECT ca.*, c.name AS class_name, c.code AS class_code
          FROM class_activities ca
          JOIN classes c ON c.id = ca.class_id
          JOIN class_memberships cm
            ON cm.class_id = c.id
            AND cm.user_id = ${session.user.id}
            AND cm.status = 'active'
          ORDER BY ca.due_at ASC NULLS LAST, ca.created_at DESC
        `
    return sendJson(response, 200, {
      activities: rows.map((item) => ({
        id: item.id,
        classId: item.class_id,
        className: item.class_name,
        classCode: item.class_code,
        title: item.title,
        description: item.description,
        status: item.status,
        dueAt: item.due_at,
        submissions: Number(item.submissions || 0),
      })),
    })
  }

  if (path === 'members' && request.method === 'GET') {
    if (!teacher) return sendJson(response, 403, { error: 'Acesso restrito à professora.' })
    const rows = await sql`
      SELECT
        u.*,
        cm.class_id,
        c.name AS class_name,
        c.code AS class_code,
        cm.role AS membership_role,
        cm.module_access,
        cm.status AS membership_status,
        cm.progress,
        cm.requested_at,
        cm.approved_at
      FROM class_memberships cm
      JOIN users u ON u.id = cm.user_id
      JOIN classes c ON c.id = cm.class_id
      ORDER BY
        CASE cm.status
          WHEN 'pending' THEN 0
          WHEN 'active' THEN 1
          WHEN 'blocked' THEN 2
          ELSE 3
        END,
        u.name
    `
    return sendJson(response, 200, {
      members: rows.map((row) => ({
        ...membershipDto(row),
        classId: row.class_id,
        className: row.class_name,
        classCode: row.class_code,
      })),
    })
  }

  if (path === 'events' && request.method === 'GET') {
    const rows = teacher
      ? await sql`
          SELECT ce.*, c.name AS class_name, c.code AS class_code
          FROM class_events ce
          JOIN classes c ON c.id = ce.class_id
          ORDER BY ce.starts_at ASC
        `
      : await sql`
          SELECT ce.*, c.name AS class_name, c.code AS class_code
          FROM class_events ce
          JOIN classes c ON c.id = ce.class_id
          JOIN class_memberships cm
            ON cm.class_id = c.id
            AND cm.user_id = ${session.user.id}
            AND cm.status = 'active'
          ORDER BY ce.starts_at ASC
        `
    return sendJson(response, 200, {
      events: rows.map((item) => ({
        id: item.id,
        classId: item.class_id,
        className: item.class_name,
        classCode: item.class_code,
        title: item.title,
        type: item.event_type,
        startsAt: item.starts_at,
        location: item.location,
        notes: item.notes,
      })),
    })
  }

  if (path === 'permissions' && request.method === 'GET') {
    if (!teacher) return sendJson(response, 403, { error: 'Acesso restrito à professora.' })
    const [pending, blocked, invites, history] = await Promise.all([
      sql`
        SELECT COUNT(*)::int AS total
        FROM class_memberships
        WHERE status = 'pending'
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM class_memberships
        WHERE status = 'blocked'
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM class_invitations
        WHERE active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
      `,
      sql`
        SELECT ae.*, u.name AS user_name
        FROM audit_events ae
        LEFT JOIN users u ON u.id = ae.user_id
        WHERE ae.event_type LIKE 'membership_%'
           OR ae.event_type LIKE 'class_%'
        ORDER BY ae.created_at DESC
        LIMIT 30
      `,
    ])
    return sendJson(response, 200, {
      totals: {
        pending: Number(pending[0]?.total || 0),
        blocked: Number(blocked[0]?.total || 0),
        activeInvites: Number(invites[0]?.total || 0),
      },
      history: history.map((item) => ({
        id: item.id,
        type: item.event_type,
        user: item.user_name || 'Sistema',
        entityId: item.entity_id,
        metadata: item.metadata || {},
        createdAt: item.created_at,
      })),
    })
  }

  if (path === 'invites' && request.method === 'POST') {
    if (!teacher) return sendJson(response, 403, { error: 'Apenas a professora pode gerar convites.' })
    const body = readBody(request)
    const role = body.role === 'monitor' ? 'monitor' : 'student'
    const requestedClassIds = Array.isArray(body.classIds)
      ? [...new Set(body.classIds.map((item) => cleanText(item, 120)).filter(Boolean))]
      : []
    if (!requestedClassIds.length) {
      return sendJson(response, 400, { error: 'Selecione pelo menos uma turma.' })
    }
    const classes = await sql`
      SELECT id, name, code
      FROM classes
      WHERE id = ANY(${requestedClassIds}::text[]) AND status = 'active'
      ORDER BY created_at ASC
    `
    if (classes.length !== requestedClassIds.length) {
      return sendJson(response, 400, { error: 'Uma das turmas selecionadas não está disponível.' })
    }
    const modules = accessModulesForRole(body.modules, role)
    const token = randomUUID()
    await sql`
      INSERT INTO class_invitations (
        id,
        class_id,
        token,
        role,
        class_ids,
        module_access,
        created_by
      )
      VALUES (
        ${randomUUID()},
        ${classes[0].id},
        ${token},
        ${role},
        ${JSON.stringify(classes.map((item) => item.id))}::jsonb,
        ${JSON.stringify(modules)}::jsonb,
        ${session.user.id}
      )
    `
    await audit(sql, session.user.id, 'access_invite_created', 'class_invitation', token, {
      role,
      classIds: classes.map((item) => item.id),
      modules,
    })
    return sendJson(response, 201, {
      token,
      role,
      classes,
      modules,
    })
  }

  if (path === 'classes' && request.method === 'POST') {
    if (!teacher) return sendJson(response, 403, { error: 'Apenas a professora pode criar turmas.' })
    const body = readBody(request)
    const name = cleanText(body.name, 140)
    const code = cleanText(body.code, 40).toUpperCase()
    const description = cleanText(body.description, 600)
    const color = ['forest', 'emerald', 'gold', 'blue', 'violet'].includes(body.color)
      ? body.color
      : 'forest'
    if (name.length < 3 || code.length < 4) {
      return sendJson(response, 400, { error: 'Informe nome e código da turma.' })
    }
    const duplicate = await sql`SELECT id FROM classes WHERE code = ${code} LIMIT 1`
    if (duplicate[0]) return sendJson(response, 409, { error: 'Este código de turma já está em uso.' })
    const classId = randomUUID()
    const token = randomUUID()
    await sql`
      INSERT INTO classes (id, name, code, description, teacher_id, color)
      VALUES (${classId}, ${name}, ${code}, ${description}, ${session.user.id}, ${color})
    `
    await sql`
      INSERT INTO class_invitations (
        id,
        class_id,
        token,
        role,
        class_ids,
        module_access,
        created_by
      )
      VALUES (
        ${randomUUID()},
        ${classId},
        ${token},
        'student',
        ${JSON.stringify([classId])}::jsonb,
        '["academic"]'::jsonb,
        ${session.user.id}
      )
    `
    await sql`
      INSERT INTO class_memberships (
        class_id,
        user_id,
        role,
        module_access,
        status,
        progress,
        approved_at
      )
      SELECT
        ${classId},
        u.id,
        'monitor',
        ${JSON.stringify(ACCESS_MODULES.map((item) => item.key))}::jsonb,
        'active',
        0,
        NOW()
      FROM users u
      WHERE
        u.role = 'student'
        AND u.status = 'active'
        AND (
          LOWER(TRIM(u.responsibility)) = 'monitor'
          OR EXISTS (
            SELECT 1
            FROM class_memberships existing_membership
            WHERE
              existing_membership.user_id = u.id
              AND existing_membership.role = 'monitor'
              AND existing_membership.status = 'active'
          )
        )
      ON CONFLICT (class_id, user_id) DO UPDATE SET
        role = 'monitor',
        module_access = EXCLUDED.module_access,
        status = 'active',
        approved_at = COALESCE(class_memberships.approved_at, NOW()),
        updated_at = NOW()
    `
    await audit(sql, session.user.id, 'class_created', 'class', classId, { code })
    const detail = await classDetail(sql, classId, session.user)
    return sendJson(response, 201, detail)
  }

  const classMatch = path.match(/^classes\/([^/]+)$/)
  if (classMatch) {
    const classId = decodeURIComponent(classMatch[1])
    if (request.method === 'GET') {
      const detail = await classDetail(sql, classId, session.user)
      if (!detail) return sendJson(response, 404, { error: 'Turma não encontrada.' })
      return sendJson(response, 200, detail)
    }
    if (request.method === 'PATCH') {
      if (!teacher) return sendJson(response, 403, { error: 'Apenas a professora pode editar a turma.' })
      const body = readBody(request)
      const rows = await sql`
        UPDATE classes
        SET
          name = ${cleanText(body.name, 140)},
          description = ${cleanText(body.description, 600)},
          status = ${body.status === 'inactive' ? 'inactive' : 'active'},
          settings = ${JSON.stringify(body.settings || {})}::jsonb,
          updated_at = NOW()
        WHERE id = ${classId}
        RETURNING id
      `
      if (!rows[0]) return sendJson(response, 404, { error: 'Turma não encontrada.' })
      await audit(sql, session.user.id, 'class_updated', 'class', classId)
      return sendJson(response, 200, await classDetail(sql, classId, session.user))
    }
    if (request.method === 'DELETE') {
      if (!teacher) return sendJson(response, 403, { error: 'Apenas a professora pode excluir a turma.' })
      const rows = await sql`
        DELETE FROM classes
        WHERE id = ${classId} AND teacher_id = ${session.user.id}
        RETURNING id, name, code
      `
      if (!rows[0]) return sendJson(response, 404, { error: 'Turma não encontrada.' })
      await audit(sql, session.user.id, 'class_deleted', 'class', classId, {
        name: rows[0].name,
        code: rows[0].code,
      })
      return sendJson(response, 200, { ok: true, message: 'Turma excluída com sucesso.' })
    }
    return rejectMethod(response, ['GET', 'PATCH', 'DELETE'])
  }

  const inviteCreateMatch = path.match(/^classes\/([^/]+)\/invite$/)
  if (inviteCreateMatch && request.method === 'POST') {
    if (!teacher) return sendJson(response, 403, { error: 'Apenas a professora pode gerar convites.' })
    const classId = decodeURIComponent(inviteCreateMatch[1])
    const exists = await sql`SELECT id FROM classes WHERE id = ${classId} LIMIT 1`
    if (!exists[0]) return sendJson(response, 404, { error: 'Turma não encontrada.' })
    const token = randomUUID()
    await sql`
      UPDATE class_invitations
      SET active = FALSE
      WHERE class_id = ${classId} AND jsonb_array_length(class_ids) <= 1
    `
    await sql`
      INSERT INTO class_invitations (
        id,
        class_id,
        token,
        role,
        class_ids,
        module_access,
        created_by
      )
      VALUES (
        ${randomUUID()},
        ${classId},
        ${token},
        'student',
        ${JSON.stringify([classId])}::jsonb,
        '["academic"]'::jsonb,
        ${session.user.id}
      )
    `
    await audit(sql, session.user.id, 'class_invite_regenerated', 'class', classId)
    return sendJson(response, 201, { token })
  }

  const memberMatch = path.match(/^classes\/([^/]+)\/members\/([^/]+)$/)
  if (memberMatch && request.method === 'PATCH') {
    if (!teacher) return sendJson(response, 403, { error: 'Apenas a professora pode gerenciar alunos.' })
    const classId = decodeURIComponent(memberMatch[1])
    const userId = decodeURIComponent(memberMatch[2])
    const body = readBody(request)
    const action = cleanText(body.action, 30)
    const role = ['student', 'monitor'].includes(body.role) ? body.role : 'student'
    const statusByAction = {
      approve: 'active',
      reject: 'rejected',
      block: 'blocked',
      reactivate: 'active',
      remove: 'removed',
    }

    if (action === 'role') {
      await sql`
        UPDATE class_memberships
        SET role = ${role}, updated_at = NOW()
        WHERE class_id = ${classId} AND user_id = ${userId}
      `
      await audit(sql, session.user.id, 'membership_role_updated', 'user', userId, { classId, role })
    } else if (action === 'access') {
      const modules = accessModulesForRole(body.modules, role)
      const rows = await sql`
        UPDATE class_memberships
        SET module_access = ${JSON.stringify(modules)}::jsonb, updated_at = NOW()
        WHERE class_id = ${classId} AND user_id = ${userId}
        RETURNING user_id
      `
      if (!rows[0]) return sendJson(response, 404, { error: 'Matrícula não encontrada.' })
      await audit(sql, session.user.id, 'membership_access_updated', 'user', userId, {
        classId,
        modules,
      })
    } else if (statusByAction[action]) {
      const membershipStatus = statusByAction[action]
      const rows = await sql`
        UPDATE class_memberships
        SET
          status = ${membershipStatus},
          approved_at = CASE WHEN ${membershipStatus} = 'active' THEN NOW() ELSE approved_at END,
          updated_at = NOW()
        WHERE class_id = ${classId} AND user_id = ${userId}
        RETURNING user_id
      `
      if (!rows[0]) return sendJson(response, 404, { error: 'Matrícula não encontrada.' })

      await syncUserStatus(sql, userId)
      await audit(sql, session.user.id, `membership_${action}`, 'user', userId, { classId })
    } else {
      return sendJson(response, 400, { error: 'Ação de aluno inválida.' })
    }

    return sendJson(response, 200, await classDetail(sql, classId, session.user))
  }

  const activityMatch = path.match(/^classes\/([^/]+)\/activities$/)
  if (activityMatch && request.method === 'POST') {
    if (!teacher) return sendJson(response, 403, { error: 'Apenas a professora pode criar atividades.' })
    const classId = decodeURIComponent(activityMatch[1])
    const body = readBody(request)
    const title = cleanText(body.title, 180)
    if (title.length < 3) return sendJson(response, 400, { error: 'Informe o título da atividade.' })
    await sql`
      INSERT INTO class_activities (
        id, class_id, title, description, status, due_at, created_by
      )
      VALUES (
        ${randomUUID()},
        ${classId},
        ${title},
        ${cleanText(body.description, 1200)},
        'published',
        ${body.dueAt ? new Date(body.dueAt).toISOString() : null},
        ${session.user.id}
      )
    `
    await audit(sql, session.user.id, 'activity_created', 'class', classId, { title })
    return sendJson(response, 201, await classDetail(sql, classId, session.user))
  }

  const eventMatch = path.match(/^classes\/([^/]+)\/events$/)
  if (eventMatch && request.method === 'POST') {
    if (!teacher) return sendJson(response, 403, { error: 'Apenas a professora pode criar eventos.' })
    const classId = decodeURIComponent(eventMatch[1])
    const body = readBody(request)
    const title = cleanText(body.title, 180)
    if (title.length < 3 || !body.startsAt) {
      return sendJson(response, 400, { error: 'Informe título, data e horário do evento.' })
    }
    await sql`
      INSERT INTO class_events (
        id, class_id, title, event_type, starts_at, location, notes, created_by
      )
      VALUES (
        ${randomUUID()},
        ${classId},
        ${title},
        ${cleanText(body.type, 40) || 'class'},
        ${new Date(body.startsAt).toISOString()},
        ${cleanText(body.location, 180)},
        ${cleanText(body.notes, 1000)},
        ${session.user.id}
      )
    `
    await audit(sql, session.user.id, 'event_created', 'class', classId, { title })
    return sendJson(response, 201, await classDetail(sql, classId, session.user))
  }

  return sendJson(response, 404, { error: 'Rota educacional não encontrada.' })
}
