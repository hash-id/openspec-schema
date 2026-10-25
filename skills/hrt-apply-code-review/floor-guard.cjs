// Diff-scoped floor guard for tempa-spec's apply review (hrt-apply-code-review step 1).
//
// Flags the moves an implementing agent makes to turn a red check green
// without fixing the code: an added suppression comment, an added skip in a
// test file that existed before the change, a deleted test file, a drop in the
// change-wide assertion count, and an added stub or swallowed exception in
// production code. It only flags; the reviewer classifies each flag (see
// SKILL.md step 5). It is NOT a linter: exit 1 is not a lint failure.
//
// Adapted from the floor guard in addyosmani/agent-skills
// (skills/constraint-driven-development/references/floor-guard.md),
// Copyright (c) 2025 Addy Osmani, MIT licence. The diff contract and exit codes
// follow it; the patterns are rewritten for Python (including unittest and
// Odoo) and JS/TS, and assertions are counted across the whole change rather
// than per removed line.
//
// Usage: node floor-guard.cjs [--base=<ref>] [--repo=<dir>]
//   --base=<ref>  diff against the merge base of <ref> and HEAD - the same base
//                 branch the security scan uses. Without it, diff against HEAD
//                 (and say so), which misses changes already committed.
//   --repo=<dir>  repository to check (default: the current directory)
//
// The change = the working tree (staged and unstaged) against the base, with
// rename detection, plus untracked files that are not ignored. Only code files
// (.py, .js, .jsx, .mjs, .cjs, .ts, .tsx, .mts, .cts) are checked.
//
// Output: `FLAG <rule> path:line  text`, one per line. The line text of a
// security suppression is never printed (it may sit next to a secret).
//
// Exit code: 0 no flags, 1 at least one flag, 2 the guard could not run.
// Exit 2 never means clean.
"use strict";

const { execFileSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function usage() {
  console.error("Usage: node floor-guard.cjs [--base=<ref>] [--repo=<dir>]");
  process.exit(2);
}

function cannotRun(msg) {
  console.error(`floor-guard: could not run - ${msg}`);
  process.exit(2);
}

let base = null;
let repo = process.cwd();
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--base=") && a.length > "--base=".length) base = a.slice("--base=".length);
  else if (a.startsWith("--repo=") && a.length > "--repo=".length) repo = a.slice("--repo=".length);
  else usage();
}

// Run git in the repo. Returns stdout, or null on failure. Exit 1 from
// `git diff --no-index` is the normal "files differ" result, so it may be allowed.
function git(args, okStatus = [0]) {
  try {
    return execFileSync("git", ["-C", repo, "-c", "core.quotePath=false", ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 1 << 28,
    });
  } catch (e) {
    if (okStatus.includes(e.status) && typeof e.stdout === "string") return e.stdout;
    return null;
  }
}

if (!fs.existsSync(repo)) cannotRun(`'${repo}' does not exist`);
const top = (git(["rev-parse", "--show-toplevel"]) || "").trim();
if (!top) cannotRun(`'${repo}' is not inside a git work tree`);
repo = top;
if (git(["rev-parse", "--verify", "--quiet", "HEAD"]) === null) cannotRun("the repository has no commit to diff against");

let baseRef = "HEAD";
let baseNote = "Base: HEAD (no --base given; changes already committed on this branch are not checked)";
if (base) {
  const mb = (git(["merge-base", base, "HEAD"]) || "").trim();
  if (!mb) cannotRun(`no merge base between '${base}' and HEAD`);
  baseRef = mb;
  baseNote = `Base: merge base of ${base} and HEAD (${mb.slice(0, 12)})`;
}

// --- file classes -----------------------------------------------------------

const CODE = /\.(py|js|jsx|mjs|cjs|ts|tsx|mts|cts)$/;
const isCode = (f) => CODE.test(f);
const isPy = (f) => f.endsWith(".py");
const isTest = (f) =>
  /(^|\/)tests?\//.test(f) ||
  /(^|\/)__tests__\//.test(f) ||
  /(^|\/)test_[^/]*\.py$/.test(f) ||
  /_test\.py$/.test(f) ||
  /\.(test|spec)\.[cm]?[jt]sx?$/.test(f);

// --- patterns ---------------------------------------------------------------

const SECURITY_SUPPRESSION = /#\s*nosec\b|nosemgrep|gitleaks:allow/;
const SUPPRESSION_PY = /#\s*noqa\b|#\s*type:\s*ignore\b|#\s*pylint:\s*disable|#\s*pragma:\s*no\s*cover/;
const SUPPRESSION_JS = /@ts-ignore|@ts-nocheck|@ts-expect-error|eslint-disable|biome-ignore|istanbul\s+ignore/;

const SKIP_PY = /@unittest\.skip|\bself\.skipTest\(|\bpytest\.skip\(|@pytest\.mark\.skip/;
// Odoo: only an added '-standard' tag removes a test from the default run.
// '-at_install' / 'post_install' only change when it runs.
const SKIP_ODOO = /@tagged\(.*['"]-standard['"]/;
const SKIP_JS = /\.(skip|todo)\(|\bxit\(|\bxdescribe\(|\bxtest\(/;

const STUB_PY = /\braise\s+NotImplementedError\b/;
const EXCEPT_PASS_PY = /^\s*except\b[^:]*:\s*pass\s*(#.*)?$/;
const EXCEPT_OPEN_PY = /^\s*except\b[^:]*:\s*(#.*)?$/;
const PASS_PY = /^\s*pass\s*(#.*)?$/;
const STUB_JS = /throw\s+new\s+\w*Error\(\s*['"`][^'"`]*not\s+implemented/i;
const EMPTY_CATCH_JS = /catch\s*(\([^)]*\))?\s*\{\s*\}/;

function countAssertions(file, text) {
  if (isPy(file)) {
    return (/^\s*assert\b/.test(text) ? 1 : 0) + (text.match(/\bself\.assert\w*\(/g) || []).length;
  }
  return (text.match(/\bexpect\(|\bassert\.\w+\(|\bassert\(/g) || []).length;
}

// --- collect the change -----------------------------------------------------

const nameStatus = git(["diff", "-M", "--name-status", "-z", "--no-color", baseRef, "--"]);
if (nameStatus === null) cannotRun(`could not diff against ${baseRef}`);
const deleted = [];
const added = new Set(); // files new in this change (did not exist at the base)
{
  const parts = nameStatus.split("\0").filter((p) => p !== "");
  for (let i = 0; i < parts.length; ) {
    const status = parts[i++];
    if (status.startsWith("R") || status.startsWith("C")) {
      i += 1; // old path
      const newPath = parts[i++];
      if (status.startsWith("C")) added.add(newPath);
    } else {
      const p = parts[i++];
      if (status === "D") deleted.push(p);
      if (status === "A") added.add(p);
    }
  }
}

const untrackedOut = git(["ls-files", "--others", "--exclude-standard", "-z"]);
if (untrackedOut === null) cannotRun("could not list untracked files");
const untracked = untrackedOut.split("\0").filter((p) => p !== "");
for (const f of untracked) added.add(f);

const diffText = git(["diff", "-M", "--unified=0", "--no-color", "--no-ext-diff", baseRef, "--"]);
if (diffText === null) cannotRun(`could not diff against ${baseRef}`);

// Each entry: { file, line, text } for added lines; { file, text } for removed.
const addedLines = [];
const removedLines = [];
{
  let oldFile = "";
  let file = "";
  let inHeader = false;
  let newLine = 0;
  for (const raw of diffText.split("\n")) {
    const l = raw.replace(/\r$/, "");
    if (l.startsWith("diff --git ")) {
      inHeader = true;
      continue;
    }
    if (l.startsWith("@@")) {
      inHeader = false;
      const m = /\+(\d+)/.exec(l.split("@@")[1] || "");
      newLine = m ? Number(m[1]) : 0;
      continue;
    }
    if (inHeader) {
      if (l.startsWith("--- ")) oldFile = l.slice(4).replace(/^a\//, "");
      else if (l.startsWith("+++ ")) {
        const nf = l.slice(4).replace(/^b\//, "");
        file = nf === "/dev/null" ? oldFile : nf;
      }
      continue;
    }
    if (l.startsWith("+")) addedLines.push({ file, line: newLine++, text: l.slice(1) });
    else if (l.startsWith("-")) removedLines.push({ file, text: l.slice(1) });
  }
}

// Untracked code files count as wholly added.
const untrackedHashes = new Map(); // content hash -> path, to spot a plain `mv`
for (const f of untracked) {
  if (!isCode(f)) continue;
  let buf;
  try {
    const st = fs.statSync(path.join(repo, f));
    if (!st.isFile() || st.size > 2 * 1024 * 1024) continue;
    buf = fs.readFileSync(path.join(repo, f));
  } catch {
    continue;
  }
  if (buf.includes(0)) continue; // binary
  untrackedHashes.set(crypto.createHash("sha1").update(buf).digest("hex"), f);
  buf.toString("utf8").split("\n").forEach((t, idx) => addedLines.push({ file: f, line: idx + 1, text: t.replace(/\r$/, "") }));
}

// --- checks -----------------------------------------------------------------

const flags = [];
function flag(rule, file, line, text) {
  flags.push({ rule, file, line, text });
}

let prev = null;
for (const a of addedLines) {
  const { file, line, text } = a;
  if (!isCode(file)) {
    prev = a;
    continue;
  }
  const test = isTest(file);

  if (SECURITY_SUPPRESSION.test(text)) flag("security-suppression", file, line, null);
  else if ((isPy(file) ? SUPPRESSION_PY : SUPPRESSION_JS).test(text)) flag("suppression", file, line, text);

  if (test && !added.has(file)) {
    const skip = isPy(file) ? SKIP_PY.test(text) || SKIP_ODOO.test(text) : SKIP_JS.test(text);
    if (skip) flag("skip-added", file, line, text);
  }

  if (!test) {
    if (isPy(file)) {
      if (STUB_PY.test(text) || EXCEPT_PASS_PY.test(text)) flag("stub", file, line, text);
      else if (PASS_PY.test(text) && prev && prev.file === file && prev.line === line - 1 && EXCEPT_OPEN_PY.test(prev.text)) {
        flag("stub", file, prev.line, `${prev.text.trim()} pass`);
      }
    } else if (STUB_JS.test(text) || EMPTY_CATCH_JS.test(text)) {
      flag("stub", file, line, text);
    }
  }
  prev = a;
}

// A deleted test file whose exact content is now an untracked file was moved
// with a plain `mv`, not deleted.
for (const f of deleted) {
  if (!isCode(f) || !isTest(f)) continue;
  const blob = git(["show", `${baseRef}:${f}`]);
  if (blob !== null) {
    const h = crypto.createHash("sha1").update(Buffer.from(blob, "utf8")).digest("hex");
    if (untrackedHashes.has(h)) continue;
  }
  flag("test-file-deleted", f, 0, "file deleted");
}

let assertRemoved = 0;
let assertAdded = 0;
for (const r of removedLines) if (isCode(r.file) && isTest(r.file)) assertRemoved += countAssertions(r.file, r.text);
for (const a of addedLines) if (isCode(a.file) && isTest(a.file)) assertAdded += countAssertions(a.file, a.text);
if (assertAdded < assertRemoved) {
  flag(
    "assertions-down",
    "(change-wide)",
    0,
    `${assertRemoved} assertion(s) removed, ${assertAdded} added across all test files (net ${assertAdded - assertRemoved})`
  );
}

// --- report -----------------------------------------------------------------

console.log(baseNote);
if (flags.length === 0) {
  console.log("OK - no floor-guard flags");
  process.exit(0);
}
for (const f of flags) {
  const loc = f.line ? `${f.file}:${f.line}` : f.file;
  const text = f.text === null ? "(line text not shown)" : f.text.trim().slice(0, 120);
  console.log(`FLAG ${f.rule} ${loc}  ${text}`);
}
console.log(`\n${flags.length} flag(s). The reviewer classifies each one (hrt-apply-code-review step 5); this is not a lint result.`);
process.exit(1);
