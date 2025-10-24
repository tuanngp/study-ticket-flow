import { vi } from 'vitest'

/**
 * Comprehensive Supabase Mock Implementation
 * 
 * This mock provides complete coverage for:
 * - Database operations (insert, select, update, delete)
 * - Edge function calls for AI triage
 * - Authentication operations
 * - Real-time subscriptions
 * - RPC (Remote Procedure Call) functions
 * - Storage operations
 * 
 * Requirements covered: 5.1 - Mock implementations for Supabase database operations
 */

// Mock query builder for chaining operations
const createMockQueryBuilder = () => ({
    select: vi.fn(() => createMockQueryBuilder()),
    insert: vi.fn(() => createMockQueryBuilder()),
    update: vi.fn(() => createMockQueryBuilder()),
    delete: vi.fn(() => createMockQueryBuilder()),
    eq: vi.fn(() => createMockQueryBuilder()),
    neq: vi.fn(() => createMockQueryBuilder()),
    gt: vi.fn(() => createMockQueryBuilder()),
    gte: vi.fn(() => createMockQueryBuilder()),
    lt: vi.fn(() => createMockQueryBuilder()),
    lte: vi.fn(() => createMockQueryBuilder()),
    like: vi.fn(() => createMockQueryBuilder()),
    ilike: vi.fn(() => createMockQueryBuilder()),
    is: vi.fn(() => createMockQueryBuilder()),
    in: vi.fn(() => createMockQueryBuilder()),
    contains: vi.fn(() => createMockQueryBuilder()),
    containedBy: vi.fn(() => createMockQueryBuilder()),
    rangeGt: vi.fn(() => createMockQueryBuilder()),
    rangeGte: vi.fn(() => createMockQueryBuilder()),
    rangeLt: vi.fn(() => createMockQueryBuilder()),
    rangeLte: vi.fn(() => createMockQueryBuilder()),
    rangeAdjacent: vi.fn(() => createMockQueryBuilder()),
    overlaps: vi.fn(() => createMockQueryBuilder()),
    textSearch: vi.fn(() => createMockQueryBuilder()),
    match: vi.fn(() => createMockQueryBuilder()),
    not: vi.fn(() => createMockQueryBuilder()),
    or: vi.fn(() => createMockQueryBuilder()),
    filter: vi.fn(() => createMockQueryBuilder()),
    order: vi.fn(() => createMockQueryBuilder()),
    limit: vi.fn(() => createMockQueryBuilder()),
    range: vi.fn(() => createMockQueryBuilder()),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn((resolve) => resolve({ data: null, error: null })),
    catch: vi.fn(),
})

// Mock channel for real-time subscriptions
const createMockChannel = () => ({
    on: vi.fn(() => createMockChannel()),
    subscribe: vi.fn(() => Promise.resolve('OK')),
    unsubscribe: vi.fn(() => Promise.resolve('OK')),
})

// Mock Supabase client implementation
export const mockSupabase = {
    // Database operations
    from: vi.fn(() => createMockQueryBuilder()),

    // RPC (Remote Procedure Call) functions
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),

    // Edge functions
    functions: {
        invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },

    // Authentication
    auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        signUp: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
        signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
        signOut: vi.fn(() => Promise.resolve({ error: null })),
        onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } }
        })),
        refreshSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        updateUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        resetPasswordForEmail: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    },

    // Real-time subscriptions
    channel: vi.fn(() => createMockChannel()),
    removeChannel: vi.fn(() => Promise.resolve('OK')),
    removeAllChannels: vi.fn(() => Promise.resolve('OK')),

    // Storage (if needed for file uploads)
    storage: {
        from: vi.fn(() => ({
            upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
            download: vi.fn(() => Promise.resolve({ data: null, error: null })),
            remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
            list: vi.fn(() => Promise.resolve({ data: [], error: null })),
            getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'mock-url' } })),
            createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: 'mock-signed-url' }, error: null })),
        })),
    },
}

// Helper functions to configure mock responses
export const mockSupabaseResponse = {
    // Configure successful responses
    success: (data: any) => ({ data, error: null }),

    // Configure error responses
    error: (message: string, code?: string) => ({
        data: null,
        error: { message, code: code || 'MOCK_ERROR' }
    }),

    // Configure auth responses
    authSuccess: (user: any, session?: any) => ({
        data: { user, session: session || null },
        error: null
    }),

    // Configure auth errors
    authError: (message: string) => ({
        data: { user: null, session: null },
        error: { message }
    }),
}

// Mock helper to reset all mocks
export const resetMockSupabase = () => {
    vi.clearAllMocks()

    // Reset all mock functions to default behavior
    Object.values(mockSupabase).forEach(value => {
        if (typeof value === 'function') {
            value.mockClear?.()
        } else if (typeof value === 'object' && value !== null) {
            Object.values(value).forEach(nestedValue => {
                if (typeof nestedValue === 'function') {
                    nestedValue.mockClear?.()
                }
            })
        }
    })
}

// Mock Supabase constructor
export const createClient = vi.fn(() => mockSupabase)

// Export default mock
export default mockSupabase