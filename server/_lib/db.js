import { neon } from '@neondatabase/serverless'

let sqlClient

export function getSql() {
  if (sqlClient) return sqlClient

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!connectionString) {
    throw new Error('Banco de dados ainda não configurado.')
  }

  sqlClient = neon(connectionString)
  return sqlClient
}
