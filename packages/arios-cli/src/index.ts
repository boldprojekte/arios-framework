#!/usr/bin/env node
import { program } from 'commander';

program
  .name('arios')
  .description('AI-assisted development workflow for Claude Code')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize ARIOS in the current project')
  .action(() => {
    console.log('ARIOS init - Not implemented yet');
    console.log('This will create .arios/ folder and slash commands.');
  });

program
  .command('update')
  .description('Update ARIOS to the latest version')
  .action(() => {
    console.log('ARIOS update - Not implemented yet');
    console.log('This will update ARIOS files and show what changed.');
  });

program.parse();
