import { readFile, writeFile } from './files.js';

/**
 * Simple template rendering using {{variableName}} pattern
 * Supports basic conditionals: {{#if var}}...{{else}}...{{/if}}
 */
export async function renderTemplate(
  templatePath: string,
  data: Record<string, unknown>
): Promise<string> {
  const template = await readFile(templatePath);
  return renderString(template, data);
}

/**
 * Render template and write to destination file
 */
export async function renderTemplateToFile(
  templatePath: string,
  destPath: string,
  data: Record<string, unknown>
): Promise<void> {
  const rendered = await renderTemplate(templatePath, data);
  await writeFile(destPath, rendered);
}

/**
 * Render a template string with variable substitution
 * Supports:
 * - {{variableName}} - simple variable replacement
 * - {{#if var}}content{{else}}alt{{/if}} - conditionals
 * - {{! comment }} - comments (removed from output)
 */
function renderString(template: string, data: Record<string, unknown>): string {
  let result = template;

  // Remove comments ({{! ... }})
  result = result.replace(/\{\{![\s\S]*?\}\}/g, '');

  // Handle conditionals: {{#if var}}...{{else}}...{{/if}}
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
    (_, varName: string, ifContent: string, elseContent: string = '') => {
      const value = data[varName];
      const isTruthy = value !== undefined && value !== null && value !== false && value !== '';
      return isTruthy ? ifContent : elseContent;
    }
  );

  // Handle simple variable replacement: {{variableName}}
  result = result.replace(
    /\{\{(\w+)\}\}/g,
    (_, varName: string) => {
      const value = data[varName];
      if (value === undefined || value === null) {
        return '';
      }
      return String(value);
    }
  );

  return result;
}
