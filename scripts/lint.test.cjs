"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// lint.cjs lives in its skill folder (it ships downstream via `npx skills add`);
// this test stays in scripts/ so it does NOT ship. Keep the two in sync.
const SCRIPT = path.join(__dirname, "..", "skills", "hrt-artifact-lint", "lint.cjs");

function run(changeDir, specsDir, ...flags) {
  const args = [SCRIPT, changeDir];
  if (specsDir) args.push(specsDir);
  args.push(...flags);
  try {
    const out = execFileSync("node", args, { encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

// Build a change dir on disk from a { "relative/path": "contents" } map.
function mk(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lint-artifacts-"));
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
  return dir;
}

const GOOD_PROPOSAL = `## Why
Problem statement.

## What Changes
- Add data export.

## Capabilities

### New Capabilities
- \`data-export\`: export user data

### Modified Capabilities

## External Dependencies
none

## Impact
Touches the export module.
`;

const GOOD_SPEC = `## ADDED Requirements

### Requirement: User can export data
The system SHALL allow users to export their data in CSV format.

#### Scenario: Successful export
- **WHEN** user clicks Export
- **THEN** a CSV file downloads
`;

const GOOD_DESIGN = `## Context
Background.

## Goals / Non-Goals
**Goals:** ship export.
**Non-Goals:** no PDF.

## Decisions
Use streaming. Alternative considered: buffer in memory.

## Shape / Seams
- \`exportCsv(userId): Stream\` — where apply's tests attach
  Covers: Successful export

## Risks / Trade-offs
[Large dataset] → stream in chunks

## Migration Plan
N/A - additive.

## Open Questions
None.
`;

const GOOD_TASKS = `## 1. Export CSV for a single table

Covers: Successful export

- [ ] 1.1 Create export module
- [ ] 1.2 Wire export command

## 2. Export with filters

Covers: none

- [ ] 2.1 Parse filters
- [ ] 2.2 Apply before formatting
`;

function goodChange(overrides = {}) {
  return mk({
    "proposal.md": GOOD_PROPOSAL,
    "specs/data-export/spec.md": GOOD_SPEC,
    "design.md": GOOD_DESIGN,
    "tasks.md": GOOD_TASKS,
    ...overrides,
  });
}

test("clean change passes with exit 0", () => {
  const r = run(goodChange());
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /OK - no structural findings/);
});

test("scenario with 3 hashtags is an ERROR", () => {
  const r = run(
    goodChange({
      "specs/data-export/spec.md": GOOD_SPEC.replace("#### Scenario:", "### Scenario:"),
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /scenario header has 3 hashtags/);
});

test("scenario as a bullet is an ERROR", () => {
  const r = run(
    goodChange({
      "specs/data-export/spec.md":
        "## ADDED Requirements\n\n### Requirement: X\nThe system MUST do X.\n\n- Scenario: bad\n- **WHEN** a\n- **THEN** b\n",
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /scenario written as a bullet/);
});

test("requirement with no scenario is an ERROR", () => {
  const r = run(
    goodChange({
      "specs/data-export/spec.md": "## ADDED Requirements\n\n### Requirement: Lonely\nThe system MUST be lonely.\n",
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /has no #### Scenario/);
});

test("scenario missing THEN is an ERROR", () => {
  const r = run(
    goodChange({
      "specs/data-export/spec.md":
        "## ADDED Requirements\n\n### Requirement: X\nThe system MUST do X.\n\n#### Scenario: half\n- **WHEN** only when\n",
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /has no THEN clause/);
});

test("requirement without SHALL/MUST is a WARN, not an error", () => {
  const r = run(
    goodChange({
      "specs/data-export/spec.md":
        "## ADDED Requirements\n\n### Requirement: Soft\nThe system should maybe do X.\n\n#### Scenario: s\n- **WHEN** a\n- **THEN** b\n",
      "tasks.md": GOOD_TASKS.replace("Covers: Successful export", "Covers: s"),
    })
  );
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /WARN .*no SHALL\/MUST/);
});

test("unknown delta header is an ERROR", () => {
  const r = run(
    goodChange({
      "specs/data-export/spec.md": GOOD_SPEC.replace("## ADDED Requirements", "## ADDED Stuff"),
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /unknown delta header/);
});

test("REMOVED requirement without Reason/Migration is an ERROR", () => {
  const r = run(
    goodChange({
      "specs/data-export/spec.md":
        GOOD_SPEC + "\n## REMOVED Requirements\n\n### Requirement: Legacy export\nGone now.\n",
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /REMOVED requirement missing \*\*Reason\*\*/);
  assert.match(r.out, /REMOVED requirement missing \*\*Migration\*\*/);
});

test("New Capability with no spec file is an ERROR", () => {
  const dir = mk({
    "proposal.md": GOOD_PROPOSAL.replace("data-export", "ghost-cap"),
    "design.md": GOOD_DESIGN,
    "tasks.md": GOOD_TASKS,
  });
  const r = run(dir);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /New Capability "ghost-cap" has no specs\/ghost-cap\/spec\.md/);
});

test("spec file with no matching capability is an ERROR", () => {
  const r = run(
    goodChange({
      "specs/orphan/spec.md": GOOD_SPEC,
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /spec file for "orphan" has no matching capability/);
});

test("non-kebab-case capability is an ERROR", () => {
  const r = run(
    goodChange({
      "proposal.md": GOOD_PROPOSAL.replace("`data-export`", "`Data_Export`"),
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /not kebab-case/);
});

test("missing design.md section is an ERROR", () => {
  const r = run(
    goodChange({
      "design.md": GOOD_DESIGN.replace("## Open Questions\nNone.\n", ""),
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /design\.md missing "## Open Questions"/);
});

test("missing design.md entirely is an ERROR", () => {
  const dir = mk({
    "proposal.md": GOOD_PROPOSAL,
    "specs/data-export/spec.md": GOOD_SPEC,
    "tasks.md": GOOD_TASKS,
  });
  const r = run(dir);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /design\.md not found - it is mandatory/);
});

test("Covers: target not in specs is an ERROR", () => {
  const r = run(
    goodChange({
      "design.md": GOOD_DESIGN.replace("Covers: Successful export", "Covers: Nonexistent scenario"),
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /names no requirement or scenario found in specs/);
});

test('"no new code surface" skips seam Covers checks', () => {
  const r = run(
    goodChange({
      "design.md": GOOD_DESIGN.replace(
        /## Shape \/ Seams[\s\S]*?## Risks/,
        "## Shape / Seams\nno new code surface\n\n## Risks"
      ),
    })
  );
  assert.strictEqual(r.code, 0, r.out);
});

test("archive task in tasks.md is an ERROR", () => {
  const r = run(
    goodChange({
      "tasks.md": GOOD_TASKS + "\n## 3. Wrap up\n\n- [ ] 3.1 Run openspec archive for the change\n",
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /MUST NOT include an archive/);
});

test("non-checkbox bullet under a task heading is a WARN", () => {
  const r = run(
    goodChange({
      "tasks.md": GOOD_TASKS + "\n## 3. More\n\nCovers: none\n\n- do a thing without a checkbox\n",
    })
  );
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /not a "- \[ \]" checkbox/);
});

// --- tasks.md parallel metadata (Depends on) -------------

const PAR_TASKS = `## 1. Core

Depends on: none
Covers: Successful export

- [ ] 1.1 Build core

## 2. Reports

Depends on: none
Covers: none

- [ ] 2.1 Build reports

## 3. Wire up

Depends on: 1, 2
Covers: none

- [ ] 3.1 Wire both
`;

function tasksChange(tasks) {
  return goodChange({ "tasks.md": tasks });
}

test("valid Depends on metadata lints clean", () => {
  const r = run(tasksChange(PAR_TASKS));
  assert.strictEqual(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /tasks\.md/);
});

test("Depends on an unknown group is an ERROR", () => {
  const r = run(tasksChange(PAR_TASKS.replace("Depends on: 1, 2", "Depends on: 1, 9")));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /unknown group 9/);
});

test("group depending on itself is an ERROR", () => {
  const r = run(tasksChange(PAR_TASKS.replace("Depends on: 1, 2", "Depends on: 3")));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /depends on itself/);
});

test("dependency cycle is an ERROR", () => {
  const r = run(
    tasksChange(PAR_TASKS.replace("## 1. Core\n\nDepends on: none\nCovers: Successful export", "## 1. Core\n\nDepends on: 3\nCovers: Successful export"))
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /dependency cycle/);
});

test("malformed Depends on value is an ERROR", () => {
  const r = run(tasksChange(PAR_TASKS.replace("Depends on: 1, 2", "Depends on: the others")));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /"Depends on:" must be "none" or a comma-separated list of group numbers/);
});

test("metadata-looking line after the first checkbox is prose, not graph metadata", () => {
  const r = run(
    tasksChange(GOOD_TASKS.replace("- [ ] 1.2 Wire export command\n", "- [ ] 1.2 Wire export command\nDepends on: the legacy exporter\n"))
  );
  assert.strictEqual(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /Depends on/);
});

test("metadata inside an HTML comment is ignored", () => {
  const r = run(
    tasksChange(
      GOOD_TASKS.replace("## 1. Export CSV for a single table\n", "## 1. Export CSV for a single table\n<!--\nDepends on: 7\n-->\n")
    )
  );
  assert.strictEqual(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /unknown group/);
});

test("unverified External Dependencies row is an ERROR", () => {
  const r = run(
    goodChange({
      "proposal.md": GOOD_PROPOSAL.replace(
        "## External Dependencies\nnone",
        "## External Dependencies\n\n| Claim | External system | Primary source | Verified? |\n| --- | --- | --- | --- |\n| API supports cursor paging | AcmeAPI | | no |"
      ),
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /not verified \(Verified\? = no\)/);
});

test("verified External Dependencies row passes", () => {
  const r = run(
    goodChange({
      "proposal.md": GOOD_PROPOSAL.replace(
        "## External Dependencies\nnone",
        "## External Dependencies\n\n| Claim | External system | Primary source | Verified? |\n| --- | --- | --- | --- |\n| API supports cursor paging | AcmeAPI | https://acme.dev/docs | yes |"
      ),
    })
  );
  assert.strictEqual(r.code, 0, r.out);
});

test("missing proposal.md section is an ERROR", () => {
  const r = run(
    goodChange({
      "proposal.md": GOOD_PROPOSAL.replace("## Impact\nTouches the export module.\n", ""),
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /proposal\.md missing "## Impact"/);
});

test("nonexistent change dir exits 2", () => {
  const r = run(path.join(os.tmpdir(), "definitely-not-here-" + Date.now()));
  assert.strictEqual(r.code, 2);
  assert.match(r.out, /does not exist or is not a directory/);
});

test("no args exits 2 with usage", () => {
  const r = run("");
  assert.strictEqual(r.code, 2);
  assert.match(r.out, /Usage: node lint\.cjs/);
});

test("template placeholder capability is ignored", () => {
  const r = run(
    goodChange({
      "proposal.md":
        GOOD_PROPOSAL.replace(
          "### Modified Capabilities\n",
          "### Modified Capabilities\n- `<existing-name>`: what requirement is changing\n"
        ),
    })
  );
  assert.strictEqual(r.code, 0, r.out);
});

// ---------------------------------------------------------------------------
// security gate (WARN only)
// ---------------------------------------------------------------------------

const AUTH_SPEC = GOOD_SPEC.replace("allow users to export their data", "require authentication before users export their data");

test("trust-boundary keyword with no threat entry and no skip line is a WARN", () => {
  const r = run(goodChange({ "specs/data-export/spec.md": AUTH_SPEC }));
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /WARN design\.md\s+possible trust boundary \(matched: authentication\)/);
});

test("a well-formed [Threat: ...] entry silences the security gate", () => {
  const r = run(
    goodChange({
      "specs/data-export/spec.md": AUTH_SPEC,
      "design.md": GOOD_DESIGN.replace(
        "[Large dataset] → stream in chunks",
        "[Large dataset] → stream in chunks\n[Threat T1: Elevation of privilege, High] → check owner on every export (Authorization Cheat Sheet)"
      ),
      "tasks.md": SEC_TASKS,
    })
  );
  assert.strictEqual(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /trust boundary|threat line/);
});

test('a "Security pass: skipped - <reason>" line silences the security gate', () => {
  const r = run(
    goodChange({
      "specs/data-export/spec.md": AUTH_SPEC,
      "design.md": GOOD_DESIGN.replace(
        "[Large dataset] → stream in chunks",
        "[Large dataset] → stream in chunks\nSecurity pass: skipped - export reuses the existing authenticated route"
      ),
    })
  );
  assert.doesNotMatch(r.out, /trust boundary/);
});

test("a threat line without category and severity is a WARN", () => {
  const r = run(
    goodChange({
      "specs/data-export/spec.md": AUTH_SPEC,
      "design.md": GOOD_DESIGN.replace("[Large dataset] → stream in chunks", "[Threat T1: Elevation of privilege] → check owner on every export"),
      "tasks.md": SEC_TASKS,
    })
  );
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /threat line should read "\[Threat T<n>: <category>, <High\|Medium\|Low>\]/);
});

test("no trust-boundary keyword means no security-gate finding", () => {
  const r = run(goodChange());
  assert.doesNotMatch(r.out, /trust boundary/);
});

test("a skip line together with threat entries is a WARN", () => {
  const r = run(
    goodChange({
      "specs/data-export/spec.md": AUTH_SPEC,
      "design.md": GOOD_DESIGN.replace(
        "[Large dataset] → stream in chunks",
        "[Threat T1: Elevation of privilege, High] → check owner on every export\nSecurity pass: skipped - export reuses the existing authenticated route"
      ),
    })
  );
  assert.match(r.out, /both a "Security pass: skipped" line and "\[Threat" entries/);
});

test("a skip line with a one-word reason does not silence the gate", () => {
  const r = run(
    goodChange({
      "specs/data-export/spec.md": AUTH_SPEC,
      "design.md": GOOD_DESIGN.replace("[Large dataset] → stream in chunks", "[Large dataset] → stream in chunks\nSecurity pass: skipped - n/a"),
    })
  );
  assert.match(r.out, /possible trust boundary/);
});

test("everyday words like design token and session timeout do not trip the gate", () => {
  const r = run(
    goodChange({
      "specs/data-export/spec.md": GOOD_SPEC.replace("in CSV format", "in CSV format using the design token for button color after a session timeout"),
    })
  );
  assert.doesNotMatch(r.out, /trust boundary/);
});

// ---------------------------------------------------------------------------
// task coverage: Covers: per group
// ---------------------------------------------------------------------------

const TWO_SCENARIO_SPEC = GOOD_SPEC + `
#### Scenario: Export of an empty table
- **WHEN** the table has no rows
- **THEN** a CSV with only the header row downloads
`;

test("a scenario no group covers is an ERROR", () => {
  const r = run(goodChange({ "specs/data-export/spec.md": TWO_SCENARIO_SPEC }));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /scenario "Export of an empty table" is covered by no task group/);
});

test("a scenario covered through a semicolon-separated Covers line passes", () => {
  const r = run(
    goodChange({
      "specs/data-export/spec.md": TWO_SCENARIO_SPEC,
      "tasks.md": GOOD_TASKS.replace("Covers: Successful export", "Covers: Successful export; Export of an empty table"),
    })
  );
  assert.strictEqual(r.code, 0, r.out);
});

test("a Covers name that matches no scenario is an ERROR", () => {
  const r = run(goodChange({ "tasks.md": GOOD_TASKS.replace("Covers: none", "Covers: Imaginary scenario") }));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /group 2 "Covers: Imaginary scenario" names no scenario/);
});

test("a group with no Covers line is an ERROR", () => {
  const r = run(goodChange({ "tasks.md": GOOD_TASKS.replace("Covers: none\n\n", "") }));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /group 2 has no "Covers:" line/);
});

test("an empty Covers line is an ERROR", () => {
  const r = run(goodChange({ "tasks.md": GOOD_TASKS.replace("Covers: none", "Covers:") }));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /group 2 has an empty "Covers:" line/);
});

test("Covers: none is accepted for a structure-only group", () => {
  const r = run(goodChange());
  assert.strictEqual(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /Covers/);
});

test("Covers matching ignores case and surrounding space", () => {
  const r = run(goodChange({ "tasks.md": GOOD_TASKS.replace("Covers: Successful export", "Covers:   successful EXPORT ") }));
  assert.strictEqual(r.code, 0, r.out);
});

test("a Covers line inside an HTML comment does not count", () => {
  const r = run(
    goodChange({
      "tasks.md": GOOD_TASKS.replace("Covers: Successful export", "<!-- Covers: Successful export -->"),
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /group 1 has no "Covers:" line/);
});

test("a Covers-looking line after the first checkbox is prose", () => {
  const r = run(
    goodChange({
      "tasks.md": GOOD_TASKS.replace("Covers: none\n\n", "").replace("- [ ] 2.2 Apply before formatting", "- [ ] 2.2 Apply before formatting\nCovers: none"),
    })
  );
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /group 2 has no "Covers:" line/);
});

// ---------------------------------------------------------------------------
// threat ids: matched by id from tasks.md Covers:
// ---------------------------------------------------------------------------

const T1 = "[Threat T1: Elevation of privilege, High] → check owner on every export (Authorization Cheat Sheet)";
const SEC_TASKS = GOOD_TASKS.replace("Covers: Successful export", "Covers: Successful export; T1").replace(
  "- [ ] 1.2 Wire export command",
  "- [ ] 1.2 Refuse export of another user's data [security]"
);

function threatChange(threatLine, extra = {}) {
  return goodChange({
    "specs/data-export/spec.md": AUTH_SPEC,
    "tasks.md": SEC_TASKS,
    "design.md": GOOD_DESIGN.replace("[Large dataset] → stream in chunks", "[Large dataset] → stream in chunks\n" + threatLine),
    ...extra,
  });
}

test("a threat covered by a group with a [security] task passes", () => {
  const r = run(threatChange(T1));
  assert.strictEqual(r.code, 0, r.out);
});

test("a threat with no id is an ERROR", () => {
  const r = run(threatChange("[Threat: Elevation of privilege, High] → check owner on every export"));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /threat has no id/);
});

test("a duplicate threat id is an ERROR", () => {
  const r = run(threatChange(T1 + "\n" + T1));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /threat id T1 is used twice/);
});

test("a threat no group covers is an ERROR", () => {
  const r = run(threatChange(T1, { "tasks.md": GOOD_TASKS }));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /threat T1 is covered by no task group/);
});

test("a Covers: threat id that design.md does not define is an ERROR", () => {
  const r = run(threatChange(T1, { "tasks.md": SEC_TASKS.replace("; T1", "; T1; T7") }));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /group 1 "Covers: T7" names no threat/);
});

test("a group covering a threat without a [security] task is an ERROR", () => {
  const r = run(threatChange(T1, { "tasks.md": SEC_TASKS.replace(" [security]", "") }));
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /covers threat T1 but has no task tagged \[security\]/);
});

test("threat ids match case-insensitively", () => {
  const r = run(threatChange(T1.replace("T1", "t1"), { "tasks.md": SEC_TASKS }));
  assert.strictEqual(r.code, 0, r.out);
});

// ---------------------------------------------------------------------------
// proposal size and shape (WARN only)
// ---------------------------------------------------------------------------

const words = (n) => Array.from({ length: n }, (_, i) => "word" + i).join(" ");

test("proposal over the word ceiling is a WARN, not an ERROR", () => {
  const r = run(goodChange({ "proposal.md": GOOD_PROPOSAL.replace("Problem statement.", words(300) + "\n\n" + words(300) + "\n\n" + words(300) + "\n\n" + words(300) + "\n\n" + words(300)) }));
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /WARN proposal\.md\s+proposal\.md is \d+ words, over the 1500-word ceiling/);
});

test("words inside HTML comments do not count toward the ceiling", () => {
  const r = run(goodChange({ "proposal.md": GOOD_PROPOSAL + "\n<!-- " + words(2000) + " -->\n" }));
  assert.doesNotMatch(r.out, /ceiling/);
});

test("a paragraph over 100 words is a WARN", () => {
  const r = run(goodChange({ "proposal.md": GOOD_PROPOSAL.replace("Problem statement.", words(120)) }));
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /paragraph or bullet of 120 words/);
});

test("a bullet over 100 words is a WARN, counting its continuation lines", () => {
  const r = run(goodChange({ "proposal.md": GOOD_PROPOSAL.replace("- Add data export.", "- " + words(60) + "\n  " + words(60)) }));
  assert.match(r.out, /paragraph or bullet of 120 words/);
});

test("a code fence in the proposal is a WARN", () => {
  const r = run(goodChange({ "proposal.md": GOOD_PROPOSAL.replace("Problem statement.", "Problem.\n\n```js\nfoo();\n```") }));
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /code fence in proposal\.md/);
});

test("more than 5 bullets under Assumptions & Open Questions is a WARN", () => {
  const bullets = Array.from({ length: 6 }, (_, i) => "- Question " + i).join("\n");
  const r = run(goodChange({ "proposal.md": GOOD_PROPOSAL.replace("## External Dependencies", "## Assumptions & Open Questions\n\n" + bullets + "\n\n## External Dependencies") }));
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /Assumptions & Open Questions has 6 bullets/);
});

test("optional Assumptions & Open Questions and Out of Scope sections are accepted", () => {
  const r = run(
    goodChange({
      "proposal.md": GOOD_PROPOSAL.replace(
        "## External Dependencies",
        "## Assumptions & Open Questions\n\n- Exports stay under 100 MB.\n\n## Out of Scope\n\n- PDF export, deferred.\n\n## External Dependencies"
      ),
    })
  );
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /OK - no structural findings/);
});

test("the size facts line reports capabilities, scenarios, task groups, and proposal words", () => {
  const r = run(goodChange());
  assert.match(r.out, /Size facts: 1 capabilities, 1 scenarios, 2 task groups, proposal \d+ words/);
});

test("--phase=proposal checks proposal.md only, so missing later artifacts are not errors", () => {
  const dir = mk({ "proposal.md": GOOD_PROPOSAL });
  const r = run(dir, null, "--phase=proposal");
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /Size facts: 0 capabilities, 0 scenarios, 0 task groups/);
});

test("--phase=proposal still reports proposal errors and warnings", () => {
  const dir = mk({ "proposal.md": GOOD_PROPOSAL.replace("## Impact", "## Nope").replace("Problem statement.", words(120)) });
  const r = run(dir, null, "--phase=proposal");
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /missing "## Impact" section/);
  assert.match(r.out, /paragraph or bullet of 120 words/);
});

test("an unknown flag or phase exits 2 with usage", () => {
  const r = run(goodChange(), null, "--phase=design");
  assert.strictEqual(r.code, 2);
  assert.match(r.out, /Usage: node lint\.cjs/);
});
