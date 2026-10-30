// Usage (from the project root): npm run import -- imports/<file>.json [--approve]
//   --approve  approve the questions on import (for files Claude writes in this project). All or nothing:
//              any invalid item or unknown topic cancels the whole import, and a file can't be imported twice.
import fs from "node:fs";
import path from "node:path";
import { ImportRejected, importQuestions } from "../bank.ts";
import { seed } from "../seed.ts";

const args = process.argv.slice(2);
const approve = args.includes("--approve");
const arg = args.find((a) => !a.startsWith("--"));
if (!arg) {
  console.error("Usage: npm run import -- <questions.json> [--approve]");
  process.exit(1);
}
// npm runs workspace scripts from server/, so resolve the path from where the command was typed.
const file = path.resolve(process.env.INIT_CWD ?? process.cwd(), arg);

seed();
let result;
try {
  result = importQuestions(JSON.parse(fs.readFileSync(file, "utf8")), path.basename(file), { approve });
} catch (err) {
  if (!(err instanceof ImportRejected)) throw err;
  console.error(err.message);
  console.error(`  ${err.errors.join("\n  ")}`);
  process.exit(1);
}

console.log(`Imported ${result.imported} question(s) from ${path.basename(file)} ${approve ? "as approved" : "into the Review Queue"}.`);
if (result.withWarnings) {
  console.log(`${result.withWarnings} have automatic-check warnings to look at:`);
  for (const w of result.warned) console.log(`  #${w.id} ${w.stem.slice(0, 70)} -> ${w.warnings.join(" ")}`);
}
if (result.createdTopics.length) console.log(`New topics created:\n  ${result.createdTopics.join("\n  ")}`);
if (result.errors.length) {
  console.log(`Skipped ${result.errors.length} item(s):\n  ${result.errors.join("\n  ")}`);
  process.exitCode = 1;
}
