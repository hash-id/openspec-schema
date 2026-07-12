# Benchmark: Skill repos & custom OpenSpec schemas vs `hash` schema

**Date:** 2026-07-12
**Scope:** survey external Claude Code skill repositories and community OpenSpec schemas for techniques that could improve `openspec/schemas/hash/schema.yaml`. Pure research — no changes applied from this document. See git log for what was actually adopted, if anything, in later commits.
**Status:** 3 research passes completed same day (see [§6 Run log](#6-run-log)). 4 candidates open, 0 applied.

> Prior benchmark (before this document) already applied to `hash` schema.yaml: `mattpocock/skills` (`productivity/grilling`, `engineering/tdd`, `engineering/code-review`, `engineering/domain-modeling`). That pass added discovery closing-confirmation guard, TDD seam-agreement + anti-patterns, review-phase smell baseline, align-phase codebase cross-reference — not repeated in detail here.

## Contents

1. [Candidates — action needed](#1-candidates--action-needed)
2. [`obra/superpowers` ecosystem](#2-obrasuperpowers-ecosystem)
3. [Other skill repos (shortlist)](#3-other-skill-repos-shortlist)
4. [Custom OpenSpec schemas](#4-custom-openspec-schemas)
5. [Independent spec-driven-dev tools](#5-independent-spec-driven-dev-tools)
6. [Run log](#6-run-log)

---

## 1. Candidates — action needed

Everything below is surfaced, not applied. Ordered by strength of signal.

| # | Candidate | Source | Touches | Status |
|---|---|---|---|---|
| 1 | Adversarial framing for align/apply-REVIEW's stop condition — don't let a suspiciously-clean pass 1 exit early unchallenged | BMAD adversarial-review | align, apply REVIEW | **Open — strongest signal this doc has** |
| 2 | `defer` as a third DECISION outcome (real, out-of-scope, explicitly logged) alongside resolve-now / block | BMAD `bmad-code-review` 4-way routing | align, apply REVIEW | Open |
| 3 | Separate Spec Compliance (✅/❌/⚠️) vs Code Quality verdict in apply REVIEW, instead of one merged HIGH/MEDIUM/LOW list | `obra/superpowers` `requesting-code-review` | apply REVIEW | Open — oldest unactioned item (from the very first pass) |
| 4 | Standing, repo-level constraints file (vs `hash`'s per-change Global Constraints restatement) | spec-kit `constitution.md` | proposal, design, align | Open — bigger structural change, needs its own discovery pass |
| 4a | Severity tier above HIGH for structural/constitution-breaking findings | spec-kit `/speckit.analyze` | align | Contingent on #4 — not standalone |

Already applied (confirmed present in the working tree's uncommitted `schema.yaml` diff, no longer open):

- File:line evidence + codebase cross-check in align findings
- TDD seam-agreement + anti-patterns (implementation-coupled tests, tautological tests, horizontal slicing)
- Review-phase smell baseline (12 items: Mysterious Name, Duplicated Code, Feature Envy, ...)
- Circuit breaker language for repeated test failure — **check**: not yet confirmed reworded to a hard 3-strikes threshold; verify against current `schema.yaml` apply IMPLEMENT text before closing.

Rejected (surveyed, no concrete `hash` pain point — reasons kept with each entry in the sections below, not repeated here):

- `retrospective` artifact · `brainstorm` as a phase separate from `discovery` · ADR immutable-supersession chain · AsyncAPI-style stage gates · wave-based parallel task execution (2 independent sightings) · standards auto-injection · finding cap at 50.

---

## 2. `obra/superpowers` ecosystem

Repos: `obra/superpowers` (core, 14 skills, ~252k stars), `obra/superpowers-lab` (experimental), `obra/superpowers-marketplace` (plugin distribution), `obra/superpowers-skills` (community-editable), `obra/superpowers-developing-for-claude-code`.

Core skill chain, each hands off to the next via a "REQUIRED SUB-SKILL" pointer:

```
brainstorming -> writing-plans -> executing-plans | subagent-driven-development
              -> requesting-code-review / receiving-code-review
              -> finishing-a-development-branch
```

Supporting skills: `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `dispatching-parallel-agents`, `using-git-worktrees`, `writing-skills`, `using-superpowers` (meta-skill that forces skill invocation before any action).

### brainstorming (~ discovery)

- Hard-gates all implementation until a design is presented and approved. Explicitly rejects "too simple to need a design" as an anti-pattern.
- Process: explore project context → ask one clarifying question at a time (multiple-choice preferred) → propose 2-3 approaches with trade-offs and a recommendation → present design in sections, get approval per section → write design doc to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` → **spec self-review** (placeholders, contradictions, ambiguity, scope) → user reviews the written spec file → hand off to `writing-plans`.
- Flags oversized requests ("chat + billing + analytics") for decomposition into sub-projects *before* spending questions on details.

### writing-plans

- Plans assume "the engineer has zero context for our codebase and questionable taste." Tasks are bite-sized (2-5 min actions: write failing test → watch it fail → minimal code → tests pass → commit).
- Every plan requires a **Global Constraints** section — project-wide requirements (version floors, naming/copy rules) "copied verbatim from the spec" that every task implicitly inherits. Concrete mechanism for keeping downstream tasks tied to source-of-truth requirements. Restated per-plan, not standing (contrast with [candidate #4](#1-candidates--action-needed)).

### Verifying plans against actual codebase state

- `executing-plans` Step 1 requires "review critically — identify any questions or concerns about the plan" before creating todos; stops execution on "plan has critical gaps" rather than guessing.
- `subagent-driven-development`'s task-reviewer template explicitly instructs the reviewer **not to trust the implementer's self-report**: "Do Not Trust the Report... Design rationales in the report are claims too... Judge the code on its merits." Requires file:line evidence for every finding, cross-checked against the diff.
- Reviewer may inspect code *outside* the diff only to verify a "concrete, named risk" (e.g. changed lock ordering or API contract) — scoped mechanism for reality-checking rather than open-ended exploration.

### Multi-pass review + severity classification (most directly relevant finding of the original pass)

- Two review tiers: **task-level review** (`task-reviewer-prompt.md`, after each task) and a **broad whole-branch review** (`code-reviewer.md`, at the end, before merge).
- Both use identical three-tier severity: **Critical (Must Fix)** / **Important (Should Fix)** / **Minor (Nice to Have)** — with an explicit instruction to "categorize by actual severity. Not everything is Critical," and to acknowledge strengths before listing issues.
- Task reviewer returns a separate **Spec Compliance verdict** (✅ / ❌ / ⚠️ "cannot verify from diff") distinct from the **Code Quality verdict** — spec-gap findings and quality findings tracked independently, not merged into one list. → [candidate #3](#1-candidates--action-needed).
- Loop mechanics: findings trigger "dispatch fix subagent for Critical/Important findings" → re-review, repeated until the task reviewer approves both spec and quality before marking the task complete.
- `receiving-code-review` governs the human/agent's response to feedback: forbids performative agreement ("You're absolutely right!"), requires restating the requirement, verifying against codebase reality, and reasoned pushback if the reviewer is wrong.
- `systematic-debugging` has its own 4-phase gate (root cause investigation → pattern analysis → hypothesis testing → implementation) with an explicit escalation rule: **3+ fixes failed → stop and question the architecture**.

### 5.0.x update (confirmed in the second pass): subagent review loop removed, but only at the plan/design stage

Releases 5.0.4–5.0.7 (Mar–May 2026) dropped the **subagent** Spec Review Loop and Plan Review Loop in `brainstorming` and `writing-plans`, replacing both with an inline Spec/Plan Self-Review checklist. Stated reason: dispatching a fresh subagent for design/plan review added ~25 min of overhead with no measured quality gain; the inline checklist catches "3-5 real bugs in ~30s." 5.0.4 also cut max review iterations from 5 to 3 and moved to single whole-plan review instead of chunk-by-chunk.

Checked whether this also hit `requesting-code-review` (the *implementation*-review skill, i.e. the one benchmarked above) — **it did not**. That skill still dispatches a `general-purpose` subagent with "precisely crafted context... never your session's history," and still uses Critical/Important/Minor. The removal is scoped to pre-code (design/plan) review, not post-code (implementation) review.

**Relevance to `hash`:** a datapoint *for* `hash`'s current design, not against it. `hash`'s `align` phase (the design/plan-equivalent stage) is already a same-session self-review loop, not a subagent dispatch — matches what superpowers converged on after measuring the subagent version was slower with no quality gain. `hash`'s apply REVIEW phase (the implementation stage) already uses a fresh subagent per pass — matches what superpowers kept unchanged. No action needed; both of `hash`'s loop mechanics already match the post-5.0.4 shape. Worth remembering so a future pass doesn't "fix" align into a subagent loop based on the stale pre-5.0.4 description of `writing-plans`.

---

## 3. Other skill repos (shortlist)

1. **`croffasia/cc-blueprint-toolkit`** (~192 stars) — "Blueprint" plugin, DABI lifecycle (Define → Architect → Build → Iterate). 13 skills / 8 agents turning requirements into "blueprints" with **numbered requirements and testable acceptance criteria**, decomposed into parallel wave-based task graphs executed by an automated validation loop. Novel: acceptance-criteria-as-numbered-IDs, and parallelized (not just sequential) task execution. First sighting of the wave-parallel pattern — see AWS Kiro in [§5](#5-independent-spec-driven-dev-tools) for the second.
2. **`anthropics/skills`** (official, ~160k stars) — `doc-coauthoring` skill: structured iterative doc-writing (proposals/tech specs/decision docs), focused on context transfer and reader-verification of drafts. Useful as the "canonical" baseline for design-doc skills.
3. **`JacobLinCool/ux-discovery-interviewer-skill`** (~4 stars) — structured UX research discovery interviews, vague idea → discovery insights. Narrower than `brainstorming` but purpose-built for the interview phase alone.
4. **"Requirements Interviewer" skill** (mcpmarket.com listing, origin repo unclear) — one-at-a-time "why"-focused questions with a running decision scratchpad synthesized into docs at the end. Conceptually close to `brainstorming` but tracks decisions live rather than only at doc-write time.
5. **`hesreallyhim/awesome-claude-code`** — curated meta-list (see the Blueprint recommendation thread, issues #1306/#1307). Not a skill itself; useful as an ongoing discovery surface.

Sources: [obra/superpowers](https://github.com/obra/superpowers) · [obra/superpowers-lab](https://github.com/obra/superpowers-lab) · [obra/superpowers-marketplace](https://github.com/obra/superpowers-marketplace) · [obra/superpowers-skills](https://github.com/obra/superpowers-skills) · [croffasia/cc-blueprint-toolkit](https://github.com/croffasia/cc-blueprint-toolkit) · [Blueprint issue thread #1306](https://github.com/hesreallyhim/awesome-claude-code/issues/1306) · [anthropics/skills doc-coauthoring](https://github.com/anthropics/skills/blob/main/skills/doc-coauthoring/SKILL.md) · [ux-discovery-interviewer-skill](https://github.com/JacobLinCool/ux-discovery-interviewer-skill) · [Requirements Interviewer listing](https://mcpmarket.com/tools/skills/requirements-interviewer-1)

---

## 4. Custom OpenSpec schemas

### (a) Baseline — vanilla `spec-driven` schema

`Fission-AI/OpenSpec`, `schemas/spec-driven/schema.yaml`. Pipeline: `proposal -> specs -> design -> tasks`, then `apply`. `design` is optional (created only for cross-cutting changes, new dependencies, security/migration complexity, etc.). Specs use delta operations (ADDED/MODIFIED/REMOVED/RENAMED Requirements, `####` Scenario headers, WHEN/THEN). `apply` just tracks `tasks.md` checkboxes with one generic instruction — **no built-in review/verification loop, no severity taxonomy**. This is the floor `hash` already diverges from (discovery phase, align phase, multi-pass TDD+review apply are all `hash`-only additions).

Schema customization is first-class in OpenSpec: `openspec/schemas/<name>/schema.yaml` + `templates/`, forkable via `openspec schema fork`, validated via `openspec schema validate`, resolution order CLI flag → change metadata → project config → default. (`docs/opsx.md`, new since the original pass, documents a workflow-engine rewrite generalizing phase-locked progression into action-based dependency graphs — schema.yaml is the same extension point `hash` already uses; no new technique to adopt, see [§6](#6-run-log).)

Docs: [customization.md](https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md) · [schema.yaml](https://github.com/Fission-AI/OpenSpec/blob/main/schemas/spec-driven/schema.yaml) · [opsx.md](https://github.com/Fission-AI/OpenSpec/blob/main/docs/opsx.md)

### (b) Community schemas found

OpenSpec's docs maintain an explicit community-schema table (modeled on spec-kit's extension catalog). Two substantive repos found, six named schemas total — re-checked in the second pass, unchanged (same commit/star/fork counts trending up, no new schema added):

**`intent-driven-dev/openspec-schemas`** ([repo](https://github.com/intent-driven-dev/openspec-schemas)):

- **`intent-driven`**: `proposal -> specs -> design -> adr -> tasks`. Adds a repo-level `adr/` folder (outside `openspec/`) for durable Architecture Decision Records, separate from the per-change `openspec/changes/` tree. ADRs are **immutable once accepted** — never edit a prior ADR, write a new one with `Supersedes:` pointing at the old one; design/tasks steps must walk the supersession graph to find the in-force decision set. Specs use Gherkin GIVEN/WHEN/THEN inside OpenSpec's normal delta-merge wrapper. *Rejected for `hash`: scale mismatch, no current need for durable cross-change ADRs.*
- **`minimalist`**: collapses to `specs -> tasks` only, for low-complexity work.
- **`event-driven`**: `event-storming -> event-modeling -> specs -> design -> asyncapi -> tasks`, with explicit stage gates (e.g. AsyncAPI contract must validate via `asyncapi-cli validate` before tasks planning can begin) and event-storming as a discovery front-end. *Rejected for `hash`: already has a lightweight equivalent via `openspec validate --strict` in the align loop.*
- **`behaviour-driven`**, **`spec-driven-with-adr`** — listed, not deep-dived.

**`JiangWay/openspec-schemas`** ([repo](https://github.com/JiangWay/openspec-schemas)), schema **`superpowers-bridge`** — the most structurally divergent, and the closest in spirit to `hash` (deliberately bridges OpenSpec to `obra/superpowers`):

Pipeline: `brainstorm -> proposal -> specs -> design -> tasks -> plan -> verify -> retrospective`

- `brainstorm`: raw, unstructured capture preceding proposal — `design.md` is a *later transformation* of it, not itself the capture. *Rejected for `hash`: discovery (grill-me-style interview) already covers this ground.*
- `plan`: separate micro-task decomposition step after `tasks`, via a dedicated skill.
- `verify`: post-implementation gate with a **PASS / PASS-WITH-WARNINGS / FAIL** tri-state decision and numbered structural/task/sync/coherence checks, including a "deferred dogfood vs automated-test equivalence" gap-tracking table. First sighting of a tri-state verdict — see BMAD in [§5](#5-independent-spec-driven-dev-tools) for the third.
- `retrospective`: distinct evidence-first artifact (git log stats; §1–§6 sections: Wins/Misses/Deviations/Skill-compliance/Surprises/Promote-candidates) with a 🔴/🟡/📌 severity scheme for misses, and an explicit non-rewrite/forward-pointer policy for correcting stale retros (never rewrite a past retro — append a pointer to the correction). *Rejected for `hash`: no current pain point it solves.*
- `apply` phase mandates git worktrees + subagent-per-task execution with transitive TDD (red-green-refactor) and code-review enforcement.
- Deliberate step ordering fix: `verify -> retrospective -> archive -> PR` — PR is the *last* step, not first.
- Notable provenance: this schema began as OpenSpec core PR #970 (`sdd-plus-superpowers`) and was redirected to a community repo after maintainer review — i.e. OpenSpec's maintainers deliberately keep superpowers-style integration out of core.

### (c) Coverage note

Beyond these two repos, no other custom schemas surfaced despite multiple query variants (`OpenSpec schema.yaml custom`, `site:github.com "openspec/schemas"`, `Fission-AI OpenSpec custom schema`, `openspec-schema`). A few forks exist (`examine928/OpenSpec-zcode`, `studyzy/OpenSpec-cn`, `hestudy/OpenSpec-Plus`) but read as localization/rebrand forks, not structural innovations — not deep-dived. **Genuinely young/niche ecosystem: 6 named community schemas across 2 repos**, confirmed unchanged across two passes five months apart in the doc's own timeline.

---

## 5. Independent spec-driven-dev tools

Everything in §2–§4 sits inside one lineage (`obra/superpowers` + its OpenSpec bridges/forks). This section deliberately looks outside it, to see whether unrelated projects converge on the same mechanisms or reveal blind spots. Four found: `github/spec-kit` (official GitHub, ~90k stars), `bmad-code-org/BMAD-METHOD` (agile-agent framework), AWS `kiro.dev` (product IDE), `buildermethods/agent-os` (standards-injection system). Ordered by relevance to `hash`.

### `bmad-code-org/BMAD-METHOD` — adversarial review + four-way finding routing (strongest find overall)

Pipeline: Analysis (optional) → Planning (PRD, UX) → Solutioning (architecture, epics/stories, readiness gate) → Implementation (sprint, story prep, `bmad-dev-story`, `bmad-code-review`).

- **`bmad-check-implementation-readiness`** gates entry to the Implementation phase with a **PASS / CONCERNS / FAIL** verdict — a three-state gate, distinct from `hash`'s align loop (which just stops-or-continues based on HIGH/MEDIUM count) and structurally similar to (a third independent sighting of) `JiangWay`'s PASS/PASS-WITH-WARNINGS/FAIL ([§4b](#4-custom-openspec-schemas)). Three unrelated projects converging on a tri-state verdict instead of a binary pass/fail is a real signal, not a coincidence.
- **`bmad-code-review`** (source: `src/bmm-skills/4-implementation/bmad-code-review/steps/step-03-triage.md`) uses a 3-tier severity (`low`/`medium`/`high` — same shape as `hash`) but routes every finding into **four** buckets instead of `hash`'s two: `patch` (auto-fixable, unambiguous — matches `hash`'s MECHANICAL), `decision_needed` (matches `hash`'s DECISION), plus two `hash` doesn't have: **`defer`** (a real, pre-existing problem outside the current change's scope — acknowledged but explicitly not blocking) and **`dismiss`** (flagged but judged a false positive or already handled). Clean-review output is "✅ Clean review, all layers passed" only when zero findings survive triage across all four buckets, not just zero HIGH/MEDIUM. → [candidate #2](#1-candidates--action-needed).
- **Adversarial review** (`docs/explanation/adversarial-review.md`) is the more structurally novel piece: the reviewer is instructed to assume defects exist and must produce findings — "zero findings triggers a halt: re-analyze or explain why" — inverting `hash`'s stop condition, which currently treats a clean pass (no HIGH/no MEDIUM) as the *good*, early-exit outcome. BMAD's version treats an unnaturally clean first pass as suspicious rather than a sign to stop. It also explicitly plans for false positives ("the AI will generate false positives intentionally... you decide what's real") and reviews without access to the implementer's own reasoning/rationale (information asymmetry) to avoid confirmation bias — same spirit as `obra/superpowers`'s "Do Not Trust the Report," but goes one step further by making the *absence* of findings itself a thing to interrogate, not just distrusting a self-report that does exist. → [candidate #1](#1-candidates--action-needed).

**Relevance:** `hash`'s align and apply-REVIEW loops both currently stop as soon as a pass is clean — exactly the pattern BMAD's adversarial-review doc argues against (a suspiciously-clean pass 1 of 3 is more likely under-scrutiny than genuine quality). And `hash`'s DECISION findings currently have no `defer` lane — a real-but-out-of-scope issue found mid-align or mid-review either gets forced into a same-change decision or silently dropped.

### `github/spec-kit` — `/speckit.analyze`: 4-tier severity + finding cap + a standing constitution

Pipeline: `constitution -> specify -> plan -> tasks -> implement`, plus optional `clarify` / `analyze` / `checklist`.

- **`constitution.md`** is a *standing, repo-level* artifact (`.specify/memory/constitution.md`), written once and referenced by every downstream phase as a MUST/SHOULD rule set — distinct from `hash`'s "Global Constraints" ([§2](#2-obrasuperpowers-ecosystem)), which live inside a single plan/proposal and get restated per change. spec-kit's version persists across changes instead of being copied each time. → [candidate #4](#1-candidates--action-needed).
- **`/speckit.analyze`** (source: `templates/commands/analyze.md`) runs a read-only cross-artifact pass over `spec.md`/`plan.md`/`tasks.md` with a **4-tier** severity scheme — CRITICAL / HIGH / MEDIUM / LOW — where CRITICAL is reserved specifically for constitution violations and missing-core-artifact cases, split out from HIGH rather than folded into it. It also **caps findings at 50 per run** for deterministic, bounded output (*rejected for `hash`: no evidence of runaway finding counts in practice*), and builds an explicit "semantic inventory" (requirements, tasks, rules extracted into structured form) as a distinct step before detection runs, rather than detecting directly off the raw prose. → [candidate #4a](#1-candidates--action-needed).
- Caveat found directly in spec-kit's own docs: `clarify`/`analyze`/`checklist` are described as *advisory*, not blocking gates — nothing stops `implement` if they're skipped. Weaker than `hash`'s align loop, which hard-blocks apply on unresolved HIGH.

**Relevance:** `hash`'s align phase already does the cross-artifact-consistency job `/speckit.analyze` does, and already blocks on HIGH (stronger than spec-kit here). Two things spec-kit does that `hash` doesn't: a severity tier above HIGH for structural/constitution-breaking findings, and a repo-level standing constraints file. Neither is a clear win yet.

### AWS Kiro — wave-based parallel task execution (second independent sighting)

`requirements.md -> design.md -> tasks.md`, then execution builds a dependency graph over tasks.md and runs independent tasks concurrently in "waves" rather than strictly sequentially. Second unrelated project (after `croffasia/cc-blueprint-toolkit`, [§3](#3-other-skill-repos-shortlist)) doing wave/parallel task execution instead of `hash`'s strict one-task-at-a-time TDD loop. Kiro's docs don't mention TDD enforcement or a review/severity scheme at all — the parallelism is the only notable piece. *Rejected for `hash`: one-task-at-a-time TDD loop is deliberate, not an oversight — already decided in the original pass. Noted here only because the pattern now has two independent sightings instead of one.*

### `buildermethods/agent-os` v3 — standards injection, not a review mechanism

v3 dropped its own spec-writing commands in favor of using the host tool's native Plan Mode for spec shaping, and instead focuses on a `/inject-standards` command that auto-suggests or explicitly loads project-specific "tribal knowledge" (coding standards extracted from the codebase) into context. No review loop, no severity taxonomy — orthogonal to what `hash` does. Interesting only as a reminder that `hash`'s apply-REVIEW smell baseline is a fixed, generic list with an escape hatch ("a repo-documented standard always overrides it") but no active mechanism to *find and load* that standard the way agent-os's injector does. *Rejected for `hash`: the escape hatch already covers this procedurally.*

---

## 6. Run log

Chronological record of when each pass ran and what it covered — kept for provenance; §1–§5 above are the consolidated, de-duplicated findings.

| Pass | Scope | Outcome |
|---|---|---|
| 1 (original) | `obra/superpowers` ecosystem, shortlist of 5 other skill repos, 2 OpenSpec community-schema repos (6 schemas) | Produced §2–§4 baseline and the original 3 candidates (now #1–3 minus BMAD/spec-kit additions) |
| 2 | Status check on pass-1 candidates + re-survey of the same sources for drift | Confirmed 3 of the original candidates already applied to `schema.yaml` (uncommitted); confirmed superpowers 5.0.x subagent-review removal is scoped to plan/design stage only, doesn't affect the implementation-review comparison; confirmed OPSX is a platform generalization, not a new technique; confirmed 0 new community schemas in 2 repos |
| 3 | Independent (non-superpowers-lineage) spec-driven-dev tools: spec-kit, BMAD-METHOD, AWS Kiro, agent-os | Added §5; produced candidates #1, #2, #4, #4a |

All three passes ran same-day (2026-07-12). No changes have been applied to `openspec/schemas/hash/schema.yaml` as a result of this document — the uncommitted diff referenced in the "already applied" table in §1 predates this document's first pass.
