import chalk from 'chalk';
import ora from 'ora';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureDir,
  copyTemplates,
  fileExists,
  readFile,
  writeFile
} from '../utils/files.js';
import { renderTemplateToFile } from '../utils/templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get templates directory (relative to compiled dist/commands/)
function getTemplatesDir(): string {
  // In dist/commands/init.js, templates are at ../../templates
  return path.resolve(__dirname, '../../templates');
}

/**
 * Initialize ARIOS in the current project
 */
export async function init(): Promise<void> {
  const cwd = process.cwd();
  const ariosDir = path.join(cwd, '.arios');
  const claudeDir = path.join(cwd, '.claude', 'commands', 'arios');

  try {
    // Check if already initialized
    if (await fileExists(ariosDir)) {
      console.log(chalk.yellow('ARIOS already initialized in this directory.'));
      console.log(chalk.dim('Run /arios:update in Claude Code to update.'));
      return;
    }

    // Detect project info
    const projectInfo = await detectProjectInfo(cwd);

    // Start spinner
    const spinner = ora('Installing ARIOS...').start();

    const templatesDir = getTemplatesDir();

    // Copy static templates
    // Copy .arios/ (excluding .hbs files)
    await copyTemplates(
      path.join(templatesDir, '.arios'),
      ariosDir
    );

    // Copy .claude/commands/arios/
    await ensureDir(path.join(cwd, '.claude', 'commands'));
    await copyTemplates(
      path.join(templatesDir, '.claude', 'commands', 'arios'),
      claudeDir
    );

    // Copy .claude/agents/
    const agentsDir = path.join(cwd, '.claude', 'agents');
    await copyTemplates(
      path.join(templatesDir, '.claude', 'agents'),
      agentsDir
    );

    // Render templated files
    const templateData = {
      projectName: projectInfo.name,
      typescript: projectInfo.typescript,
      stack: projectInfo.stack,
      version: '0.1.0'
    };

    // Render config.json.hbs
    await renderTemplateToFile(
      path.join(templatesDir, '.arios', 'config.json.hbs'),
      path.join(ariosDir, 'config.json'),
      templateData
    );

    // Handle CLAUDE.md
    await handleClaudeMd(cwd, templatesDir, templateData);

    // Success
    spinner.succeed('ARIOS installed successfully!');
    console.log('');
    console.log(chalk.dim('Created:'));
    console.log(chalk.dim('  .arios/           ARIOS system files'));
    console.log(chalk.dim('  .claude/commands/ Slash commands (/arios:start, /arios:orchestrate)'));
    console.log(chalk.dim('  .claude/agents/   Subagents (researcher, planner, executor)'));
    console.log('');
    console.log(chalk.cyan('Run /arios:start in Claude Code to complete setup'));
  } catch (error) {
    console.error(chalk.red('Failed to initialize ARIOS:'));
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Detect basic project information
 */
async function detectProjectInfo(cwd: string): Promise<{
  name: string;
  typescript: boolean;
  stack: string | null;
}> {
  let name = path.basename(cwd);
  let typescript = false;
  let stack: string | null = null;

  // Try to read package.json for project name
  const packageJsonPath = path.join(cwd, 'package.json');
  if (await fileExists(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(await readFile(packageJsonPath));
      if (packageJson.name) {
        name = packageJson.name;
      }
      stack = 'node';
    } catch {
      // Ignore parse errors
    }
  }

  // Check for TypeScript
  const tsconfigPath = path.join(cwd, 'tsconfig.json');
  if (await fileExists(tsconfigPath)) {
    typescript = true;
  }

  return { name, typescript, stack };
}

/**
 * Handle CLAUDE.md file:
 * - If doesn't exist: create from template
 * - If exists without ARIOS section: append section
 * - If exists with ARIOS section: skip
 */
async function handleClaudeMd(
  cwd: string,
  templatesDir: string,
  templateData: Record<string, unknown>
): Promise<void> {
  const claudeMdPath = path.join(cwd, 'CLAUDE.md');
  const templatePath = path.join(templatesDir, 'CLAUDE.md.hbs');

  // ARIOS section markers
  const ARIOS_START = '<!-- ARIOS:START -->';
  const ARIOS_END = '<!-- ARIOS:END -->';

  // ARIOS section content
  const ariosSection = `${ARIOS_START}
## ARIOS
This project uses ARIOS for AI-assisted development.
See @.arios/system.md for workflow commands.
${ARIOS_END}`;

  if (!(await fileExists(claudeMdPath))) {
    // Create new CLAUDE.md
    await writeFile(claudeMdPath, ariosSection + '\n');
    return;
  }

  // Read existing file
  const content = await readFile(claudeMdPath);

  // Check if ARIOS section already exists
  if (content.includes(ARIOS_START) || content.includes('ARIOS')) {
    // Already has ARIOS section, skip
    return;
  }

  // Append ARIOS section
  const updatedContent = content.trimEnd() + '\n\n' + ariosSection + '\n';
  await writeFile(claudeMdPath, updatedContent);
}
