# Changelog

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
