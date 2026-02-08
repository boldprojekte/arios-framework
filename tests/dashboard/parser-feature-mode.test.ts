import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { buildDashboardState } from '../../src/dashboard/server/parser.ts';

function writeFile(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf-8');
}

test('buildDashboardState parses feature mode with stable IDs and mode-aware status', () => {
  const workspaceDir = mkdtempSync(join(tmpdir(), 'arios-feature-parser-'));

  try {
    const planningDir = join(workspaceDir, '.planning');
    const searchFeatureDir = join(planningDir, 'features', 'feature-search');
    const profileFeatureDir = join(planningDir, 'features', 'feature-profile');

    writeFile(
      join(planningDir, 'config.json'),
      JSON.stringify(
        {
          mode: 'feature',
          feature_name: 'search',
          active_feature: 'search'
        },
        null,
        2
      )
    );

    writeFile(
      join(searchFeatureDir, 'STATE.md'),
      `---
phase: 1
planIndex: 2
---
`
    );

    writeFile(
      join(searchFeatureDir, '01-PLAN.md'),
      `---
title: Implement search endpoint
plan_id: feature-search-1
wave: 1
depends_on: []
---
## Objective
Implement backend search endpoint.
`
    );

    writeFile(
      join(searchFeatureDir, '02-PLAN.md'),
      `---
title: Add search UI
wave: 2
depends_on:
  - "01-01"
---
## Objective
Build search UI components.
`
    );

    writeFile(
      join(searchFeatureDir, '01-SUMMARY.md'),
      `---
duration: 15m
completed: 2026-02-08T12:00:00Z
---
## One-Liner
Implemented and validated search endpoint.
`
    );

    // Additional feature to verify active-feature filtering.
    writeFile(
      join(profileFeatureDir, '01-PLAN.md'),
      `---
title: Should not appear
plan_id: feature-profile-1
---
## Objective
This plan belongs to a different feature.
`
    );

    const dashboardState = buildDashboardState(planningDir);

    assert.deepEqual(
      dashboardState.tasks.map((task) => task.id),
      ['01-01', '01-02'],
      'feature mode should produce deterministic IDs without 00-* artifacts'
    );

    assert.ok(
      dashboardState.tasks.every((task) => task.phase === 'feature-search'),
      'only active feature tasks should be included'
    );

    const taskOne = dashboardState.tasks.find((task) => task.id === '01-01');
    const taskTwo = dashboardState.tasks.find((task) => task.id === '01-02');

    assert.equal(taskOne?.status, 'complete');
    assert.equal(taskTwo?.status, 'in-progress');

    assert.equal(dashboardState.currentPhase, 1);
    assert.equal(dashboardState.currentPlan, 2);
    assert.equal(dashboardState.phases.length, 1);
    assert.equal(dashboardState.phases[0]?.id, 1);
    assert.equal(dashboardState.phases[0]?.plansTotal, 2);
    assert.equal(dashboardState.phases[0]?.plansComplete, 1);
  } finally {
    rmSync(workspaceDir, { recursive: true, force: true });
  }
});
