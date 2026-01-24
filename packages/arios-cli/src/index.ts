#!/usr/bin/env node
import { program } from 'commander';
import { init } from './commands/init.js';
import { update } from './commands/update.js';

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

program.parse();
