// Fixes imported questions in place and re-runs the automatic checks.
// Usage (from the project root): npm run fix -- <fixes.json> <imports/file.json>
// fixes.json maps question id -> the fields to replace, e.g. {"2345": {"stem": "...", "options": ["A", "B", "C", "D"]}}.
// Supported fields: stem, options, rationale, explanations, quote, source. The same change is written to the
// import file (matched by the question's old stem), so the file stays a faithful copy of the bank.
import fs from "node:fs";
import path from "node:path";
import { run } from "../db.ts";
import { getQuestion, recheck } from "../repo.ts";

const [fixesArg, importArg] = process.argv.slice(2);
if (!fixesArg || !importArg) {
  console.error("Usage: npm run fix -- <fixes.json> <imports/file.json>");
  process.exit(1);
}
const cwd = process.env.INIT_CWD ?? process.cwd();
const importFile = path.resolve(cwd, importArg);
const fixes = JSON.parse(fs.readFileSync(path.resolve(cwd, fixesArg), "utf8")) as Record<string, Record<string, unknown>>;
const file = JSON.parse(fs.readFileSync(importFile, "utf8")) as { questions: Record<string, unknown>[] };

// Question column, import-file key, and whether the value is stored as JSON.
const FIELDS: Record<string, [column: string, key: string, json: boolean]> = {
  stem: ["stem", "stem", false],
  options: ["options", "options", true],
  rationale: ["rationale", "rationale", false],
  explanations: ["explanations", "explanations", true],
  quote: ["source_quote", "quote", false],
  source: ["source_label", "source", false],
};

for (const [idText, fix] of Object.entries(fixes)) {
  const id = Number(idText);
  const q = getQuestion(id);
  if (!q) throw new Error(`Question #${id} does not exist.`);
  const item = file.questions.find((x) => x.stem === q.stem);
  if (!item) throw new Error(`#${id} was not found in ${importArg} (looked for its stem).`);
  for (const [name, value] of Object.entries(fix)) {
    const field = FIELDS[name];
    if (!field) throw new Error(`#${id}: "${name}" can't be fixed with this tool.`);
    const [column, key, json] = field;
    run(`UPDATE questions SET ${column} = ?, updated_at = datetime('now') WHERE id = ?`, json ? JSON.stringify(value) : String(value), id);
    item[key] = value;
  }
  recheck(id);
  console.log(`#${id} warnings: ${JSON.stringify(getQuestion(id)!.warnings)}`);
}
fs.writeFileSync(importFile, JSON.stringify(file, null, 1) + "\n");
