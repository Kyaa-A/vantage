import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/analytics',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Zustand stores
vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 1, email: 'test@example.com', role: 'MLGOO_DILG' },
    isAuthenticated: true,
    setUser: vi.fn(),
  })),
}));
