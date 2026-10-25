"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// floor-guard.cjs lives in its skill folder (it ships downstream via `npx skills add`);
// this test stays in scripts/ so it does NOT ship. Keep the two in sync.
const SCRIPT = path.join(__dirname, "..", "skills", "hrt-apply-code-review", "floor-guard.cjs");

const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@example.invalid",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@example.invalid",
  GIT_CONFIG_NOSYSTEM: "1",
  HOME: os.tmpdir(),
};

function git(dir, ...args) {
  return execFileSync("git", ["-C", dir, "-c", "commit.gpgsign=false", ...args], { encoding: "utf8", env: GIT_ENV });
}

function write(dir, files) {
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
}

// A repo whose first commit (on `main`) holds `base`; nothing else is staged.
function repo(base) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "floor-guard-"));
  execFileSync("git", ["init", "-q", dir], { env: GIT_ENV });
  git(dir, "checkout", "-q", "-b", "main");
  write(dir, { "README.md": "x\n", ...base });
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "base");
  return dir;
}

function run(dir, ...flags) {
  try {
    const out = execFileSync("node", [SCRIPT, `--repo=${dir}`, ...flags], { encoding: "utf8", env: GIT_ENV });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

const PY_TEST = `from odoo.tests import TransactionCase


class TestThing(TransactionCase):
    def test_a(self):
        self.assertEqual(1, 1)
        self.assertTrue(True)
`;
const TS_SPEC = `import { test } from '@japa/runner'

test('works', ({ assert }) => {
  assert.equal(1, 1)
  expect(2).toBe(2)
})
`;

test("clean change: exit 0, base note printed", () => {
  const d = repo({ "app/a.py": "x = 1\n" });
  write(d, { "app/a.py": "x = 2\n" });
  const r = run(d);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /OK - no floor-guard flags/);
  assert.match(r.out, /Base: HEAD \(no --base given/);
});

test("suppression added in Python production code is flagged with its line", () => {
  const d = repo({ "app/a.py": "import os\n" });
  write(d, { "app/a.py": "import os\nimport sys  # noqa: F401\n" });
  const r = run(d);
  assert.strictEqual(r.code, 1, r.out);
  assert.match(r.out, /FLAG suppression app\/a\.py:2 {2}import sys {2}# noqa: F401/);
});

test("each Python and JS/TS suppression form is flagged", () => {
  const d = repo({});
  write(d, {
    "app/p.py": "a = 1  # type: ignore\nb = 2  # pylint: disable=x\nc = 3  # pragma: no cover\n",
    "app/j.ts": "// @ts-ignore\n// @ts-nocheck\n// @ts-expect-error\n/* eslint-disable no-x */\n// biome-ignore x\n/* istanbul ignore next */\n",
  });
  const r = run(d);
  assert.strictEqual(r.code, 1);
  assert.strictEqual((r.out.match(/FLAG suppression /g) || []).length, 9, r.out);
});

test("security suppression is its own rule, never printed, not double-flagged", () => {
  const d = repo({});
  write(d, { "app/a.py": 'API_KEY = "sk_live_abc123"  # nosec gitleaks:allow\n', "app/b.ts": "run(x) // nosemgrep\n" });
  const r = run(d);
  assert.strictEqual(r.code, 1);
  assert.strictEqual((r.out.match(/FLAG security-suppression /g) || []).length, 2, r.out);
  assert.doesNotMatch(r.out, /FLAG suppression /);
  assert.doesNotMatch(r.out, /sk_live_abc123/);
  assert.match(r.out, /\(line text not shown\)/);
});

test("suppression text in a non-code file is ignored", () => {
  const d = repo({});
  write(d, { "docs/notes.md": "use # noqa sparingly\n", "setup.cfg": "# noqa\n" });
  assert.strictEqual(run(d).code, 0);
});

test("skip added to an existing Python test file is flagged (unittest, pytest, skipTest)", () => {
  const d = repo({ "addons/m/tests/test_x.py": PY_TEST });
  write(d, {
    "addons/m/tests/test_x.py": PY_TEST.replace(
      "    def test_a(self):\n",
      "    @unittest.skip('later')\n    def test_a(self):\n        self.skipTest('flaky')\n        pytest.skip('x')\n"
    ),
  });
  const r = run(d);
  assert.strictEqual(r.code, 1);
  assert.strictEqual((r.out.match(/FLAG skip-added /g) || []).length, 3, r.out);
});

test("Odoo: added '-standard' tag is a skip; '-at_install', 'post_install' is not", () => {
  const d = repo({ "addons/m/tests/test_x.py": PY_TEST, "addons/m/tests/test_y.py": PY_TEST });
  write(d, {
    "addons/m/tests/test_x.py": PY_TEST.replace("class TestThing", "@tagged('-standard', 'manual')\nclass TestThing"),
    "addons/m/tests/test_y.py": PY_TEST.replace("class TestThing", "@tagged('-at_install', 'post_install')\nclass TestThing"),
  });
  const r = run(d);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /FLAG skip-added addons\/m\/tests\/test_x\.py:4/);
  assert.doesNotMatch(r.out, /test_y\.py/);
});

test("skip in a test file created by the change is not flagged", () => {
  const d = repo({});
  write(d, { "addons/m/tests/test_new.py": PY_TEST.replace("        self.assertEqual", "        if not x:\n            self.skipTest('no field')\n        self.assertEqual") });
  assert.strictEqual(run(d).code, 0);
});

test("JS: .skip( and xit( in an existing spec are flagged; .skip( in production code is not", () => {
  const d = repo({ "tests/unit/a.spec.ts": TS_SPEC, "app/repo.ts": "export const f = () => 1\n" });
  write(d, {
    "tests/unit/a.spec.ts": TS_SPEC + "test('later', () => {}).skip(true)\nxit('x', () => {})\n",
    "app/repo.ts": "export const f = () => cursor.skip(10)\n",
  });
  const r = run(d);
  assert.strictEqual(r.code, 1);
  assert.strictEqual((r.out.match(/FLAG skip-added tests\/unit\/a\.spec\.ts/g) || []).length, 2, r.out);
  assert.doesNotMatch(r.out, /app\/repo\.ts/);
});

test("deleted test file is flagged; git mv and a plain mv of identical content are not", () => {
  const d = repo({ "tests/a.spec.ts": TS_SPEC, "tests/b.spec.ts": TS_SPEC + "// b\n", "tests/c.spec.ts": TS_SPEC + "// c\n" });
  fs.rmSync(path.join(d, "tests/a.spec.ts"));
  fs.mkdirSync(path.join(d, "tests/unit"));
  git(d, "mv", "tests/b.spec.ts", "tests/unit/b.spec.ts");
  fs.mkdirSync(path.join(d, "tests/moved"));
  fs.renameSync(path.join(d, "tests/c.spec.ts"), path.join(d, "tests/moved/c.spec.ts"));
  const r = run(d);
  assert.match(r.out, /FLAG test-file-deleted tests\/a\.spec\.ts/);
  assert.doesNotMatch(r.out, /b\.spec\.ts/);
  assert.doesNotMatch(r.out, /test-file-deleted tests\/c\.spec\.ts/);
});

test("assertions moved between test files: no flag", () => {
  const d = repo({ "tests/test_a.py": PY_TEST, "tests/test_b.py": "def test_b():\n    pass\n" });
  write(d, {
    "tests/test_a.py": PY_TEST.replace("        self.assertTrue(True)\n", ""),
    "tests/test_b.py": "def test_b(self):\n    self.assertTrue(True)\n",
  });
  assert.strictEqual(run(d).code, 0);
});

test("edited expected value keeps the count: no flag", () => {
  const d = repo({ "tests/test_a.py": PY_TEST });
  write(d, { "tests/test_a.py": PY_TEST.replace("assertEqual(1, 1)", "assertEqual(1, 2 - 1)") });
  assert.strictEqual(run(d).code, 0);
});

test("change-wide assertion drop is one flag with counts (Python and JS)", () => {
  const d = repo({ "tests/test_a.py": PY_TEST, "tests/unit/a.spec.ts": TS_SPEC });
  write(d, {
    "tests/test_a.py": PY_TEST.replace("        self.assertTrue(True)\n", "        assert x\n").replace("        self.assertEqual(1, 1)\n", ""),
    "tests/unit/a.spec.ts": TS_SPEC.replace("  expect(2).toBe(2)\n", ""),
  });
  const r = run(d);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /FLAG assertions-down \(change-wide\) {2}3 assertion\(s\) removed, 1 added across all test files \(net -2\)/, r.out);
});

test("deleting a test file also lowers the change-wide count", () => {
  const d = repo({ "tests/test_a.py": PY_TEST });
  fs.rmSync(path.join(d, "tests/test_a.py"));
  const r = run(d);
  assert.match(r.out, /FLAG test-file-deleted tests\/test_a\.py/);
  assert.match(r.out, /FLAG assertions-down/);
});

test("stubs and swallowed exceptions in production code are flagged", () => {
  const d = repo({});
  write(d, {
    "app/a.py": "def f():\n    raise NotImplementedError\n\ntry:\n    g()\nexcept ValueError:\n    pass\n\ntry:\n    h()\nexcept Exception: pass\n",
    "app/b.ts": "export function f() {\n  throw new Error('Not implemented')\n}\ntry { g() } catch {}\ntry { h() } catch (e) {}\n",
  });
  const r = run(d);
  assert.strictEqual(r.code, 1);
  assert.strictEqual((r.out.match(/FLAG stub app\/a\.py/g) || []).length, 3, r.out);
  assert.match(r.out, /FLAG stub app\/a\.py:6 {2}except ValueError: pass/);
  assert.strictEqual((r.out.match(/FLAG stub app\/b\.ts/g) || []).length, 3, r.out);
});

test("stubs in test code are not flagged; except with a body is not a stub; TODO is not checked", () => {
  const d = repo({});
  write(d, {
    "tests/test_a.py": "def helper():\n    raise NotImplementedError\n",
    "app/a.py": "try:\n    g()\nexcept ValueError:\n    log()\n# TODO later\n",
  });
  assert.strictEqual(run(d).code, 0);
});

test("--base checks committed work on the branch; without it, committed work is not seen", () => {
  const d = repo({ "app/a.py": "x = 1\n" });
  git(d, "checkout", "-q", "-b", "feature");
  write(d, { "app/a.py": "x = 1  # noqa\n" });
  git(d, "commit", "-q", "-am", "work");
  assert.strictEqual(run(d).code, 0);
  const r = run(d, "--base=main");
  assert.strictEqual(r.code, 1, r.out);
  assert.match(r.out, /Base: merge base of main and HEAD/);
  assert.match(r.out, /FLAG suppression app\/a\.py:1/);
});

test("untracked binary and oversized files are skipped without error", () => {
  const d = repo({});
  fs.writeFileSync(path.join(d, "blob.py"), Buffer.from([0, 1, 2, 35, 32, 110, 111, 113, 97]));
  assert.strictEqual(run(d).code, 0);
});

test("could not run: bad argument, not a git repo, unknown base, no commit - exit 2", () => {
  assert.strictEqual(run(repo({}), "--nope").code, 2);
  const plain = fs.mkdtempSync(path.join(os.tmpdir(), "floor-guard-plain-"));
  const r = run(plain);
  assert.strictEqual(r.code, 2);
  assert.match(r.out, /could not run - .* not inside a git work tree/);
  assert.strictEqual(run(repo({}), "--base=does-not-exist").code, 2);
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), "floor-guard-empty-"));
  execFileSync("git", ["init", "-q", empty], { env: GIT_ENV });
  assert.match(run(empty).out, /no commit to diff against/);
});
