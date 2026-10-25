"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// The rules ship in the skill folder (skills/hrt-security-pass/opengrep/*.yml); their fixtures stay
// here so they do NOT ship. The two static tests need nothing installed. The two engine tests need
// `opengrep` on PATH and are skipped without it, so a machine without opengrep can still run the other
// tests. Only this test file skips: the apply review itself requires opengrep (README, Security).
const RULES_DIR = path.join(__dirname, "..", "skills", "hrt-security-pass", "opengrep");
const RULE_FILES = fs.readdirSync(RULES_DIR).filter((f) => f.endsWith(".yml"));
const FIXTURES = path.join(__dirname, "fixtures", "opengrep-rules");

const ENV = { ...process.env };
const HAS_OPENGREP = spawnSync("opengrep", ["--version"], { encoding: "utf8" }).status === 0;
const SKIP_ENGINE = HAS_OPENGREP ? false : "opengrep is not installed";

const ruleIds = () =>
  RULE_FILES.flatMap((f) => [...fs.readFileSync(path.join(RULES_DIR, f), "utf8").matchAll(/^\s*- id: (\S+)\s*$/gm)].map((m) => m[1]));
const fixtureText = () =>
  fs
    .readdirSync(FIXTURES)
    .map((f) => fs.readFileSync(path.join(FIXTURES, f), "utf8"))
    .join("\n");

test("every rule has a positive and a negative fixture case", () => {
  const text = fixtureText();
  const ids = ruleIds();
  assert.ok(ids.length > 0, "no rules found");
  for (const id of ids) {
    assert.match(text, new RegExp(`ruleid: ${id}\\b`), `${id}: no ruleid fixture`);
    assert.match(text, new RegExp(`ok: ${id}\\b`), `${id}: no ok fixture`);
  }
});

test("every fixture annotation names an existing rule", () => {
  const ids = new Set(ruleIds());
  for (const m of fixtureText().matchAll(/(?:ruleid|ok): (\S+?)(?:\s|-->|$)/g)) {
    assert.ok(ids.has(m[1]), `fixture names unknown rule ${m[1]}`);
  }
});

test("opengrep test passes on all fixtures", { skip: SKIP_ENGINE }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "opengrep-rules-"));
  for (const f of RULE_FILES) fs.copyFileSync(path.join(RULES_DIR, f), path.join(dir, f));
  for (const f of fs.readdirSync(FIXTURES)) fs.copyFileSync(path.join(FIXTURES, f), path.join(dir, f));
  const out = execFileSync("opengrep", ["test", dir], { encoding: "utf8", env: ENV });
  assert.match(out.replace(/\x1b\[[0-9;]*m/g, ""), /All tests passed/);
});


// A change under review is not committed yet: a tracked file edited and not staged, a new file staged,
// a new file not tracked, next to one commit on the branch. Returns the repo and the list of files the
// review gives to opengrep (the same two git commands as in hrt-apply-code-review step 1).
function dirtyRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "opengrep-rules-git-"));
  const git = (...a) =>
    execFileSync("git", ["-C", dir, "-c", "commit.gpgsign=false", ...a], {
      encoding: "utf8",
      env: { ...ENV, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.invalid", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.invalid" },
    });
  const put = (name, text) => fs.writeFileSync(path.join(dir, name), text);
  execFileSync("git", ["init", "-q", dir], { env: ENV });
  git("checkout", "-q", "-b", "main");
  fs.mkdirSync(path.join(dir, "rules"));
  for (const f of RULE_FILES) fs.copyFileSync(path.join(RULES_DIR, f), path.join(dir, "rules", f));
  put("legacy.py", 'def old(cr, n):\n    cr.execute(f"SELECT {n}")\n');
  put("edit_me.py", "x = 1\n");
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  git("checkout", "-q", "-b", "feature");
  put("committed.py", "import pickle\ndef a(b):\n    return pickle.loads(b)\n");
  git("add", "committed.py");
  git("commit", "-q", "-m", "committed");
  put("edit_me.py", 'import os\ndef f(u):\n    os.system("ls " + u)\n'); // edited, not staged
  put("staged_new.py", "import tempfile\nn = tempfile.mktemp()\n");
  git("add", "staged_new.py"); // new, staged
  put("untracked_new.py", 'import subprocess\ndef g(u):\n    subprocess.run(f"ls {u}", shell=True)\n'); // new, untracked
  const names = (out) => out.split("\n").filter(Boolean);
  const files = [
    ...new Set([...names(git("diff", "--name-only", "--diff-filter=d", "main")), ...names(git("ls-files", "--others", "--exclude-standard"))]),
  ].sort();
  const scan = (...extra) =>
    JSON.parse(
      execFileSync("opengrep", ["scan", "--config", "rules", "--json", "--quiet", ...extra], { cwd: dir, encoding: "utf8", env: ENV }),
    ).results.map((r) => r.path).sort();
  return { files, scan };
}

test("scanning the changed files finds committed, unstaged, staged and untracked work, and skips untouched files", { skip: SKIP_ENGINE }, () => {
  const { files, scan } = dirtyRepo();
  assert.deepStrictEqual(files, ["committed.py", "edit_me.py", "staged_new.py", "untracked_new.py"]);
  assert.deepStrictEqual(scan(...files), ["committed.py", "edit_me.py", "staged_new.py", "untracked_new.py"]);
});

// KNOWN GAP in opengrep (checked on 1.11.1 and 1.32.0): with --baseline-commit it reports nothing for an
// edit that is not staged or a file that is not tracked, and it exits 0. This is why the review lists
// the files itself. If a new opengrep fixes it, this test fails: then reconsider step 1.
test("KNOWN GAP: --baseline-commit misses unstaged edits and untracked files", { skip: SKIP_ENGINE }, () => {
  const { scan } = dirtyRepo();
  assert.deepStrictEqual(scan("--baseline-commit", "main", "."), ["committed.py", "staged_new.py"]);
});
