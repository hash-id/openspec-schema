# Research: what `addyosmani/agent-skills` offers tempa-spec

**Date:** 2026-10-25
**Scope:** Read all 25 skills in [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills/tree/main/skills) and decide which parts, if any, would raise software quality or security in `tempa-spec` without making the process heavier. The bar is the repo's Lean principle: no new phase, artifact, or review loop unless it is a deterministic check.
**Status:** Implemented as schema v16 (see CHANGELOG, 2026.10.25); the mutation probe stays deferred. Three changes to `apply` Phase 2 and `hrt-security-pass` (floor guard, supply-chain reference, performance lens), plus the supporting edits they need, ship as one change (§4). A fourth, the mutation probe, is designed but deferred until there is evidence it is needed (§4.2). The changes were agreed with the maintainer in `grilling` sessions held before and after an independent plan review and a measurement on three downstream repos (§5, §6.4, §6.5). One addition during implementation: the guard also flags `@ts-expect-error`, which the measurement had counted as a suppression.
**Method:** Shallow clone of the source repo at commit `aeac41d4d005999432bb7312f7ff06383a91d59d` (2026-10-13, MIT licence, 408,425 bytes under `skills/`). Every `SKILL.md` front matter and section list read. Read in full: `security-and-hardening` (with `references/hardening-patterns.md`), `code-review-and-quality`, `constraint-driven-development` (with `references/floor-guard.md`), `doubt-driven-development`, `source-driven-development`, and `evals/README.md`. Read in part: `test-driven-development`, `debugging-and-error-recovery`, and `observability-and-instrumentation`. Compared against `schema.yaml`, `skills/hrt-apply-code-review/SKILL.md`, `skills/hrt-security-pass/` (skill and references), `skills/hrt-dark-mode-routing/SKILL.md`, `skills/hrt-mr-brief/SKILL.md`, `skills/vendor/tdd/SKILL.md`, and `templates/design.md`. Every claim was re-checked by the author the same day. A fresh-context subagent then reviewed the plan against the repo, and the floor guard's patterns were measured read-only against the git history of three downstream repos (§6).

## Contents

1. [What the evals prove](#1-what-the-evals-prove)
2. [Gaps in tempa-spec the source repo fills](#2-gaps-in-tempa-spec-the-source-repo-fills)
3. [Skill-by-skill verdict](#3-skill-by-skill-verdict)
4. [Adopted changes](#4-adopted-changes)
5. [Decision record](#5-decision-record)
6. [Verification and review](#6-verification-and-review)

---

## 1. What the evals prove

The source repo has three eval tiers (`evals/README.md`):

| Tier | Measures | Outcome evidence |
|---|---|---|
| 1. Structural | Front matter, layout, links | None (lint only) |
| 2. Trigger and routing | Stemmed TF-IDF over descriptions: does a prompt rank the right skill first | None. Measures routing, not quality |
| 3. Behavioral | A headless run graded against `expectations[]` | 1 to 3 cases per skill (18 skills have 1, 5 have 2, 2 have 3), run on demand. No with/without-skill quality comparison is published |

The `claude plugin eval` runs report a delta, but the published numbers are about how often a skill fires. For example, the review skill went from firing on 7 of 27 prompts to 21 of 27 after one clause was added to its description. They do not show that the reviewed code got better.

Two consequences for this repo:

- Trigger accuracy matters little here. tempa-spec instructions call skills by name ("MUST use the `X` skill"), so routing is not the failure mode.
- Any adoption must rest on the mechanism itself (is it deterministic, does it close a gap we can name), not on the source repo's evals.

## 2. Gaps in tempa-spec the source repo fills

| Gap in tempa-spec today | Where the source repo covers it |
|---|---|
| Nothing checks whether the implementing agent **weakened the bar** to get to green: a new suppression comment, an added skip, a deleted test file, fewer assertions in a test file that stays, a stub, or a swallowed exception. The weak-oracle gate in `hrt-apply-code-review` step 3 only judges tests that exist. | `constraint-driven-development` step 6 ("Guard the bar itself") and its reference script `references/floor-guard.md` |
| The weak-oracle gate **reads** a test and asks whether a stub would pass it. Nothing **runs** that experiment, so a `[security]` test that cannot detect the attack can still be credited. | `code-review-and-quality`, "Review the Tests First": invert one condition the change adds, run the suite, restore the file. If the suite stays green, that is a finding |
| `hrt-security-pass`'s gate fires on a *new* dependency only; an upgrade never fires it. The references ask about supply chain in general terms (web `A03` and `A08`, LLM `LLM03`, agentic `ASI04`, mobile `M2`), but none asks about dependency confusion, typosquatting, install scripts, or reviewing a lockfile diff. | `security-and-hardening`, "Dependencies and supply chain", and `code-review-and-quality`, "Dependency Discipline" |
| `hrt-apply-code-review`'s smell baseline is structural only. There is no performance check on changed code. | `code-review-and-quality`, axis 5 "Performance" |

Checked and **not** a gap:

- Path traversal: CWE-22 is in `cwe-top25-2025.md`.
- STRIDE and LINDDUN: `hrt-security-pass` `method.md` §2.
- Bug reproduction before the fix: `tdd` plus `diagnosing-bugs`, which turns the minimal repro into the regression test.
- Expand/contract migrations: the `tasks` instruction and template.
- Rollback: the `design.md` Migration Plan.
- Scanner output treated as data, and published-contract changes as a one-way door: `hrt-apply-code-review` steps 1 and 8.

## 3. Skill-by-skill verdict

| Skill | Verdict | Reason |
|---|---|---|
| `constraint-driven-development` | Adopt one part | Floor guard only (§4.1). The rest adds a `CONSTRAINTS.md` artifact, a 4-question interview, and scanner installs. That conflicts with the decision not to bundle or mandate a scanner (`2026-10-15-security-approach-vendored-skills-vs-standards.md` §10.4) |
| `code-review-and-quality` | Adopt one part, defer one | Performance axis (§4.4). Mutation probe designed and deferred (§4.2). The rest overlaps `hrt-apply-code-review` or is human-team practice (review speed, PR descriptions, disagreement handling) |
| `security-and-hardening` | Adopt one part | Supply-chain questions (§4.3). The whole skill is 17.5 KB plus 13 KB of patterns, centred on Express and the web. `hrt-security-pass` is a 1.3 KB gate with references read per surface |
| `observability-and-instrumentation` | Defer | "Write 2–4 on-call questions before instrumenting" is sound but adds `design.md` volume, against the open complaint that drafts are too long. Revisit if the R7 hand log shows production issues that could not be diagnosed |
| `source-driven-development` | Defer | `apply` does not check that API use matches the installed version, but the skill overlaps `research` and the External Dependencies table, and adds web fetches per task |
| `doubt-driven-development` | Reject | Adds a same-model reviewer per decision, plus a mandatory cross-model offer (a user question) per cycle. The 2026-10-21 weight analysis found stacked same-model review the least evidenced part of tempa-spec, and v15 removed the proposal's model review on that basis. Its one useful rule (do not pass the author's claim to the reviewer) already holds: tempa-spec reviewers see only artifacts on disk |
| `interview-me`, `idea-refine` | Reject | Duplicate `grilling` |
| `spec-driven-development`, `planning-and-task-breakdown`, `incremental-implementation` | Reject | Duplicate proposal, specs, tasks with `Depends on:`, and the per-task TDD loop |
| `test-driven-development` | Reject | Duplicates vendored `tdd`. The test pyramid and test-size table add nothing a seam-based loop needs |
| `debugging-and-error-recovery` | Reject | Duplicates `diagnosing-bugs` |
| `deprecation-and-migration` | Reject | Expand/migrate/contract is already in `tasks` |
| `code-simplification` | Reject | Overlaps the smell baseline |
| `documentation-and-adrs` | Reject | `design.md` Decisions holds rejected alternatives |
| `api-and-interface-design` | Reject | A published-contract change is already a one-way door in `hrt-apply-code-review` step 8 |
| `git-workflow-and-versioning`, `ci-cd-and-automation`, `shipping-and-launch` | Reject | Outside the schema: `apply` never commits, pushes, or deploys |
| `frontend-ui-engineering`, `browser-testing-with-devtools`, `performance-optimization` | Reject | Web-specific. The browser skill needs a chrome-devtools MCP server the installer cannot provision |
| `context-engineering`, `using-agent-skills` | Reject | tempa-spec uses `config.yaml` `context:` and explicit skill pointers |

## 4. Adopted changes

Three changes (§4.1, §4.3, §4.4), plus the supporting edits they need (§4.5). §4.2 is designed but deferred (Q20). All land in `apply` or in `hrt-security-pass`. None adds a phase, a schema artifact, or a review loop. Each is a local adaptation, not vendored: vendoring would bring 17–21 KB per skill to use one section. Each adapted file credits the source (MIT), the way `hrt-mr-brief` credits `mattpocock/skills`' `pr`. Everything ships as one change with one CHANGELOG entry and schema `version: 16` (Q8).

Severity and resolution terms are those of `hrt-apply-code-review` steps 5 to 8:

- A **HIGH DECISION** finding needs its own answer from the user.
- A **MEDIUM or LOW DECISION** finding goes in the digest, unless it is a one-way door or changes settled scope. Then it needs its own answer too (step 8).
- A **MECHANICAL** finding is fixed without a question.
- A **LOW** finding never keeps the loop running.

### 4.1 Floor guard

**Where:** a zero-dependency script in `skills/hrt-apply-code-review/`, run in step 1 beside tests, linters, and the security scan. Its test lives in `scripts/` so it does not ship, like `lint.test.cjs`.

**Not a linter.** The guard's exit 1 means "flags for the reviewer to classify". It is not a lint error, so step 1's "any failing test or lint error is an automatic HIGH" does not apply. Neither does the loop-exit rule "MUST NOT stop while … linters are failing" (Q11).

**Diff:** the same base the security scan uses ("diff against the base branch"), plus untracked files.

- Untracked files are listed with `git ls-files --others --exclude-standard`, because `git diff` does not show them.
- Rename detection is on (`-M`), so a moved or renamed test file is not read as a deleted file.
- If no base can be found, the guard falls back to `HEAD` and says so in its output.

**Patterns (Q6):** written for this repo's users, not copied from the source script, which targets JavaScript and misses the Python and Odoo forms (§6.2). The first version covers Python (including unittest and Odoo) and JS/TS. Other ecosystems are added only after a real incident.

| Move | Python, including unittest and Odoo | JS/TS | Applies to |
|---|---|---|---|
| Suppression added | `# noqa`, `# type: ignore`, `# pylint: disable`, `# pragma: no cover` | `@ts-ignore`, `@ts-nocheck`, `eslint-disable`, `biome-ignore`, `istanbul ignore` | All files |
| Security suppression added | `# nosec`, `nosemgrep`, `gitleaks:allow` | `nosemgrep`, `gitleaks:allow` | All files |
| Skip added | `@unittest.skip*`, `self.skipTest(`, `pytest.skip(`, `@pytest.mark.skip`, an added `'-standard'` in `@tagged(...)` | `.skip(`, `.todo(`, `xit(`, `xdescribe(` | Test files that existed before the change |
| Test file deleted (renames excluded) | `test_*.py`, files under `tests/` | `*.test.*`, `*.spec.*` | Test files only |
| Fewer assertions across the change | net count of `assert` statements and `self.assert*` calls over all test files drops | net count of `expect(` and `assert` calls over all test files drops | Test files only |
| Stub or swallowed exception added | `raise NotImplementedError`, `except …: pass` | `throw new Error("Not implemented")`, an empty `catch {}` | Production code |

Notes on the patterns:

- **Odoo tags.** Only an added `'-standard'` counts as a skip. `@tagged('-at_install', 'post_install')` is standard Odoo usage and only changes when a test runs.
- **Skips in new test files (Q19).** A skip in a test file the change itself creates weakens no existing test, so it is not flagged. A conditional `self.skipTest` inside a new parametrised test is the common case (§6.5).
- **Assertion counting (Q13, Q18).** The count is taken over all test files in the change, before against after. Assertions moved between files, or into a shared helper, leave the total unchanged. So do edited expected values. A weak-oracle rewrite usually raises it. Per-file drops are not flagged: in §6.5, 18 of 18 per-file drops were moves, rewrites, or spec changes. `should` is not counted, because it also matches test titles such as `it('should …')`.
- **TODO.** Not checked, because it would raise too many false alarms.

**Severity:** the guard only flags. The reviewer classifies each flag:

| Flag | Severity |
|---|---|
| Deleted test, added skip, or a change-wide drop in assertions, tied to a requirement under `## REMOVED Requirements` or `## MODIFIED Requirements` in specs | LOW, in the digest (Q13) |
| Deleted test, added skip, or a change-wide drop in assertions, otherwise | HIGH DECISION (Q1) |
| Security suppression | HIGH DECISION (Q2). Always goes to the user, also in dark mode (Q17) |
| Other suppression | MEDIUM DECISION (Q2). The recommended resolution is to remove it and fix what it hides. Keeping it is recommended only with a reason specific to that line, stated in the code or the digest; a generic reason does not count (Q22) |
| Stub or swallowed exception in production code | HIGH DECISION. The reviewer may lower it to LOW for a legitimate pattern: an abstract method or hook meant to be overridden, or `except ImportError: pass` for an optional dependency (Q14) |

**Answered flags do not come back (Q11).** Each pass is a fresh subagent that sees only the disk, so a flag the user already approved is raised again on the next pass. The orchestrating session lasts for the whole loop. It keeps the user's answers and drops any re-raised flag it already has an answer for. An approved flag counts as resolved, not as an unresolved HIGH, so it never becomes a RELEASE BLOCKER. Approvals are listed under Merge Danger in `mr-brief.md`, so the human reviewer sees them.

**Exit codes:** 0 clean, 1 flags found, 2 the guard could not run. Exit 2 is reported once in the loop-exit report as a known issue, the same way a missing scanner is reported. It never reads as clean and never blocks.

### 4.2 Mutation probe (deferred)

**Deferred (Q20).** Not part of this change. The design below is kept so it can be revived without a new review. Revive it when there is evidence that a weak `[security]` test got through: a case in the R7 hand log, or a finding by a human reviewer.

Why it is deferred:

- `[security]` tasks are common. §6.5 counts 194 of them in 18 of 75 archived changes, about 10 per change that has any. So the probe would add about 10 test runs on pass 1 for a quarter of all changes.
- Reading history cannot show whether any of those tests are weak. That needs the tests to be run.

**Scope (Q3):** tests the contract map credits for a `[security]` task or for a scenario cited by a High threat.

**Steps (Q12):**

1. **The reviewer picks the mutation.** The review subagent (not the implementer) lists each test to probe and the guard condition to invert, and returns the list in its findings report (step 7). It does this in the same call that builds the contract map, so no extra model call is needed.
2. **The orchestrator runs it.** After the report, the orchestrating session, for each listed test:
   1. copies the file under test to `.probe-backup/` in the change folder;
   2. inverts the condition;
   3. runs that test;
   4. restores the file from the backup, confirms the hash matches, and deletes the backup.

   If a repo already configures a mutation tool, that tool is run instead, scoped to the changed files.
3. **The result counts in the same pass.** A `[security]` test that stays green is a HIGH weak-oracle finding. It always goes to the user, also in dark mode (Q17).
4. **Leftover check.** At the start of every pass and before Phase 3, if `.probe-backup/` exists, a probe was interrupted. The orchestrator restores the files from it, then stops with a blocker. This way an inverted security check can never be left in a tree the user commits.
5. **Later passes:** following the security lens's rule (step 2), the probe re-runs only if the previous pass raised a security finding, and only for files changed since.
6. **Evidence:** the mutation, the test name, and the result are recorded for `hrt-mr-brief`.

A model chooses which condition to invert, so the probe is not fully deterministic. Only the test run is.

### 4.3 Supply-chain reference and gate wording

**Gate (Q16):** in `hrt-security-pass/SKILL.md`, and in the matching parenthesis in `hrt-apply-code-review` step 2, "a new dependency is added" becomes "a third-party package is added or upgraded". What it covers:

- **Included:** `external_dependencies` in an Odoo `__manifest__.py`.
- **Excluded:** Odoo module `depends` (internal modules), and a lockfile that changes without a direct version change (a regeneration). Without these exclusions, a routine change would produce `[Threat]` lines, `[security]` tasks, and lint errors for no real boundary.

**Reference (Q15):** a new file `references/cicd-top10.md`, plus one row in `method.md` §1's surface table, triggered by the gate above. It follows the format of the other reference files: official titles quoted, questions written for this skill, source URL, and licence note. It records that the source page states no version label and that its content dates from 2022 (§6.1). It carries **CICD-SEC-3 Dependency Chain Abuse** only. CICD-SEC-9 (artifact integrity) overlaps `A08` in `web-top10-2025.md`, and the other eight categories concern CI pipeline configuration, not an application diff.

Questions under CICD-SEC-3:

- Is the version pinned?
- Do the lockfile, the declared manager, and CI agree?
- Was the lockfile diff reviewed, including transitive changes?
- Do new packages run install scripts?
- Are a new package's name, maintainer, release age, and provenance plausible? (This covers dependency confusion, typosquatting, and brandjacking.)
- Is each upgrade isolated, with its changelog read?
- *apply only:* were findings from the repo's own audit command triaged by reachability, with no forced fix?

Only commands the repo already configures are run, per the 2026-10-15 decision not to bundle or mandate a scanner.

### 4.4 Performance lens

**Where:** three or four lines in `hrt-apply-code-review` step 2, for changed code only:

- a query, ORM call, or remote call inside a loop (N+1);
- an unbounded fetch, or a loop over caller-controlled input;
- a list endpoint with no pagination;
- a large allocation on a hot path.

**Severity (Q5, Q9):** every finding from this lens is **LOW and tagged DECISION**. It is a warning that never blocks, and it is never fixed without a question, so a loop that carries behaviour is not rewritten silently.

One exception, which does not come from this lens: when specs or design state a performance requirement and the code breaks it, the existing rule applies. Behaviour that contradicts a spec is HIGH.

The lines stay generic. "ORM call inside a loop" already covers Odoo's `search` and `browse`, so `odoo.md` stays security-only. That file is read only after the security gate fires anyway.

### 4.5 Supporting changes

- **RED output on disk (Q10).** `apply` Phase 1 writes each task's RED output (test name and failure line) to a working file next to `tasks.md`, instead of keeping it only in session memory. The Phase 2 reviewer and `hrt-mr-brief` read it from there. This is a working log, not a schema artifact: it is not in `artifacts[]` and nothing lints it. Today's rule for a missing RED output stays (`hrt-apply-code-review` step 2: say it is missing; not a finding by itself).
- **Dark-mode routing (Q17).** Add a rule to `hrt-dark-mode-routing`: in dark mode, a new security suppression always goes to the user, like the existing rule 2 for mitigations `hrt-security-pass` decided. A `[security]` test that survives the probe gets the same rule when §4.2 is revived. Other floor-guard findings follow the decision gate and are logged in `dark.md`.
- **Dropped: the RED-reason check (Q10).** An earlier draft checked that each recorded RED was an assertion failure. Step 3's weak-oracle gate is already mandatory whenever 5 or more tests, or any test for a specifically described behaviour, are credited. The probe was meant to cover `[security]` tests. And the heuristic misreads common output: "Expected 200, Received 404" looks like an ordinary assertion failure.

### 4.6 Cost and files touched

| Change | Extra model calls | Extra test runs | User questions |
|---|---|---|---|
| 4.1 Floor guard | none | none | only when a flag is raised, and once per flag (Q11) |
| 4.2 Mutation probe (deferred) | none (mutation chosen in the review's existing call) | one per probed test on pass 1; later passes only after a security finding | only when a `[security]` test survives |
| 4.3 Supply chain | none | none | none extra |
| 4.4 Performance lens | none | none | digest entries only |

Files to edit:

- `openspec/schemas/tempa-spec/schema.yaml`: `version: 16`, and the `apply` Phase 1 line on keeping RED output (write it to the working file).
- `skills/hrt-apply-code-review/SKILL.md`: steps 1, 2, 5, and 8, and the loop exit (the guard is not a linter, answered flags are filtered, the performance lens, the gate parenthesis).
- `skills/hrt-apply-code-review/`: the new guard script.
- `scripts/`: the new guard test, plus the `test` script in `scripts/package.json`, which lists test files by name.
- `skills/hrt-security-pass/SKILL.md`: the gate.
- `skills/hrt-security-pass/references/method.md`: the surface row.
- `skills/hrt-security-pass/references/cicd-top10.md`: new.
- `skills/hrt-mr-brief/SKILL.md`: read the RED log, list approvals.
- `skills/hrt-dark-mode-routing/SKILL.md`: the new always-to-user rule.
- `AGENTS.md`: skill paragraphs and test counts.
- `README.md`: the security paragraph.
- `CHANGELOG.md`.
- This document's status line.

Not touched: `install-schema.sh` and `install-schema.ps1` (skills install through the existing `npx skills add` call), and `skills/vendor/`.

## 5. Decision record

Agreed with the maintainer on 2026-10-25 in three `grilling` rounds of decisions:

- **Q1–Q9:** every recommendation accepted except Q5, which the maintainer changed.
- **Q10–Q17:** held after the plan review in §6.4. Every recommendation accepted.
- **Q18–Q21:** held after the downstream measurement in §6.5. Every recommendation accepted.

Where a later answer replaces an earlier one, the earlier row says so.

| Q | Question | Decision |
|---|---|---|
| Q1 | Who decides whether a weakened test is legitimate? | The guard flags and the reviewer classifies. Exemptions widened by Q13 |
| Q2 | Severity of suppressions and stubs | Suppression: MEDIUM DECISION with a reason. Security suppression: HIGH DECISION. Stub severity replaced by Q14. `TODO` not checked |
| Q3 | Scope of the mutation probe | `[security]` tests and scenarios cited by a High threat only. Mechanics replaced by Q12 |
| Q4 | Source for the supply-chain reference | OWASP Top 10 CI/CD Security Risks. Scope and file name replaced by Q15 |
| Q5 | Performance lens and Odoo | **Changed by the maintainer:** performance findings are a warning, never a blocker. No Odoo hints in `odoo.md` |
| Q6 | Ecosystems for floor guard patterns | Python (including unittest and Odoo) and JS/TS. Others only after a real incident |
| Q7 | A RED that failed for the wrong reason | Replaced by Q10 (check dropped) |
| Q8 | How to release | One change, one CHANGELOG entry, a new schema version. No commit without an explicit request |
| Q9 | Does "warning" cover every performance finding? | Yes, every finding from the lens is LOW. Breaking a stated performance requirement stays HIGH under the existing spec-contradiction rule |
| Q10 | Keep the RED-reason check? | Dropped. Phase 1 writes RED output to a working file so Phase 2 and `hrt-mr-brief` can read it |
| Q11 | A flag the user answered comes back on the next pass | The orchestrating session filters flags it already has an answer for. An approved flag counts as resolved, and approvals go in `mr-brief.md` Merge Danger. The guard is not a linter |
| Q12 | Keep the mutation probe, redesigned? | Yes. The reviewer picks the mutation, the orchestrator runs it after the report, a backup lives in `.probe-backup/`, and a leftover check runs at the start of every pass and before Phase 3. Deferred by Q20 |
| Q13 | Assertion rule | Net assertion count, without `should`. A drop tied to `## REMOVED` or `## MODIFIED` is LOW, otherwise HIGH DECISION. Counting scope replaced by Q18 |
| Q14 | Stub severity | HIGH DECISION. The reviewer may lower it to LOW for a legitimate pattern |
| Q15 | Supply-chain scope and file name | CICD-SEC-3 only, in `cicd-top10.md`. The audit-triage question is marked apply-only |
| Q16 | Gate wording | "A third-party package is added or upgraded". Odoo `depends` and lockfile regeneration are excluded |
| Q17 | Dark mode for new security findings | A new security suppression, or a `[security]` test that survives the probe, always goes to the user. The probe part waits for §4.2 |
| Q18 | Assertion counting scope | Over all test files in the change. Flag only when the change-wide count drops and the drop is not tied to `## REMOVED` or `## MODIFIED` |
| Q19 | Skips in new test files | Not flagged |
| Q20 | Mutation probe | Deferred. Revive on evidence that a weak `[security]` test got through |
| Q21 | Record the measurement | §6.5, with repositories anonymised |
| Q22 | Can a generic-reason suppression pass with a digest "ok"? | No. The recommended resolution defaults to removing the suppression and fixing what it hides. It may be kept only for a reason specific to that line. This closes the repo B pattern without a new question |

Settled by default, without a question:

- Exit 2 from the guard is reported once as a known issue.
- The guard falls back to `HEAD` when no base branch can be found.
- The probe on later passes follows the security lens's full rule.
- Reviewer findings #7, #8, #11, #12, and #13 in §6.4 were applied as fixes.

## 6. Verification and review

### 6.1 Checked and confirmed

**Source repo:**

- Commit, date, and licence.
- Size under `skills/`: 408,425 bytes.
- Per-file sizes: `security-and-hardening` 17,559 bytes plus 13,036 of patterns, `code-review-and-quality` 20,976, `constraint-driven-development` 21,008.
- The 7 → 21 of 27 firing figure in `evals/README.md`.
- Eval case counts per skill.

**This repo:**

- No skill or instruction mentions skipped tests, suppressions, or removed assertions.
- `hrt-security-pass/SKILL.md` (1,355 bytes) fires on a "new dependency" only.
- `2026-10-15-…` §10.4 says "Do not bundle or mandate a scanner".
- `hrt-apply-code-review`:
  - step 1 makes any failing test or lint error an automatic HIGH;
  - the weak-oracle gate is mandatory whenever step 2 credits 5 or more tests, or any test for a specifically described behaviour;
  - MECHANICAL findings are fixed directly;
  - step 8 lists a published API or event contract change as a one-way door;
  - the loop exit makes an unresolved HIGH a RELEASE BLOCKER.
- `hrt-dark-mode-routing`: Phase 2 sends "every finding that would otherwise surface to the user" to the decision gate, with "nothing extra" to the user. Only mitigations `hrt-security-pass` already decided always go to the user (rule 2).
- `schema.yaml` is `version: 15`. Phase 1 keeps RED output "so PHASE 3 can quote it", in session memory, not on disk.
- `scripts/package.json`'s `test` script lists test files by name.
- `method.md` §2 carries STRIDE and LINDDUN; `cwe-top25-2025.md` carries CWE-22; `web-top10-2025.md` carries A03 and A08.
- `odoo.md` is read only after the security gate fires.

**OWASP Top 10 CI/CD Security Risks** (fetched 2026-10-25):

- The ten titles, including "CICD-SEC-3: Dependency Chain Abuse", are at https://owasp.org/www-project-top-10-ci-cd-security-risks/.
- The CICD-SEC-3 page (https://owasp.github.io/www-project-top-10-ci-cd-security-risks/CICD-SEC-03-Dependency-Chain-Abuse) names dependency confusion, dependency hijacking, typosquatting, and brandjacking. It covers pre-install scripts and checksum and signature verification, and does not mention lockfiles by name.
- Repository `OWASP/www-project-top-10-ci-cd-security-risks`: licence CC-BY-SA-4.0 (GitHub API). It was created 2022-07-20, and the CICD-SEC-3 file has a single commit, dated 2022-08-17. The page states no version label.

**OWASP Vulnerable Dependency Management Cheat Sheet:** considered and rejected as a source. It covers responses to vulnerabilities that are already disclosed, not typosquatting, install scripts, or lockfiles.

### 6.2 Floor guard patterns tested

The source script's regexes were run against Python and Odoo samples:

| Expected to flag | Result |
|---|---|
| `self.assertEqual`, `self.assertTrue`, `with self.assertRaises` (the unittest style every Odoo test uses) | Missed by the assertion-removed rule |
| `raise NotImplementedError`, `except Exception: pass` | Missed |
| `# pragma: no cover`, `# nosec`, `# pylint: disable`, `//nolint`, `@SuppressWarnings` | Missed |
| `self.skipTest(...)`, an added `'-standard'` Odoo tag | Missed |
| `cursor.skip(10)`, `stream.skip(1)` in ordinary code | Flagged (false positive) |

### 6.3 Corrections made by the author's own pass

- §1 first said one behavioral case per skill. It is 1 to 3.
- §3 first said v15 removed same-model review layers. It removed only the proposal's model review.
- The mutation probe was first called deterministic. Only the test run is.

### 6.4 Plan review by a fresh-context subagent

A general-purpose subagent with no access to the author's reasoning reviewed §4 against the repo's own rules and files. It was given the plan and the repo's invariants, was told to look for faults only, and had to name a concrete consequence for each finding. The author checked its key citations against the files before acting.

| # | Severity | Finding | Disposition |
|---|---|---|---|
| 1 | HIGH | The assertion rule read removed lines, so an edited expected value, a Phase 1 refactor, the review's own weak-oracle rewrite, or a renamed `it('should …')` test became a HIGH DECISION | Q13: net count per file, no `should`, MODIFIED exempt |
| 2 | HIGH | An approved flag is raised again by each fresh pass: a MEDIUM keeps the loop running, an unresolved HIGH becomes a RELEASE BLOCKER, and exit 1 read as a lint error would never let the loop end | Q11 |
| 3 | HIGH | The probe was placed in step 1, before the contract map that defines its scope existed. The implementer chose the mutation, and no hand-off was defined | Q12 |
| 4 | HIGH | A crash between invert and restore could leave an inverted security check in the tree the user commits | Q12: backup path and leftover check |
| 5 | MEDIUM | The draft claimed dark mode sends new security findings to the user. It does not | Corrected in §2. Q17 adds the rule |
| 6 | MEDIUM | The RED-reason check added little over step 3, read RED output that is not on disk, and misread "Expected 200, Received 404" | Q10: dropped, RED output written to disk |
| 7 | MEDIUM | `@tagged('-…')` matched the standard `'-at_install', 'post_install'` | Fixed: only an added `'-standard'` |
| 8 | MEDIUM | The guard used a different base than the scanner, `git diff HEAD` misses untracked files, and a moved test read as deleted | Fixed: scanner's base, `ls-files --others`, rename detection |
| 9 | MEDIUM | A fixed HIGH for stubs would block legitimate abstract hooks and optional-import fallbacks | Q14 |
| 10 | MEDIUM | The gate wording would fire on Odoo `depends` and lockfile churn, creating threats, tasks, and lint errors | Q16 |
| 11 | LOW | `# nosec` was in both suppression rows | Fixed |
| 12 | LOW | A LOW MECHANICAL performance finding would be fixed with no question | Fixed: always DECISION |
| 13 | LOW | §4.6 left out the version bump, the Phase 1 RED line, README, dark-mode routing, and the `test` script | Fixed |
| 14 | LOW | §2 wrongly said there was one supply-chain question, and CICD-SEC-9 duplicates A08 | Corrected in §2. Q15 |

Non-blocking points: the file name no longer carries a year (Q15), and the probe on later passes now follows the security lens's full rule. Also corrected is the wording that every MEDIUM goes in the digest (a one-way door needs its own answer). Two points were not acted on: the "large allocation on a hot path" line stays, since its findings are LOW, and the remark about the probe's model calls is answered in §4.6.

### 6.5 Downstream measurement

To test whether the floor guard addresses something that actually happens, its patterns were run read-only over the git history of three downstream repositories that use tempa-spec. They are anonymised here because this repository is public:

- **Repo A:** TypeScript (AdonisJS).
- **Repo B:** TypeScript (AdonisJS).
- **Repo C:** Python (Odoo).

**Method:**

- History from the first commit that touched `openspec/changes`, merges excluded.
- An **apply commit** is one that touches a change's `tasks.md`. The other commits in the same period serve as the baseline.
- Each flag was then read by hand: commit message, file stat, and whether removed assertions reappear elsewhere in the same commit, verbatim or rewritten.

| | Apply commits | Other commits |
|---|---|---|
| Commits scanned | 235 | 448 |
| Commits with at least one flag | 19 | 7 |

**Results per rule (apply commits):**

| Rule | Flags | Real weakening on reading | What the flags were |
|---|---|---|---|
| Suppression added | 51 | **Yes, in repo B** | About 40 `@ts-ignore` comments in 6 apply commits in repo B, most carrying the generic text "TypeScript errors suppressed for test files". Repo B's other commits added none. 37 remain in its test folder today. No openspec artifact or `mr-brief.md` mentions them, so the current review let them through. Repo A's `eslint-disable` comments each carry a specific reason (MEDIUM, digest). Repo C's one `# noqa: F401` is a re-export import |
| Test file deleted | 3 | No | Each followed code removed or redesigned under a spec change |
| Skip added | 3 | No | Conditional `self.skipTest` in a test file created by the same commit |
| Fewer assertions in one file | 18 | No | Assertions moved to another test file or a shared helper, rewritten with a wider check (one was an access-control assertion, rewritten in another language and broadened), or removed together with a behaviour the spec changed. Counted across each commit's test files, only 2 of the 18 cases show a drop, and both follow a modified requirement |
| Stub or swallowed exception | 0 | — | — |

**`[security]` tasks**, counted from the archived `tasks.md` files to size §4.2: 194 tasks in 18 of 75 archived changes, with 31 `[Threat` lines across the designs. The count says nothing about whether those tests are weak. Finding that out needs a run of the tests, not a read of the history.

**What changed because of this measurement:**

- The assertion rule counts across the change, not per file (Q18). Skips in new test files are not flagged (Q19). With both rules, the sample yields no false HIGH flags.
- The suppression rule is the part with measured value. It is the one weakening pattern that recurs and that the current review missed.
- The mutation probe is deferred (Q20).

**Limits:**

- Three repositories, with one stack each.
- "Apply commit" is a proxy. A user may commit apply's code without touching `tasks.md`.
- Reading by hand cannot rule out weakening hidden inside a legitimate-looking refactor.
