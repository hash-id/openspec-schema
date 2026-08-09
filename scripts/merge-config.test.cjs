// Regression tests for merge-config.cjs's read-modify-write of openspec/config.yaml.
//
// Run: cd scripts && npm install && npm test
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const YAML = require("yaml");

const SCRIPT = path.join(__dirname, "merge-config.cjs");
const MARKER = "# tempa-spec: tooling preference";
const TEXT =
  "Prefer, in order: codegraph (if available) > codebase-memory-mcp (if available and codegraph is not) > ripgrep (`rg`, MUST use over built-in grep/glob tools) for any codebase exploration.";

function runMerge(configPath, schemaName = "tempa-spec") {
  execFileSync("node", [SCRIPT, configPath, schemaName, MARKER, TEXT], { stdio: "pipe" });
}

// Like runMerge, but expects a non-zero exit instead of throwing the test out.
// Returns { status, stderr }.
function runMergeExpectFailure(configPath, schemaName = "tempa-spec") {
  try {
    execFileSync("node", [SCRIPT, configPath, schemaName, MARKER, TEXT], { stdio: "pipe" });
    return { status: 0, stderr: "" };
  } catch (err) {
    return { status: err.status, stderr: String(err.stderr) };
  }
}

function tmpConfigPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "merge-config-test-"));
  return path.join(dir, "config.yaml");
}

function writeAndRun(initialContent, schemaName = "tempa-spec") {
  const configPath = tmpConfigPath();
  if (initialContent !== null) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, initialContent);
  }
  runMerge(configPath, schemaName);
  const raw = fs.readFileSync(configPath, "utf8");
  return { raw, parsed: YAML.parse(raw) };
}

test("no file exists yet", () => {
  const { raw, parsed } = writeAndRun(null);
  assert.equal(parsed.schema, "tempa-spec");
  assert.match(parsed.context, new RegExp(MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(parsed.context, /Prefer, in order: codegraph/);
  assert.match(raw, /^context: \|/m, "should write context as a block-literal scalar");
});

test("file exists with schema only, no context key", () => {
  const { parsed } = writeAndRun("schema: other-schema\n");
  assert.equal(parsed.schema, "tempa-spec", "schema: should be overwritten to the new schema name");
  assert.match(parsed.context, /Prefer, in order: codegraph/);
});

test("existing single-line quoted context is preserved and appended to", () => {
  const { parsed } = writeAndRun('schema: tempa-spec\ncontext: "Tech stack: TypeScript, React."\n');
  assert.match(parsed.context, /^Tech stack: TypeScript, React\./);
  assert.match(parsed.context, /Prefer, in order: codegraph/);
});

test("existing single-line unquoted (plain scalar) context is preserved and appended to", () => {
  const { parsed } = writeAndRun("schema: tempa-spec\ncontext: Tech stack notes here\n");
  assert.match(parsed.context, /^Tech stack notes here/);
  assert.match(parsed.context, /Prefer, in order: codegraph/);
});

test("existing multiline block-literal (|) context is preserved and appended to", () => {
  const { parsed } = writeAndRun(
    "schema: tempa-spec\ncontext: |\n  Tech stack notes.\n  More notes.\n"
  );
  assert.match(parsed.context, /Tech stack notes\.\s*\n\s*More notes\./);
  assert.match(parsed.context, /Prefer, in order: codegraph/);
});

test("existing folded (>) multiline context is preserved (semantically) and appended to", () => {
  const { parsed } = writeAndRun(
    "schema: tempa-spec\ncontext: >\n  Tech stack: TypeScript,\n  React, and Node.\n"
  );
  assert.match(parsed.context, /Tech stack: TypeScript, React, and Node\./);
  assert.match(parsed.context, /Prefer, in order: codegraph/);
});

test("commented-out sample context block is left as a dead comment, not treated as active", () => {
  const { raw, parsed } = writeAndRun(
    "schema: tempa-spec\n# context: |\n#   dead sample\n#   more dead sample\n"
  );
  assert.match(parsed.context, /^# tempa-spec: tooling preference/, "should NOT pick up the commented sample as existing content");
  assert.match(raw, /#\s*context: \|/, "the commented-out sample line should survive untouched");
  assert.match(raw, /#\s*dead sample/);
});

test("re-running against its own prior output is idempotent (marker not duplicated)", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, "schema: tempa-spec\ncontext: |\n  Tech stack notes.\n  More notes.\n");
  runMerge(configPath);
  runMerge(configPath);
  const raw = fs.readFileSync(configPath, "utf8");
  const occurrences = raw.split(MARKER).length - 1;
  assert.equal(occurrences, 1, "marker text must appear exactly once after two runs");
  const parsed = YAML.parse(raw);
  assert.match(parsed.context, /Tech stack notes\./, "original content must still be present");
});

test("output is always valid, re-parseable YAML", () => {
  const { raw } = writeAndRun("schema: tempa-spec\ncontext: |\n  a\n  b\n");
  assert.doesNotThrow(() => YAML.parse(raw));
});

test("existing context as a YAML list (non-string) is refused, not silently overwritten", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const original = "schema: tempa-spec\ncontext:\n  - foo\n  - bar\n";
  fs.writeFileSync(configPath, original);
  const { status, stderr } = runMergeExpectFailure(configPath);
  assert.notEqual(status, 0, "should exit non-zero rather than overwrite");
  assert.match(stderr, /not a plain string/);
  assert.match(stderr, /a list/);
  assert.equal(fs.readFileSync(configPath, "utf8"), original, "file must be left untouched on refusal");
});

test("existing context as a YAML mapping (non-string) is refused, not silently overwritten", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const original = "schema: tempa-spec\ncontext:\n  foo: bar\n";
  fs.writeFileSync(configPath, original);
  const { status, stderr } = runMergeExpectFailure(configPath);
  assert.notEqual(status, 0, "should exit non-zero rather than overwrite");
  assert.match(stderr, /not a plain string/);
  assert.match(stderr, /a mapping/);
  assert.equal(fs.readFileSync(configPath, "utf8"), original, "file must be left untouched on refusal");
});

test("parent directory of the config path is created automatically when missing", () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "merge-config-test-"));
  const configPath = path.join(rootDir, "nested", "sub", "config.yaml");
  assert.equal(fs.existsSync(path.dirname(configPath)), false, "precondition: parent dir must not exist yet");
  runMerge(configPath);
  assert.equal(fs.existsSync(configPath), true);
  const parsed = YAML.parse(fs.readFileSync(configPath, "utf8"));
  assert.equal(parsed.schema, "tempa-spec");
});

test("malformed YAML (duplicate keys) is refused with a clean message, not a raw stack trace", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const original = "schema: old\nschema: tempa-spec\ncontext: hello\n";
  fs.writeFileSync(configPath, original);
  const { status, stderr } = runMergeExpectFailure(configPath);
  assert.notEqual(status, 0, "should exit non-zero rather than overwrite");
  assert.match(stderr, /not valid YAML/);
  assert.doesNotMatch(stderr, /at Object\.<anonymous>/, "should not leak a raw Node stack trace");
  assert.equal(fs.readFileSync(configPath, "utf8"), original, "file must be left untouched on refusal");
});

test("malformed YAML (tab indentation) is refused with a clean message, not a raw stack trace", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const original = "schema: tempa-spec\ncontext: |\n\tindented with tab\n";
  fs.writeFileSync(configPath, original);
  const { status, stderr } = runMergeExpectFailure(configPath);
  assert.notEqual(status, 0, "should exit non-zero rather than overwrite");
  assert.match(stderr, /not valid YAML/);
  assert.equal(fs.readFileSync(configPath, "utf8"), original, "file must be left untouched on refusal");
});

test("a UTF-8 BOM at the start of the file is handled transparently", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, "﻿schema: tempa-spec\ncontext: hello\n");
  runMerge(configPath);
  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = YAML.parse(raw);
  assert.equal(parsed.schema, "tempa-spec");
  assert.match(parsed.context, /^hello/);
  assert.equal(raw.charCodeAt(0), "s".charCodeAt(0), "BOM should not survive into the rewritten file");
});

test("existing context as a YAML alias (*ref) is refused, not silently overwritten", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const original = 'defaults: &d "shared text"\nschema: tempa-spec\ncontext: *d\n';
  fs.writeFileSync(configPath, original);
  const { status, stderr } = runMergeExpectFailure(configPath);
  assert.notEqual(status, 0, "should exit non-zero rather than overwrite");
  assert.match(stderr, /not a plain string/);
  assert.match(stderr, /alias/);
  assert.equal(fs.readFileSync(configPath, "utf8"), original, "file must be left untouched on refusal");
});

// ---------------------------------------------------------------------------
// Marker-drift: what happens when the marker/contextText the caller passes
// changes between runs (e.g. a future installer rewords CONTEXT_MARKER or
// CONTEXT_TEXT, exactly as already happened once in this repo's history).
// ---------------------------------------------------------------------------

function runMergeWith(configPath, schemaName, marker, text) {
  execFileSync("node", [SCRIPT, configPath, schemaName, marker, text], { stdio: "pipe" });
}

test("FIXED: a reworded marker's block replaces the old one instead of accumulating", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  runMergeWith(configPath, "tempa-spec", "# tempa-spec: tooling preference", "Use ripgrep only.");
  runMergeWith(
    configPath,
    "tempa-spec",
    "# tempa-spec: tooling preference",
    "Use codegraph AND ripgrep together."
  );
  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = YAML.parse(raw);
  assert.doesNotMatch(parsed.context, /Use ripgrep only\./, "old block must be gone, not just superseded");
  assert.match(parsed.context, /Use codegraph AND ripgrep together\./, "new block present");
});

test("FIXED: a marker that is a substring of unrelated existing text does NOT false-match - the real block is still appended", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const original = "schema: tempa-spec\ncontext: |\n  We covered MARK informally, unrelated to this tool.\n";
  fs.writeFileSync(configPath, original);
  runMergeWith(configPath, "tempa-spec", "MARK", "Prefer, in order: codegraph.");
  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = YAML.parse(raw);
  assert.match(parsed.context, /Prefer, in order: codegraph\./, "real block must be appended despite the substring collision");
  assert.match(parsed.context, /We covered MARK informally/, "original unrelated prose must survive untouched");
});

test("FIXED: a whitespace-only marker does not falsely match unrelated existing text (line-anchored, not substring)", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const original = "schema: tempa-spec\ncontext: |\n  some prior notes with a space in them\n";
  fs.writeFileSync(configPath, original);
  runMergeWith(configPath, "tempa-spec", " ", "Prefer, in order: codegraph.");
  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = YAML.parse(raw);
  assert.match(parsed.context, /Prefer, in order: codegraph\./, "real block must be appended despite the whitespace marker");
});

test("FIXED: replacing a block preserves unrelated surrounding content", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(
    configPath,
    "schema: tempa-spec\ncontext: |\n  Team notes above.\n\n  MARK\n  old body text\n\n  Team notes below.\n"
  );
  runMergeWith(configPath, "tempa-spec", "MARK", "new body text");
  const parsed = YAML.parse(fs.readFileSync(configPath, "utf8"));
  assert.match(parsed.context, /Team notes above\./);
  assert.match(parsed.context, /Team notes below\./);
  assert.match(parsed.context, /new body text/);
  assert.doesNotMatch(parsed.context, /old body text/);
});

test("FIXED: replacing a block at end-of-string (no trailing blank line) works", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, "schema: tempa-spec\ncontext: |\n  MARK\n  old body text\n");
  runMergeWith(configPath, "tempa-spec", "MARK", "new body text");
  const parsed = YAML.parse(fs.readFileSync(configPath, "utf8"));
  assert.match(parsed.context, /new body text/);
  assert.doesNotMatch(parsed.context, /old body text/);
});

test("KNOWN LIMITATION: rewording a multi-paragraph contextText (internal blank line) leaves the old block's trailing paragraph(s) as orphaned text", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  runMergeWith(configPath, "tempa-spec", "MARK", "para one\n\npara two");
  runMergeWith(configPath, "tempa-spec", "MARK", "changed para one\n\nchanged para two");
  const parsed = YAML.parse(fs.readFileSync(configPath, "utf8"));
  // Documents the CURRENT, accepted limitation (see the comment above
  // replaceOrAppendBlock in merge-config.cjs): block-end is inferred from
  // the first blank line after the marker, so everything up to and
  // including the new block's own first blank line is treated as "the old
  // block" and gets removed - but text that comes AFTER that first blank
  // line in the OLD content (here, the old block's second paragraph) is
  // outside what gets matched as "before"/"after" and survives verbatim as
  // orphaned trailing text, uncorrelated with the new content.
  // Not a real-world risk today - the installer's contextText is always a
  // single line - so this is intentionally left as-is rather than fixed.
  assert.match(parsed.context, /changed para one/);
  assert.match(parsed.context, /changed para two/);
  assert.doesNotMatch(parsed.context, /^para one/m, "old first paragraph's text is gone");
  assert.match(parsed.context, /^para two/m, "documents the gap: old second paragraph survives as orphaned trailing text");
});

// ---------------------------------------------------------------------------
// YAML data-shape edge cases
// ---------------------------------------------------------------------------

test("context: with no value (null-ish forms) is treated the same as an absent key", () => {
  for (const form of ["context:\n", "context: null\n", "context: ~\n"]) {
    const configPath = tmpConfigPath();
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, `schema: tempa-spec\n${form}`);
    runMerge(configPath);
    const parsed = YAML.parse(fs.readFileSync(configPath, "utf8"));
    assert.match(parsed.context, /Prefer, in order: codegraph/, `form ${JSON.stringify(form)} should append fresh content`);
  }
});

test("multi-document YAML stream (--- separator) is refused via the doc.errors check, not silently mis-parsed", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const original = "schema: x\ncontext: a\n---\nschema: y\ncontext: b\n";
  fs.writeFileSync(configPath, original);
  const { status, stderr } = runMergeExpectFailure(configPath);
  assert.notEqual(status, 0);
  assert.match(stderr, /not valid YAML/);
  assert.equal(fs.readFileSync(configPath, "utf8"), original, "file must be left untouched on refusal");
});

test("context containing a literal '---' or '...' line as text content round-trips safely (not mistaken for a document boundary)", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  runMergeWith(configPath, "tempa-spec", "MARK", "line one\n---\nline two");
  const parsed = YAML.parse(fs.readFileSync(configPath, "utf8"));
  assert.match(parsed.context, /line one\n---\nline two/);
});

test("contextText with CRLF line endings round-trips exactly, even though it forces a quoted-scalar fallback instead of block-literal", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  runMergeWith(configPath, "tempa-spec", "MARK", "line one\r\nline two");
  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = YAML.parse(raw);
  assert.match(parsed.context, /MARK/);
  assert.match(parsed.context, /line one\r\nline two/);
});

test("contextText with a control character round-trips exactly, even though it forces a quoted-scalar fallback instead of block-literal", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  runMergeWith(configPath, "tempa-spec", "MARK", "text with \x07 bell char");
  const parsed = YAML.parse(fs.readFileSync(configPath, "utf8"));
  assert.match(parsed.context, /text with \x07 bell char/);
});

test("YAML 1.1-ambiguous bareword context values (yes/no/on/off) are treated as plain strings, not booleans", () => {
  for (const word of ["yes", "no", "on", "off"]) {
    const configPath = tmpConfigPath();
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, `schema: tempa-spec\ncontext: ${word}\n`);
    runMerge(configPath);
    const parsed = YAML.parse(fs.readFileSync(configPath, "utf8"));
    assert.match(parsed.context, new RegExp(`^${word}`), `bareword ${word} should be preserved as string content`);
    assert.match(parsed.context, /Prefer, in order: codegraph/);
  }
});

test("context supplied only via a YAML merge key (<<: *anchor) is invisible to the script and treated as absent", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(
    configPath,
    "defaults: &d\n  context: inherited via merge key\nschema: x\n<<: *d\n"
  );
  runMerge(configPath);
  const parsed = YAML.parse(fs.readFileSync(configPath, "utf8"));
  // Documents CURRENT behavior: doc.get() does not resolve merge keys, so a
  // fresh sibling context: key is written containing only the new block.
  assert.match(parsed.context, /Prefer, in order: codegraph/);
});

test("very long contextText (5000 chars, single line) round-trips without corruption or unwanted wrapping", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const longText = "x".repeat(5000);
  runMergeWith(configPath, "tempa-spec", "MARK", longText);
  const parsed = YAML.parse(fs.readFileSync(configPath, "utf8"));
  assert.match(parsed.context, new RegExp("x".repeat(5000)));
});

test("marker containing regex-metacharacters is treated as a literal string, not a regex", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const weirdMarker = "## marker (v2) [x] $1 .* +?";
  runMergeWith(configPath, "tempa-spec", weirdMarker, "some content");
  // second run with the exact same marker must be idempotent (no duplication)
  runMergeWith(configPath, "tempa-spec", weirdMarker, "some content");
  const raw = fs.readFileSync(configPath, "utf8");
  const occurrences = raw.split("some content").length - 1;
  assert.equal(occurrences, 1, "regex-metacharacter marker must still dedupe correctly on re-run");
});

// ---------------------------------------------------------------------------
// Filesystem / OS / process edge cases
// ---------------------------------------------------------------------------

test("FIXED: configPath pointing to a directory produces a clean single-line error, not a raw stack trace", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "merge-config-test-"));
  const { status, stderr } = runMergeExpectFailure(dir);
  assert.notEqual(status, 0, "should exit non-zero");
  assert.match(stderr, /^Error: could not read\/write/m, "should use the script's clean-error style");
  assert.match(stderr, /EISDIR/);
  assert.doesNotMatch(stderr, /at Object\./, "should not leak a raw Node stack trace");
});

test("FIXED: an unwritable parent directory produces a clean single-line error, not a raw stack trace", { skip: process.getuid === undefined }, () => {
  if (typeof process.getuid === "function" && process.getuid() === 0) {
    return; // root bypasses permission checks; skip rather than false-fail
  }
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "merge-config-test-"));
  const readonlyDir = path.join(rootDir, "readonly");
  fs.mkdirSync(readonlyDir, { mode: 0o555 });
  const configPath = path.join(readonlyDir, "config.yaml");
  try {
    const { status, stderr } = runMergeExpectFailure(configPath);
    assert.notEqual(status, 0, "should exit non-zero");
    assert.match(stderr, /^Error: could not read\/write/m, "should use the script's clean-error style");
    assert.match(stderr, /EACCES/);
    assert.doesNotMatch(stderr, /at Object\./, "should not leak a raw Node stack trace");
  } finally {
    fs.chmodSync(readonlyDir, 0o755);
  }
});

test("FIXED: a symlinked configPath is refused, not followed", { skip: process.platform === "win32" }, () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "merge-config-test-"));
  const realTarget = path.join(rootDir, "real-config.yaml");
  const symlinkPath = path.join(rootDir, "config.yaml");
  const originalTargetContent = "schema: original\ncontext: hi\n";
  fs.writeFileSync(realTarget, originalTargetContent);
  fs.symlinkSync(realTarget, symlinkPath);
  const { status, stderr } = runMergeExpectFailure(symlinkPath);
  assert.notEqual(status, 0, "should exit non-zero rather than follow the symlink");
  assert.match(stderr, /is a symlink/);
  assert.equal(fs.readFileSync(realTarget, "utf8"), originalTargetContent, "symlink target must be left untouched");
  assert.equal(fs.lstatSync(symlinkPath).isSymbolicLink(), true, "the symlink itself must be left in place, not replaced");
});

test("FIXED: a dangling symlink at configPath is also refused, not silently written through", { skip: process.platform === "win32" }, () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "merge-config-test-"));
  const symlinkPath = path.join(rootDir, "config.yaml");
  fs.symlinkSync(path.join(rootDir, "does-not-exist.yaml"), symlinkPath);
  const { status, stderr } = runMergeExpectFailure(symlinkPath);
  assert.notEqual(status, 0, "should exit non-zero rather than create the symlink's target");
  assert.match(stderr, /is a symlink/);
  assert.equal(fs.existsSync(path.join(rootDir, "does-not-exist.yaml")), false, "must not create the dangling target");
});

test("concurrent runs against the same file do not corrupt bytes, but one run's result silently wins over the other's (no locking)", () => {
  const configPath = tmpConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const { spawnSync } = require("node:child_process");
  const procA = require("node:child_process").spawn("node", [SCRIPT, configPath, "schema-A", "MARK-A", "text-A"], { stdio: "ignore" });
  const procB = require("node:child_process").spawn("node", [SCRIPT, configPath, "schema-B", "MARK-B", "text-B"], { stdio: "ignore" });
  const wait = (proc) => new Promise((resolve) => proc.on("exit", resolve));
  return Promise.all([wait(procA), wait(procB)]).then(() => {
    const raw = fs.readFileSync(configPath, "utf8");
    assert.doesNotThrow(() => YAML.parse(raw), "output must still be valid YAML even under a race, no torn writes");
    const parsed = YAML.parse(raw);
    assert.ok(parsed.schema === "schema-A" || parsed.schema === "schema-B", "one of the two concurrent runs' schema value must have won outright");
  });
});

test("a relative configPath resolves against the current working directory as expected", () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "merge-config-test-"));
  const originalCwd = process.cwd();
  try {
    process.chdir(rootDir);
    execFileSync("node", [SCRIPT, "openspec/config.yaml", "tempa-spec", MARKER, TEXT], { stdio: "pipe" });
    const parsed = YAML.parse(fs.readFileSync(path.join(rootDir, "openspec/config.yaml"), "utf8"));
    assert.equal(parsed.schema, "tempa-spec");
  } finally {
    process.chdir(originalCwd);
  }
});
