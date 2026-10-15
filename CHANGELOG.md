# Changelog

## Unreleased (schema v14)

Security approach reworked after comparing it with OWASP, NIST, published practice at Anthropic, OpenAI, Cloudflare and Vercel, and academic work. Evidence and sources: `docs/research/2026-10-15-security-approach-vendored-skills-vs-standards.md`.

- **New `hrt-security-pass` skill replaces three vendored `wshobson/agents` skills** (`stride-analysis-patterns`, `threat-mitigation-mapping`, `security-requirement-extraction`; removed from `skills/vendor/` and `vendor-lock.json`). A tiny `SKILL.md` that holds only the gate (a change touching no trust boundary pays almost nothing), `references/method.md` (STRIDE questions, a surface table, the threat line, the `apply` step) loaded only when the gate fires, and one small file per list, read only for the surfaces a change touches: OWASP Top 10:2025 (web), API Security Top 10:2023, Mobile Top 10 (2024), LLM Top 10 2025, Agentic Top 10 2026, Non-Human Identities Top 10 2025, MITRE CWE Top 25 2025, and Odoo 18+ hints (each point sourced to Odoo's 18.0 and 19.0 docs or source docstrings). The gate also covers secrets, sensitive data in logs, new dependencies, and LLM or agent tool use. Threats use a fixed line `[Threat: <category>, <High|Medium|Low>] → Mitigation (<Cheat Sheet or CWE>)`, or `Security pass: skipped - <reason>`. Threats now carry a severity, and mitigations name an OWASP Cheat Sheet or CWE
- `schema.yaml` (v13 → v14): `specs` and `design` use the same modal word (MUST) for the same gate and both point at `hrt-security-pass`; `design.md` template documents the threat and skip lines
- **`apply` Phase 2 gets a security gate.** `hrt-apply-code-review` runs the repo's own security commands (scripts, pre-commit, CI, scanner configs) scoped to the diff: a finding on a changed line is HIGH, an older one is reported once as LOW and never blocks, no scanner is installed or downloaded, and scanner output is treated as data. A security lens is added to the contract map: it uses the same `hrt-security-pass` reference lists matched to the changed files, with an explicit do-not-report list, and checks that each `[security]` test's RED output exercises the threat. `hrt-mr-brief` Evidence names the scanners run or `no scanner configured`. To limit human and token cost, LOW security findings are reported once as a batch instead of asked one by one, and passes 2 and 3 re-run the lens only if the previous pass raised a security finding (the scanner still re-runs every pass)
- `hrt-artifact-lint`: new WARN-only security gate (proposal/specs name a trust-boundary keyword but `design.md` has neither a threat line nor the skip line; threat line missing category or severity). Eight new cases (38 in `lint.test.cjs`); the keyword list avoids everyday words (token, session, permission, third-party) and the gate also warns when a skip line sits beside threat entries or gives a one-word reason. `hrt-align-consistency-review` judges whether a flagged boundary is real
- README gains a short Security note (gitleaks and osv-scanner as suggested baselines, nothing bundled). Installers (`.sh` and `.ps1`) list `hrt-security-pass` and drop the three removed skills
- Evaluated and not adopted: OWASP ASVS (web-centred, no L1 requirements in V16, CC BY-SA 4.0, needs a lookup script and attribution), a bundled scanner, a persistent repo-level threat model, NIST/CISA mapping
- Not yet exercised on a real change, and no study found that plan-time security text improves downstream code security; there is no benchmark harness here, so this has no measured evidence

### Earlier in Unreleased (schema v13 at the time)


Ideas taken from cursor/plugins `pstack` after a line-by-line comparison against this schema. Skills and installer text only; `schema.yaml` is untouched, so no version bump.

- `hrt-apply-code-review`: the weak-oracle gate now lists the shapes of a weak test (existence or truthiness only, call-only, expected value computed by the code under test or a restated constant, assertions on data the test built) and how to fix one (one concrete input, assert the literal result; assert a mock's payload; pair an absence with a presence). Relation checks and type-level tests are kept. Same trigger and same mandatory conditions as before; findings are now called "weak oracle" instead of "tautological oracle"
- `hrt-adversarial-authoring` (`design`): seams are reviewed against `to-spec`'s rule, which the schema had not carried over: test at the highest available entry point, fewer seams is better (ideal one). The Auditor flags seams that test an internal collaborator and seams a higher one would cover; the Critic asks whether a higher existing boundary already covers a seam, and names one structurally different shape for a Decision that creates a new module or seam
- `hrt-mr-brief`: Blast Radius says what it rests on (suite result, a design Risk, or the diff alone) and writes "not checked beyond the diff" when it is the diff alone
- Installers (`.sh` and `.ps1`) list `hrt-mr-brief` in their skill echo; AGENTS.md skill count corrected to 19
- The pinned commit of the `mattpocock/skills` entries in `vendor-lock.json` moved to `49dd158d1`; their file contents did not change
- Not adopted from pstack: multi-model arena/interrogate/swarm, the task-type router, the confidence ladder, a reverse diff-to-task check (`apply`'s "No scope drift" line already covers it), and attack-the-premise (`diagnosing-bugs` ranked hypotheses and the 3-pass review cap cover it)
- Not yet exercised on a real change; there is no benchmark harness, so none of these has measured evidence

## 2026.10.8 — 2026-10-08 (schema v13)

- **Parallel `apply`, declared in `tasks.md`.** A task group may carry one `Depends on: none | 1, 2` line under its heading. `apply` PHASE 1 then schedules a rolling frontier (as in mattpocock's `implement-spec`): one subagent per group, a finished group immediately frees newly unblocked ones. A group without the line depends on the group before it, so existing `tasks.md` files behave as before. Parallel is never the default: `apply` shows the group graph as ASCII, states the concurrency limit `min(floor(cores / 3), floor(available GB / 2))`, and asks whether to run concurrently or in order (no question in dark mode, which runs in order; limit below 2 or unreadable also runs in order). One shared working tree, no worktrees; only the orchestrator ticks checkboxes; the full suite runs only at quiet points. There is deliberately no `Touches:` / `Test:` line to keep `tasks.md` short: the declared dependencies are the isolation, `align` checks they are true, and `apply` stops and reports a missing edge if two concurrent groups change the same file or a test fails in code the group did not change
- `hrt-artifact-lint` checks the group graph (unknown group id, self-dependency, cycle, malformed value; metadata after a group's first checkbox or inside an HTML comment is ignored), with seven new test cases (30 in `lint.test.cjs`). `hrt-align-consistency-review` gains a `tasks graph` dimension (8 → 9) that judges whether the declared graph is true
- **Prefactoring** (from `to-tickets`): `design` records a Decision when the current shape of the code makes a slice hard to build or test; `tasks` turns it into an early, behaviour-preserving group the slices depend on, verifiable by a green suite and dropped if no slice needs it. Shared edits that independent slices would both make go there too
- **`apply` PHASE 3** writes `mr-brief.md` next to `tasks.md` with the new local `hrt-mr-brief` skill (Summary / Evidence / Merge Danger, adapted from mattpocock's `pr` and Dex Horthy's `show-me`), sourced from the change's artifacts and real test runs, for the reviewer to paste as a review comment. PHASE 1 now keeps each task's RED output so Evidence can quote it. `apply` still never commits, pushes, or touches the review system
- Refreshes the vendored `mattpocock/skills` (`grilling`, `tdd`, `diagnosing-bugs`, `research`) to `f3fc563` (`CONTEXT.md` → `GLOSSARY.md`, small wording additions). `scripts/vendor-skills.cjs` gains `--source <owner/repo>` to limit `--check` / `--apply` to one upstream repo. The other vendored skills are unchanged
- Not yet exercised on a real change: the PHASE 1 scheduling, the confirmation question, and `hrt-mr-brief` are prompt rules covered by review, not by tests

## 2026.9.10 — 2026-09-10 (schema v12)

- `hrt-adversarial-authoring` and `hrt-align-consistency-review` gain a **consequence gate**: a finding is only actionable (`## Required Changes` / HIGH / MEDIUM) if it names the concrete thing a reader or implementer hits when it goes unfixed. Strength-of-argument critique that names no consequence drops to the existing non-blocking batch — `## Suggested Improvements` in `hrt-adversarial-authoring`, LOW DECISION findings in `hrt-align-consistency-review` — shown to the user once, never a per-item question
- Both review skills now treat "defer it / note it / accept the drift" as a non-alternative (it does not make a finding a genuine user decision), and neither auto-resolves a finding just because a clean fix exists when a competent author could reasonably pick a different remedy
- The `specs` and `design` adversarial reviewers no longer re-open a premise `proposal.md` settled — a genuine premise error goes to Risks / Open Questions, not a Required Change. The `hrt-adversarial-authoring` step-3 lane note names which lens owns what
- `hrt-align-consistency-review`: VERIFY no longer skips on a LOW DECISION finding (only pure MECHANICAL + clean lint skips), and its fresh-context pass explicitly re-checks whether a finding ALIGN placed at LOW should be HIGH/MEDIUM — so the consequence gate cannot quietly demote a real issue past the independent recheck
- `design` instruction: restores upstream's anti-restatement guards on Context and Goals/Non-Goals (dropped in v12's rewrite) so `design.md` points at the proposal instead of re-telling its problem statement and scope. Dedups `discovery` vs `design` — `design.md`'s Decisions is the sole home for rejected technical alternatives, `discovery.md`'s Key Decisions carries scope/direction decisions only; templates updated to match
- Research: `docs/research/2026-09-09-technical-writing-adversarial-drafting-skills.md` (ecosystem pass behind these changes) and `docs/research/2026-09-07-llm-as-judge-reliability-2026.md`

## 2026.8.28 — 2026-08-28 (schema v12)

- Adds the `hrt-artifact-lint` skill (bundled zero-dependency `lint.cjs`): a deterministic structure lint — hashtag counts, checkbox format, delta headers, capability↔spec-file correspondence, `Covers:`-target existence, `design.md` section presence, unverified External Dependencies rows — with a 23-case test suite. Run from `hrt-adversarial-authoring` (before its reviewers) and `hrt-align-consistency-review` ALIGN, so a cheap model stops miscounting hashtags and grepping by hand
- `hrt-adversarial-authoring`: its Structural Auditor now only does the structural _judgement_ calls a linter cannot; the two reviewers spawn concurrently; the Destructive Critic names an overturn condition per finding; `humanizer` runs once over merged output instead of per-section
- Adds the `hrt-dark-mode-routing` skill: single source of truth for where a dark-mode finding goes. The per-phase carve-out paragraphs in `proposal`/`specs`/`design`/`align`/`apply` collapse to one pointer line each
- `discovery` interview convergence is an explicit checklist (every decision has a rationale + rejected alternative, every outcome/assumption/open-question recorded, user confirms in their own words) instead of an open-ended "until the user confirms"
- `hrt-align-consistency-review`: VERIFY is skipped when ALIGN raised no HIGH/MEDIUM and the lint ran clean; after 3 cycles the loop asks the user whether to continue (checkpoint, not a cap); each recorded decision and resolved HIGH gets a source pointer (doc + section)
- `apply` reads `align.md` + `tasks.md` as binding primary context, following each align.md entry's source pointer to the exact passage instead of re-reading the other four artifacts whole
- `hrt-adversarial-authoring`: a thin `design.md` (no code surface, at most one decision) gets the Destructive Critic only, not the Structural Auditor — nothing for the Auditor's judgement checks to find at that size
- `hrt-align-consistency-review`: the codebase-claim check records what it verified; cycle 2+ re-checks only new or changed claims, since the codebase is frozen until `apply`
- Adds the `hrt-change-size-gate` skill, pointed to from `proposal`'s What Changes bullet: when the draft holds two or more independent, non-dependent, non-capability-sharing slices, the agent stops and asks the user whether to split — default one change, agent never splits on its own, still escalates in dark mode
- Adds `openspec/BACKLOG.md`, a persistent parking lot for slices deferred by that gate; `discovery` reads it as interview context, the `hrt-change-size-gate` skill writes and prunes it
- Raises seams to a first-class `design.md` section (`## Shape / Seams`), required whenever the change adds callable code; makes `design.md` itself mandatory for every change (thin sections for a pure config/data/infra change), so `align` treats its absence as HIGH
- Adds a `## External Dependencies` table to `proposal.md`: one row per out-of-codebase claim feasibility rests on, each needing a primary source or a completed `research` run — makes the `research`-skill trigger a structural "no" row instead of an agent judgment call, checked by `hrt-adversarial-authoring`'s Destructive Critic
- Adds a `specs <-> seams` dimension to `align`'s consistency review (7 → 8 dimensions, always MEDIUM) and a WALKTHROUGH prompt pointing the user at the seams
- `hrt-adversarial-authoring` reviews the new seams in its `design` pass — Structural Auditor checks each `Covers:` target exists, Destructive Critic checks the boundary choice
- `apply` PHASE 1 now verifies the `design.md` seam against real code instead of choosing one; a mismatch is a blocker (routed to `hrt-dark-mode-decision-gate` in dark +implementation)
- Adds an expand → migrate → contract exception to `tasks.md` for wide mechanical refactors
- Adds the `hrt-backlog-reconcile` skill: user-invoked (`/hrt-backlog-reconcile`), reconciles `openspec/BACKLOG.md` against the shipped specs and proposes deleting covered entries — outside the pipeline, run by hand after `openspec archive`
- Vendors the external skills (`grilling`, `tdd`, `diagnosing-bugs`, `research` from `mattpocock/skills`; `stride-analysis-patterns`, `threat-mitigation-mapping`, `security-requirement-extraction` from `wshobson/agents`; `humanizer` from `blader/humanizer`) into `skills/vendor/<name>/` with per-file SHA-256 pins in `skills/vendor/vendor-lock.json`. The installer drops from four `npx skills add` calls (one per source repo, four network clones, three third-party repos in the critical path) to one for this repo's `skills/`. Adds `scripts/vendor-skills.cjs` (`--check` / `--apply`) to refresh the copies from upstream, with an 11-case test suite

## 2026.8.14 — 2026-08-14 (schema v11)

- Gates MECHANICAL/anchored auto-resolve in `align`'s consistency review behind deterministic checks (was judgement-only)
- Cites `plain-language-writing`'s COMMS rule set at each user-surfacing point in the `hrt-*` skills, not once at the top
- Forbids spec-archive/sync tasks in `tasks.md`
- Adds `humanizer` skill, cited from `hrt-adversarial-authoring` (Author Notes, reviewer output), `hrt-align-consistency-review`, and `hrt-apply-code-review` (all agent-reasoning surfaces, distinct from `plain-language-writing`'s COMMS/ARTIFACT scope)
- Adds `research` skill (`mattpocock/skills`), pointed to from `discovery`/`proposal` for feasibility claims resting on unverified external facts (third-party API behavior, library limits, standard specs)

## 2026.8.10 — 2026-08-09

- Installer falls back to `git init` + `fetch --depth 1` when `--branch` fails, so a commit SHA can be passed as install ref
- Mirrors the SHA-ref fallback in the PowerShell installer
- Adds `diagnosing-bugs` skill pointer from apply Phase 1 (test keeps failing) and Phase 2's `hrt-apply-code-review` resolution step
- Moves codebase-exploration tooling preference out of duplicated instruction strings into `openspec/config.yaml`'s `context:` field
- Adds `scripts/merge-config.cjs`, a real YAML read-modify-write merger, so an existing `context:` (multiline/block-scalar/commented) survives install
- Adds 37-test suite for `merge-config.cjs`, fixing 4 real bugs: marker-version-drift, marker-as-substring false idempotency, followed symlinked config path, and raw stack traces on filesystem errors
- Reorders proposal/specs/design instructions to front-load the `hrt-adversarial-authoring` trigger (no behavior change)
- Adds a causal-structure (PROBLEM/WHY/CONCLUSION) rule to `plain-language-writing`'s COMMS rule set
- Adds an optional Shape subsection to `design.md` for pre-implementation signatures/file-tree diffs
- Enforces vertical-slice headings in `tasks.md`, with a demoability test and explicit blocking-relationship notation per heading

## 2026.8.9 — 2026-08-06

- Points `discovery` at the `grilling` skill directly, dropping the dead `grill-me` pointer (now `disable-model-invocation`)
- Filters annotated tag dereferences (`^{}`) when the installer resolves the latest tag
- Fixes README title (was still `openspec-schema` post-rename) and documents tag-pin install usage

## 2026.8.8 — 2026-08-06

- Installer now defaults to the newest git tag instead of `master`, with an optional positional arg to pin a ref
- Renames schema `hash` → `tempa-spec` (Indonesian forging metaphor), bumps schema version 7→8 as a breaking rename

## 2026.8.7 — 2026-08-03

- Prefers `codegraph` over `codebase-memory-mcp` for codebase exploration (OOM risk on large repos) and requires ripgrep over built-in grep/glob
- Simplifies the align walkthrough to one generic question per round (was per-file-chunk) and adds a fresh-context VERIFY pass before findings reach the user
- Adds a PowerShell installer (`install-schema.ps1`) mirroring the bash one, and fixes a missing `grilling` skill dependency in both

## 2026.7.5 — 2026-07-19

- Adds traceability from `tasks` to specs' negative scenarios and design's threat/mitigation entries; adds a matching design→tasks consistency dimension to `align`
- Adds a weak/tautological-oracle smell check to apply Phase 2 code review

## 2026.7.4 — 2026-07-19

- Wires `design` into `hrt-adversarial-authoring` (draft-then-review) and adds Migration Plan / Open Questions sections to its template
- Splits the adversarial-authoring reviewer into two lenses: Destructive Critic (content/logic) and Structural Auditor (format/traceability)
- Installs skills non-interactively for all agents and auto-symlinks against detected coding agents
- Requires a human walkthrough in the align phase (old loop could exit without human contact)
- Renames `codebase-mcp` references to `codebase-memory-mcp`

## 2026.7.3 — 2026-07-16

- Extracts long inline instructions into installable skills (`grill-me`, `tdd`, wshobson security set, plus new local `hrt-align-consistency-review`, `hrt-apply-code-review`, `hrt-adversarial-authoring`)
- Adds a gated security pass (STRIDE, mitigation-mapping, security-requirement-extraction) to design/specs when a trust boundary is hit
- Streamlines capabilities contract guidance in the schema's proposal instruction
- Restructures the align loop to require a completed 7-dimension consistency map before severity classification
- Makes any failing test or lint an automatic HIGH finding in the apply review loop, independent of subagent judgement

## 2026.7.2 — 2026-07-12

- Hardens the discovery gate (explicit user confirmation before writing `discovery.md`) and verifies design/tasks claims against the actual codebase
- Adds `AGENTS.md` repo guidance
- Runs apply Phase 2 review via subagent
- Reformats schema instructions for readability
- Updates LICENSE copyright holder to PT Hash Rekayasa Teknologi
- Adds `align` phase and post-apply code review loop (both HIGH/MEDIUM/LOW, MECHANICAL/DECISION tagged; unresolved HIGH blocks progress)
- Hardens installer: restricts copied files to `schema.yaml` + `templates/`, fixes config regex to match only the top-level `schema:` key
- Initial `hash` OpenSpec workflow schema and local installer (discovery → proposal → {specs, design} → tasks → apply)
