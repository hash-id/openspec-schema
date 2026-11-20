# OpenCode layer implementation plan

**Date:** 2026-11-19 (revised 2026-11-20 after a runtime probe)
**Trigger:** maintainer decision to plan maximally and then implement directly, without a separate pilot: runtime verifications are folded into the implementation steps as checkpoints instead. Three open decisions from [the research](2026-11-19-opencode-additive-enforcement-layer.md) are now locked (§1).
**Scope:** everything needed to ship the OpenCode additive enforcement layer in this repo: `integrations/opencode/` (config, agent, companion skill, plugin), the provision script and installer-twin step, tests, purity check, and docs. Tier 0 + Tier 1 only; Tier 2 stays deferred. No core file (`schema.yaml`, `templates/`, `skills/hrt-*`, `skills/plain-language-writing`) changes.
**Status:** planning complete, ready to implement. Implementation not started. Each step ends at a named verification checkpoint (V1–V5) that must pass before the next step begins; the step can be stopped there without leaving anything half-built.
**Revision 2026-11-20:** a runtime probe (OpenCode 2.3.2, OpenSpec 2.1.1; see the Addendum in the research doc) corrected the detection signal, the exit-gate command patterns, the PREFLIGHT gate, the permission rule order and the journal's verdict claim. Corrected text is marked *(rev. 2026-11-20)*; questions the probe already answered are marked *answered* in §9.

## Contents

1. [Decisions locked](#1-decisions-locked)
2. [Source tree and install destination](#2-source-tree-and-install-destination)
3. [Step 1 — Tier 0 scaffold (config, agent, skill)](#3-step-1--tier-0-scaffold-config-agent-skill)
4. [Step 2 — plugin, part 1: the gates](#4-step-2--plugin-part-1-the-gates)
5. [Step 3 — plugin, part 2: the journal](#5-step-3--plugin-part-2-the-journal)
6. [Step 4 — distribution: provision script and installer twins](#6-step-4--distribution-provision-script-and-installer-twins)
7. [Step 5 — purity check and docs](#7-step-5--purity-check-and-docs)
8. [Explicitly deferred](#8-explicitly-deferred)
9. [What only implementation can settle](#9-what-only-implementation-can-settle)
10. [Sources](#10-sources)

## 1. Decisions locked

Locked by the maintainer on 2026-11-19:

- **Scope:** everything — Tier 0 (config-only) plus the plugin's two parts (gates, then journal), built in stages. After Step 2 the layer is already useful and safe to stop at; the journal is Step 3.
- **Distribution:** Option B — detection inside the main installer. Signal *(rev. 2026-11-20)*: `(.agents/skills/.openspec-target lists "opencode") OR (./.opencode/ exists)`. Never the PATH. OpenSpec 2.1.1 never writes `aiTools`, so it is not used. One new step in each installer twin calls one tested Node script; fatal-on-error like the skills-install step; non-destructive (never removes the layer); no skip when a signal is absent beyond one printed line.
- **Location:** `integrations/opencode/` in this repo. Layer versioning follows the schema (no drift).
- **Philosophy change (R5), accepted:** "no flags" survives; "same behavior in every repo" becomes "behavior follows the user's recorded setup". Must be recorded in AGENTS.md and README (Step 5), not left implicit.
- **Pilot items become checkpoints.** The five runtime verifications from the research (§8–9 there) are distributed across the checkpoints below, so nothing is built on an unverified assumption longer than one step.
- **Host stays OpenCode (2026-11-20):** Pi, Pi Durable, T3 Code and Orca were assessed; none replaces the layer (research Part 8a).

## 2. Source tree and install destination

Source of truth in this repo (all new files; nothing moved, nothing renamed):

```
integrations/opencode/
├── opencode.jsonc                  # adapter config: policies, instructions, plugin entry
├── agents/
│   └── tempa-reviewer.md           # named reviewer: mode subagent, edit deny
├── skills/
│   └── tempa-guard/
│       └── SKILL.md                # companion skill: explains the enforcement, names the convention
└── plugins/
    └── tempa-guard/
        └── index.ts                # V2 Plugin.define; dual-export V1 server() for API-churn safety
scripts/
├── provision-opencode-layer.cjs    # distribution logic (merge-config.cjs pattern)
├── provision-opencode-layer.test.cjs
└── purity.test.cjs                 # core must not mention opencode (§7)
```

Install destination in a downstream repo — copied wholesale by the provision script:

```
.opencode/
├── opencode.jsonc
├── agents/tempa-reviewer.md
├── skills/tempa-guard/SKILL.md
└── plugins/tempa-guard/index.ts
```

No collision with anything OpenSpec generates (`.opencode/commands/opsx-<id>.md`, `.opencode/skills/openspec-*/` — research §6.4) or with other hosts (`.claude/`, `.kilo/`, `.kilocode/` — separate roots).

*(rev. 2026-11-20)* After a default-profile `openspec init --tools opencode` the `.opencode/` directory does not exist (OpenSpec's skills go to `.agents/skills/`), so the provision script creates it. The one real collision is a user's own `.opencode/opencode.jsonc`: the script never overwrites or merges it (Step 4).

## 3. Step 1 — Tier 0 scaffold (config, agent, skill)

Files: `opencode.jsonc`, `agents/tempa-reviewer.md`, `skills/tempa-guard/SKILL.md` (plugin entry commented out until Step 2).

- **`opencode.jsonc`** — policies only, minimal instructions:
  - format *(rev. 2026-11-20)*: the `permissions` array of `{ action, resource, effect }`; the **last matching rule wins**, so every deny sits after the broad allows (probe: `deny git commit*` placed before `allow *` let the commit through). Action names: `shell`, `edit`, `read`, `subagent`, `external_directory`. A node test asserts that no allow follows a deny it would override;
  - shell deny: `git commit*`, `git push*` (mechanizes the AGENTS.md rule every repo already carries), plus `opencode api*` and `opencode run*` (in the probe a blocked child opened a session through the server API from its shell, which sidesteps every per-session rule);
  - `external_directory` deny (agents read and wrote outside the project under `--auto` in the probe);
  - edit deny: `.opencode/**`, `opencode.json*` (self-protection), `openspec/changes/**/apply-guard.json` (journal write protection, effective from Step 3; harmless before);
  - reviewer agent gets `edit: deny` in its own frontmatter, not here;
  - `instructions`: at most one or two lines pointing at the companion skill — long inline rules duplicate the skills and create double-enforcement confusion (research §5).
- **`agents/tempa-reviewer.md`** — frontmatter `description`, `mode: subagent`, `permission: edit: deny`; body: read-only review expectations mirroring what `hrt-apply-code-review` and the other review skills ask of a fresh reviewer (read artifacts and code, report findings and verdict, `review incomplete: <file>` when an input cannot be read).
- **`skills/tempa-guard/SKILL.md`** — frontmatter `name` + `description` only (repo convention). Body: what each gate does, the exact block messages a session will see, and the naming convention that makes review passes identifiable: **spawn review passes with the `tempa-reviewer` agent** (research Part 4a.3 — the named agent is the precise detector; the fixed step-1 command signatures are the fallback).

**Checkpoint V1.** In a scratch repo: OpenCode loads without warnings; attempting `git commit` is denied; `tempa-reviewer` appears in the agent list and cannot edit; the companion skill is discoverable; a normal (non-OpenSpec) coding session behaves exactly as before — the layer is invisible outside a change context. *(rev. 2026-11-20)* Already answered by the probe: `.opencode/opencode.jsonc` is loaded (inspect with `opencode debug config`), `.opencode/plugins/*.ts` auto-loads with no config entry, `**` globs work, and the last matching rule wins. Still to confirm here: the `tempa-reviewer.md` frontmatter keys (`mode`, `permission`) as OpenCode 2.x reads them, that `opencode debug agents` lists it with edit denied, that the companion skill is discovered from `.opencode/skills/`, and that the shipped `opencode.jsonc` passes the deny-last test.

## 4. Step 2 — plugin, part 1: the gates

`plugins/tempa-guard/index.ts`. All state is derived at check time from the change directory (files are the truth, hooks are the sensors — research §6.2); the only in-memory state is the observed-evidence set for the current session. The plugin **no-ops fast when there is no active change** (no `openspec/changes/` dir in progress), so ordinary OpenCode use pays nothing. *(rev. 2026-11-20)* "Active change" must be defined, since several changes can sit in `openspec/changes/`: the change named in the `/openspec-*` command arguments or in the latest `openspec ... --change <name>` shell command, else the single non-archived change dir that has a `tasks.md`. If still ambiguous, no gate fires and a one-line notice is shown (fail open, never guess).

Gates, in the order they fire during a change:

1. **PREFLIGHT time-gate** *(rev. 2026-11-20)*. The plugin runs `opengrep --version` itself, once per session, at the first `execute.before` of a change session. Until it succeeds, deny edits outside the change directory and the first Phase-1 spawn, with the schema's own message (a missing tool is an automatic HIGH: no install, no waiver). The subagent probe is dropped: OpenCode's primary agent always has the `subagent` tool, so observing it proves nothing. PREFLIGHT "writes nothing" (schema text), and a version check writes nothing either.
2. **Phase 1 → Phase 2 gate.** On the first match of the review's fixed step-1 signatures (`opengrep scan --config`, `floor-guard.cjs --base=`) require `tasks.md` full-tick and `red-log.md` existence — existence checks, not content checks.
3. **Exit gate** *(rev. 2026-11-20)*. On any shell command that runs `openspec archive` (also through `npx`) or moves a change directory into `openspec/changes/archive/` with `mv` or `git mv` (the shipped archive skill uses `mv`, so the CLI is only one of two doors) **when the change dir has a `tasks.md`**, require full-tick, `red-log.md`, `mr-brief.md`, and (from Step 3) a clean final journal verdict; otherwise a `Tool.Error` naming exactly what is missing. Escape hatches built in: no `tasks.md` → gate does not fire; discarding an applied change = deleting the change dir, which is not gated; the human's own terminal is always ungated. `ff` and `bulk-archive` are not CLI commands and are never gated. The CLI does not enforce full-tick itself (the probe archived a change with an unticked task), so this gate is not redundant. Because the "no `tasks.md`" hatch could be triggered by the agent deleting the file, shell commands that delete or move `tasks.md` are denied too (item 6).
4. **Dark-mode relaxation.** `permission.hook("evaluate")`: flip `ask` → `allow` only while `dark.md` exists; configured `deny` is never seen by the hook (verified 2026-11-20, for config and session denies), so the static red lines stay unbreakable. *(rev. 2026-11-20)* `dark.md` is created by the agent itself (`hrt-dark-mode-opt-in` step 4), so the file alone would let a model grant itself autonomy. Relax only when `dark.md` exists **and** carries the section for the current stage (the Apply section for apply-time asks), and never for `external_directory`. Whether to also require a human-visible trace of the opt-in is decided at V2. The gates above deliberately do **not** go through this hook — they are `Tool.Error` blocks, which dark mode cannot auto-approve (research §4a.3, finding 2).
5. **Annotators** (same hook family, kept cheap): after an artifact write/edit, run `lint.cjs` from its documented installed path and append the output; after a turn or a task group (not on every edit, because it diffs against the base and is costly under parallel apply), run the `floor-guard.cjs` logic. If either proves chatty in practice, move it behind a config flag rather than tuning thresholds silently.
6. **Bypass closers** *(rev. 2026-11-20)*. Shell gates live in `tool.hook("execute.before")` for the `shell` tool, because `shell.hook("create.before")` carries no session or agent. There the plugin denies shell commands that write, move or delete `apply-guard.json` or `tasks.md` (the edit deny does not cover redirects such as `echo ... > file`), and any `opencode api` or `opencode run` command.
7. **Tick discipline (v19)** *(rev. 2026-11-20)*. Only the orchestrator ticks `tasks.md`. The plugin sets a `session.update` deny on `tasks.md` in child sessions, in the child's first `context` event so the orchestrator is not locked. Inheritance of session deny rules is verified; child-only application is checked at V2.

Every block message follows the `plain-language-writing` COMMS rules and quotes the same skill names the skills use, so enforcement and guidance never contradict each other.

**Checkpoint V2.** In a scratch repo with OpenSpec initialized: each gate fires at the right moment and unblocks when its conditions become true; edge cases produce correct messages (change without `tasks.md`; unticked tasks; missing `red-log.md`); the archive gate covers `openspec archive` and a plain `mv` into `archive/`, and never fires on `ff`; a session with no active change is completely unaffected; hook messages steer the model in use (the cross-model item from the research — record how well it works, do not tune yet; the 2026-11-20 probe model followed block messages but also tried the server API to get around one, so record both).

## 5. Step 3 — plugin, part 2: the journal

`apply-guard.json` in the change dir, plugin-owned (research §4a.2): ordered entries `{subphase, pass, verdict, evidence}`; written at pass start (scan-signature observation) and pass end; read by the gates.

- **Pass cap:** a fourth pass is denied, message pointing at the release-blocker rule the skill already states for an unresolved 3rd pass.
- **EGM `not run`:** a pass entry with no observed reviewer evidence (a `tempa-reviewer` spawn, or a generic subagent whose prompt matches the review pass) is recorded `not run` and treated exactly as the skill treats it — counts toward the cap, never ends the loop, blocks.
- **Write protection** was already configured in Step 1 for the edit tools; the shell route is closed in Step 2 (item 6). The plugin writes through internal fs, which policies do not bind.
- The exit gate also checks the final verdict *(rev. 2026-11-20)*, but only as far as it can be observed. Reviewer output is free text, so the plugin cannot decide "clean" itself. It enforces: no fourth pass, a pass without observed reviewer evidence recorded as `not run`, and a final entry present. The verdict value is the orchestrator's report (a small plugin-provided `tempa_record_pass` tool it must call with the digest's HIGH count), and the gate's message says it is reported, not measured. A machine-readable "clean" in the review output would need a core change and is out of scope.

**Checkpoint V3.** Multi-session `apply` keeps the journal correct (state survives restart); `openspec validate --strict` tolerating the foreign file (answered by the probe: it passes, and the file moves with the folder on `openspec archive`); a model attempt to edit the journal is denied by policy; the 4th pass and the `not run` paths produce the intended messages; the journal archives with the change dir.

## 6. Step 4 — distribution: provision script and installer twins

`scripts/provision-opencode-layer.cjs` (the `merge-config.cjs` pattern: run from the installer's temp clone, zero behavioral logic in the twins):

- *(rev. 2026-11-20)* Reads `<cwd>/.agents/skills/.openspec-target`: one tool id per line, optionally followed by a marker word (`opencode own-files`), so each line is split on whitespace and the first token is the id. Also checks `<cwd>/.opencode/` existence. Signal = `target lists "opencode" OR .opencode/ exists`; PATH is never consulted and `config.yaml` is not read (OpenSpec 2.1.1 never writes `aiTools`). No YAML parser is needed, so the script has no dependencies. A repo whose target lists only `agents` and has no `.opencode/` gets the skip line; it opts in by running `openspec init --tools opencode` first or by creating `.opencode/`.
- Signal present → copy `integrations/opencode/**` → `<cwd>/.opencode/`, preserving existing foreign files (OpenSpec's own foreign-file rule, mirrored). A pre-existing `.opencode/opencode.jsonc` is never overwritten or merged: the script leaves it, prints one line naming it and the policy block to add by hand, and exits 0. If V1 shows the static policies can move into the plugin (`session.update` at the session's first `context` event, a mechanism verified to work), the collision disappears and `opencode.jsonc` is dropped.
- Signal absent → print one line — "OpenCode layer skipped — re-run after `openspec init` if you use OpenCode" — and exit 0.
- An unreadable or empty `.openspec-target` counts as *no signal* (skip message), not as an installer failure — unlike `merge-config.cjs`, which must refuse because writing config is its job; here reading is only evidence.
- Fatal-on-error for its own failures (copy, mkdir); never removes anything.
- Nuance recorded: after a first install, `.opencode/` exists by construction, so re-runs always provision — correct for a repo that opted in, harmless (inert files) for a false positive (R1).

Installer twins: `install-schema.sh` and `install-schema.ps1` each gain **one step** (calling the script from the temp clone), same position — after the `merge-config` step, so a failed schema install never leaves a half-installed layer — same echo wording in both. The AGENTS.md lockstep rule applies to this change like any other.

Tests: `scripts/provision-opencode-layer.test.cjs` (node:test), covering at least: no signal → skip + no files; target lists `opencode`; target line `opencode own-files`; target lists only `agents` and no `.opencode/` → skip; `.opencode/` hit without any target file; unreadable target → skip; idempotent re-run; foreign files preserved; an existing `.opencode/opencode.jsonc` left untouched with the manual-merge line printed; copy failure → non-zero exit.

**Checkpoint V4.** End-to-end from a scratch dir: installer with each signal combination; a repo where `openspec init` runs *after* the install (the R2 false-negative path — re-run provisions correctly); PowerShell twin behaves identically. Signal fixtures come from a real `openspec init --tools opencode` run, not hand-written files.

## 7. Step 5 — purity check and docs

- **`scripts/purity.test.cjs`** (node:test, added to `npm test`): asserts zero occurrences of `opencode` / `.opencode` in `schema.yaml`, `templates/`, and this repo's own skills (`skills/hrt-*`, `skills/plain-language-writing`). Vendor skills are excluded from the invariant — they are upstream-pinned and refreshed only through `vendor-skills.cjs`; if a vendored skill ever gains the word, that is an upstream fact, not a purity break. This makes the research's purity invariant (§2 there) mechanical instead of a review-time promise.
- **README:** a "Use with OpenCode" section — what installs, the skip message, manual removal (`rm -rf .opencode/` plus nothing else — the tree is self-contained), and the requirement that no core instruction ever names the layer.
- **AGENTS.md:** the installer section gains the new step and the R5 philosophy sentence (the signal is the `.openspec-target` list, not `aiTools`); the twins rule already covers it.

**Checkpoint V5.** `cd scripts && npm test` green (all four existing suites + the two new ones); one clean end-to-end install; a grep by hand confirms the invariant holds while `integrations/opencode/` is full of the word.

## 8. Explicitly deferred

- Tier 2 items (TDD ordering enforcement, edit-scope confinement, checkbox discipline) — research Part 8; measure first.
- Generalizing the journal to the `align` loop and `specs`/`design` passes — research §4a.2; ship the apply journal, then decide.
- Public packaging (Option C: separate repo/npm) — only if the layer is ever opened up.
- Tuning hook messages for non-Claude models — V2 records behavior; changes only after evidence.
- Other hosts (Pi, Pi Durable, T3 Code, Orca) — assessed in research Part 8a. Revisit Pi only if Pi Durable runs extensions and a maintained subagent extension is proven. T3 Code and Orca may sit above OpenCode as a UI; their per-agent worktrees conflict with the v19 no-worktree decision, so single-worktree use only.

## 9. What only implementation can settle

Carried from the research's pilot list, now bound to checkpoints:

| Item | Status (2026-11-20) | Checkpoint |
|---|---|---|
| Config file name/precedence; plugin auto-discovery; `**` glob support | *answered*: `.opencode/opencode.jsonc` loads, `.opencode/plugins/` auto-loads, globs work, last match wins | V1 (re-check on the shipped files) |
| `context` hook in child sessions; subagent tool events | *answered for child sessions*; grandchild open (needs a custom agent allowed to spawn) | V1–V2 |
| Block messages steering the model in use; annotator chattiness | blocks reach the model (MiniMax-M3.1-Flash); steering quality across models and chattiness open | V2 |
| Child-only `session.update` at the child's first `context` event | open | V2 |
| Reviewer-agent frontmatter keys; companion-skill discovery under `.opencode/skills/` | open | V1 |
| Long-session compaction with per-request injection | open | V2 (long change) |
| `apply-guard.json` vs `openspec validate --strict` | *answered*: passes | V3 |
| Multi-session journal durability | open | V3 |
| Persisted tool choice; post-init install (R2 recovery) | *answered*: `.openspec-target`, not `aiTools`; recovery by re-run still to test | V4 |
| Output paths of OpenSpec's expanded profile (`opsx-*` command files) | open | V4 |

## 10. Sources

- [2026-11-19-opencode-additive-enforcement-layer.md](2026-11-19-opencode-additive-enforcement-layer.md) — the research this plan implements (architecture §2, mechanisms §3, mapping §4, sub-phase control §4a, distribution §7, tiers §8)
- OpenCode docs: plugins and plugin server API (hook names, permission evaluate, config stacking)
- OpenSpec source: `src/core/config.ts` (`OpenSpecConfig { aiTools }`, a type only), `command-generation/adapters/opencode.ts` (generated paths, foreign-file policy); installed 2.1.1 `dist/core/shared-skill-target.js` (the `.openspec-target` list format)
- Runtime probe, 2026-11-20: see the Addendum and Part 8a in the research doc (OpenCode 2.3.2, OpenSpec 2.1.1, scratch repo, probe plugin)
- In-repo patterns the plan follows: `scripts/merge-config.cjs` (+ test) for the provision script and its twin-call shape; `scripts/*.test.cjs` node:test convention; `skills/hrt-apply-code-review/floor-guard.cjs` for the live floor guard logic; `skills/hrt-artifact-lint/lint.cjs` for the annotator; `skills/plain-language-writing` for all block messages
