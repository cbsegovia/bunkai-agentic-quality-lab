import antfu from '@antfu/eslint-config';

import { BASE_ESLINT_OPTIONS, CLI_IMPORT_CLOSURE, KATA_IMPORT_ALIASES } from './eslint.config.base.js';

// Shared options, ignores and rules live in eslint.config.base.js (synced by
// `bun run up`). This file only adds what is specific to this project.
export default antfu(
  {
    ...BASE_ESLINT_OPTIONS,

    ignores: [
      ...BASE_ESLINT_OPTIONS.ignores,
      'playwright-demo',
      // Legacy skill location, kept ignored in case a pre-migration copy remains
      '.claude/skills/**',
      // Pre-migration backup snapshot the boilerplate updater writes before an
      // in-place harness migration — a frozen copy of old source, not live code.
      '.template/pre-agents-migration/**',
    ],
  },
  KATA_IMPORT_ALIASES,
  CLI_IMPORT_CLOSURE,
);
