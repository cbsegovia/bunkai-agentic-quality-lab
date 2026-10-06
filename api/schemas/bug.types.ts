/**
 * KATA Framework - Type Facade: Bug Domain
 *
 * Types mirror the real OpenAPI contract synced from
 * https://staging-upexbunkai.vercel.app/api/openapi.
 *
 * Consumed by: tests/components/api/BugsApi.ts
 */

import type { components, paths } from '@openapi';

// ============================================================================
// Schema Types (from components.schemas)
// ============================================================================

export type BugDetail = components['schemas']['BugDetail'];
export type BugStandaloneCreateBody = components['schemas']['BugStandaloneCreateBody'];
export type BugStatusTransitionBody = components['schemas']['BugStatusTransitionBody'];

// ============================================================================
// Endpoint Types — POST /api/v1/bugs
// ============================================================================

type CreateBugPath = paths['/api/v1/bugs']['post'];
export type CreateBugResponse = CreateBugPath['responses'][201]['content']['application/json'];

// ============================================================================
// Endpoint Types — POST /api/v1/bugs/{id}/status
// ============================================================================

type BugStatusPath = paths['/api/v1/bugs/{id}/status']['post'];
export type BugStatusResponse = BugStatusPath['responses'][200]['content']['application/json'];
