# OpenCode as a tempa-spec host, and an additive enforcement layer

**Date:** 2026-11-19 (revised 2026-11-20 after a runtime probe, see the Addendum)
**Trigger:** the team currently splits hosts: Claude Code for planning (artifact creation), Kilo Code for implement+verify (`opsx apply`, `verify`, …). Kilo Code is heavy and unfriendly to work in, and the team wants OpenCode as its replacement — for either phase or both. Follow-up question from the maintainer: can OpenCode itself be made a *stricter harness*, so tempa-spec's guidelines are followed more consistently — with the hard constraint that everything OpenCode-specific stays **additive**: tempa-spec remains generic, and on any other host (Claude Code, Kilo Code) behavior is the unchanged baseline.
**Scope:** `openspec/schemas/tempa-spec` usage against the OpenCode agent harness, the OpenSpec CLI's tool adapters, and this repo's installer and skills. Pure research — nothing applied; no schema, skill, or installer change. Evidence: OpenCode documentation (skills, agents, config, plugins, plugin server API), OpenSpec `docs/supported-tools.md` and source (`src/core/config.ts`, `src/core/command-generation/adapters/opencode.ts`), one local probe of `npx skills add` output directories, and reads of this repo's skills. API claims were checked against documentation on 2026-11-19; items that only a running session can confirm are listed as pilot items in [§9](#9-confidence-and-open-items).
**Status:** research complete. Part 1 (host viability) is settled: OpenCode can serve both phases today with **zero changes** to schema, skills, or installer; adoption is a pilot decision, not a build task. Part 2 (the additive layer) is design-level: every mechanism it relies on is verified against documentation, the distribution choice (separate script vs installer auto-detection) is analyzed in [§7](#7-distribution-separate-script-vs-installer-detection) and remains an open maintainer decision, and the maintainer's preferred variant (installer detection) was re-assessed during this research and found acceptable under the conditions given there. [Part 4a](#4a-part-4a--sub-phase-and-loop-control-inside-apply), added after a maintainer-requested critical re-review, covers sub-phase and loop control inside `apply` — four gates and a plugin-owned loop journal that mechanize existing schema and skill rules only.

## Addendum — runtime verification (2026-11-20)

The design below was first written from documentation. On 2026-11-20 its mechanisms were run for real: OpenCode 2.3.2 (`@opencode/plugin` 2.3.2), OpenSpec 2.1.1, a scratch git repo, a probe plugin in `.opencode/plugins/`, and the MiniMax-M3.1-Flash model. Result: the architecture holds and every core mechanism works, but several claims were wrong or incomplete and are corrected inline (marked "run check" or "corrected 2026-11-20"). Items still unverified are listed in §9.

**Confirmed by running**

- A plain `{ id, setup(ctx) }` object in `.opencode/plugins/*.ts` loads with no config entry and no import.
- `throw` inside `tool.hook("execute.before")` blocks the call, and the message reaches the model as a tool error.
- `shell.hook("create.before")` also blocks, but its event carries only `command`, `cwd`, `timeout`, `shell`, `env`: no `sessionID`, no `agent`.
- `session.hook("context")` fires per request with `agent`, `sessionID`, `system[]` (`{type:"text", text}`) and `tools{}`; deleting a key from `tools` works.
- Hooks fire inside a child session (agent `general`, its own `sessionID`).
- `session.update({ sessionID, permissions })` deny rules apply to the session and are inherited by child sessions created afterwards.
- `permission.hook("evaluate")` is not called for a `deny`, whether it comes from config or from `session.update`.
- Permission `**` globs work (`openspec/changes/**/apply-guard.json`).
- `openspec validate --strict` accepts a foreign `apply-guard.json` in the change directory, and the file moves with the folder when the change is archived.

**Corrected**

- **Rule order.** The permission list is evaluated with the **last matching rule winning**. `deny git commit*` placed before `allow *` let `git commit` succeed. Every deny must come after the broad allows.
- **Edit-deny does not cover the shell.** The `write` tool was denied for `apply-guard.json`, but `echo ... > apply-guard.json` through the shell succeeded.
- **The model reaches for the server API.** A child blocked from spawning a grandchild created a session through `opencode api post /api/session` from its shell. Under `--auto` the agents also read and wrote outside the project (`external_directory`). The layer must deny `opencode api*`, `opencode run*` and `external_directory`.
- **Detection signal.** OpenSpec 2.1.1 does not write `aiTools`. The tool choice is recorded in `.agents/skills/.openspec-target` (one id per line, optionally followed by `own-files`). A default-profile `init --tools opencode` creates no `.opencode/` directory.
- **Completion door.** `ff` and `bulk-archive` are not CLI commands. The shipped archive skill moves the folder with `mv`, and `openspec archive -y` archived a change with an unticked task, so the CLI does not enforce full-tick itself.
- **Grandchild sessions.** The built-in `general` agent has `subagent` denied, so single-orchestrator apply needs a custom agent that allows spawning. Grandchild hook visibility is unverified.

## Contents

0. [Addendum — runtime verification (2026-11-20)](#addendum--runtime-verification-2026-11-20)
1. [Part 1 — OpenCode as host: findings](#1-part-1--opencode-as-host-findings)
2. [Part 2 — the additivity constraint and the three-ring architecture](#2-part-2--the-additivity-constraint-and-the-three-ring-architecture)
3. [Part 3 — verified OpenCode enforcement mechanisms](#3-part-3--verified-opencode-enforcement-mechanisms)
4. [Part 4 — mapping: tempa-spec discipline to OpenCode enforcement](#4-part-4--mapping-tempa-spec-discipline-to-opencode-enforcement) — sub-phase and loop control inside `apply` in [Part 4a](#4a-part-4a--sub-phase-and-loop-control-inside-apply)
5. [Part 5 — what stays non-mechanical](#5-part-5--what-stays-non-mechanical)
6. [Part 6 — resolved design questions](#6-part-6--resolved-design-questions)
7. [Part 7 — distribution: separate script vs installer detection](#7-part-7--distribution-separate-script-vs-installer-detection)
8. [Part 8 — tiers and pilot plan](#8-part-8--tiers-and-pilot-plan)
    - [Part 8a — other harnesses considered](#8a-part-8a--other-harnesses-considered)
9. [Part 9 — confidence and open items](#9-confidence-and-open-items)
10. [Sources](#10-sources)

---

## 1. Part 1 — OpenCode as host: findings

**tempa-spec is host-agnostic by construction.** A grep over the repo finds no reference to Kilo Code or Claude Code anywhere in `schema.yaml`, `templates/`, or `skills/` — the workflow stands on four things: prompts printed by the OpenSpec CLI (`openspec instructions <phase>`), skills installed to `.agents/skills/`, shell (Node for `lint.cjs`/`floor-guard.cjs`, the `opengrep` binary), and a subagent tool for every reviewer. Dark mode's only activation signal is the file `dark.md` ([hrt-dark-mode-opt-in](../../skills/hrt-dark-mode-opt-in/SKILL.md): "`dark.md`'s existence is the only signal dark mode is active. No separate flag.") — nothing host-specific anywhere in the chain.

**OpenCode covers all four requirements natively:**

| Requirement | OpenCode mechanism | Evidence |
|---|---|---|
| Skills in `.agents/skills/` | OpenCode searches `.agents/skills` (project and global) as a compatibility source, alongside `.claude/skills` and `.opencode/skills` | opencode.ai/docs/skills — precedence list |
| Subagent reviewers (mandatory: no subagent → skill stops and reports, EGM §3.5) | `subagent` tool, built-in `general`/`explore` subagents, custom agents at `.opencode/agents/*.md` with `mode: subagent` | opencode.ai/docs/agents |
| `opsx` slash commands | OpenSpec has an OpenCode adapter whose source writes `.opencode/commands/opsx-<id>.md` (invoked as `/opsx-<id>`). *Run check 2026-11-20 (OpenSpec 2.1.1, default profile):* `init --tools opencode` wrote six skills to `.agents/skills/openspec-*/` plus `.agents/skills/.openspec-target`, no `.opencode/` directory and no command files; the entry point was `/openspec-propose`. Whether the expanded profile (`openspec config profile`) writes the `opsx-*` command files is unverified | OpenSpec supported-tools.md; `opencode.ts`; probe |
| MCP (CodeGraph, per the installer's `context:` MUST) | `mcp.servers` in `opencode.json(c)` | opencode.ai/docs/config |
| Shell (lint, floor guard, opengrep, tests) | bash via the shell tool; `opengrep` requirement is host-independent | — |

The skills claim was also verified empirically: running `npx skills@latest add <this repo>/skills --full-depth --agent '*'` in a scratch directory writes `.agents/` and `.claude/` only (no `.opencode/`), and OpenCode reads `.agents/skills` from its compatibility sources — so **the installer as it ships today already provisions skills in a form OpenCode reads. No installer change is needed for skill coverage.** OpenSpec 2.1.1 also writes its own skills to `.agents/skills/` for OpenCode, so both sets share one folder.

One known caveat, consistent with the repo's own EGM analysis ([2026-11-16-egm-adoption-analysis.md](2026-11-16-egm-adoption-analysis.md) §3.3, not adopted): a "fresh-context" reviewer subagent on OpenCode still reads project instruction files (`AGENTS.md`), the same failure mode documented for Codex and Antigravity (OpenSpec issue #237 analog). This is acceptable because the review skills do not depend on context exclusion; behavior matches Claude Code without the EGM plugin.

**Recommendation recorded:** replace Kilo Code with OpenCode for `apply`+verify first — the lowest-risk move, because that phase is carried by deterministic tooling (TDD loop, `lint.cjs`, `floor-guard.cjs`, `opengrep` PREFLIGHT) that any competent harness runs. Planning migration (proposal interview, adversarial authoring) should be a separate decision after a pilot, because its quality is set by the *model's* instruction-following, not the harness — see [2026-07-12-cross-model-instruction-following.md](2026-07-12-cross-model-instruction-following.md).

## 2. Part 2 — the additivity constraint and the three-ring architecture

The maintainer's constraint: customizations (plugins, custom tools) may only *add* quality when tempa-spec runs inside OpenCode; on any other host the baseline is unchanged. This rules out any fork of the schema or skills and any host-conditional text inside the core. The architecture that satisfies it has three rings:

```
┌─ Ring 3: ADAPTER (per-host, additive) — .opencode/ ────────┐
│  permissions/policies, agents, plugin, companion skills    │
│   ┌─ Ring 2: STATE CONTRACT (host-neutral) ────────────┐   │
│   │  files: proposal.md, specs/, design.md, tasks.md,  │   │
│   │  align.md, dark.md, red-log.md, Covers:/[Threat]   │   │
│   │   ┌─ Ring 1: CORE (host-neutral, untouched) ────┐  │   │
│   │   │  schema.yaml, templates/, .agents/skills/   │  │   │
│   │   └─────────────────────────────────────────────┘  │   │
│   └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

The load-bearing fact: **tempa-spec already disciplines through file state** (ring 2). An OpenCode adapter (ring 3) only reads the same files and enforces what they record, mechanically. Every injection channel lives under `.opencode/` (plus the OpenCode-only config file), which only OpenCode loads — Claude Code reads `.claude/skills` and `.agents/skills`, Kilo Code reads `.kilocode/`/`.kilo/`; none of them ever see the adapter.

**Purity invariant (CI-checkable):** `schema.yaml`, `templates/`, and `skills/**` must contain zero occurrences of `opencode`/`.opencode`. A one-line grep check in CI makes host-neutrality mechanical instead of a review-time promise. The same invariant implies: no core instruction may ever name the layer or its installer — the layer is discoverable through documentation only.

## 3. Part 3 — verified OpenCode enforcement mechanisms

All of the following were checked against OpenCode documentation (plugin server API, config, permissions) on 2026-11-19, and the ones marked "Run check" were exercised on OpenCode 2.3.2 on 2026-11-20 (see the Addendum). Names are V2 (`@opencode/plugin`, `Plugin.define`); a plugin can dual-export V1 `server()` + V2 `setup()` from one package, which softens API-churn risk during the pilot.

1. **`ctx.session.hook("context")` — per-request system injection and tool removal.** The hook runs immediately before every agent-loop model dispatch and can `event.system.push(...)` additional instructions, `delete event.tools.write` (remove a tool from that request's toolset), and set request options. The event carries `readonly agent: string` and `sessionID`, so scoping by agent (orchestrator vs reviewer) is a first-class field, not a guess. Because it runs per request, injected text survives compaction automatically and never accumulates in history. *Run check:* the hook fired on every request in primary and child sessions with the fields above, and removing a tool from `event.tools` worked. Compaction behavior itself is unverified.
2. **`ctx.session.update({ sessionID, permissions })` — dynamic, session-scoped permission rules,** evaluated after agent rules; *"Child sessions inherit the rules in effect when they are created."* This is the phase-gate primitive: when `apply` starts, deny edits to artifacts; before `align.md` sign-off, deny edits to code; reviewer subagents spawned afterwards inherit the tightened rules without any code in the review skills changing. *Run check:* a deny on `tasks.md` set on the primary session was enforced for the primary session and for the child spawned afterwards. Rules are `{ action, resource, effect }`, last match wins. Applying a rule to the child only (so the orchestrator can still tick) is by design but untested; the place to do it is the child's first `context` event.
3. **`ctx.permission.hook("evaluate")` — controlled relaxation.** Runs after configured rules; may flip `ask` → `allow`/`ask`/`deny` with a reason message. Crucially, *"an explicit configured `deny` is final and does not invoke the hook."* This is architecturally exact for dark mode: static denies (commit/push, config edits) stay unbreakable, while a plugin may auto-approve ask-level actions only when `dark.md` exists — turning dark mode into real autonomy on OpenCode while every other host keeps manual approval. *Run check:* confirmed that `evaluate` is not called for a configured or session `deny`. Its payload is `{ sessionID, agent, action, resources[], effect, message }`.
4. **`ctx.tool.hook("execute.before"/"execute.after")` — block and annotate.** `before` may fail with `Tool.Error` carrying a one-line actionable reason (the repo's established "MECHANICAL, fix outside the code" style); `after` may replace the result, e.g. append `lint.cjs` output after every artifact write so the deterministic lint cannot be forgotten, and run `floor-guard.cjs` logic at the moment of the edit instead of at review time. *Run check:* a plain `throw new Error(...)` in `execute.before` blocks the call and the model sees the message as a tool error. The documentation only describes `Tool.Error` for permission rejections, so the block does not depend on that class. Tool names seen: `shell`, `write`, `edit`, `read`, `subagent`, `skill`, `execute`.
5. **`ctx.shell.hook("create.before")` — every shell command interception** (command, cwd, env, timeout), for shell-level floor guarding beyond config policies. *Run check:* it blocks, but the event has no `sessionID` or `agent`, so any gate that needs session context belongs in `tool.hook("execute.before")` for the `shell` tool instead.
6. **`ctx.session.instructions.entry.put` — durable `<context key>` instruction entries** rendered into the session's instructions, announced at the next step boundary — the lightweight persistent-state channel complementing per-request injection.
7. **Config stacking.** OpenCode merges config files by precedence; the documentation states that the `plugins` array is combined instead of replaced (corrected 2026-11-20: it does not say this for every array field). Permissions are an ordered rule list, **last match wins**. `opencode debug config` lists every loaded source and the merged permission array. The adapter can own `.opencode/opencode.jsonc` and coexist with a user's root `opencode.json` without a merge script, **but only when the user has no `.opencode/opencode.jsonc` of their own**; that file is a real collision the provisioning step must handle. Plugins are auto-discovered only from `.opencode/plugins/`, not from a `plugins/` folder beside a root `opencode.json`.
8. **Companion skills.** `.opencode/skills/<name>/SKILL.md` is an established ecosystem pattern (plugin + skill that teaches the model the enforcement, e.g. the Replicate plugin). It is also the slot no other host reads, i.e. additive by construction.

## 4. Part 4 — mapping: tempa-spec discipline to OpenCode enforcement

Baseline = what the prompts/skills already require (works on every host). "Layer" = the ring-3 component that enforces it on OpenCode only.

| Discipline | Baseline enforcement | OpenCode additive enforcement | Layer piece |
|---|---|---|---|
| Never commit/push | AGENTS.md rule (prompt) | policy hard-deny `shell` `git commit*`, `git push*`, placed after the broad allow (last match wins; verified the other order lets the commit through) | config |
| Reviewer read-only | implicit in review skills (prompt) | reviewer agent with `edit: deny` | config (agent file) |
| No artifact edits after finalize | prompt | phase-gate deny via dynamic session permissions | plugin |
| No code edits before `align.md` sign-off | prompt (align is a human gate) | deny `edit` on code paths until sign-off file exists | plugin |
| `lint.cjs` cannot be forgotten | skill/prompt says "run it" | auto-run after artifact `write`/`edit`, result injected | plugin |
| Floor guard (suppressions, skips, deleted tests, stubs) | review-time `floor-guard.cjs` | live at `edit`/shell time, same pure logic reused | plugin |
| `opengrep` required / PREFLIGHT | schema text; missing tool = automatic HIGH | unchanged; optionally a first-edit reminder | — (keep as-is) |
| Dark mode autonomy | file signal (`dark.md`), approvals manual | `evaluate` hook relaxes asks when `dark.md` exists; denies final | plugin |
| Strict-rules text (OpenCode-only) | — | `instructions` config + companion skill + per-request injection | config/plugin |
| Phase-state visibility for the model | prompt narration | `tempa_state` tool and/or `<context>` entry | plugin |
| tasks.md checkboxes ticked only by the orchestrator | prompt | partial: deny `edit` to `tasks.md` in subagent sessions; inheritance of session deny rules verified, child-only application (set in the child's first `context` event) untested | config/plugin |
| Edit scope confined to the change | prompt | partial/deferred — false-positive risk, see [§5](#5-part-5--what-stays-non-mechanical) | deferred |
| The agent cannot step outside the layer through OpenCode itself | — | deny `shell` `opencode api*` and `opencode run*`; deny `external_directory` (all seen used by a blocked agent in the 2026-11-20 probe) | config |
| Journal and `tasks.md` cannot be changed by a shell redirect | — | `execute.before` inspects `shell` command text for writes, moves and deletes of those paths (the edit deny does not cover the shell) | plugin |

## 4a. Part 4a — sub-phase and loop control inside `apply`

Added after the maintainer asked whether the phases and review loop *inside* `apply` — PREFLIGHT, Phase 1 (TDD groups), Phase 2 (review, at most 3 passes), Phase 3 (`mr-brief.md`) — can be controlled the way stage transitions are, and asked for a critical re-review before this was recorded. The re-review held, with four corrections ([§4a.3](#4a3-findings-from-the-re-review)). The framing that makes it work: the schema and `hrt-apply-code-review` already state every rule these gates enforce, so the layer creates **no new process rule** — it turns existing prompt rules into mechanical ones, which is the strongest additivity story available.

### 4a.1 The four gates

| Transition | Rule already in force (source) | File signal today | Layer enforcement |
|---|---|---|---|
| Enter Phase 1 (PREFLIGHT) | "PREFLIGHT (every mode, before anything else, **writes nothing**)"; "If this host cannot spawn a subagent, STOP"; the `opengrep --version` check (`schema.yaml`, apply instruction) | none — PREFLIGHT is conversational | deny edits outside the change directory — and the first Phase-1 spawn — until the plugin has itself run `opengrep --version` successfully once for the session (corrected 2026-11-20: the plugin runs the check; it does not wait to observe the agent doing it). The subagent probe is dropped on OpenCode, because the primary agent always has the `subagent` tool and the probe would test nothing. Deliberately **time-scoped, not path-scoped** — narrower than edit-scope confinement, which stays deferred (Tier 2) |
| Phase 1 → Phase 2 | the review checks code "once every task is complete" (`hrt-apply-code-review`); each task's RED output "must be on disk" (`schema.yaml`, Phase 1) | `tasks.md` full-tick + `red-log.md` exists | the review's step-1 commands are fixed strings (`opengrep scan --config .agents/skills/hrt-security-pass/opengrep`, `floor-guard.cjs --base=`); on the first occurrence via shell interception, deny unless both file signals hold. Existence checks, not content checks — a docs-only change may carry a thin `red-log.md` |
| The pass loop | "a loop of at most 3 passes"; "A review that did not happen is not a clean pass"; the `not run` rules (quoted in [§4a.2](#4a2-the-gate-journal-apply-guardjson)) | none — pass count and verdicts exist nowhere on disk | the gate journal ([§4a.2](#4a2-the-gate-journal-apply-guardjson)) |
| Exit stage | archiving "happens after apply finishes and a human has confirmed" (`schema.yaml`, tasks guidance); "tell the user NOT to archive the change until they are resolved" (`hrt-apply-code-review`) | `mr-brief.md`, full-tick, review report | deny the agent's completion commands — `openspec archive` (also through `npx`) and any `mv` or `git mv` whose target is under `openspec/changes/archive/` (corrected 2026-11-20: the shipped archive skill moves the folder with `mv`, and `ff` and `bulk-archive` are not CLI commands). Both doors are shell commands, which is what makes them enforceable — unless full-tick, `red-log.md`, `mr-brief.md`, and a journal final verdict of *ran and clean, no unresolved HIGH* all hold. Escape hatches: the gate fires only when the change dir has a `tasks.md` (a change that never entered `apply` archives freely), and an abandoned applied change is discarded by deleting the change dir, which is not gated |

Phase 2 → Phase 3 needs no gate of its own beyond the journal: `mr-brief.md` is Phase 3's *output*, not its entry condition (an earlier draft of this section had that direction backwards; corrected in [§4a.3](#4a3-findings-from-the-re-review)).

The strongest single piece is the exit gate, for two reasons. The completion step is a shell command, so the one shortcut that matters — declaring the change done — is mechanically interceptable, where conversational claims are not. And the schema and skill already instruct exactly this hold ("NOT to archive"), so the gate mechanizes an instruction that today relies on the model remembering it under pressure.

### 4a.2 The gate journal: `apply-guard.json`

The loop's state — which pass, what verdict, whether the reviewer actually ran — exists nowhere on disk today, so no file-derived gate can enforce the pass cap or the EGM `not run` rule. The layer therefore owns one small file per change, `openspec/changes/<name>/apply-guard.json`, recording ordered entries `{subphase, pass, verdict, evidence}`. The plugin writes it as passes start and end; every gate reads it.

What this mechanizes, verbatim from existing rules:

- **The pass cap** ("Stop ... after the 3rd pass"): a fourth pass is denied, with the message pointing at the release-blocker rule the skill already states for an unresolved 3rd pass.
- **EGM `not run`** (a reviewer that "fails, times out, returns nothing, or cannot read an input is retried once and then recorded as `not run`, which is never a clean review and blocks"): a pass entry without observed reviewer evidence (spawn event, or the layer's named reviewer agent) is recorded `not run` and treated exactly as the skill treats it — it counts toward the cap, never ends the loop, and blocks.

Properties, each checked against the additivity constraint:

- **Plugin-owned.** Core never reads it and never names it — the purity invariant (§2) holds by construction. It lands in the change dir so it archives with the change (audit trail) and follows the same next-to-`tasks.md` pattern as `red-log.md`.
- **Model writes denied.** A config policy denies model edits to the file; configured `deny` is final (§3, mechanism 3), and the plugin writes through internal fs, not through tools, so the policy does not bind it. *Run check:* the edit and write tools were denied, but `echo ... > apply-guard.json` through the shell was not, so the plugin must also inspect shell command text in `execute.before`.
- **Survives sessions.** State on disk, not session memory — the same file-truth principle §6.2 resolved for phase state, extended to loop state. A multi-session `apply` no longer risks a lost pass count.
- **`openspec validate --strict` tolerance** of the foreign file in the change dir: verified 2026-11-20 on OpenSpec 2.1.1 (passes with the file present), and the file moved with the folder on `openspec archive`.

**Limit found in the 2026-11-20 review: the final verdict.** Reviewer output is free text, so the plugin cannot decide by itself that a pass was "clean". What it can enforce from observation: no fourth pass, a pass without observed reviewer evidence recorded as `not run`, and a final entry present. The verdict value itself is the orchestrator's report (for example through a small plugin-provided tool it must call with the digest's HIGH count), and the exit gate's message says that it is reported, not measured. Making "clean" machine-readable in the review output would need a core change and is out of scope under the purity invariant.

Rejected alternative, kept for the record: counting scan invocations as a pass proxy. Scans can legitimately run outside a numbered pass, so the count drifts precisely in the sessions where discipline is already slipping. Journal-first.

Generalizing the same journal shape to the `align` loop and the `specs`/`design` review passes is possible but **not committed** — the measure-first bar of [2026-10-21-tempa-spec-weight-and-phase-reduction.md](2026-10-21-tempa-spec-weight-and-phase-reduction.md) applies: ship the apply journal, measure, then decide.

### 4a.3 Findings from the re-review

The maintainer asked for a critical re-review before recording. Four corrections came out of it; the section above carries them already, listed here for the trail:

1. **Phase 2→3 gate direction** — `mr-brief.md` marks Phase 3's output, not its entry condition; the real entry condition is the journal's final verdict.
2. **Dark-mode conflict between two §3 mechanisms** — a gate implemented as a permission `ask` would be auto-approved by the `evaluate` hook whenever `dark.md` exists (§3, mechanism 3), silently disarming the gate exactly when autonomy is highest. All gates are therefore tool-level `Tool.Error` blocks (`execute.before` / `shell.create.before`), which are not permission events and not subject to `evaluate`; the relaxation hook stays limited to ordinary asks.
3. **Review passes cannot be identified by agent name alone** — the review skill spawns generic subagents. Two detectors close the gap: the review's fixed step-1 command signatures (stateless, primary), and the layer's own reviewer agent (precise wherever the companion skill's naming convention is followed). This makes the Tier 0 reviewer agent load-bearing for Tier 1, not just a read-only convenience.
4. **The archive gate needs escape hatches**, or it blocks legitimate work: a change that never entered `apply` has no `tasks.md` and must archive freely; an abandoned applied change is discarded by deleting the change dir (ungated); and the pattern must cover the real completion doors — `openspec archive` and a plain `mv` into `openspec/changes/archive/` (corrected 2026-11-20: `ff` and `bulk-archive` are not CLI commands; they are workflows from OpenSpec's expanded profile, and by name `ff` is the artifact fast-forward, so no pattern should include it unless its skill text is read first). Also confirmed by running: `openspec archive -y` archives a change whose `tasks.md` still has an unticked task, so the gate is not redundant with the CLI.

Two further checks confirmed rather than corrected. PREFLIGHT's "writes nothing" means no file signal can ever exist for it, so event observation is the only enforcement route, not an optional extra. And the apply instruction's single-orchestrator mode (one Phase-1 subagent that spawns group subagents itself) means group subagents can run in grandchild sessions, so server-level hook visibility into grandchildren is what the journal's evidence recording depends on — pilot item (§8). *Run check:* hooks do fire inside a child session. The built-in `general` agent has `subagent` denied, so a grandchild needs a custom agent that allows it; grandchild visibility is therefore still unverified.

### 4a.4 Verdict

- Every gate maps one-to-one onto an instruction that already exists in the schema or a skill; nothing new is asked of the model or the reader, no core byte changes, and the human retains a direct ungated path — running the completion command in their own terminal — consistent with "a human has confirmed".
- The consistency gain is real: each gate converts a late failure (an automatic HIGH discovered at review, a release blocker discovered at exit) into an early block at the point of drift, and the two loop rules most likely to erode under context pressure — the pass cap and `not run` — become mechanical.
- What stays non-mechanical is unchanged from §5: the layer can verify the review's ritual (spawns observed, scans run, verdicts recorded) but cannot force the quality of its judgment, and parallel scheduling remains the orchestrator's decision — the journal records what happened; it never schedules.

## 5. Part 5 — what stays non-mechanical

Honest boundary, consistent with the repo's own lint philosophy (`lint.cjs` is deterministic-only; judgment stays with reviewer subagents):

- **Ritual can be forced; judgment cannot.** Whether a scenario is genuinely testable behavior, whether a finding is actionable (the consequence gate), grilling question quality, steel-manning in the decision gate — these remain model work. The harness eliminates the *consistency* failure mode (skipping steps under context pressure), not the *quality* failure mode.
- **Hooks must fail with one-line actionable messages** in the established MECHANICAL style, or the model burns tokens retrying blocked edits. Hook text should quote the same skill names and artifact rules the skills use, so enforcement and guidance never contradict each other (double-enforcement confusion is a real design risk).
- **Cross-model steering is unproven.** `Tool.Error` messages steer Claude-class models well; how well GLM-class or other models comply is exactly what the repo's cross-model research would predict varies — pilot item.

## 6. Part 6 — resolved design questions

1. **Does the `context` hook reach child sessions, and how is it scoped?** The event carries `agent` and `sessionID` (per-agent scoping is first-class). Inheritance is documented for permissions: child sessions inherit rules in effect at creation. That hooks registered at server level fire for subagent child sessions is implied by the architecture (child sessions issue model requests through the same pipeline) — confirmed at pilot, not from docs alone.
2. **What is the source of truth for the active phase?** Files are the truth, hooks are the sensors. The plugin derives phase state *statelessly* from the change directory (artifacts present, `align.md` sign-off, `tasks.md` checkboxes, `dark.md`) at every gate check — no session memory to corrupt. The `prompt` hook (which demonstrably sees `/opsx-*` command submissions, since commands submit through `session.prompt`) is only an edge trigger. This stays correct even when the agent runs `openspec instructions apply` via shell instead of a slash command.
3. **Compaction interaction?** The `context` hook re-runs per request, so injected instructions are re-applied after compaction automatically; `instructions.entry` blocks are durable. Long-session behavior is a pilot item.
4. **What does `openspec update` do to adapter files?** The adapter source shows OpenSpec writes exactly `.opencode/commands/opsx-<id>.md` (plural — the current source and supported-tools.md agree; the singular claim in issue #748 predates this) and `.opencode/skills/openspec-*/SKILL.md`, with the stated policy of only ever writing or removing files whose content it generated; foreign files are left alone and reported. Adapter paths (`plugins/tempa-guard/`, `skills/tempa-*/`, `agents/*.md`, `opencode.jsonc`) cannot collide. Kilo Code coexistence is zero-conflict (`.kilocode/skills/`, `.kilo/command/` — separate roots). *Update 2026-11-20:* with OpenSpec 2.1.1 and the default profile, `init --tools opencode` wrote only `.agents/skills/openspec-*/` (six skills), `.agents/skills/.openspec-target` (content `opencode`) and `openspec/config.yaml`; there is no `.opencode/` directory at all.
5. **Does the layer need a config merge script?** No — OpenCode stacks config files and combines array fields, so the adapter's own `.opencode/opencode.jsonc` coexists with a user config. (Contrast with `context:` in `openspec/config.yaml`, which is why `merge-config.cjs` exists.)

## 7. Part 7 — distribution: separate script vs installer detection

The layer's install surface is one self-contained tree (`.opencode/plugins/tempa-guard/`, `.opencode/skills/tempa-*/`, `.opencode/agents/*.md`, `.opencode/opencode.jsonc`) plus optional policy lines in config. Skills coverage for OpenCode needs nothing (§1). Two shapes were analyzed.

**Option A — separate installer script** (`install-opencode-layer.sh` + `.ps1` twin, existing conventions): resolve ref, shallow clone, copy the tree, done. Installer main files untouched; opt-in by running it; failure isolation from schema install. Cost: one extra command, documented in README.

**Option B — detection inside the main installer** (the maintainer's preference): after the existing steps, one new step calls a single Node script that decides and provisions. During this research the risk picture changed materially, because **OpenSpec records the user's tool selection declaratively**. Corrected 2026-11-20: not in `openspec/config.yaml` — `OpenSpecConfig { aiTools }` exists only as a type, and a real `init` never writes it. The record is `.agents/skills/.openspec-target`, one tool id per line, optionally followed by a marker word (`opencode own-files`). "OpenCode selected" is therefore a read of the user's explicit choice, not a heuristic. OpenSpec itself documents this philosophy ("the signal is the user's setup"), with per-tool `detectionPaths`.

**Recommended detection signal (Option B), corrected 2026-11-20:** `(.agents/skills/.openspec-target lists "opencode") OR (./.opencode/ exists)`, and never `opencode` on PATH (global install ≠ repo usage). Parse each line by whitespace and take the first token. The `.opencode/` half covers users who run OpenCode without choosing it at `init`; it is no longer a fallback for the main path, because a default-profile `init --tools opencode` does not create `.opencode/`. A user who picked only the vendor-neutral `agents` target and has no `.opencode/` gets the skip message.

Risks and mitigations, as assessed for the maintainer:

- **R1 False positive (layer installed where OpenCode is not used): cost ≈ zero.** The layer is inert outside OpenCode runtime — the plugin loads only when OpenCode runs; on a Claude-Code-only repo the files are dead weight. This is the reason Option B is acceptable at all: false positives are made harmless by design, not prevented.
- **R2 False negative (OpenCode user misses the layer): the main residual risk, and it is time-of-check.** Installing tempa-spec before `openspec init --tools opencode` finds no signal. Mitigations: the OR signal (`.opencode/` is not created by a default-profile `init`, so the `.openspec-target` marker is the primary signal), a one-line skip message ("re-run after `openspec init` if you use OpenCode"), and the documented re-run-to-update habit.
- **R3 bash/PowerShell drift on conditional logic:** keep all logic in one tested script (`scripts/provision-opencode-layer.cjs`, the `merge-config.cjs` pattern), called as one step by each twin. Preserves "same steps, same order, same messages" better than inline conditionals, and makes the detection testable under the `scripts/*.test.cjs` convention, which the installers alone cannot offer.
- **R4 Stale layer when OpenCode is later dropped:** non-destructive installer — never auto-remove; the tree is self-contained, documented removal is manual.
- **R5 Philosophy change:** "no flags" survives (no new flag), but "same behavior in every repo" becomes "behavior follows the user's recorded setup". A conscious maintainer decision to record in AGENTS.md and README, not a silent drift; OpenSpec precedent makes the argument.
- **R6 Failure policy:** fatal, same as the skills install step — identical failure modes (clone/network), and a completed install must mean everything provisioned.

**Net assessment:** with the `.openspec-target`+`.opencode/` signal (corrected 2026-11-20 from `aiTools`) and the one-script pattern, Option B's residual risk is limited to R2 (self-healing via re-run), so it is acceptable. Option A remains the conceptually simpler fallback. The choice between them is recorded as an open maintainer decision for the proposal.

## 8. Part 8 — tiers and pilot plan

- **Tier 0 — config only, no code:** policies (commit/push deny, deny edit on `.opencode/**` and `opencode.json*`), reviewer agent (`mode: subagent`, `edit: deny`), per-agent skill permissions, adapter `opencode.jsonc`. Provable value alone; safe to run in a pilot repo immediately.
- **Tier 1 — one small plugin (`tempa-guard`):** file-truth phase gates via dynamic session permissions; live floor guard reusing `floor-guard.cjs` pure logic; auto-lint injection on artifact writes; dark-mode `evaluate` hook; companion skill explaining the enforcement; self-protection (deny edits to the adapter's own files). The Part 4a gates land here too, in two steps: first the PREFLIGHT time-gate (the plugin runs `opengrep --version` itself), the Phase 1→2 gate, and the archive exit gate (`openspec archive` and `mv` into `archive/`); then the `apply-guard.json` loop journal once the first step is stable. The Tier 0 reviewer agent becomes load-bearing here: review passes are identified by its name or by the review skill's fixed step-1 command signatures ([§4a.3](#4a3-findings-from-the-re-review)).
- **Tier 2 — deferred until the pilot shows need** (highest false-positive risk): TDD ordering enforcement (test-before-code per task), edit-scope confinement, checkbox discipline. The weight findings of [2026-10-21-tempa-spec-weight-and-phase-reduction.md](2026-10-21-tempa-spec-weight-and-phase-reduction.md) apply here too: enforcement that misfires costs more than the drift it prevents — measure first.

**Status 2026-11-20:** parts of items 3, 4 and 5 below were executed by a scratch-repo probe (see the Addendum); what remains is listed in §9.

**Pilot checklist** (one real change in a downstream repo, OpenCode selected at `openspec init`):
1. `/opsx-new` → interview → specs/design (adversarial authoring) → tasks → align → `/opsx-apply` → `/opsx-verify`, baseline behavior with no layer.
2. Confirm subagent reviews run correctly with OpenCode's background child sessions (the review skills' `not run` rule makes failures loud, not silent).
3. Tier 0 files only: verify policies fire and nothing else changed.
4. Pilot-only verifications from §6/§5: `context` hook firing in child sessions; compaction behavior across a long `apply`; how well `Tool.Error` hook messages steer the chosen non-Claude model; observe one real `openspec update` (foreign-file policy); confirm `aiTools` persisted form.
5. Part 4a verifications: server-level hooks seeing grandchild sessions (Phase 1's single-orchestrator subagent spawns group subagents — the journal's evidence recording depends on it); `openspec validate --strict` tolerating the foreign `apply-guard.json`; journal correctness across a multi-session `apply`; the archive gate's edge cases (a change without `tasks.md`; an abandoned applied change; `openspec ff` and `bulk-archive` command shapes).

## 8a. Part 8a — other harnesses considered

Added 2026-11-20 at the maintainer's request. The same five needs were applied to each candidate: block a tool call with a reason, intercept shell commands, per-session rules that children inherit, a subagent for every reviewer (mandatory, EGM §3.5), and skills from `.agents/skills`. OpenCode was run; everything else rests on documentation, repository READMEs and third-party pages and is **not verified by running**.

| Harness | Kind | Fit for the enforcement layer |
|---|---|---|
| OpenCode 2.3.2 (MIT) | Agent with its own loop | Verified by running: tool and shell blocking, per-session inherited rules, `context` hook, subagents, custom agents, `.agents/skills` |
| Pi (pi.dev, MIT) | Minimal agent | Documented `tool_call` hook that blocks with a reason, `before_agent_start` system prompt, `appendEntry` for state, `.agents/skills` mentioned. **No built-in permission system and no built-in subagents** ("skips features like sub-agents and plan mode"), so both would have to come from extensions, and a host with no subagent is a stop case for the review skills |
| Pi Durable | Step-recovery runtime for Pi | Experimental. The durable agent lists extensions under "Not here"; issue #10386 ("host coding-agent extensions") was open when read, with no maintainer position. A third-party adapter reportedly runs about 10 of the top 20 extensions, not `pi-subagents`. Not usable for a hook layer today |
| T3 Code (pingdotgg, MIT, v0.1.10) | Control plane and GUI over other agents | Drives Claude Code, Codex, OpenCode, Pi and ACP agents. No policy layer of its own described; enforcement stays in the agent underneath |
| Orca (stablyai, MIT, v1.4.x) | Parallel agent environment | Runs any CLI agent in its own worktree, with coordinator agents and diff comments. No policy layer of its own described; it relays the agent's permission prompts |

**Decision recorded:** stay on OpenCode. T3 Code and Orca are not replacements; they could sit above OpenCode as a UI, but whether OpenCode plugins load when they drive it is unverified, and their per-agent worktrees conflict with the v19 decision against worktrees (a test environment per worktree), so only single-worktree use fits. Revisit Pi only if Pi Durable runs extensions and a maintained subagent extension is proven.

## 9. Confidence and open items

- **High confidence (documented, partly probed):** host viability with zero changes; skills coverage via `.agents/skills`; OpenSpec adapter paths and foreign-file policy; every mechanism listed in §3 exists as documented.
- **Verified by running (2026-11-20):** plugin auto-load, tool and shell blocking, `context` hook shape, hooks in child sessions, inherited session deny rules, `evaluate` skipped for deny, `**` globs, rule order, `validate --strict` tolerance, the `.openspec-target` signal.
- **Medium confidence (pilot-verify):** hook visibility in grandchild sessions (needs a custom agent that may spawn); child-only `session.update` at the first `context` event; reviewer-agent frontmatter keys; discovery of a companion skill under `.opencode/skills/`; long-session compaction behavior; the output paths of OpenSpec's expanded profile.
- **Unknown until tried:** cross-model compliance with hook messages; the value of Tier 2 items.
- **Open maintainer decisions:** Option A vs Option B (§7); whether the layer ships in this repo (`integrations/opencode/` + installer step, respecting the bash/PowerShell lockstep rule) or a sibling location; Tier 1 scope.

## 10. Sources

- OpenCode docs: [skills](https://opencode.ai/docs/skills/) (discovery/precedence incl. `.agents/skills`), [agents](https://opencode.ai/docs/agents/) (subagents, permissions), [config](https://opencode.ai/docs/config/) (stacking, policies, instructions, MCP), [plugins](https://opencode.ai/docs/plugins/), [plugin server API](https://opencode.ai/docs/build/plugins/server) (hooks, permissions evaluate, session instructions entries)
- OpenCode School, [plugins lesson](https://opencode.school/lessons/plugins) (companion-skill pattern)
- OpenSpec: [supported-tools.md](https://github.com/Fission-AI/OpenSpec/blob/main/docs/supported-tools.md) (OpenCode and Kilo Code rows, ownership policy), [`src/core/config.ts`](https://github.com/Fission-AI/OpenSpec/blob/main/src/core/config.ts) (`OpenSpecConfig { aiTools }`, detectionPaths philosophy), [`src/core/command-generation/adapters/opencode.ts`](https://github.com/Fission-AI/OpenSpec/blob/main/src/core/command-generation/adapters/opencode.ts) (`.opencode/commands/opsx-<id>.md`), [issue #748](https://github.com/Fission-AI/OpenSpec/issues/748) (historical singular/plural drift)
- Internal: [2026-11-16-egm-adoption-analysis.md](2026-11-16-egm-adoption-analysis.md) (§3.3 fresh-context caveat; §3.5 no-subagent stop rule), [2026-07-12-cross-model-instruction-following.md](2026-07-12-cross-model-instruction-following.md), [2026-10-21-tempa-spec-weight-and-phase-reduction.md](2026-10-21-tempa-spec-weight-and-phase-reduction.md) (measure-first bar), [hrt-dark-mode-opt-in](../../skills/hrt-dark-mode-opt-in/SKILL.md) (file-signal dark mode), `scripts/install-schema.sh` (skills install step, `--agent '*'`)
- Local probe, 2026-11-19: `npx skills@latest add …/skills --full-depth --agent '*'` in a scratch dir wrote `.agents/` and `.claude/` only (no `.opencode/`)
- Runtime probe, 2026-11-20: OpenCode 2.3.2 and OpenSpec 2.1.1 in a scratch repo, with a probe plugin that logged every hook and blocked on marker strings; types read from the published `@opencode/plugin` 2.3.2 package; OpenSpec behavior read from `openspec init`, `validate --strict`, `archive` runs and the installed `dist/core/shared-skill-target.js`
- Other harnesses (Part 8a): [Pi extensions docs](https://pi.dev/docs/latest/extensions), [Pi Durable issue #10386](https://github.com/earendil-works/pi/issues/10386), [T3 Code](https://github.com/pingdotgg/t3code), [Orca](https://github.com/stablyai/orca) — documentation and READMEs only, not run
