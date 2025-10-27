import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Use Supabase connection string from environment variables
const connectionString = import.meta.env.DATABASE_URL ||
  `postgresql://postgres:${import.meta.env.VITE_SUPABASE_DB_PASSWORD}@${import.meta.env.VITE_SUPABASE_HOST}:5432/postgres`

export const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema });