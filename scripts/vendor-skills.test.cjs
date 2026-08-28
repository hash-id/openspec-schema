"use strict";

// Unit coverage for the pure helpers in vendor-skills.cjs. The git-backed
// run() (clone + diff + --apply) is exercised by hand — it needs network — the
// same split scripts/merge-config.test.cjs uses for its subprocess cases.
//
//   cd scripts && npm test

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  sha256,
  readLock,
  writeLock,
  walkFiles,
  diffTrees,
  verifyIntegrity,
  renderVendorMd,
} = require("./vendor-skills.cjs");

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "vendor-skills-test-"));
}

function write(dir, rel, content) {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

test("sha256 is deterministic and content-sensitive", () => {
  assert.equal(sha256(Buffer.from("abc")), sha256(Buffer.from("abc")));
  assert.notEqual(sha256(Buffer.from("abc")), sha256(Buffer.from("abd")));
});

test("writeLock / readLock round-trip", () => {
  const dir = tmpDir();
  const p = path.join(dir, "vendor-lock.json");
  const lock = { version: 1, skills: { foo: { source: "a/b", files: { "SKILL.md": "hash" } } } };
  writeLock(p, lock);
  assert.deepEqual(readLock(p), lock);
  assert.ok(fs.readFileSync(p, "utf8").endsWith("\n"));
});

test("readLock rejects a lock with no skills map", () => {
  const dir = tmpDir();
  const p = path.join(dir, "vendor-lock.json");
  fs.writeFileSync(p, JSON.stringify({ version: 1 }));
  assert.throws(() => readLock(p), /malformed/);
});

test("walkFiles: sorted relative paths, recursion, LICENSE/VENDOR.md excluded", () => {
  const dir = tmpDir();
  write(dir, "SKILL.md", "s");
  write(dir, "LICENSE", "l");
  write(dir, "VENDOR.md", "v");
  write(dir, "references/details.md", "d");
  write(dir, "agents/openai.yaml", "y");
  assert.deepEqual(walkFiles(dir), [
    "SKILL.md",
    path.join("agents", "openai.yaml"),
    path.join("references", "details.md"),
  ]);
});

test("walkFiles: missing directory returns []", () => {
  assert.deepEqual(walkFiles(path.join(tmpDir(), "nope")), []);
});

test("diffTrees classifies added / removed / changed / same", () => {
  const vendored = tmpDir();
  const upstream = tmpDir();
  write(vendored, "SKILL.md", "same");
  write(upstream, "SKILL.md", "same");
  write(vendored, "old.md", "gone");
  write(upstream, "new.md", "fresh");
  write(vendored, "tests.md", "v1");
  write(upstream, "tests.md", "v2");

  const d = diffTrees(vendored, upstream);
  assert.deepEqual(d.added, ["new.md"]);
  assert.deepEqual(d.removed, ["old.md"]);
  assert.deepEqual(d.changed, ["tests.md"]);
  assert.deepEqual(d.same, ["SKILL.md"]);
});

test("diffTrees ignores LICENSE / VENDOR.md on the vendored side", () => {
  const vendored = tmpDir();
  const upstream = tmpDir();
  write(vendored, "SKILL.md", "x");
  write(vendored, "LICENSE", "mit");
  write(vendored, "VENDOR.md", "note");
  write(upstream, "SKILL.md", "x");

  const d = diffTrees(vendored, upstream);
  assert.deepEqual(d, { added: [], removed: [], changed: [], same: ["SKILL.md"] });
});

test("diffTrees `only` restricts the upstream side to an explicit file list", () => {
  const vendored = tmpDir();
  const upstream = tmpDir();
  write(vendored, "SKILL.md", "x");
  write(upstream, "SKILL.md", "x");
  write(upstream, "README.md", "repo readme, not part of the skill");
  write(upstream, ".github/workflows/ci.yml", "ci");

  assert.deepEqual(diffTrees(vendored, upstream, ["SKILL.md"]), {
    added: [],
    removed: [],
    changed: [],
    same: ["SKILL.md"],
  });
});

test("verifyIntegrity flags modified, missing, and extra files", () => {
  const dir = tmpDir();
  write(dir, "SKILL.md", "current");
  write(dir, "extra.md", "unexpected");
  const lockFiles = {
    "SKILL.md": sha256(Buffer.from("original")),
    "gone.md": sha256(Buffer.from("whatever")),
  };
  const r = verifyIntegrity(dir, lockFiles);
  assert.deepEqual(r.modified, ["SKILL.md"]);
  assert.deepEqual(r.missing, ["gone.md"]);
  assert.deepEqual(r.extra, ["extra.md"]);
});

test("verifyIntegrity clean when hashes match", () => {
  const dir = tmpDir();
  write(dir, "SKILL.md", "body");
  const r = verifyIntegrity(dir, { "SKILL.md": sha256(Buffer.from("body")) });
  assert.deepEqual(r, { modified: [], missing: [], extra: [] });
});

test("renderVendorMd carries source, path, and pinned commit", () => {
  const md = renderVendorMd("tdd", {
    source: "mattpocock/skills",
    sourcePath: "skills/engineering/tdd",
    sourceCommit: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef0",
    license: "MIT",
  });
  assert.match(md, /mattpocock\/skills/);
  assert.match(md, /skills\/engineering\/tdd/);
  assert.match(md, /deadbeefdeadbeefdeadbeefdeadbeefdeadbeef0/);
  assert.match(md, /Do NOT edit files here by hand/);
});
