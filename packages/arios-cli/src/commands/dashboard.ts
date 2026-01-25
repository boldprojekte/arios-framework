import { Command } from 'commander';
import chalk from 'chalk';
import { spawn, ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Find dashboard server entry point relative to CLI package
function getDashboardServerPath(): string {
  // packages/arios-cli/src/commands/dashboard.ts
  // -> packages/arios-dashboard/src/server/index.ts
  const cliRoot = path.resolve(__dirname, '../..');
  const dashboardServer = path.resolve(cliRoot, '../arios-dashboard/src/server/index.ts');
  return dashboardServer;
}

/**
 * Dashboard command - starts the dashboard server
 */
export const dashboardCommand = new Command('dashboard')
  .description('Start the ARIOS dashboard to view task progress')
  .option('-p, --port <port>', 'Port to run dashboard on', '3456')
  .option('--no-open', 'Do not open browser automatically')
  .action(async (options: { port: string; open: boolean }) => {
    const cwd = process.cwd();
    const planningDir = path.join(cwd, '.planning');

    // Check for .planning directory
    if (!existsSync(planningDir)) {
      console.error(chalk.red('Error: .planning directory not found.'));
      console.error(chalk.dim('Run /arios:start to initialize a project first.'));
      process.exit(1);
    }

    const port = parseInt(options.port, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error(chalk.red(`Error: Invalid port number: ${options.port}`));
      process.exit(1);
    }

    const dashboardServer = getDashboardServerPath();
    if (!existsSync(dashboardServer)) {
      console.error(chalk.red('Error: Dashboard server not found.'));
      console.error(chalk.dim(`Expected at: ${dashboardServer}`));
      process.exit(1);
    }

    console.log(chalk.cyan('Starting ARIOS Dashboard...'));

    // Spawn dashboard server
    let serverProcess: ChildProcess | null = null;
    let serverStarted = false;

    try {
      serverProcess = spawn('npx', ['tsx', dashboardServer, planningDir, String(port)], {
        stdio: ['inherit', 'pipe', 'inherit'],
        env: { ...process.env, PORT: String(port) },
        cwd: path.dirname(dashboardServer),
      });

      // Listen for server output
      serverProcess.stdout?.on('data', async (data: Buffer) => {
        const output = data.toString();
        process.stdout.write(output);

        // Check for server start message
        if (!serverStarted && output.includes('Dashboard server running')) {
          serverStarted = true;
          const url = `http://localhost:${port}`;
          console.log('');
          console.log(chalk.green(`Dashboard running at: ${chalk.bold(url)}`));
          console.log(chalk.dim('Press Ctrl+C to stop'));

          // Open browser if --open flag (default)
          if (options.open) {
            await openBrowser(url);
          }
        }
      });

      // Handle server errors
      serverProcess.on('error', (err) => {
        console.error(chalk.red('Failed to start dashboard server:'), err.message);
        process.exit(1);
      });

      serverProcess.on('close', (code) => {
        if (code !== 0 && code !== null) {
          console.error(chalk.red(`Dashboard server exited with code ${code}`));
        }
        process.exit(code ?? 0);
      });

      // Handle Ctrl+C gracefully
      const shutdown = () => {
        if (serverProcess && !serverProcess.killed) {
          console.log('');
          console.log(chalk.yellow('Shutting down dashboard...'));
          serverProcess.kill('SIGTERM');
        }
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

    } catch (err) {
      console.error(chalk.red('Failed to start dashboard:'), err);
      process.exit(1);
    }
  });

/**
 * Open URL in default browser (cross-platform)
 */
async function openBrowser(url: string): Promise<void> {
  const { platform } = process;
  let command: string;
  let args: string[];

  switch (platform) {
    case 'darwin':
      command = 'open';
      args = [url];
      break;
    case 'win32':
      command = 'cmd';
      args = ['/c', 'start', '', url];
      break;
    default:
      // Linux and others
      command = 'xdg-open';
      args = [url];
      break;
  }

  try {
    spawn(command, args, { detached: true, stdio: 'ignore' }).unref();
  } catch {
    // Silently fail if browser can't be opened
    console.log(chalk.dim('(Could not open browser automatically)'));
  }
}
