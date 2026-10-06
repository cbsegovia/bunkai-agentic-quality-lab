/**
 * KATA Architecture - Test Data Types
 *
 * Types for test data generation and fixture state.
 * These are TEST-ONLY concepts — NOT API contract types.
 *
 * API contract types (request/response schemas) belong in:
 *   api/schemas/{domain}.types.ts → import from '@schemas/{domain}.types'
 */

// ============================================
// Generic Types
// ============================================

export interface TestUser {
  email: string
  password: string
  name: string
  firstName?: string
  lastName?: string
}

export interface TestCredentials {
  email: string
  password: string
}

// ============================================
// Project-Specific Types (Bunkai TMS)
// ============================================

export interface TestUserStory {
  title: string
  moduleId: string
}

export interface TestProject {
  name: string
  description?: string
}

export interface TestModule {
  name: string
  description?: string
}

export interface TestBug {
  title: string
  severity: 'P1' | 'P2' | 'P3' | 'P4'
  steps_to_reproduce?: string
}

export interface OpenBugsCounts {
  total: number
  P1: number
  P2: number
  P3: number
  P4: number
}

// ============================================
// Auth/Fixture State Types
// ============================================

/**
 * Stored API state for test fixtures
 * Used by setup files and TestFixture for token propagation
 */
export interface ApiState {
  token: string
  tokenType: string
  expiresIn: number
  refreshToken: string | null
  source: 'ui-login' | 'api-login'
  createdAt: string
}
