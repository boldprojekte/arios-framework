import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const repoRoot = process.cwd();
const commandsRoot = join(repoRoot, 'templates', '.claude', 'commands');
const namespacedCommandsDir = join(commandsRoot, 'arios');

const workflowAliases = [
  'ideate',
  'plan',
  'execute',
  'feature',
  'project',
  'change-mode',
  'orchestrate'
];

function getMarkdownFiles(dir) {
  return readdirSync(dir)
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => join(dir, entry))
    .sort();
}

function lineNumberAt(content, index) {
  return content.slice(0, index).split('\n').length;
}

test('all /arios:* references resolve to existing namespaced command templates', () => {
  const commandFiles = getMarkdownFiles(namespacedCommandsDir);
  const commandNames = new Set(commandFiles.map((filePath) => basename(filePath, '.md')));

  assert.ok(commandNames.has('arios'), 'missing canonical /arios command template');

  const sourceFiles = [
    ...commandFiles,
    join(repoRoot, 'templates', '.arios', 'system.md'),
    join(repoRoot, 'README.md')
  ];

  const unresolved = [];
  const ariosRefRegex = /\/arios:([a-z][a-z-]*)\b/g;

  for (const filePath of sourceFiles) {
    const content = readFileSync(filePath, 'utf-8');
    let match;
    while ((match = ariosRefRegex.exec(content)) !== null) {
      const commandName = match[1];
      if (!commandNames.has(commandName)) {
        unresolved.push(`${filePath}:${lineNumberAt(content, match.index)} -> /arios:${commandName}`);
      }
    }
  }

  assert.deepEqual(
    unresolved,
    [],
    `found /arios:* references without template files:\n${unresolved.join('\n')}`
  );
});

test('canonical /arios docs do not use un-namespaced workflow commands', () => {
  const violations = [];
  const legacyWorkflowRegex = /(^|[\s`"'(])\/(ideate|plan|execute|feature|project|change-mode|orchestrate)(?!-|:)\b/gm;

  for (const filePath of getMarkdownFiles(namespacedCommandsDir)) {
    if (basename(filePath) === 'help.md') {
      continue;
    }

    const content = readFileSync(filePath, 'utf-8');
    let match;
    while ((match = legacyWorkflowRegex.exec(content)) !== null) {
      violations.push(`${filePath}:${lineNumberAt(content, match.index)} -> /${match[2]}`);
    }
  }

  assert.deepEqual(
    violations,
    [],
    `found un-namespaced workflow command references in canonical docs:\n${violations.join('\n')}`
  );
});

test('legacy alias wrapper commands exist and forward to /arios:*', () => {
  const aliasMap = {
    ideate: 'ideate',
    plan: 'plan',
    execute: 'execute',
    feature: 'feature',
    project: 'project',
    'change-mode': 'change-mode',
    orchestrate: 'orchestrate'
  };

  for (const aliasName of workflowAliases) {
    const aliasFile = join(commandsRoot, `${aliasName}.md`);
    assert.ok(existsSync(aliasFile), `missing legacy alias wrapper: ${aliasFile}`);
    const content = readFileSync(aliasFile, 'utf-8');
    assert.match(
      content,
      new RegExp(`/arios:${aliasMap[aliasName]}\\b`),
      `alias wrapper does not forward to /arios:${aliasMap[aliasName]}: ${aliasFile}`
    );
  }
});

test('init/update commands copy full command templates (namespaced + aliases)', () => {
  const initSource = readFileSync(join(repoRoot, 'src', 'commands', 'init.ts'), 'utf-8');
  const updateSource = readFileSync(join(repoRoot, 'src', 'commands', 'update.ts'), 'utf-8');

  assert.ok(
    initSource.includes("path.join(templatesDir, '.claude', 'commands')"),
    'init should copy full templates/.claude/commands directory'
  );
  assert.ok(
    updateSource.includes("path.join(templatesDir, '.claude', 'commands')"),
    'update should copy full templates/.claude/commands directory'
  );
});
