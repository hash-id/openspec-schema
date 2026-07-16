# Plan: skills-as-dependencies for `hash/schema.yaml`

**Date:** 2026-07-16
**Status:** decided via grill-me interview, not yet applied. Input to a `hash` proposal/discovery cycle, or direct implementation — see [Open items](#open-items) before either.
**Builds on:** [2026-07-16-skills-agents-as-dependencies.md](2026-07-16-skills-agents-as-dependencies.md) (research — candidates §9)

## Decisions

| # | Candidate (from research §9) | Decision |
|---|---|---|
| 1 | Formalize `apply` Phase 2 review as `.claude/agents/*.md` | **Rejected as subagent-file.** No cross-agent standard for subagent frontmatter (Claude Code/opencode schemas diverge; `subagents.sh` tooling is Claude-Code-only, no lockfile). Downgraded to a **skill** instead — `SKILL.md` is the format with actual cross-tool traction. |
| 2 | Reference `mattpocock/skills` (grill-me etc.) instead of inlining | **Accepted for `discovery` only.** `discovery` instruction becomes a thin pointer to the external `grill-me` skill. |
| 3 | `gherkin-authoring` as dep for `specs` | **Rejected.** `specs` stays fully inline — Gherkin/Cucumber is the wrong paradigm for OpenSpec's WHEN/THEN + SHALL/MUST scenario format, forcing the fit risks semantic drift. |
| 4 | ripgrep/codebase-mcp as hard precondition | **Rejected as blocker, accepted as soft priority.** No precedent anywhere in the repo family for hard-blocking on optional tooling (research §5); consistent pattern is graceful degradation. Becomes an explicit priority order inside instructions that already say "explore the codebase," not a new precondition class. |

New findings during this interview, not in the original research doc:
- `mattpocock/skills` also ships `skills/engineering/code-review` — see [Why `align`/`apply`-Phase2 stayed inline](#why-alignapply-phase2-stayed-inline) for why it was still rejected as a source for those two phases.
- `hrt-adversarial-authoring`'s pattern (author subagent + reviewer subagent, independent perspective, resolved before the artifact is finalized) was re-examined separately from candidate #1 and **accepted in modified form** for `proposal` and `specs` — see [Adversarial-authoring for `proposal` and `specs`](#adversarial-authoring-for-proposal-and-specs).
- A pre-existing gap surfaced and was fixed: `design.requires` — see [Fix: `design.requires` gains `specs`](#fix-designrequires-gains-specs).
- Follow-up decision: `review-in-fresh-context` (shared by `align` and `apply`-Phase2) was **split into two skills** to avoid the one-skill-two-callers ambiguity resolved as Open Item #3 below — see [What changes §1](#1-two-local-review-skills-split-not-shared). `hrt-adversarial-authoring` (shared by `proposal` and `specs`) was evaluated for the same split and **kept as one skill** — the two callers share authoring *structure* (author→reviewer→resolve) and differ only in content parameters, unlike `align`/`apply`-Phase2 which check structurally different objects (artifact-vs-artifact vs. code-vs-artifact).
- `apply` Phase 1 (the TDD implement loop) was never covered by the original research or the initial pass of this plan — raised separately. `mattpocock/skills` also ships a `tdd` skill; checked in depth, overlap is far larger than `code-review`'s was. **Accepted as external, thin pointer**, with one explicit override — see [`apply` Phase 1: external `tdd` skill, with a stated override](#apply-phase-1-external-tdd-skill-with-a-stated-override).
- `design` and `specs` had no secure-by-design / threat-modeling coverage at all — raised separately, prompted by the observation that a design/spec phase's job includes risk mapping and mitigation, not just functional behavior. Neither `mattpocock/skills` nor `obra/superpowers` nor `anthropics/skills` has anything security-related. `npx skills find` against the full registry did: `wshobson/agents` (37.9K★, MIT, active, explicitly multi-harness — Claude Code/Codex/OpenCode) ships a 5-skill `security-scanning` plugin. **3 of 5 accepted, 2 rejected, and gated behind a trust-boundary check** (raised as a bloat concern, resolved the same way `design.md` already gates its own conditionality) — see [Secure-by-design](#secure-by-design-stride-analysis-patterns--threat-mitigation-mapping-for-design-security-requirement-extraction-for-specs).
- Skill-invocation and gating wording across this plan should follow this repo's existing RFC 2119 research (`docs/research/2026-07-12-rfc2119-normative-language.md`) — sparse capitalized MUST/SHOULD/MAY, no formal declaration sentence. Re-checked specifically against skill-invocation language (not just general schema.yaml prose) and the same conclusion held — see [Skill-invocation language](#skill-invocation-language-sparse-mustshouldmay).

## What changes

### 1. Two local review skills (split, not shared)

Originally planned as one shared `review-in-fresh-context` skill for both `align` and `apply`-Phase2 (same loop/tagging/gate machinery, different check object). Revisited: one skill called by two callers with different required parameters reads as ambiguous — which caller's shape does the frontmatter `description` describe? which artifacts does it expect on disk? Split into two, each self-contained and independently invocable:

- **`skills/hrt-align-consistency-review/SKILL.md`** — artifacts-vs-artifacts. Extracted from the current `align` instruction text (`schema.yaml` lines 167-194): the loop-of-3-passes, the 7-dimension consistency map (discovery→proposal, proposal→specs, proposal↔design, specs↔design, specs→tasks, spec structure, design/tasks→codebase), HIGH/MEDIUM/LOW × MECHANICAL/DECISION tagging.
- **`skills/hrt-apply-code-review/SKILL.md`** — code-vs-artifacts. Extracted from the current `apply`-Phase2 instruction text (`schema.yaml` lines 216-251): the same loop/tagging shape, the 7-item contract map (requirement+scenario implemented and tested, design honoured, tasks genuinely done, no scope drift, plus the 12-item Fowler smell baseline), and the hard test/lint gate that `align` doesn't have (`align` runs before any code exists).

Both live at repo root (`skills/<name>/SKILL.md`), not under `openspec/schemas/hash/` — decoupled from any one schema so other schemas in this repo (`spec-driven`) could reuse them later. Both self-contained: no reference to `mattpocock/skills`' `code-review` skill despite the smell-baseline overlap (see below) — that overlap only touches `hrt-apply-code-review`, not `hrt-align-consistency-review`, which has no smell-baseline item at all.

### 2. `schema.yaml` instruction changes

- `discovery`: replace inlined interview instructions with a thin pointer to the `grill-me` skill (installed by `install-schema.sh`, see §3). Keep the discovery.md-specific framing (what discovery.md must NOT duplicate from proposal.md) inline, since that's hash-specific, not part of grill-me.
- `align`: replace the loop/map/tagging instruction body with a thin pointer to `hrt-align-consistency-review`. The 7-dimension consistency map moves into the skill itself (no longer a runtime parameter — each skill fully owns its check content now that the two are split).
- `apply` Phase 2: same thin-pointer treatment, pointing to `hrt-apply-code-review` (contract map + smell baseline owned by the skill).
- `specs`: stays fully inline for its core requirement/scenario authoring, gains an additional thin pointer to the external `security-requirement-extraction` skill for a new security-requirement pass. See [Secure-by-design](#secure-by-design-stride-analysis-patterns--threat-mitigation-mapping-for-design-security-requirement-extraction-for-specs).
- `design`: gains thin pointers to two external skills, `stride-analysis-patterns` and `threat-mitigation-mapping`, feeding the existing Risks/Trade-offs section. See [Secure-by-design](#secure-by-design-stride-analysis-patterns--threat-mitigation-mapping-for-design-security-requirement-extraction-for-specs).
- Everywhere an instruction currently says some form of "explore the codebase" (`discovery`, `align`'s codebase-claim check, `apply` context-file reading): add explicit priority order — **codebase-mcp > ripgrep > grep/glob bawaan** — soft, not blocking.
- `proposal` and `specs`: add a cross-context adversarial-authoring pass (author subagent drafts, reviewer subagent challenges in a fresh context, resolved before the artifact is finalized). See [Adversarial-authoring for `proposal` and `specs`](#adversarial-authoring-for-proposal-and-specs).
- `design`: `requires` gains `specs`. See [Fix: `design.requires` gains `specs`](#fix-designrequires-gains-specs).
- `apply` Phase 1: replace the inlined seams/anti-patterns/loop-rules text with a thin pointer to the external `tdd` skill (installed by `install-schema.sh`, see §3), plus one explicit override line kept inline — see below.

### 3. `install-schema.sh` changes

- Add precondition check: `command -v npx` (alongside the existing `command -v git` check). Fail with the same stop-and-report style as the existing git check if missing.
- After copying `schema.yaml` + `templates/*` (unchanged step), run:
  - `npx skills add mattpocock/skills --skill grill-me tdd` — one invocation, both `mattpocock`-sourced skills. Verified against `vercel-labs/skills`' own `parseAddOptions` (`src/add.ts`): `-s`/`--skill` consumes all following space-separated args up to the next flag, appending each to `options.skill[]` — not `--skill=x --skill=y` (each occurrence resets `options.skill` before its own append loop) and not comma-separated (`--skill=grill-me,tdd` matches no parser branch).
  - `npx skills add wshobson/agents --skill stride-analysis-patterns threat-mitigation-mapping security-requirement-extraction` — one invocation, all three `wshobson`-sourced security skills, same multi-value `--skill` syntax.
  - `npx skills add hash-id/openspec-schema/skills` — no `--skill` filter, install everything discoverable under this repo's `skills/` folder. Verified against `discoverSkills` (`src/skills.ts`): a subpath pointing at a *container* directory (one with no `SKILL.md` directly inside it) skips the single-skill early-return and walks its subfolders instead — the same mechanism that makes `owner/repo` alone (no subpath) discover an entire skills repo. Since `skills/` in this repo holds only the three `hrt-*` skills and nothing else, no filter is needed; this also means a fourth `hrt-*` skill added later is picked up automatically without an installer edit.
- Failure of any skill install stops the installer and reports — same precedent as the `openspec --version` check in `AGENT_INSTALL.md` (research §5): hard block for the CLI/tooling layer itself, not for optional enhancements.

### 4. Docs

- `README.md`: "Requires" line gains Node.js/npx alongside the OpenSpec CLI and git.
- `AGENTS.md`: the "Installer" section's "only copies `schema.yaml` and `templates/*`" claim needs updating — it now also provisions eight skills (5 external across 2 source repos, 3 local) via `npx skills add`. Keep the "never `cp -r`s the whole clone" invariant; the new steps are additive, not a scope change to that rule.

## Why `align`/`apply`-Phase2 stayed inline

`mattpocock/skills`' `code-review` skill was checked in depth (fetched and read in full) after the smell-baseline overlap surfaced. Comparison:

| | `mattpocock/code-review` | hash `align` + `apply`-Phase2 |
|---|---|---|
| Reviews | a git diff vs. a user-supplied ref | openspec artifacts (specs/design/tasks) and, separately, code vs. those artifacts |
| Axes | 2 fixed (Standards, Spec), parallel subagents, **never merged** | 1 unified contract/consistency map (7 dimensions), single subagent per pass |
| Severity | none | HIGH/MEDIUM/LOW |
| Resolution routing | none (reports only) | MECHANICAL (auto-fix) vs. DECISION (ask user, one at a time, grounded in discovery.md) |
| Looping | single pass | up to 3 passes, fresh subagent each time, stop early on clean pass |
| Gate | fails fast only on bad ref/empty diff | failing tests/lints = automatic blocking HIGH; unresolved HIGH at loop-end = RELEASE BLOCKER |
| Cross-artifact consistency (`align`'s job) | not covered — assumes the spec is fixed and correct | the entire point of `align` |

Overlap is real but narrow: the 12-item Fowler smell list is near-verbatim identical (same items, same "judgement call, repo standard overrides" framing) — one item inside `hrt-apply-code-review`'s 7-item contract map (`hrt-align-consistency-review` has no smell-baseline item at all, so the overlap doesn't touch it). Everything else (the loop, the severity×resolution-type tagging, the hard gate, `align`'s cross-artifact check) is machinery `mattpocock/code-review` doesn't have. Decision: keep both skills fully self-contained, including `hrt-apply-code-review`'s own copy of the smell list — the overlap is too small a fraction of the whole to justify an external dependency on a skill whose surrounding design (2-axis, ungated, non-looping) doesn't fit what `align`/`apply`-Phase2 need.

## Adversarial-authoring for `proposal` and `specs`

Re-examined separately from candidate #1 (subagent-file rejection was a *mechanism* problem — no cross-agent subagent-frontmatter standard — not a verdict on whether the actor-critic authoring pattern itself has a use case in `hash`).

**Cross-model, downgraded to cross-context.** `mattpocock`'s `adversarial-authoring` pins the author and reviewer to different model *families* (`opencode/big-pickle` vs `openai/gpt-5.5`) for genuine cross-vendor challenge. `hash` targets multiple agents (Claude Code, Codex, opencode) — pinning specific models in `schema.yaml` would be Claude-Code-specific and non-portable, the same problem that sank candidate #1 as a subagent-file. Adopted instead as **cross-context**: same model family, but the reviewer runs in a fresh session with no visibility into the author's reasoning — structurally the same isolation `apply`-Phase2 review already uses ("fresh session... no memory of the implementer"), applied one phase earlier, at authoring time instead of after the fact.

**Why `proposal` and `specs`, not `design`:**
- `proposal` — defines WHY and scope, the earliest authoring node (`requires: []` beyond discovery), and — before this plan's `design.requires` fix — the only artifact with zero other independent artifacts to check itself against. Highest leverage: a scope error here propagates to every downstream artifact before anything catches it.
- `specs` — defines WHAT. `align`'s existing checks (`specs -> tasks` coverage, spec *structure* — hashtag count, SHALL/MUST) verify well-formedness and downstream coverage, not whether a requirement is genuinely the right thing to build. That's a gap `align` doesn't fill, because `align` runs once all artifacts already exist — an adversarial pass at authoring time catches it before `tasks` is even built on top of it.
- `design` — excluded, but not for the reason first considered (its instruction already asks for "alternatives considered" as a partial self-check — true, but weak, since a solo author can write an alternative that's easy to beat). The real reason: once `design.requires` includes `specs` (see below), `design` is authoring *with* a settled, already-adversarially-reviewed artifact as required input, not authoring from nothing. Its main risk shifts from "no independent check at all" to "misreading a spec that already survived independent review" — a narrower failure mode `align`'s `specs <-> design` consistency dimension already covers post-hoc.

**New local skill:** `skills/hrt-adversarial-authoring/SKILL.md` — self-contained like the two review skills, but for the author→reviewer→resolve shape instead of the fresh-context-loop shape. Kept as one skill, not split like `hrt-align-consistency-review`/`hrt-apply-code-review`: `proposal` and `specs` share the same authoring *structure*, differing only in content parameters (proposal's Why/What/Capabilities/Impact vs. specs' requirement/scenario content) — a narrower difference than `align` vs. `apply`-Phase2, which check structurally different objects. `proposal` and `specs` instructions become thin pointers to it.

## `apply` Phase 1: external `tdd` skill, with a stated override

`mattpocock/skills`' `tdd` skill (plus its companions `tests.md`, `mocking.md`) was fetched and read in full. Comparison against `apply`-Phase1 (`schema.yaml` lines 205-214):

| | `mattpocock/tdd` | hash `apply`-Phase1 |
|---|---|---|
| Seam confirmation | "confirm them with the user... never test at an unconfirmed seam" | "confirm it matches the design... never test at an unconfirmed seam" — near-identical wording |
| Anti-pattern: implementation-coupled | mocks internal, tests private methods, side-channel verify | same three, same framing |
| Anti-pattern: tautological | "expected value recomputed the way the code computes it... must come from an independent source" | same, same framing |
| Anti-pattern: horizontal slicing | "writing all tests first... work in vertical slices" | same |
| Loop | red before green, one slice at a time | RED, GREEN, one test at a time |
| **Refactor** | **excluded from the loop** — "belongs to the review stage (the `code-review` skill)" | **inside the loop** — step 3 of every task cycle, "only while GREEN," before the checkbox is ticked |

Unlike `code-review` vs. `align`/`apply`-Phase2 (where the overlap was one item out of seven), the overlap here covers nearly the entire instruction — seam confirmation, all three anti-patterns, and the vertical-slicing rule are close to verbatim matches. The one real divergence is structural, not incidental: `mattpocock` treats TDD as strictly red→green and defers refactoring to a separate review stage; `hash` treats red-green-refactor as one loop per task, with refactor as step 3 before the checkbox ticks. This is a standing hash design choice (the phase is literally named "red-green-refactor"), not an oversight.

Decision: **external, thin pointer**, unlike `align`/`apply`-Phase2 which stayed inline. `apply`-Phase1's instruction shrinks to point at the `tdd` skill (installed alongside `grill-me`, see §3), plus one line that stays inline and is stated explicitly rather than silently dropped:

> Unlike the `tdd` skill's default (which defers refactoring to the `code-review` review stage), REFACTOR stays inside this loop as step 3 (only while GREEN, never while RED) — tick the checkbox only after it.

This keeps the override visible in `schema.yaml` itself rather than requiring a reader to already know it contradicts the skill's own documented default.

## Secure-by-design: `stride-analysis-patterns` + `threat-mitigation-mapping` for `design`, `security-requirement-extraction` for `specs`

Raised separately from the original research scope: one of `design`/`specs`' jobs is mapping risk and mitigations, including secure-by-design concerns — and neither had any explicit coverage. `design.md`'s template has a generic "Risks / Trade-offs" section (no security prompt); `spec.md` has no risk section at all.

**Search process.** `mattpocock/skills`, `obra/superpowers`, and `anthropics/skills` (Anthropic's own public skills repo) were all checked — none has anything security- or threat-model-related. Escalated to `npx skills find security` / `"threat model"` / `"STRIDE"` against the full `skills.sh` registry. That surfaced real candidates, several framework-specific (Firebase rules, Golang, better-auth) and out of scope, but one clear fit: `wshobson/agents`, a 5-skill `security-scanning` plugin.

**Source diligence** (required — this becomes an installer precondition, a hard block on failure): `wshobson/agents` is 37.9K★, MIT-licensed, not archived, pushed within the last two days of this session, PR-based workflow (not direct-to-main), owned by an identifiable maintainer (Seth Hobson, GitHub account since 2011, 2K+ followers, "Senior AI Engineer") — and its `README` explicitly targets Claude Code, Codex, and OpenCode, i.e. the same multi-agent surface `hash` targets. `references/details.md` files were read in full and are substantive (worked dataclass models, not placeholders). CLI-verified the repo clones and its skills are discoverable despite living under nested `plugins/security-scanning/skills/` rather than a flat `skills/` root (install command in §3).

**All 5 skills in the plugin, reviewed individually:**

| Skill | Verdict | Why |
|---|---|---|
| `stride-analysis-patterns` | **Accepted → `design`** | Systematic threat identification (Spoofing/Tampering/Repudiation/Info Disclosure/DoS/Elevation), authoring-time (no existing code required), lightweight. |
| `threat-mitigation-mapping` | **Accepted → `design`** | Threats → controls/mitigations, preventive/detective/corrective, defense-in-depth layering. Directly formalizes what `design.md`'s existing "Risks / Trade-offs" section already does in miniature (`[Risk] → Mitigation`, `schema.yaml` line 117) — this doesn't introduce a new section, it fills out one that already exists. |
| `security-requirement-extraction` | **Accepted → `specs`** | Threats → testable, traceable requirements (Functional/Non-functional/Constraint categories). Initially questioned as possibly business-requirement-level (which would belong in `proposal`, not `specs`) — re-checked: its own categories and its explicit Traceability/Testability attributes are system-behavior level, the same level `specs`' SHALL/MUST + WHEN/THEN scenarios already operate at, not the WHY/scope level `proposal` covers. |
| `attack-tree-construction` | **Rejected** | Overlaps `stride-analysis-patterns` (also threat enumeration) but heavier — attacker cost/skill/detection scoring, visual tree construction — oriented at pentest planning and stakeholder communication rather than a lightweight design-doc pass. |
| `sast-configuration` | **Rejected** | Static-analysis *tooling* setup (Semgrep/SonarQube/CodeQL, CI/CD integration) — post-hoc code scanning, not authoring-time design/spec work, and outside `hash`'s scope (`hash` doesn't touch CI config). |

**Format constraint, stated explicitly so it isn't lost at implementation time:** `security-requirement-extraction`'s own reference material models requirements with its own dataclasses/enums (`RequirementType`, `SecurityDomain`, `ComplianceFramework`). That structure is a **thinking aid** for the skill user — which security domains to consider, how to categorize a requirement — not a competing output format. The actual output written to `specs/**/*.md` still MUST use `hash`'s existing `### Requirement` / `#### Scenario` (4-hashtag WHEN/THEN) structure; a security requirement is a `### Requirement` like any other, just one whose derivation used STRIDE/mitigation-mapping thinking. Two requirement formats living in the same file was flagged and rejected during this interview.

**Gated, not always-on.** Raised as a concern during this interview: `design` is itself conditional in `hash` today ("create only if any apply" — cross-cutting change, new dependency, security/performance/migration complexity, etc., `schema.yaml` lines 107-111) precisely to avoid making every change carry design overhead it doesn't need. Making the security pass unconditional — STRIDE + mitigation-mapping on every `design.md`, a security-requirement check on every `specs` capability — would reintroduce exactly the bloat `design`'s own conditionality exists to prevent, and would apply threat-modeling overhead to changes with no trust surface at all (a button color change, a copy edit).

Resolved the same way `design.md` already gates itself: an explicit skip condition stated in the instruction, not a new schema mechanism. The authoring agent evaluates it inline, same as it already evaluates "when to include design.md."

**Where in the instructions** (normative keywords per [Skill-invocation language: sparse MUST/SHOULD/MAY](#skill-invocation-language-sparse-mustshouldmay) below):
- `design`: MUST check whether the change touches a trust boundary — new or modified authentication/authorization, external/untrusted input, data exposure or storage, third-party integration, privilege changes — before running STRIDE / mitigation-mapping. If none apply, MUST skip the security pass and MAY note the skip in one line; the existing "Risks / Trade-offs" section still gets filled from ordinary (non-security) risk if relevant. If any apply, MUST run STRIDE-style threat identification, then MUST map each identified threat to a mitigation, feeding the "Risks / Trade-offs" section — both as thin pointers to the two skills.
- `specs`: same trust-boundary check, MUST be evaluated per capability, not per change (a change can add one capability with a trust boundary and one without). For capabilities that touch one, SHOULD consider `security-requirement-extraction`'s categories and MUST write the result as a normal `### Requirement` block (no second requirement format — see the format constraint above, itself a MUST). For capabilities that don't, the skill MUST NOT be invoked at all — this is the mechanism that keeps the gate from becoming a rubber stamp everyone runs through anyway.

## Skill-invocation language: sparse MUST/SHOULD/MAY

Raised separately: how should the thin-pointer instructions across this plan — "use the `grill-me` skill," "run the security pass unless...," "point to `hrt-align-consistency-review`" — actually be worded? `docs/research/2026-07-12-rfc2119-normative-language.md` (pre-existing research in this repo, read in full before answering) already covers this question for `schema.yaml` generally: **sparse capitalized MUST/SHOULD/MAY, reserved for genuinely binding/mechanically-checkable points — no BCP-14 declaration sentence, no full SHALL/REQUIRED/RECOMMENDED tier system.** That recommendation's rationale (`schema.yaml` has one author and one reader-class — an agent executing a phase — not a multi-vendor interoperability audience) was re-checked specifically against skill-invocation wording, since multi-source skills (mattpocock, wshobson, `hrt-*` all installed independently) look superficially closer to the interop case RFC 2119 is actually for (`agentskills/agentskills`'s own use of the full declaration, per that research's §3). Rejected: the *installer* being a hard precondition (§3, "failure of any skill install stops the installer") already does the enforcement work an interop declaration would otherwise exist for — `schema.yaml` itself still has exactly one reader per phase, so the sparse pattern applies unchanged.

Concretely, this plan's skill-invocation and gating language follows the same rule already applied to the rest of `schema.yaml`: capitalize MUST/MUST NOT only where skipping it breaks something downstream (a gate that must actually gate, a format that must actually match) — leave judgment calls (how much to write in a skip-note, which of a skill's categories are worth reading) as plain lowercase guidance. The security-pass instructions above are the concrete application; the same rule extends to the other thin pointers introduced in this plan (`discovery`→`grill-me`, `align`→`hrt-align-consistency-review`, `apply`-Phase1→`tdd`, `apply`-Phase2→`hrt-apply-code-review`, `proposal`/`specs`→`hrt-adversarial-authoring`) when their exact instruction text is drafted (Open Item #7).

## Fix: `design.requires` gains `specs`

Verified against the actual upstream `Fission-AI/OpenSpec` `schemas/spec-driven/schema.yaml` (fetched in full): `design.requires: [proposal]` and the "Reference the proposal for motivation and specs for requirements" instruction line are both inherited verbatim from upstream, present since `hash`'s first commit (`dfdfa9e`) — not a `hash`-introduced regression. Upstream's own schema `description` states the intended order as "proposal → specs → design → tasks," but its `requires:` graph doesn't enforce that — `specs` and `design` are graph siblings there too, despite `design`'s own instruction depending on `specs`' content.

Decision: **`hash` diverges from upstream on purpose.** `design.requires` becomes `[proposal, specs]`. Rationale: the dependency is real and already acknowledged in the instruction text (design needs the finalized requirements to ground its technical decisions in something concrete, not a moving target); the graph should say what the instruction already assumes. `hash` already diverges from `spec-driven` in several other places (`discovery`, `align`, apply's Phase 2 review) — this is one more well-justified divergence, not a new category of change.

Ordering consequence: `specs` no longer can run purely in parallel with `design` — `design` now waits on `specs`. `tasks.requires: [specs, design]` is unaffected (already required both).

## Open items

Not resolved in this interview — needs a decision before implementation:

1. ~~Repo reachable as `hash-id/openspec-schema` on GitHub~~ — **resolved**: confirmed public. Still open, and blocking every `install-schema.sh` step in §3: the three `hrt-*` `SKILL.md` files don't exist yet. Write them, merge to `master` (or whatever ref `npx skills add` defaults to), *then* confirm two things end-to-end (only a dry run so far — cloned, discovered all skills, but never a completed install): `npx skills add hash-id/openspec-schema/skills` installs exactly the three `hrt-*` skills and nothing else, and `npx skills add wshobson/agents --skill stride-analysis-patterns threat-mitigation-mapping security-requirement-extraction` resolves exactly those three out of the repo's 175.
2. Exact frontmatter/body format for all three new local `SKILL.md` files — needs the same `name`/`description` frontmatter contract `vercel-labs/skills` and Claude Code both expect. Draft against `mattpocock`'s `code-review` and `adversarial-authoring` `SKILL.md`s as structural references (frontmatter shape only, not content).
3. ~~Whether `align`/`apply`-Phase2 share one skill or two~~ — **resolved**: split into `hrt-align-consistency-review` and `hrt-apply-code-review` (see [What changes §1](#1-two-local-review-skills-split-not-shared)). `hrt-adversarial-authoring` stays one skill shared by `proposal`/`specs`, parameterized by content — still needs the actual parameter-passing mechanism worked out (how the instruction text tells the skill which artifact it's authoring) when the SKILL.md is drafted.
4. `design.requires: [proposal, specs]` — confirm this doesn't create a cycle or break anything relying on `design`/`specs` being parallel-executable (e.g. tooling, docs, or the `align` phase's own assumptions about artifact readiness order). Re-run the "no cycles or missing ids" manual check from `AGENTS.md` § Validating changes after the edit.
5. This plan does not itself run the `hash` workflow's own `discovery` → `proposal` → ... cycle on itself — a meta note, not a blocker, but worth deciding whether these schema.yaml changes go through `hash` or are hand-applied given the bootstrapping problem (using `hash` to change `hash`).
6. ~~Confirm two `mattpocock/skills` installs (grill-me, tdd) don't collide~~ — **resolved**: single invocation, `npx skills add mattpocock/skills --skill grill-me tdd` (see §3).
7. Exact instruction wording for where `stride-analysis-patterns` / `threat-mitigation-mapping` slot into `design`'s existing Decisions/Risks flow, and where `security-requirement-extraction`'s trust-boundary note slots into `specs` — drafted at a high level in this plan (including MUST/SHOULD/MAY placement, see [Skill-invocation language](#skill-invocation-language-sparse-mustshouldmay)), not yet written as actual `schema.yaml` instruction text. Same applies to the other thin-pointer instructions in this plan (`discovery`, `align`, `apply` Phase 1 and 2, `proposal`/`specs` adversarial-authoring) — normative-keyword placement for those hasn't been drafted at all yet, only flagged as following the same rule.
