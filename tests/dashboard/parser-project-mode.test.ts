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

test('buildDashboardState preserves project mode roadmap parsing and status mapping', () => {
  const workspaceDir = mkdtempSync(join(tmpdir(), 'arios-project-parser-'));

  try {
    const planningDir = join(workspaceDir, '.planning');
    const phaseOneDir = join(planningDir, 'phases', '01-foundation');
    const phaseTwoDir = join(planningDir, 'phases', '02-auth');

    writeFile(
      join(planningDir, 'config.json'),
      JSON.stringify(
        {
          mode: 'project'
        },
        null,
        2
      )
    );

    writeFile(
      join(planningDir, 'STATE.md'),
      `---
phase: 1
planIndex: 2
---
`
    );

    writeFile(
      join(planningDir, 'ROADMAP.md'),
      `# Roadmap

- [ ] **Phase 1: Foundation** - Core setup
  - [x] 01-01-PLAN.md
  - [ ] 01-02-PLAN.md
- [ ] **Phase 2: Auth** - Authentication flow
  - [ ] 02-01-PLAN.md
`
    );

    writeFile(
      join(phaseOneDir, '01-01-PLAN.md'),
      `---
phase: 01-foundation
plan: 1
title: Bootstrap repository
wave: 1
depends_on: []
---
## Objective
Create project baseline.
`
    );

    writeFile(
      join(phaseOneDir, '01-02-PLAN.md'),
      `---
phase: 01-foundation
plan: 2
title: Add CI workflow
wave: 1
depends_on:
  - "01-01"
---
## Objective
Add project CI.
`
    );

    writeFile(
      join(phaseOneDir, '01-01-SUMMARY.md'),
      `---
duration: 20m
completed: 2026-02-08T12:00:00Z
---
## One-Liner
Repository bootstrap completed.
`
    );

    writeFile(
      join(phaseTwoDir, '02-01-PLAN.md'),
      `---
phase: 02-auth
plan: 1
title: Implement login endpoint
wave: 1
depends_on: []
---
## Objective
Build initial auth API.
`
    );

    const dashboardState = buildDashboardState(planningDir);

    assert.deepEqual(
      dashboardState.tasks.map((task) => task.id),
      ['01-01', '01-02', '02-01'],
      'tasks should be sorted deterministically by phase and plan'
    );

    assert.equal(dashboardState.tasks[0]?.status, 'complete');
    assert.equal(dashboardState.tasks[1]?.status, 'in-progress');
    assert.equal(dashboardState.tasks[2]?.status, 'pending');

    assert.equal(dashboardState.phases.length, 2);
    assert.equal(dashboardState.phases[0]?.status, 'in-progress');
    assert.equal(dashboardState.phases[1]?.status, 'pending');

    assert.equal(dashboardState.currentPhase, 1);
    assert.equal(dashboardState.currentPlan, 2);
    assert.match(dashboardState.roadmap, /Phase 1: Foundation/);
  } finally {
    rmSync(workspaceDir, { recursive: true, force: true });
  }
});
