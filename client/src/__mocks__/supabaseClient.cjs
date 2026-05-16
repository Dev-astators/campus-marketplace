// src/__mocks__/supabaseClient.cjs
// Replaces the real supabase client during tests so that
// import.meta.env (Vite-only) is never executed by Jest.

const supabase = {
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: null },
    }),
    signInWithOAuth: jest.fn().mockResolvedValue({ error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: {
        subscription: { unsubscribe: jest.fn() },
      },
    }),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
  channel: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
  }),
  removeChannel: jest.fn(),
};

module.exports = { supabase };
