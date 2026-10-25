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

test("--baseline-commit reports only what the change added", { skip: SKIP_ENGINE }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "opengrep-rules-git-"));
  const git = (...a) =>
    execFileSync("git", ["-C", dir, "-c", "commit.gpgsign=false", ...a], {
      encoding: "utf8",
      env: { ...ENV, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.invalid", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.invalid" },
    });
  execFileSync("git", ["init", "-q", dir], { env: ENV });
  git("checkout", "-q", "-b", "main");
  fs.mkdirSync(path.join(dir, "rules"));
  for (const f of RULE_FILES) fs.copyFileSync(path.join(RULES_DIR, f), path.join(dir, "rules", f));
  fs.writeFileSync(path.join(dir, "legacy.py"), 'def old(cr, n):\n    cr.execute(f"SELECT {n}")\n');
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  fs.writeFileSync(path.join(dir, "feature.py"), 'def new(cr, n):\n    cr.execute(f"DELETE FROM t WHERE n={n}")\n');
  git("add", "-A");
  git("commit", "-q", "-m", "feature");
  const out = execFileSync("opengrep", ["scan", "--config", "rules", "--baseline-commit", "HEAD~1", "--json", "--quiet", "."], {
    cwd: dir,
    encoding: "utf8",
    env: ENV,
  });
  const files = JSON.parse(out).results.map((r) => r.path);
  assert.deepStrictEqual(files, ["feature.py"]);
});
