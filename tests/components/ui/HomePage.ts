/**
 * KATA Architecture - Layer 3: Home Page Component
 *
 * UI component for BK-258's Home "Open bugs" card (`/home`).
 *
 * Locators (data-testid, scoped to `home-open-bugs*` so the sibling Home
 * cards, e.g. BK-259 Coverage, never interfere):
 * - Card root:        [data-testid="home-open-bugs"]
 * - Total:            [data-testid="home-open-bugs-count"]
 * - Chips container:  [data-testid="home-open-bugs-severities"]
 * - Chip per level:   [data-testid="home-open-bugs-severity-P1"] .. P4
 *                     text pattern `P{n} {Critical|Major|Minor|Trivial} {count}`
 * - Loading:          [data-testid="home-open-bugs-skeleton"]
 */

import type { OpenBugsCounts } from '@data/types';
import type { TestContextOptions } from '@TestContext';

import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc, step } from '@utils/decorators';

// ============================================
// Types
// ============================================

type Severity = 'P1' | 'P2' | 'P3' | 'P4';

const SEVERITY_LABELS: Record<Severity, string> = {
  P1: 'Critical',
  P2: 'Major',
  P3: 'Minor',
  P4: 'Trivial',
};

const SEVERITIES = Object.keys(SEVERITY_LABELS) as Severity[];

// ============================================
// Home Page Component
// ============================================

export class HomePage extends UiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // Navigation (Public)
  // ============================================

  /**
   * Navigate to Home. Call before any Home-card ATC.
   */
  @step
  async open(): Promise<void> {
    await this.page.goto(this.buildUrl('/home'));
  }

  // ============================================
  // ATCs - Complete Test Cases
  // ============================================

  /**
   * ATC: The Home "Open bugs" card shows the expected total and the four
   * severity chips, and the total equals the sum of the chips. Starts on
   * /home (navigation is the separate `open()` helper).
   *
   * The loading placeholder is awaited away BEFORE any count is read: while
   * the Suspense skeleton is attached the count test id can resolve to two
   * elements.
   *
   * @param expected - total and per-severity counts the card must show
   */
  @atc('BK-1093')
  async showsOpenBugTotalWithSeverityBreakdown(expected: OpenBugsCounts): Promise<void> {
    await expect(this.page.locator('[data-testid="home-open-bugs-skeleton"]')).toHaveCount(0);
    await expect(this.page.locator('[data-testid="home-open-bugs-severities"]')).toBeVisible();

    await expect(this.page.locator('[data-testid="home-open-bugs-count"]')).toHaveText(String(expected.total));

    for (const severity of SEVERITIES) {
      const chip = this.page.locator(`[data-testid="home-open-bugs-severity-${severity}"]`);
      await expect(chip).toBeVisible();
      await expect(chip).toHaveText(new RegExp(`^${severity}\\s*${SEVERITY_LABELS[severity]}\\s*${expected[severity]}$`));
    }

    // The card matched every expected figure above, so this is the total/breakdown identity on what it renders.
    expect(expected.total).toBe(expected.P1 + expected.P2 + expected.P3 + expected.P4);
  }
}
