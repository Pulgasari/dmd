// @dmd/cli/mod.ts

import { compileDMD } from "@dmd/core";

const args = Deno.args;
if (args.length === 0) {
  console.log("Nutzung: dmd <input.dmd> [output.md]");
  Deno.exit(1);
}

const  inputFile = args[0];
const outputFile = args[1] || inputFile.replace(/\.dmd$/, '.md');

try {
  const rawContent = await Deno.readTextFile(inputFile);
  const result     = compileDMD(rawContent);
  await Deno.writeTextFile(outputFile, result);
  console.log(`Successfully compiled: ${inputFile} -> ${outputFile}`);
} catch (err) {
  console.error("Fehler beim Kompilieren:", (err as Error).message);
}
