# Changelog

## 2026.8.28 — 2026-08-28 (schema v12)

- Adds the `hrt-artifact-lint` skill (bundled zero-dependency `lint.cjs`): a deterministic structure lint — hashtag counts, checkbox format, delta headers, capability↔spec-file correspondence, `Covers:`-target existence, `design.md` section presence, unverified External Dependencies rows — with a 23-case test suite. Run from `hrt-adversarial-authoring` (before its reviewers) and `hrt-align-consistency-review` ALIGN, so a cheap model stops miscounting hashtags and grepping by hand
- `hrt-adversarial-authoring`: its Structural Auditor now only does the structural *judgement* calls a linter cannot; the two reviewers spawn concurrently; the Destructive Critic names an overturn condition per finding; `humanizer` runs once over merged output instead of per-section
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
