// This file is for SERVER-SIDE use only (Node.js scripts, API routes)
// DO NOT import this in browser code!

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// This will only work in Node.js environment (scripts, backend API)
const connectionString = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL

if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
}

// Create postgres client
export const client = postgres(connectionString, { prepare: false })

// Create Drizzle instance with schema
export const db = drizzle(client, { schema })
