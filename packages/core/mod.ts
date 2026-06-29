// @dmd/core/mod.ts

// Standard-Standardfunktionen für Markdown-Generierung
const builtInFunctions: Record<string, Function> = {
  createTable: (data: Array<Record<string, unknown>>) => {
    if (!data || data.length === 0) return '';
    const headers    = Object.keys(data[0]);
    const headerRow  = `| ${headers.join(' | ')} |`;
    const dividerRow = `| ${headers.map(() => '---').join(' | ')} |`;
    const rows = data.map(row => `| ${headers.map(h => String(row[h] ?? '')).join(' | ')} |`).join('\n');
    return `\n${headerRow}\n${dividerRow}\n${rows}\n`;
  },
  createList: (entries: Array<unknown>) => {
    if (!entries || entries.length === 0) return '';
    return `\n${entries.map(e => `- ${String(e)}`).join('\n')}\n`;
  }
};

export function compileDMD (input: string): string {
  let markdown = input;
  
  // Wir erstellen einen Execution-Context für unsere Variablen
  // Erbt die Standardfunktionen
  const context: Record<string, any> = { ...builtInFunctions };

  // 1. SCHRITT: Definitions-Blöcke parsen (:::dmd ... ::: über mehrere Zeilen)
  const blockRegex = /:::dmd\s*\n([\s\S]*?)\n:::/g;
  markdown = markdown.replace(blockRegex, (_, logicCode) => {
    // Variablen-Zuweisungen im Kontext ausführen
    executeInContext(logicCode, context);
    return ''; // Löscht den Definitionsblock aus dem finalen MD
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

  return markdown.trim();
}

// Hilfsfunktion: Führt Code aus und füllt den Kontext (für Variablen)
function executeInContext (code: string, context: Record<string, any>) {
  // Wir wandeln $variable im Code in context.variable um
  const sanitizedCode = code.replace(/\$(\w+)/g, 'this.$1');
  const fn = new Function(sanitizedCode);
  fn.call(context);
}

// Hilfsfunktion: Evaluiert einen einzelnen Ausdruck und gibt das Ergebnis zurück
function evaluateExpression (expression: string, context: Record<string, any>): unknown {
  const sanitizedExpression = expression.replace(/\$(\w+)/g, 'this.$1');
  const fn = new Function(`return ${sanitizedExpression};`);
  try {
    return fn.call(context);
  } catch (e) {
    return `[DMD Error: ${(e as Error).message}]`;
  }
}
