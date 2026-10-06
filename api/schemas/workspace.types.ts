/**
 * KATA Framework - Type Facade: Workspace Domain
 *
 * Types mirror the real OpenAPI contract synced from
 * https://staging-upexbunkai.vercel.app/api/openapi.
 *
 * Consumed by: tests/components/api/OpenBugsApi.ts
 */

import type { components, paths } from '@openapi';

// ============================================================================
// Schema Types (from components.schemas)
// ============================================================================

export type OpenBugs = components['schemas']['OpenBugs'];
export type OpenBugsBySeverity = components['schemas']['OpenBugsBySeverity'];

// ============================================================================
// Endpoint Types — GET /api/v1/workspaces/{id}/open-bugs
// ============================================================================

type OpenBugsPath = paths['/api/v1/workspaces/{id}/open-bugs']['get'];
export type OpenBugsResponse = OpenBugsPath['responses'][200]['content']['application/json'];
