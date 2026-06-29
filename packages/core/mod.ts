// @dmd/core/mod.ts

import { marked } from "marked";

const builtInFunctions: Record<string, Function> = {
  createTable: (data: Array<Record<string, unknown>>) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const headerRow = `| ${headers.join(' | ')} |`;
    const dividerRow = `| ${headers.map(() => '---').join(' | ')} |`;
    const rows = data.map(row => `| ${headers.map(h => String(row[h] ?? '')).join(' | ')} |`).join('\n');
    return `\n${headerRow}\n${dividerRow}\n${rows}\n`;
  },
  createList: (entries: Array<unknown>) => {
    if (!entries || entries.length === 0) return '';
    return `\n${entries.map(e => `- ${String(e)}`).join('\n')}\n`;
  }
};

export interface CompileOptions {
  toHtml?: boolean;
}

export function compileDMD(input: string, options: CompileOptions = {}): string {
  let markdown = input;
  const context: Record<string, any> = { ...builtInFunctions };

  // 1. SCHRITT: Definitions-Blöcke parsen (:::dmd ... ::: über mehrere Zeilen)
  const blockRegex = /:::dmd\s*\n([\s\S]*?)\n:::/g;
  markdown = markdown.replace(blockRegex, (_, logicCode) => {
    executeInContext(logicCode, context);
    return '';
  });

  // 2. SCHRITT: Inline-Funktionsblöcke parsen (:::dmd funktion() ::: auf einer Zeile)
  const inlineBlockRegex = /^:::dmd\s+(.+?)\s+:::$/gm;
  markdown = markdown.replace(inlineBlockRegex, (_, expression) => {
    return String(evaluateExpression(expression, context));
  });

  // 3. SCHRITT: Inline-Variablen & Ausdrücke parsen (:{ ... }:)
  const inlineRegex = /:{\s*(.+?)\s*}:/g;
  markdown = markdown.replace(inlineRegex, (_, expression) => {
    return String(evaluateExpression(expression, context));
  });

  const finalMarkdown = markdown.trim();

  // Optionales HTML-Rendering via marked
  if (options.toHtml) {
    return marked.parse(finalMarkdown) as string;
  }

  return finalMarkdown;
}

function executeInContext(code: string, context: Record<string, any>) {
  const sanitizedCode = code.replace(/\$(\w+)/g, 'this.$1');
  const fn = new Function(sanitizedCode);
  fn.call(context);
}

function evaluateExpression(expression: string, context: Record<string, any>): unknown {
  const sanitizedExpression = expression.replace(/\$(\w+)/g, 'this.$1');
  const fn = new Function(`return ${sanitizedExpression};`);
  try {
    return fn.call(context);
  } catch (e) {
    return `[DMD Error: ${(e as Error).message}]`;
  }
}
