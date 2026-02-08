import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const namespacedCommandsDir = join(repoRoot, 'templates', '.claude', 'commands', 'arios');

function getCommandMarkdownFiles() {
  return readdirSync(namespacedCommandsDir)
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => join(namespacedCommandsDir, entry))
    .sort();
}

test('runtime config template exists under .planning/config.json.hbs', () => {
  const templatePath = join(repoRoot, 'templates', '.planning', 'config.json.hbs');
  assert.ok(existsSync(templatePath), `missing runtime config template: ${templatePath}`);

  const templateContent = readFileSync(templatePath, 'utf-8');
  const renderedContent = templateContent.replace('{{version}}', '0.0.0-test');
  const parsed = JSON.parse(renderedContent);

  assert.equal(parsed.mode, null);
  assert.equal(parsed.feature_name, null);
  assert.equal(parsed.active_feature, null);
  assert.equal(parsed.approach, 'balanced');
  assert.ok(parsed.checkpoint && typeof parsed.checkpoint === 'object');
  assert.ok(parsed.recovery && typeof parsed.recovery === 'object');
});

test('runtime config path is consolidated to .planning/config.json', () => {
  const approachSource = readFileSync(
    join(repoRoot, 'src', 'config', 'approach.ts'),
    'utf-8'
  );
  assert.match(
    approachSource,
    /CONFIG_PATH\s*=\s*['"]\.planning\/config\.json['"]/,
    'approach config path should point to .planning/config.json'
  );

  const metadataTemplate = readFileSync(
    join(repoRoot, 'templates', '.arios', 'config.json.hbs'),
    'utf-8'
  );
  assert.match(
    metadataTemplate,
    /"configPath"\s*:\s*"\.planning\/config\.json"/,
    '.arios metadata should declare runtime config path'
  );

  const violations = [];
  for (const filePath of getCommandMarkdownFiles()) {
    if (basename(filePath) === 'update.md') {
      continue;
    }
    const content = readFileSync(filePath, 'utf-8');
    if (content.includes('.arios/config.json')) {
      violations.push(filePath);
    }
  }

  assert.deepEqual(
    violations,
    [],
    `runtime command docs should not read .arios/config.json:\n${violations.join('\n')}`
  );
});

test('init command renders metadata and runtime config to separate targets', () => {
  const initSource = readFileSync(
    join(repoRoot, 'src', 'commands', 'init.ts'),
    'utf-8'
  );

  assert.ok(
    initSource.includes("path.join(templatesDir, '.arios', 'config.json.hbs')"),
    'init command must render .arios/config.json from template'
  );
  assert.ok(
    initSource.includes("path.join(ariosDir, 'config.json')"),
    'init command must write metadata config to .arios/config.json'
  );
  assert.ok(
    initSource.includes("path.join(templatesDir, '.planning', 'config.json.hbs')"),
    'init command must render .planning/config.json from template'
  );
  assert.ok(
    initSource.includes("path.join(planningDir, 'config.json')"),
    'init command must write runtime config to .planning/config.json'
  );
});

test('/arios:start contract keeps product type unset during setup', () => {
  const startCommand = readFileSync(
    join(repoRoot, 'templates', '.claude', 'commands', 'arios', 'start.md'),
    'utf-8'
  );

  assert.match(
    startCommand,
    /must NOT lock in the final product\/project type/i,
    '/arios:start should explicitly avoid fixing final project type'
  );
  assert.match(
    startCommand,
    /"type"\s*:\s*"unspecified"/,
    '/arios:start should store neutral project type during setup'
  );
});
