import { vi } from 'vitest'

// Mock Supabase client implementation
export const mockSupabase = {
    from: vi.fn(() => ({
        insert: vi.fn(() => ({
            select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
        })),
        select: vi.fn(() => ({
            eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
        })),
        update: vi.fn(() => ({
            eq: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
                })),
            })),
        })),
        delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
    })),

    functions: {
        invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },

    auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
}

// Mock Supabase constructor
export const createClient = vi.fn(() => mockSupabase)

// Export default mock
export default mockSupabase