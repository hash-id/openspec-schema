# mattpocock Skills Analysis: Change-Size Gate, Seams, and Deferred-Slice Backlog

**Status:** Grilled to shared understanding (two rounds). This is the implementation spec — §10 is ready-to-paste. Not going through the OpenSpec pipeline; applied directly.
**Date:** 2026-08-27
**Scope:** `openspec/schemas/tempa-spec/schema.yaml` (instructions for `discovery`, `proposal`, `design`, `tasks`, `align`, `apply`; version bump), `templates/design.md`, `skills/hrt-align-consistency-review/SKILL.md`, `skills/hrt-adversarial-authoring/SKILL.md`, `CHANGELOG.md`, `AGENTS.md`, plus a runtime-created `openspec/BACKLOG.md`.

---

## 1. Why this analysis

Three developer concerns:

1. **Oversized change dumps.** Developers sometimes pour a concept that combines 3+ user stories into one change. Fear: every downstream phase (proposal → specs → design → tasks) inflates, and the agent enters the "context dumb zone" — quality drops.
2. **Seams / TDD fit.** `tasks.md` already adopts heading-level vertical slicing (from the `2026-08-09-vertical-slicing-to-tickets.md` research) so `apply`'s TDD loop works. But is the seam approach placed right?
3. **OpenSpec ≠ mattpocock workflow, but fundamentals transfer.** Which parts of `wayfinder` / `to-spec` / `to-tickets` / `implement` are critical and adoptable?

Sources analysed (companion articles, verified against the SKILL.md files referenced in `2026-08-09-vertical-slicing-to-tickets.md`):
- `wayfinder` — https://www.aihero.dev/skills-wayfinder
- `to-spec` — https://www.aihero.dev/skills-to-spec
- `to-tickets` — https://www.aihero.dev/skills-to-tickets
- `implement` — https://www.aihero.dev/skills-implement

---

## 2. How the two chains map

**This schema (one change):**
```
proposal ──> specs/A ─┐
             specs/B ─┼──> design.md ──> tasks.md ──> align.md ──> apply
             specs/C ─┘     (1)            (1)          (1)
   WHY       WHAT (per        HOW          VERTICAL     CONSISTENCY  BUILD
             capability)                  SLICES       CHECK
```

**mattpocock:**
```
grill-with-docs → to-spec (1 spec, user stories, seams validated with user)
                    ↓
                 to-tickets → ticket 1, 2, ... N  (fan-out here: tracer bullets, blocking edges, quiz step)
                    ↓
                 implement (per ticket, TDD at agreed seams) → code-review
```

### Key mapping facts

| mattpocock | This schema | Match? |
|---|---|---|
| `to-spec` output (1 spec, user stories, **seams validated with user**) | `proposal` + `specs/*` combined | Partial. **Seams are missing.** |
| seams (born in `to-spec`, before tickets) | not explicit anywhere; only surface at `apply` via `tdd`'s "seam confirmation" | **Gap** |
| `to-tickets` output (N tickets, tracer bullets, blocking edges, mandatory quiz) | `tasks.md` `##` headings (demoability test, "blocked by X.Y") | Yes. Quiz step → replaced by `align` WALKTHROUGH (post-draft, not mid-draft). |
| `implement` per ticket | `apply` PHASE 1 per checkbox | Yes. |
| `wayfinder` decision map | `discovery` (grilling) + Open Questions | Close enough — no new phase needed. |
| expand→migrate→contract (wide-refactor exception) | **not present** | Gap — adopt. |

### Two fan-outs on different axes

- `specs/*` fans out **per capability** (in the `specs` phase) — the "what" axis.
- `tasks.md` headings fan out **per vertical slice** (in the `tasks` phase) — the "how to ship incrementally" axis.

One heading may touch 2 capabilities; one capability may spread across 3 headings. **This is correct.** Forcing 1 heading = 1 capability would produce horizontal slices. `align`'s `specs -> tasks` dimension already checks every scenario (across all capabilities) traces to ≥1 task, so a capability's scenarios can't fall through the cracks between headings. **No change needed there.**

### `specs/*` is NOT the `to-tickets` unit

`specs/*` = behaviour contract (the `to-spec` half). `to-tickets` tickets = demoable units of work. The `to-tickets` fan-out lands in **`tasks.md` between headings**, not in `specs/`. `specs` is the basis for `design` — same logical order as mattpocock (`to-tickets` also reads the spec as its basis). The one difference: mattpocock has no separate `design.md`; technical decisions are made inline in `to-tickets` step 2. This schema splitting `design` into its own phase is an improvement, not a divergence.

---

## 3. Concern 1 — oversized change dumps

### The risk this addresses

Companion article for `to-tickets`: one team ran a 26-ticket stack sliced by layer, got ~20 agent runs per closed ticket, ~75% rework — their post-mortem traced every failure class to horizontal slicing. The whole mattpocock chain exists to prevent this.

### What the schema already holds

- `tasks` instruction already applies the demoability test **at the heading level** (each `##` heading must produce one demoable/verifiable slice).
- `apply` PHASE 1 uses `tdd` per checkbox, one task at a time, in a fresh session.
- `context:` injects codebase-exploration rules into every phase.

### The real gap

No **size gate upstream**. `to-tickets` has an explicit sizing floor ("fits one context window → use `/implement`; doesn't → `/to-tickets`"). `wayfinder` has "session count, not project size." This schema has no check for "is this change too big / several independent stories glued together" before all the downstream artifacts get written. `align` only catches the bloat after everything is drafted.

### The false-positive-split risk (must be controlled)

A gate that says "consider splitting" biases the agent toward over-decomposition (the article calls over-decomposition "the most common friction"). A single user story can legitimately touch many layers and many capabilities — that is NOT a split signal. The gate must default to one change, must not let the agent split on its own, and must frame the decision as a question to the user.

---

## 4. Concern 2 — seams / TDD placement

### What mattpocock does with seams

- `to-spec` **identifies seams and validates them with the user** before tickets exist. Reason stated: "seams travel downstream to `tdd` and `code-review`." Prefer existing seams, minimise new ones.
- `implement` **consumes** "pre-agreed seams" — beat 1 is "parse the spec/ticket and identify seams." Seams are already agreed upstream.
- `to-tickets` doesn't mention seams — it's about blocking edges and ticket size.

Order: **seams decided in `to-spec` (with the user), carried by tickets, executed in `implement`.**

### What this schema does

- `specs` phase: WHEN/THEN scenarios. No seams.
- `design` phase: optional `## Shape` section — "key type/method signatures for new public functions." Closest thing to seams, but optional and framed as architecture, not testing boundary.
- `tasks` phase: no mention of seams.
- `apply` PHASE 1: `tdd` skill does "seam confirmation" — in the implementation session, by a subagent, **with no human review**.

**Mismatch:** in this schema seams are first confirmed at `apply` — not agreed with the user during planning. `align` WALKTHROUGH (the only human gate before apply) never shows seams because they don't exist in any artifact yet. If the agent picks a bad seam at `apply` (test coupled to implementation, seam on an internal function instead of a public boundary), no planning gate catches it — only `hrt-apply-code-review` PHASE 2, after the code is written.

### Why `design` is the right home (not `specs`)

In mattpocock seams are born in `to-spec` = `proposal`+`specs` here. But `specs` in this schema is deliberately pure behaviour (WHEN/THEN only). Putting signatures there breaks that separation. `design` is the earliest phase that legitimately names code structure, and `design` reads all `specs/*` as its basis, so seams derived there are automatically anchored to scenarios across every capability. Slightly downstream of mattpocock, but the earliest fit here.

---

## 5. Concern 3 — what transfers, what doesn't

### Adopt (fundamental)

| mattpocock concept | Action |
|---|---|
| Vertical slice / tracer bullet | Already at `tasks` heading level. Add a thin size gate upstream at `proposal`. |
| Seams agreed upstream, consumed at implement | Raise to `design` (mandatory `## Shape / Seams` when there's callable code). |
| Sizing floor ("fits one context window?") | The `proposal` size gate. |
| Blocking edges between units | `tasks` already asks for "blocked by X.Y". Enough. |
| Expand→migrate→contract for wide refactors | Add to `tasks` as a documented exception. |

### Keep as-is (already equal or stronger)

- Quiz step → `align` WALKTHROUGH already serves as the equivalent checkpoint (post-draft, not mid-draft).
- 1 ticket per invocation, shared git state = conflict → `apply` already runs one task at a time.
- `implement` stops at commit, never touches the work item → `apply` already MUST NOT commit, MUST NOT archive specs.
- "spec is what survives context clearing" → `apply` PHASE 0 already enforces a fresh session.
- `wayfinder` decision map → `discovery` + Open Questions cover it; no new phase.

### Do NOT adopt

- One file per ticket — this schema needs a single `tasks.md` parsed for checkboxes.
- `disable-model-invocation: true` skills (`to-tickets`, `grill-me`) — dead-end pointers; reference the concept as prose only (already the established pattern).
- Mid-draft quiz step — collides with `align`'s post-draft timing.

---

## 6. Decisions (from the grilling)

### 6.1 Change-size gate

| # | Decision |
|---|---|
| **Placement** | At the **start of `proposal`**, before writing "What Changes". `discovery.md` is already done and is referenced as-is (a reasoning log may legitimately be referenced by more than one later change). |
| **Trigger (binary)** | Fires only when "What Changes" contains ≥2 items where: (a) each is demoable/verifiable independently, **and** (b) there is no code/data dependency between them, **and** (c) they do not map to the same capability in the proposal's own **Capabilities** section. All three → the gate asks the user. If any fails → skip the gate silently. (Note: `specs/**` files do not exist yet at this phase — `specs` runs after `proposal` — so (c) is checked against the Capabilities list the agent is drafting, not against files on disk.) |
| **Behaviour** | Agent MUST stop, framed explicitly as "this materially affects the scope of the change" (so `opsx:propose`'s one-shot mode treats it as a mandatory interaction point, not a minor assumption). Ask the user "one change or N?". **Default is one change.** Agent proposes, user decides. Agent MUST NOT split on its own. A single broad user story is NOT a trigger. |
| **Dark mode** | The gate **still escalates to the user even in dark mode** — a third carve-out alongside security decisions and the mandatory WALKTHROUGH. It is NOT routed to `dark-mode-decision-gate` (the answer depends on the user's capacity/priorities, which no grounding artifact contains — a steel-man subagent would only guess). The user's split decision is **not** logged to `dark.md` — that file is for decisions the agent made autonomously; the split is a user decision, already recorded in `proposal.md` Out of Scope + `discovery.md` Key Decisions + `BACKLOG.md`. |
| **`opsx:propose` compatibility** | Verified against `Fission-AI/OpenSpec` **source** (`skills/openspec-propose/SKILL.md`, cloned `master` 2026-08-27): step 1 "Understand the request and clarify material ambiguity" — "If the request contains ambiguity that would materially affect scope, externally observable behavior, compatibility, or acceptance criteria, ask the user before creating the change." Step 5.c "If an artifact requires user input (unclear context): Ask the user to clarify, then continue with creation." Step 5.a: "If the `instruction` field delegates creation to a specific skill or command, invoke it" and "Follow the `instruction` field... it is the authoritative guidance." So a schema `instruction` that stops on scope-affecting ambiguity is honored mid-generation. The gate's "materially affects the scope" wording matches the skill's exact trigger phrase. Only requirement: the instruction must use that scope-affecting language. No extra mitigation. Caveat: no headless/non-interactive branch exists in the skill — in a non-interactive run the "ask" cannot resolve; general OpenSpec limitation, not gate-specific. |
| **Order of evaluation** | "What Changes" is a trigger input but the gate runs before the section is *finalized*. Resolution: the agent drafts "What Changes" first (as working content), evaluates the trigger against that draft, then — gate or no gate — finalizes the section. The gate is not a pre-`proposal` step; it is the first thing done *inside* `proposal`, against a working draft. |
| **"Demoable/verifiable independently" (trigger a)** | At the change level: if you shipped only item X (without Y, Z), a user could still use and verify something working. Independent: "add CSV export" + "add a dark-mode toggle" — ship either alone, the user can exercise it. Not independent: "add CSV export" + "add a permission check for export" — the second is meaningless without the first; they are one slice. |

### 6.2 When the user splits — `proposal` phase order (final)

1. Gate detects the binary trigger → MUST stop (scope-affecting framing) → ask "one change or N?".
2. User chooses to split → ask which slice to do now.
3. Write `proposal.md` for the chosen slice only + `## Out of Scope` section (one line per excluded slice).
4. Add an entry to `discovery.md`'s **Key Decisions** (not Open Questions — the split is a resolved scope decision with a rejected alternative, which is exactly what Key Decisions holds, and `align`'s `discovery -> proposal` dimension then traces it): "Scope: build slice `<X>` only — slices `<Y, Z>` split to separate changes (decided at the proposal size-gate). Alternative rejected: one combined change (too large; downstream phases inflate)." **Left in place permanently** — a later change that picks up slice Y does not remove it. It records what that discovery session covered.
5. Run `hrt-adversarial-authoring` (artifact: proposal). If its Destructive Critic narrows scope further ("scope creeping"), add the newly-excluded slice(s) to `## Out of Scope`.
6. Append to `openspec/BACKLOG.md` from the **final** `## Out of Scope` (single source of truth), one 3-line entry each. Before appending, remove any BACKLOG entry that this change now covers (see 6.3).
7. Finalize.

`## Out of Scope` in `proposal.md` is canonical; `BACKLOG.md` is derived from it, after the proposal is final. `proposal.md`'s section is archived with the change (context for this change); `BACKLOG.md` is persistent (pickup later) — the redundancy is deliberate.

### 6.3 `openspec/BACKLOG.md`

| # | Decision |
|---|---|
| **Location** | `openspec/BACKLOG.md`. Verified against `Fission-AI/OpenSpec`: bare `.md` files in `openspec/` **and** in `openspec/changes/` are ignored by `openspec list` / `validate` / `archive` (they only scan subdirectories). `openspec/` is the clearer semantic home and more robust if OpenSpec later adds tooling that treats `changes/` contents specially. |
| **Purpose** | Parking lot for slices raised during another change's planning and deliberately deferred. NOT a mini-proposal — just enough context to start a `discovery` session later. |
| **Who writes it** | Only the 6.1 gate, at step 6 above. Not a dumping ground for stray ideas. Entries are born only when the user chooses "do one, defer the rest". |
| **Entry format (3 lines)** | `## <slug-kebab>` / `- Raised by: <change-id> (<YYYY-MM-DD>)` / `- Slice: <1-2 sentences: what can be demoed when this is done>` / `- Deferred because: <blocking dep / scope / capacity>`. No "Pointer" field — the reasoning log will be re-grilled anyway; "Raised by" is enough of an entry point (the change-id survives as a trace, findable in `changes/archive/` once archived). |
| **`discovery` reads it** | At the start of `discovery`, if `openspec/BACKLOG.md` exists, read it as **context for grilling only** (an entry's "Slice" + "Deferred because" feed the interview so it doesn't re-cover known ground). If the file doesn't exist → skip silently. **Entry removal does NOT happen in `discovery`** — it happens at the end of `proposal` (step 6), once `proposal.md` is final, because scope can still narrow via the gate. |
| **Matching an entry to this change (step 6)** | The agent decides on its own whether a BACKLOG entry is now covered by this change — an LLM judgment against the entry's "Slice" line vs the final `proposal.md`. No user confirmation step. If matched, delete that entry before appending new ones. A wrong call is low-cost: a stale entry that stays gets re-evaluated next time, a wrongly-deleted one is recoverable from git. |
| **File header** | When the file is created, it starts with: a `# Deferred Slices` title, then one line — "Slices raised while planning another change, deliberately deferred. Not proposals — just enough to start a `discovery` session. Delete an entry when it becomes a change." Then the entries. |
| **When the last entry is removed** | Leave the file with just its header. Do not delete the file. (An empty-of-entries file is a valid state; deleting and recreating it churns git history for no gain.) |
| **`align` ignores it** | Out of scope for the consistency review — not an artifact of this change. |
| **Installer** | Does not touch it. Created at runtime the first time the gate fires. |

### 6.4 Seams in `design`

| # | Decision |
|---|---|
| **Section** | `## Shape / Seams` (keeps continuity with the instruction's existing "Shape" wording, marks the new function). |
| **Mandatory when** | `design.md` exists AND the change introduces callable code (new function/method/endpoint/module, or a changed signature). Skip (one line) only for pure config/data/infra designs with no new code surface — same pattern as the schema's existing security-pass skip. |
| **`design.md` now mandatory when** | The change introduces callable code that needs a tested boundary — even a small change gets a `design.md`, possibly thin everywhere except `## Shape / Seams` (Context one line, Decisions "none beyond Shape/Seams"). A change with genuinely no new code (pure config/data) may still skip `design.md` entirely. This adds one bullet to the "when to include design.md" criteria. |
| **Editing the old "Shape (optional)" text** | Two spots in the current `design` instruction say "optional": the Sections-list entry and the "Focus on architecture... the optional Shape section above is the one exception" line. **Both are edited directly** (not overridden) — this is the schema's own text, no reason to keep "optional" then negate it. |
| **Template position** | `## Shape / Seams` goes **after `## Decisions`** (seams follow from technical decisions; matches the instruction's section order). |
| **Framing** | Each seam = the public boundary where tests attach at `apply`. Prefer existing boundaries; explore the codebase (per `context:`'s rules) for them; only add a new seam when no existing boundary fits, and record why. |
| **Format** | Each seam entry: signature + which scenario/requirement's tests attach at it (`Covers: <name>`). |
| **Verifying "seam already exists"** | Handled by `align`'s existing `design/tasks -> codebase` dimension ("every concrete claim design.md makes about the existing system is checked against the actual codebase"). No new dimension for this. |

### 6.5 New `align` dimension (`hrt-align-consistency-review`)

| # | Decision |
|---|---|
| **Check** | One direction: every scenario in `specs/**` has a seam in `design.md`'s `## Shape / Seams` that can serve as its test attachment point. Uses the seam→scenario list from 6.4 as the anchor, checked both ways against `specs` (every listed scenario exists in specs; every specs scenario appears under some seam). |
| **Not checked** | seam → scenario the other way as a blocker (a seam with no scenario is at most over-design, which `hrt-adversarial-authoring` on `design` already handles). |
| **Severity / tag** | MEDIUM / DECISION. A scenario with no clear seam is not a cross-artifact contradiction; it's "incomplete coverage / edge case left un-scenarioed", which `align` already rates MEDIUM. No grep anchor for "can this seam test this scenario" → DECISION. |
| **When `design.md` doesn't exist** | Not reachable — 6.4 makes `design.md` mandatory whenever there's callable code. Pure config/data changes have no seams and no scenarios needing them. |

### 6.6 `align` WALKTHROUGH — seams highlight

A one-line highlight in WALKTHROUGH, written in the `align` instruction in `schema.yaml` (not in `SKILL.md`) — same as the dark-mode adjustment already there. After listing artifacts, before the generic question: point the user at `design.md`'s `## Shape / Seams` as the test-boundary decision, asking them to read that section specifically if the change has new code. Only relevant when the change has callable code.

Note on §6.5 severity: the `specs <-> seams` dimension is **always MEDIUM**, never HIGH. A truly untestable scenario is a `specs`-phase problem already guarded by the spec-structure dimension and `hrt-adversarial-authoring`'s "every requirement testable" check — `align` finding it late still only needs MEDIUM/DECISION (which surfaces to the user one at a time anyway). Do not add it to `align` step 5's HIGH examples.

Rationale: seams are the easiest thing for a non-technical reader to skim past (signatures, not behaviour). The ALIGN dimension (6.5) only surfaces *doubtful* seams one at a time; seams that pass ALIGN are never explicitly shown otherwise. Making every seam a DECISION prompt (rejected alternative) would mean 8 back-to-back prompts for an 8-seam change and would bury the ones that matter.

### 6.7 `apply` PHASE 1 — seam verification

| # | Decision |
|---|---|
| **Override style** | `tdd` is an external skill and can't be edited; "seam confirmation" is a step *inside* it. So this is an override paragraph in the `apply` instruction (like the existing REFACTOR override), with an explicit supersede sentence: where `tdd`'s loop calls for confirming/choosing a seam, the agent instead verifies the one `design.md` names against the actual code before RED. |
| **Bad seam** | A seam in `design.md` that is wrong / missing / untestable is a **blocker → pause to the user**. The agent MUST NOT silently pick a different seam — a bad seam means `align` missed something, so it warrants a pause (consistent with PHASE 1's existing "Pause on any other blocker"). |
| **Dark mode +implementation** | The seam-mismatch blocker in PHASE 1 routes to `dark-mode-decision-gate`, logged to `dark.md`'s Apply section. The gate can evaluate "is alternative seam X valid" from code + design + specs (evidence exists, unlike the size gate). NOT a fourth carve-out. |

### 6.8 `tasks` — wide-refactor exception

| # | Decision |
|---|---|
| **Form** | One cross-reference line in the existing demoability-per-heading rule ("except wide refactors, see below") + a paragraph describing **expand → migrate → contract** as sequential headings: `## 1. Expand` (new form alongside old), `## 2. Migrate call sites` (batched, possibly several headings), `## 3. Contract` (delete old). |
| **Trigger** | Qualitative, two conditions, both read from `design.md` (not counted by `tasks`): `design.md` identifies the change as a mechanical edit repeated across many call sites (rename, retype, signature change) AND no vertical slice of it can be demoed as a feature. No call-site count threshold — a number in the instruction just invites "is 87 enough?" debate. |
| **"Demoable" here** | Means "the suite stays green", not "a new feature is visible". |
| **`align`** | Not changed — `hrt-align-consistency-review` judges demoability by LLM judgment (not grep), so it reads the wide-refactor context from `tasks.md` + `design.md` itself. |

### 6.9 `hrt-adversarial-authoring` — proposal untouched, design gets seam checks

**`proposal` checklist: not touched.** The Destructive Critic for `proposal` already checks "Is scope creeping beyond what was asked?" — that catches a proposal that merges more than was grilled. The reverse ("split without reason") can't occur: the skill runs *after* the size gate, on an already-narrowed proposal. An explicit "is this one coherent slice" check would duplicate the existing one.

**`design` checklist: three additions**, because seams are a new artifact the skill was previously blind to:

| Where | Addition |
|---|---|
| `content_sections` for `design` (SKILL.md ~line 18) | Add "Shape / Seams (when the change adds callable code)" so the draft subagent produces it. |
| Structural Auditor, `design` checklist (~line 35) | "Shape / Seams: if a skip-line, is the change genuinely codeless? If it lists seams, does each have a real signature and a `Covers:` target that exists in `specs/**`? (ANCHORED: grep the `Covers:` name in specs)" |
| Destructive Critic, `design` checklist (~line 32) | "For each seam: is this the right boundary to test at, or did the design overlook a better-established one? Would testing here couple tests to an implementation detail?" |

**Resolution routing (SKILL.md ~line 38–40):**
- Auditor's `Covers:`-target check is **ANCHORED → auto-resolve** (grep fact, one correct fix — the design-phase "even ANCHORED to the user" bias is scoped to findings "bordering on scope", which a stale scenario reference is not).
- Critic's boundary-quality check is **UNANCHORED → surface to the user** (genuine judgment). In dark mode this is a single-reviewer UNANCHORED design finding, so the existing `design` dark-mode rule already routes it to `dark-mode-decision-gate` (logged to `dark.md` Design section) — no new rule needed.

---

## 7. What does NOT change

- `tasks` heading/checkbox model — already correct (from `2026-08-09-vertical-slicing-to-tickets.md`). Heading = vertical slice (`to-tickets` altitude), checkbox = TDD cycle (`tdd` altitude).
- `specs` template — deliberately behaviour-only (WHEN/THEN). No signatures.
- `hrt-adversarial-authoring` **`proposal`** checklist — not touched (see 6.9). Its **`design`** checklist does change (see 6.9).
- Installer (`install-schema.sh`, `install-schema.ps1`), `context:`, `merge-config.cjs` — no new skill, no new step. `templates/*` copy picks up the changed `design.md` automatically.
- `align`'s capability→heading coverage — the existing `specs -> tasks` dimension already covers it.
- `dark.md` template — the Apply section is already generic enough for the 6.7 entry; no `dark.md` change at all (the size gate doesn't log there, per 6.1; seam findings route via the existing `design`/`apply` dark-mode rules).
- No new phase (`wayfinder` equivalent) — `discovery` + Open Questions cover it.
- `discovery.md` / `dark.md` / `tasks.md` / `spec.md` templates — unchanged (only `design.md` gets a new section).

### Known dependency: dark mode

§6.1, §6.7, and §6.9 add dark-mode routing text (a third size-gate carve-out; seam-mismatch → `dark-mode-decision-gate`; the `design` UNANCHORED seam finding). Dark mode itself is still an unproven prototype (commit `c40e4b2`, marked DANGEROUS). Decision: keep these paragraphs in this change. If dark mode is later reverted or reworked, these three spots must be revisited together — they are the only coupling points.

---

## 8. Files to change (index — the actual wording is in §10)

1. **`openspec/schemas/tempa-spec/schema.yaml`** — `discovery` (§10.1), `proposal` (§10.2), `design` (§10.3), `tasks` (§10.4), `align` (§10.5), `apply` (§10.6) instructions; `version` bump (§10.7).
2. **`openspec/schemas/tempa-spec/templates/design.md`** — `## Shape / Seams` section after `## Decisions` (§10.8).
3. **`skills/hrt-align-consistency-review/SKILL.md`** — `specs <-> seams` dimension, 7 → 8, always MEDIUM (§10.9).
4. **`skills/hrt-adversarial-authoring/SKILL.md`** — three `design`-only additions: `content_sections`, Structural Auditor, Destructive Critic (§10.10).
5. **`CHANGELOG.md`** — release entry (§10.11).
6. **`AGENTS.md`** — one paragraph (§10.12).
7. **`openspec/BACKLOG.md`** — created at runtime by the `proposal` gate, not now.

Validation after applying: §10.13.

---

## 9. Sources

- `2026-08-09-vertical-slicing-to-tickets.md` (this repo) — prior research the seam/slice model builds on; its verified SKILL.md quotes are relied on here.
- https://www.aihero.dev/skills-wayfinder, /skills-to-spec, /skills-to-tickets, /skills-implement — companion articles, fetched 2026-08-27.
- `Fission-AI/OpenSpec` — CLI directory-scanning behaviour (bare `.md` files ignored) via DeepWiki; `opsx:propose` interaction-point behaviour and its relationship to custom-schema instructions verified against **cloned source** (`skills/openspec-propose/SKILL.md`, `master`, 2026-08-27), not DeepWiki — see §6.1 for the quoted steps.
- Repo files read: `schema.yaml` (v11), `templates/tasks.md`, `templates/spec.md`, `templates/design.md`, `templates/dark.md`, `skills/hrt-align-consistency-review/SKILL.md`, `skills/hrt-adversarial-authoring/SKILL.md`, `skills/dark-mode-decision-gate/SKILL.md`, `skills/dark-mode-opt-in/SKILL.md`.

---

## 10. Implementation spec (ready-to-paste text)

This section is the actual change. Each block is the wording to insert; wording is prompt engineering, not prose — do not paraphrase it when applying.

### 10.1 `schema.yaml` — `discovery` instruction

Add, as a new paragraph near the top of the `instruction` (after the "MUST use the `grilling` skill" paragraph):

> Before starting the interview, if `openspec/BACKLOG.md` exists, read it. Its entries are slices deferred from earlier changes' planning. Use any entry's "Slice" and "Deferred because" lines as context for the interview — do not re-litigate ground an entry already covers. This is read-only context; do not edit or remove entries here. If the file does not exist, continue without comment.

### 10.2 `schema.yaml` — `proposal` instruction

Add, as the FIRST thing the instruction tells the agent to do (before "Create the proposal document..."):

> **Change-size gate (run this first).** Draft the "What Changes" list as working content. Then check: does it contain two or more items where (a) each could be shipped and verified by a user on its own, (b) none has a code or data dependency on another, and (c) no two of them fall under the same capability in the **Capabilities** section you are drafting? Only if all three hold: this materially affects the scope of the change — you MUST stop and ask the user whether this should be one change or several, following the `plain-language-writing` skill's COMMS rules. Do not split on your own. Default to one change. A single user story that touches many layers or many capabilities is not a trigger — the signal is several independent stories combined, not one broad story.
>
> If the user chooses to split:
> 1. Ask which slice to build now.
> 2. Write `proposal.md` for that slice only. Add an `## Out of Scope` section listing each excluded slice on one line.
> 3. Add an entry to `discovery.md`'s **Key Decisions**: "Scope: build slice `<X>` only — slices `<Y, Z>` split to separate changes (decided at the proposal size-gate). Alternative rejected: one combined change (too large; downstream phases inflate)." Leave it in place permanently — it records what the discovery session covered.
> 4. Run the `hrt-adversarial-authoring` step below. If its Destructive Critic narrows scope further, add the newly-excluded slice(s) to `## Out of Scope`.
> 5. Once `## Out of Scope` is final: if `openspec/BACKLOG.md` has an entry this change now covers (judge the entry's "Slice" against the final `proposal.md`), delete that entry. Then append one entry per `## Out of Scope` slice, in this format:
>    ```
>    ## <slug-kebab>
>    - Raised by: <this change-id> (<YYYY-MM-DD>)
>    - Slice: <1-2 sentences: what a user can demo when this slice is done>
>    - Deferred because: <blocking dependency / scope / capacity>
>    ```
>    If `openspec/BACKLOG.md` does not exist, create it first with a `# Deferred Slices` title and this line: "Slices raised while planning another change, deliberately deferred. Not proposals — just enough to start a `discovery` session. Delete an entry when it becomes a change." If deleting the last entry leaves the file with only its header, leave it that way — do not delete the file.
>
> **In dark mode (`dark.md` exists): this gate still escalates to the user.** It is not routed to `dark-mode-decision-gate` — same carve-out as the security decisions. WALKTHROUGH and everything else about dark mode are unchanged.

### 10.3 `schema.yaml` — `design` instruction

**(a) Edit the "When to include design.md" list** — add one bullet:

> - The change introduces callable code (a new function, method, endpoint, or module, or a changed signature) that needs a tested boundary — in this case create `design.md` even if it is thin everywhere except Shape / Seams.

**(b) Replace the existing `Shape` entry** in the Sections list (currently "**Shape** (optional): For designs introducing new modules...") with:

> - **Shape / Seams**: required whenever the change introduces callable code. List each seam — the public boundary where `apply`'s tests will attach. For each: its signature, and which spec requirement or scenario has its tests attached there (`Covers: <name>`). Prefer boundaries that already exist in the codebase (explore for them, per `context:`'s rules); add a new seam only when no existing boundary fits, and say why. Skip this section with a one-line note ("no new code surface") only for pure config, data, or infra changes.

**(c) Edit the "Focus on architecture..." line** — it currently reads "...not line-by-line implementation - the optional Shape section above is the one exception, scoped to signatures and file layout, not function bodies." Change "the optional Shape section" → "the Shape / Seams section" (drop "optional" — it's now required for callable-code changes).

### 10.4 `schema.yaml` — `tasks` instruction

**After the demoability-per-heading bullet**, add to that bullet's end:

> (exception: wide refactors — see below)

**Add a paragraph** after the Guidelines list:

> **Wide-refactor exception.** If `design.md` identifies the change as a mechanical edit repeated across many call sites (a rename, a retype, a signature change) where no vertical slice can be demoed as a feature, the demoability-per-heading rule does not apply. Use expand → migrate → contract as sequential headings: `## 1. Expand` (new form added alongside the old), `## 2. Migrate call sites` (in batches; may span several headings), `## 3. Contract` (remove the old form). "Verifiable" for these headings means the test suite stays green, not that a new behavior is visible.

### 10.5 `schema.yaml` — `align` instruction

**Add** after the `hrt-align-consistency-review` pointer, before the dark-mode paragraph:

> When `design.md` has a Shape / Seams section, the WALKTHROUGH round MUST also point the user at it by name: the seams are the test boundaries the implementation will be built against, and a wrong one is easy to skim past because it reads as a signature, not a behavior. Ask the user to read that section specifically.

### 10.6 `schema.yaml` — `apply` instruction

**In PHASE 1**, after the REFACTOR override, add this override paragraph (the PHASE 1 opening sentence still says "MUST use the `tdd` skill for seam confirmation..." — leave that; this paragraph supersedes the seam-choosing part of it):

> **Seam override.** Seams are already fixed in `design.md`'s Shape / Seams section. This supersedes the seam-confirmation step of the `tdd` skill's loop: do not choose or re-derive a seam. Before each RED test, verify the seam `design.md` names still matches the actual code. A seam that is missing, wrong, or cannot carry a test is a blocker — pause to the user (following the `plain-language-writing` skill's COMMS rules), same as any other PHASE 1 blocker. MUST NOT silently substitute a different seam.

**In the dark-mode block** (the `dark.md` header = +implementation branch), add:

> A seam-mismatch blocker in PHASE 1 routes to `dark-mode-decision-gate` (logged to `dark.md`'s Apply section), not to the user — the gate can weigh an alternative seam against the code, design, and specs.

### 10.7 `schema.yaml` — version

Bump `version: 11` → `version: 12`.

### 10.8 `templates/design.md`

The template currently has **no** Shape section. **Insert** this new section immediately after `## Decisions` (before `## Risks / Trade-offs`):

```markdown
## Shape / Seams

<!-- Required when the change introduces callable code. One entry per seam:
     - `signatureOfPublicBoundary(args): ReturnType` — where apply's tests attach
       Covers: <spec requirement or scenario name>
     Prefer existing boundaries; note why any new seam is new.
     For pure config/data/infra changes, replace this section body with: "no new code surface". -->
```

### 10.9 `skills/hrt-align-consistency-review/SKILL.md`

**In ALIGN step 2**, add a new dimension to the list (after the `design -> tasks` dimension):

> - specs <-> seams: every `#### Scenario` in `specs/**` has a seam in `design.md`'s Shape / Seams section whose tests could attach to it, and every seam's stated "Covers:" scenario/requirement actually exists in `specs/**`. LLM judgment for "could a test for this scenario attach here"; the seam list itself is the anchor for the reverse direction. Skip this dimension only when `design.md` has no Shape / Seams section (pure config/data change).

**In ALIGN step 2's closing line ("complete for all 7 dimensions") and step 4**, change "7" → "8".

**In ALIGN step 5**, add to the **MEDIUM** examples (not HIGH — see below):

> a scenario with no seam it could attach to, or a seam naming a "Covers:" target that isn't in the specs

This dimension's findings are **always MEDIUM, never HIGH** — a genuinely untestable scenario is caught earlier by the spec-structure dimension and `hrt-adversarial-authoring`. Do not add anything to step 5's HIGH examples.

**In ALIGN step 6**, this dimension's findings are DECISION (no grep anchor for "a test could attach here").

**In VERIFY step 1 and step 2**, "the same 7 dimensions" → "the same 8 dimensions".

### 10.10 `skills/hrt-adversarial-authoring/SKILL.md` (`design` artifact only)

**(a) `content_sections` for `design`** (Parameters section, ~line 18) — append to the list:

> Shape / Seams (when the change adds callable code)

**(b) Structural Auditor, `design` checklist** (~line 35) — add:

> Shape / Seams: if the section is a skip-line, is the change genuinely codeless? If it lists seams, does each have a real signature and a `Covers:` target? ANCHORED: grep each `Covers:` name in `specs/**` — a target that isn't there is a finding.

**(c) Destructive Critic, `design` checklist** (~line 32) — add:

> For each seam: is this the right boundary to test at, or did the design overlook a better-established one? Would testing here couple tests to an implementation detail?

**(d) Resolution routing** (~line 38–40): the Auditor's `Covers:`-target check is **ANCHORED → auto-resolve** (grep fact; the "even ANCHORED to the user" design bias is scoped to scope-bordering findings, which a stale reference is not). The Critic's boundary-quality check is **UNANCHORED → surface to the user**; in dark mode the existing `design` dark-mode rule already routes single-reviewer UNANCHORED findings to `dark-mode-decision-gate`, so no new dark-mode text is needed.

### 10.11 `CHANGELOG.md`

Add at the top:

```markdown
## <next-date> — <YYYY-MM-DD> (schema v12)

- Adds a change-size gate at the start of `proposal`: when "What Changes" holds two or more independent, non-dependent, non-`specs`-sharing slices, the agent stops and asks the user whether to split — default one change, agent never splits on its own, still escalates in dark mode
- Adds `openspec/BACKLOG.md`, a persistent parking lot for slices deferred by that gate; `discovery` reads it as interview context, `proposal` writes and prunes it
- Raises seams to a first-class `design.md` section (`## Shape / Seams`), required whenever the change adds callable code; makes `design.md` itself required in that case
- Adds a `specs <-> seams` dimension to `align`'s consistency review (7 → 8 dimensions, always MEDIUM) and a WALKTHROUGH prompt pointing the user at the seams
- `hrt-adversarial-authoring` reviews the new seams in its `design` pass — Structural Auditor checks each `Covers:` target exists, Destructive Critic checks the boundary choice
- `apply` PHASE 1 now verifies the `design.md` seam against real code instead of choosing one; a mismatch is a blocker (routed to `dark-mode-decision-gate` in dark +implementation)
- Adds an expand → migrate → contract exception to `tasks.md` for wide mechanical refactors
```

### 10.12 `AGENTS.md`

**In the "thin pointers to skills" paragraph** (the long one under "Editing schema.yaml"), no change needed — the gate and seams are inline instruction text, not skill pointers.

**Under "Editing schema.yaml"**, add a short paragraph:

> The `proposal` instruction opens with a change-size gate — if "What Changes" holds several independent slices, the agent asks the user whether to split rather than proceeding. Deferred slices are recorded in `openspec/BACKLOG.md` (created at runtime, not provisioned by the installer; the OpenSpec CLI ignores bare `.md` files under `openspec/`). `design.md`'s `## Shape / Seams` section carries the test boundaries forward to `apply`; `align` has a `specs <-> seams` dimension checking every scenario has one, and `hrt-adversarial-authoring`'s `design` pass reviews them. See `docs/research/2026-08-27-mattpocock-skills-gate-and-seams.md`.

### 10.13 Validation after applying

Per the repo's hand-check rules (no test suite for schema/templates):

1. `schema.yaml` is valid YAML.
2. `requires` graph unchanged (this change adds no artifact) — still no cycles, no missing ids.
3. Every `template:` file still present; `templates/design.md` now has `## Shape / Seams` after `## Decisions`.
4. `hrt-align-consistency-review/SKILL.md` — the dimension count reads "8" everywhere it's stated (step 2 close, step 4, VERIFY steps 1–2). No addition to step 5's HIGH examples.
5. `hrt-adversarial-authoring/SKILL.md` — only the `design`-parameterized text changed; `proposal` and `specs` checklists untouched.
6. No `merge-config.cjs` change → `scripts` test suite not affected.
7. Grep the whole repo for "optional Shape" / "Shape (optional)" — no stale references left in `schema.yaml`.
8. If the schema is installed in a downstream OpenSpec repo, run `openspec validate --strict` there.
