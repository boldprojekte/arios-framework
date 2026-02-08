#!/usr/bin/env node
import { program } from 'commander';
import { init } from './commands/init.js';
import { update } from './commands/update.js';
import { dashboardCommand } from './commands/dashboard.js';

// Handoff utilities for subagent communication
export * from './types/handoff.js';
export * from './utils/handoff.js';

// State utilities for project state persistence
export * from './types/state.js';
export * from './utils/state.js';

program
  .name('arios')
  .description('AI-assisted development workflow for Claude Code')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize ARIOS in the current project')
  .action(init);

program
  .command('update')
  .description('Update ARIOS to the latest version')
  .action(update);

program.addCommand(dashboardCommand);

program.parse();
