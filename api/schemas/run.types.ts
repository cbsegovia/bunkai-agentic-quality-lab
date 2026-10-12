/**
 * KATA Framework - Type Facade: Run Domain
 *
 * Types mirror the real OpenAPI contract synced from
 * https://staging-upexbunkai.vercel.app/api/openapi.
 *
 * Consumed by: tests/components/api/RunsApi.ts
 */

import type { components, paths } from '@openapi';

// ============================================================================
// Schema Types (from components.schemas)
// ============================================================================

export type Run = components['schemas']['Run'];
export type RunCreateBody = components['schemas']['RunCreateBody'];
export type RunAbortBody = components['schemas']['RunAbortBody'];

// ============================================================================
// Endpoint Types — POST /api/v1/runs
// ============================================================================

type StartRunPath = paths['/api/v1/runs']['post'];
export type StartRunResponse = StartRunPath['responses'][201]['content']['application/json'];

// ============================================================================
// Endpoint Types — POST /api/v1/runs/{id}/abort
// ============================================================================

type AbortRunPath = paths['/api/v1/runs/{id}/abort']['post'];
export type AbortRunResponse = AbortRunPath['responses'][200]['content']['application/json'];
