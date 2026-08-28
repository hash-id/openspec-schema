#!/usr/bin/env node
"use strict";

// Keeps skills/vendor/<name>/ in sync with its upstream sources.
//
//   node scripts/vendor-skills.cjs            # same as --check
//   node scripts/vendor-skills.cjs --check    # report drift, exit 1 if any
//   node scripts/vendor-skills.cjs --apply    # pull upstream, rewrite vendor-lock.json
//
// The vendored copies are the source of truth the installer ships downstream
// (one `npx skills add <repo>/skills` call picks them up alongside the hrt-*
// skills). This script is the only sanctioned way to change them: never hand-edit
// a file under skills/vendor/.
//
// Zero dependencies, plain Node. Needs `git` and network access for --check /
// --apply (the pure helpers below are covered by scripts/vendor-skills.test.cjs).

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const VENDOR_DIR = path.join(REPO_ROOT, "skills", "vendor");
const LOCK_PATH = path.join(VENDOR_DIR, "vendor-lock.json");

// Files this script manages itself, never copied from or compared against upstream.
const LOCAL_ONLY = new Set(["LICENSE", "VENDOR.md"]);

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested)
// ---------------------------------------------------------------------------

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function readLock(lockPath) {
  const raw = fs.readFileSync(lockPath, "utf8");
  const lock = JSON.parse(raw);
  if (!lock || typeof lock !== "object" || !lock.skills) {
    throw new Error(`malformed vendor-lock.json at ${lockPath}`);
  }
  return lock;
}

function writeLock(lockPath, lock) {
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
}

// Relative paths of every file under dir, sorted, minus the LOCAL_ONLY set.
function walkFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === ".git") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkFiles(full, base));
    } else if (ent.isFile()) {
      const rel = path.relative(base, full);
      if (!LOCAL_ONLY.has(rel)) out.push(rel);
    }
  }
  return out.sort();
}

// Compare a vendored copy against an upstream subtree.
// `only`, when given, restricts the upstream side to that explicit file list
// (used for skills vendored from a repo root, where walking everything would
// sweep in the source repo's own README / CI / packaging files).
// Returns { added, removed, changed, same } — arrays of relative paths.
function diffTrees(vendoredDir, upstreamDir, only) {
  const vFiles = new Set(walkFiles(vendoredDir));
  const allUpstream = walkFiles(upstreamDir);
  const uFiles = new Set(only ? allUpstream.filter((f) => only.includes(f)) : allUpstream);
  const added = [];
  const removed = [];
  const changed = [];
  const same = [];
  for (const f of uFiles) {
    if (!vFiles.has(f)) {
      added.push(f);
      continue;
    }
    const a = fs.readFileSync(path.join(vendoredDir, f));
    const b = fs.readFileSync(path.join(upstreamDir, f));
    (a.equals(b) ? same : changed).push(f);
  }
  for (const f of vFiles) {
    if (!uFiles.has(f)) removed.push(f);
  }
  return {
    added: added.sort(),
    removed: removed.sort(),
    changed: changed.sort(),
    same: same.sort(),
  };
}

// Check the on-disk vendored copy against the hashes recorded in the lock.
// Returns { modified, missing, extra } — files that drifted from what was vendored.
function verifyIntegrity(vendoredDir, lockFiles) {
  const modified = [];
  const missing = [];
  const onDisk = new Set(walkFiles(vendoredDir));
  for (const [rel, hash] of Object.entries(lockFiles)) {
    const full = path.join(vendoredDir, rel);
    if (!fs.existsSync(full)) {
      missing.push(rel);
      continue;
    }
    if (sha256(fs.readFileSync(full)) !== hash) modified.push(rel);
  }
  const extra = [...onDisk].filter((f) => !(f in lockFiles));
  return { modified: modified.sort(), missing: missing.sort(), extra: extra.sort() };
}

function renderVendorMd(name, entry) {
  return (
    `# Vendored skill: ${name}\n\n` +
    `Source: \`${entry.source}\` — path \`${entry.sourcePath}\`\n` +
    `Pinned commit: \`${entry.sourceCommit}\`\n` +
    `License: ${entry.license} — see \`LICENSE\` in this folder.\n\n` +
    `Do NOT edit files here by hand. To pull upstream changes:\n\n` +
    `    node scripts/vendor-skills.cjs --check    # show drift\n` +
    `    node scripts/vendor-skills.cjs --apply    # refresh + update vendor-lock.json\n`
  );
}

// ---------------------------------------------------------------------------
// git-backed operations
// ---------------------------------------------------------------------------

function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function shallowClone(source, ref, destParent) {
  const dest = path.join(destParent, source.replace(/[^\w.-]/g, "-"));
  if (fs.existsSync(dest)) return dest;
  const url = `https://github.com/${source}.git`;
  execFileSync("git", ["clone", "--depth", "1", "--branch", ref, url, dest], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  return dest;
}

function run() {
  const mode = process.argv.includes("--apply") ? "apply" : "check";
  const lock = readLock(LOCK_PATH);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vendor-skills-"));
  let drift = false;

  try {
    // clone each distinct source repo once
    const clones = new Map();
    for (const entry of Object.values(lock.skills)) {
      const key = `${entry.source}@${entry.sourceRef}`;
      if (!clones.has(key)) {
        clones.set(key, shallowClone(entry.source, entry.sourceRef, tmp));
      }
    }

    for (const [name, entry] of Object.entries(lock.skills)) {
      const vendoredDir = path.join(VENDOR_DIR, name);
      const cloneDir = clones.get(`${entry.source}@${entry.sourceRef}`);
      const upstreamHead = git(["rev-parse", "HEAD"], cloneDir);
      const upstreamDir =
        entry.sourcePath === "." ? cloneDir : path.join(cloneDir, entry.sourcePath);

      const integ = verifyIntegrity(vendoredDir, entry.files || {});
      if (integ.modified.length || integ.missing.length) {
        drift = true;
        console.log(`\n${name}: LOCAL EDITS (differs from vendor-lock.json)`);
        integ.modified.forEach((f) => console.log(`  modified  ${f}`));
        integ.missing.forEach((f) => console.log(`  missing   ${f}`));
      }

      const d = diffTrees(vendoredDir, upstreamDir, entry.only);
      const upstreamChanged = d.added.length || d.removed.length || d.changed.length;
      const commitMoved = upstreamHead !== entry.sourceCommit;

      if (!upstreamChanged && !commitMoved) {
        console.log(`${name}: up to date (${entry.sourceCommit.slice(0, 9)})`);
        continue;
      }

      drift = true;
      console.log(
        `\n${name}: upstream ${entry.source} ${commitMoved ? `moved ${entry.sourceCommit.slice(0, 9)} -> ${upstreamHead.slice(0, 9)}` : "(same commit, content differs)"}`
      );
      d.added.forEach((f) => console.log(`  + ${f}`));
      d.removed.forEach((f) => console.log(`  - ${f}`));
      d.changed.forEach((f) => console.log(`  ~ ${f}`));

      if (mode === "apply") {
        // wipe managed files, re-copy from upstream, keep LICENSE + regen VENDOR.md
        for (const f of walkFiles(vendoredDir)) fs.rmSync(path.join(vendoredDir, f));
        const files = {};
        const upstreamFiles = entry.only
          ? walkFiles(upstreamDir).filter((f) => entry.only.includes(f))
          : walkFiles(upstreamDir);
        for (const rel of upstreamFiles) {
          const buf = fs.readFileSync(path.join(upstreamDir, rel));
          const target = path.join(vendoredDir, rel);
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.writeFileSync(target, buf);
          files[rel] = sha256(buf);
        }
        entry.sourceCommit = upstreamHead;
        entry.files = files;
        fs.writeFileSync(path.join(vendoredDir, "VENDOR.md"), renderVendorMd(name, entry));
        console.log(`  -> refreshed`);
      }
    }

    if (mode === "apply") {
      writeLock(LOCK_PATH, lock);
      console.log(`\nvendor-lock.json updated. Review the diff, then commit.`);
      return 0;
    }
    if (drift) {
      console.log(`\nDrift found. Run: node scripts/vendor-skills.cjs --apply`);
      return 1;
    }
    console.log(`\nAll vendored skills match upstream.`);
    return 0;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

module.exports = {
  sha256,
  readLock,
  writeLock,
  walkFiles,
  diffTrees,
  verifyIntegrity,
  renderVendorMd,
  LOCK_PATH,
  VENDOR_DIR,
};

if (require.main === module) {
  try {
    process.exit(run());
  } catch (err) {
    console.error(`vendor-skills: ${err.message}`);
    process.exit(2);
  }
}
