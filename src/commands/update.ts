import chalk from 'chalk';
import ora from 'ora';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureDir,
  copyTemplates,
  fileExists,
  readFile,
} from '../utils/files.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getTemplatesDir(): string {
  return path.resolve(__dirname, '../../templates');
}

/**
 * Update ARIOS commands, agents, and system files to the latest version
 */
export async function update(): Promise<void> {
  const cwd = process.cwd();
  const ariosDir = path.join(cwd, '.arios');
  const configPath = path.join(ariosDir, 'config.json');

  try {
    // Check if ARIOS is installed
    if (!(await fileExists(ariosDir))) {
      console.error(chalk.red('ARIOS is not installed in this directory.'));
      console.log(chalk.dim('Run `npx arios init` first.'));
      process.exit(1);
    }

    // Read current version
    let currentVersion = 'unknown';
    if (await fileExists(configPath)) {
      try {
        const config = JSON.parse(await readFile(configPath));
        currentVersion = config.version ?? 'unknown';
      } catch {
        // Ignore parse errors
      }
    }

    const spinner = ora('Updating ARIOS...').start();

    const templatesDir = getTemplatesDir();

    // Update .arios/system.md (but preserve config.json — user settings)
    const systemMdSrc = path.join(templatesDir, '.arios', 'system.md');
    const systemMdDest = path.join(ariosDir, 'system.md');
    if (await fileExists(systemMdSrc)) {
      const { copyFile } = await import('node:fs/promises');
      await copyFile(systemMdSrc, systemMdDest);
    }

    // Update .claude/commands/arios/
    const claudeDir = path.join(cwd, '.claude', 'commands', 'arios');
    await ensureDir(path.join(cwd, '.claude', 'commands'));
    await copyTemplates(
      path.join(templatesDir, '.claude', 'commands', 'arios'),
      claudeDir
    );

    // Update .claude/agents/
    const agentsDir = path.join(cwd, '.claude', 'agents');
    await copyTemplates(
      path.join(templatesDir, '.claude', 'agents'),
      agentsDir
    );

    spinner.succeed('ARIOS updated successfully!');
    console.log('');
    console.log(chalk.dim('Updated:'));
    console.log(chalk.dim('  .arios/system.md  System instructions'));
    console.log(chalk.dim('  .claude/commands/ Slash commands (12)'));
    console.log(chalk.dim('  .claude/agents/   Subagents (6)'));
    console.log('');
    console.log(chalk.dim(`Previous version: ${currentVersion}`));
    console.log(chalk.dim('Your .arios/config.json and .planning/ were preserved.'));
  } catch (error) {
    console.error(chalk.red('Failed to update ARIOS:'));
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
