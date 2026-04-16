#!/usr/bin/env node
/**
 * Validates that a git commit message includes a non-empty Assisted-by trailer.
 * See docs/AI_ASSISTED_CONTRIBUTIONS.md
 */
import fs from "node:fs";

const argv = process.argv.slice(2);
const strict =
  argv.includes("--strict") || process.env.ASSISTED_BY_STRICT === "1";
const useStdin = argv.includes("--stdin");
const fileArg = argv.find((a) => !a.startsWith("-"));

let message;
if (useStdin) {
  message = fs.readFileSync(0, "utf8");
} else if (fileArg) {
  message = fs.readFileSync(fileArg, "utf8");
} else {
  console.error(
    "Usage: node scripts/check-assisted-by.mjs <commit-msg-file> [--strict]",
  );
  console.error(
    "   or: git log -1 --format=%B | node scripts/check-assisted-by.mjs --stdin [--strict]",
  );
  process.exit(strict ? 1 : 0);
}

function shouldSkip(msg) {
  const first = msg.split(/\r?\n/)[0]?.trim() ?? "";
  if (first.startsWith("Merge ")) return true;
  if (first.startsWith("Revert ")) return true;
  return false;
}

/** Non-empty value after "Assisted-by:" (e.g. human-only, none, Agent:Model). */
function hasAssistedByTrailer(msg) {
  return /^Assisted-by:\s*\S+/im.test(msg);
}

if (shouldSkip(message)) {
  process.exit(0);
}

if (hasAssistedByTrailer(message)) {
  process.exit(0);
}

const hint = `Commit message must include a non-empty Assisted-by line, for example:

  Assisted-by: Cursor:Composer-2

If no AI/tools were used for this commit:

  Assisted-by: human-only

Docs: docs/AI_ASSISTED_CONTRIBUTIONS.md`;

if (strict) {
  console.error("Assisted-by check failed (strict mode).\n");
  console.error(hint);
  process.exit(1);
}

console.error("Assisted-by: trailer missing or empty (warning only).\n");
console.error(hint);
process.exit(0);
