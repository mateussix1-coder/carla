import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { createSeedData } from '../src/data/seedData.js'

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!connectionString) {
  throw new Error('Defina DATABASE_URL ou POSTGRES_URL antes da migração.')
}

const sql = neon(connectionString)
const schema = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8')

for (const statement of schema.split(/;\s*(?:\r?\n|$)/).map((part) => part.trim()).filter(Boolean)) {
  await sql.query(statement)
}

const teacherId = 'USR-CARLA'
await sql`
  INSERT INTO users (
    id, name, email, role, class_name, responsibility, notes, status
  )
  VALUES (
    ${teacherId},
    'Profª Carla',
    'carla@ciclo114.app',
    'teacher',
    'Escola / Fazenda experimental',
    'Professora responsável',
    'Gestão zootécnica e acompanhamento acadêmico.',
    'active'
  )
  ON CONFLICT (id) DO NOTHING
`

const seed = createSeedData()
const initialState = {
  ...seed,
  alunos: undefined,
  feedPosts: undefined,
}

await sql`
  INSERT INTO app_state (id, data, updated_by)
  VALUES ('main', ${JSON.stringify(initialState)}::jsonb, ${teacherId})
  ON CONFLICT (id) DO NOTHING
`

const studentIds = new Map()
for (const student of seed.alunos) {
  const userId = `USR-${student.id}`
  studentIds.set(student.name, userId)
  const email = `${student.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')}@pendente.ciclo114.app`

  await sql`
    INSERT INTO users (
      id, name, email, role, class_name, responsibility, private_notes, status
    )
    VALUES (
      ${userId},
      ${student.name},
      ${email},
      'student',
      ${student.className},
      ${student.role},
      ${student.notes},
      'invited'
    )
    ON CONFLICT (id) DO NOTHING
  `
}

for (const post of seed.feedPosts) {
  const authorId = studentIds.get(post.author) || teacherId
  await sql`
    INSERT INTO posts (
      id, author_id, activity, related, body, image_path, created_at
    )
    VALUES (
      ${post.id},
      ${authorId},
      ${post.activity},
      ${post.related},
      ${post.text},
      ${post.image},
      ${post.date}
    )
    ON CONFLICT (id) DO NOTHING
  `

  for (const comment of post.comments || []) {
    await sql`
      INSERT INTO post_comments (id, post_id, author_id, body, created_at)
      VALUES (
        ${comment.id || randomUUID()},
        ${post.id},
        ${teacherId},
        ${comment.text},
        ${post.date}
      )
      ON CONFLICT (id) DO NOTHING
    `
  }

  for (const likeName of post.likes || []) {
    const likeUserId = studentIds.get(likeName) || teacherId
    await sql`
      INSERT INTO post_likes (post_id, user_id)
      VALUES (${post.id}, ${likeUserId})
      ON CONFLICT DO NOTHING
    `
  }
}

const classSeeds = [
  ['CLS-MR', 'Manejo Reprodutivo', 'C114-MR-26', 'Coberturas, diagnóstico e acompanhamento do ciclo reprodutivo.', 'forest'],
  ['CLS-GM', 'Gestação de Matrizes', 'C114-GM-26', 'Controle dos 114 dias, pré-parto e tomada de decisão.', 'emerald'],
  ['CLS-PM', 'Partos e Maternidade', 'C114-PM-26', 'Rotina da maternidade, registros de parto e evidências.', 'gold'],
  ['CLS-LD', 'Leitões do Nascimento ao Desmame', 'C114-LD-26', 'Manejo, pesagens, sanidade e evolução dos lotes.', 'blue'],
]

for (const [id, name, code, description, color] of classSeeds) {
  await sql`
    INSERT INTO classes (id, name, code, description, teacher_id, color)
    VALUES (${id}, ${name}, ${code}, ${description}, ${teacherId}, ${color})
    ON CONFLICT (id) DO NOTHING
  `
}

const classIds = classSeeds.map(([id]) => id)
for (const [index, student] of seed.alunos.entries()) {
  const userId = studentIds.get(student.name)
  const classId = classIds[index % classIds.length]
  await sql`
    INSERT INTO class_memberships (
      class_id, user_id, role, status, progress, approved_at
    )
    VALUES (
      ${classId},
      ${userId},
      ${student.name === 'João Lima' ? 'monitor' : 'student'},
      'active',
      ${[92, 88, 76, 64][index] || 70},
      NOW()
    )
    ON CONFLICT (class_id, user_id) DO NOTHING
  `
}

for (const [index, classId] of classIds.entries()) {
  await sql`
    INSERT INTO class_invitations (
      id, class_id, token, active, created_by
    )
    VALUES (
      ${`INV-${classId}`},
      ${classId},
      ${`convite-${classId.toLowerCase()}-2026`},
      TRUE,
      ${teacherId}
    )
    ON CONFLICT (id) DO NOTHING
  `

  await sql`
    INSERT INTO class_activities (
      id, class_id, title, description, status, due_at, submissions, created_by
    )
    VALUES (
      ${`ACT-${classId}`},
      ${classId},
      ${['Checklist de observação reprodutiva', 'Linha do tempo gestacional', 'Registro completo do parto', 'Manejo e pesagem do lote'][index]},
      'Registre a atividade prática com observações e evidências.',
      'published',
      NOW() + (${index + 2} || ' days')::interval,
      ${[18, 14, 9, 11][index]},
      ${teacherId}
    )
    ON CONFLICT (id) DO NOTHING
  `

  await sql`
    INSERT INTO class_events (
      id, class_id, title, event_type, starts_at, location, notes, created_by
    )
    VALUES (
      ${`EVT-${classId}`},
      ${classId},
      ${['Aula prática de cobertura', 'Ultrassonografia das matrizes', 'Preparação da maternidade', 'Pesagem de 21 dias'][index]},
      ${['class', 'evaluation', 'birth', 'weighing'][index]},
      NOW() + (${index + 1} || ' days')::interval,
      'Fazenda experimental',
      'Levar equipamentos de proteção e ficha de campo.',
      ${teacherId}
    )
    ON CONFLICT (id) DO NOTHING
  `
}

const postClassLinks = [
  ['F001', 'CLS-PM'],
  ['F002', 'CLS-GM'],
  ['F003', 'CLS-LD'],
]
for (const [postId, classId] of postClassLinks) {
  await sql`
    UPDATE posts
    SET class_id = ${classId}
    WHERE id = ${postId} AND class_id IS NULL
  `
}

console.log('Banco Ciclo 114 criado e dados iniciais preservados.')
