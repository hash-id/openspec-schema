// Read-modify-write openspec/config.yaml with a real YAML parser so an
// existing context: (multiline, block-scalar, or commented-out sample)
// survives instead of being clobbered by line-based text edits.
//
// Usage: node merge-config.cjs <config-path> <schema-name> <context-marker> <context-text>
"use strict";

const fs = require("fs");
const path = require("path");
const YAML = require("yaml");

const [, , configPath, schemaName, marker, contextText] = process.argv;
if (!configPath || !schemaName || !marker || !contextText) {
  console.error("Usage: node merge-config.cjs <config-path> <schema-name> <context-marker> <context-text>");
  process.exit(1);
}

// Check for a symlink (including a dangling one - fs.existsSync follows
// symlinks and would report false for a dangling one, hiding it) before
// touching the path any other way.
let lstat;
try {
  lstat = fs.lstatSync(configPath);
} catch {
  lstat = null;
}
if (lstat && lstat.isSymbolicLink()) {
  console.error(
    `Error: '${configPath}' is a symlink. Refusing to read or write through it - ` +
      "replace it with a regular file, or point the installer at a different path."
  );
  process.exit(1);
}

// Map common fs error codes to a one-line message instead of letting Node's
// default uncaught-exception dump (source snippet + internal stack frames)
// reach the user - consistent with the clean-error style used elsewhere
// in this script for YAML-parse and non-string-context failures.
function failWithCleanFsError(err, configPath) {
  const reasons = {
    EISDIR: "is a directory, not a file",
    EACCES: "permission denied",
    EPERM: "operation not permitted",
    ENOSPC: "no space left on device",
    ENOTDIR: "a parent path component is not a directory",
  };
  const reason = reasons[err.code] || err.message;
  console.error(`Error: could not read/write '${configPath}' - ${reason} (${err.code}).`);
  process.exit(1);
}

let raw = "";
if (fs.existsSync(configPath)) {
  try {
    raw = fs.readFileSync(configPath, "utf8");
  } catch (err) {
    failWithCleanFsError(err, configPath);
  }
}

const doc = raw.trim() ? YAML.parseDocument(raw) : new YAML.Document({});
if (doc.errors.length > 0) {
  console.error(
    `Error: '${configPath}' is not valid YAML - refusing to modify it automatically:\n` +
      doc.errors.map((e) => e.message).join("\n") +
      "\nFix the file by hand, then re-run the installer."
  );
  process.exit(1);
}
if (doc.contents === null) {
  doc.contents = doc.createNode({});
}

doc.set("schema", schemaName);

const existing = doc.get("context");
if (existing !== undefined && existing !== null && typeof existing !== "string") {
  const kind = YAML.isSeq(existing)
    ? "a list"
    : YAML.isMap(existing)
      ? "a mapping"
      : YAML.isAlias(existing)
        ? "a YAML alias (*ref)"
        : typeof existing;
  console.error(
    `Error: '${configPath}' has a 'context:' key that is not a plain string (found ${kind}). ` +
      "Refusing to overwrite it automatically - merge the tooling-preference text into it by hand:\n" +
      `${marker}\n${contextText}`
  );
  process.exit(1);
}

// Find and replace an existing block that starts with an exact, line-anchored
// match of `marker` (not a substring match anywhere in the text - that would
// false-positive against unrelated prose that happens to contain the marker
// text). A block runs from the marker line through the next blank line or
// end of string. This lets a reworded contextText for the same marker
// replace the old block instead of accumulating a second, possibly
// contradictory one on every install with a different contextText.
//
// KNOWN LIMITATION: this infers the block's end from the first blank line
// after the marker, so a contextText containing an internal blank line
// (a multi-paragraph body) will only have its first paragraph replaced on a
// reword - later paragraphs from the old block survive as orphaned trailing
// text. Not fixed: the installer's contextText is always a single line
// today, so this never triggers in practice, and a robust fix needs an
// explicit block-closing delimiter (a format change to every already
// installed config.yaml) for a problem that doesn't exist yet.
function replaceOrAppendBlock(text, markerLine, newBlock) {
  const lines = text.split("\n");
  const markerIndex = lines.findIndex((line) => line === markerLine);
  if (markerIndex === -1) {
    return text.replace(/\n?$/, "") + "\n\n" + newBlock;
  }
  let blockEnd = lines.findIndex((line, i) => i > markerIndex && line.trim() === "");
  if (blockEnd === -1) blockEnd = lines.length;
  const before = lines.slice(0, markerIndex);
  const after = lines.slice(blockEnd);
  const merged = [...before, ...newBlock.split("\n"), ...after].join("\n");
  return merged.replace(/\n{3,}/g, "\n\n");
}

const newBlock = marker + "\n" + contextText;
let newContext;
if (typeof existing === "string" && existing.trim()) {
  newContext = replaceOrAppendBlock(existing.replace(/\n+$/, ""), marker, newBlock).replace(/\n?$/, "") + "\n";
} else {
  newContext = newBlock + "\n";
}

doc.set("context", doc.createNode(newContext));
const contextNode = doc.get("context", true);
contextNode.type = "BLOCK_LITERAL";

try {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, String(doc));
} catch (err) {
  failWithCleanFsError(err, configPath);
}
