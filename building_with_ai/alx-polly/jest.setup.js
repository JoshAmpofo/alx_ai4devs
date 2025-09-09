// Import jest-dom for DOM element assertions
require('@testing-library/jest-dom');

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase client
const supabaseMock = {
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
  },
  from: jest.fn().mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }),
    // Make it thenable for non-single queries
    then: jest.fn(resolve => resolve({ data: [], error: null })),
  })),
};

jest.mock('@/lib/supabase/client', () => ({
  supabase: supabaseMock,
}));



// Mock Chart.js to avoid canvas rendering issues


// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Bar: () => null,
  Pie: () => null,
  Doughnut: () => null,
}));

// Suppress console errors during tests
global.console.error = jest.fn();