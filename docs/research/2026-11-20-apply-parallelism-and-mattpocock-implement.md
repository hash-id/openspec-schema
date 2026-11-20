# `apply` parallelism: `implement` or `implement-spec`?

**Date:** 2026-11-20
**Question:** `tasks.md` groups were designed as the equivalent of a ticket in mattpocock's `to-tickets`, and `apply` can run independent groups in parallel (schema v13). Does that equivalence hold in practice, and should `apply` move closer to `implement-spec` (one fresh subagent per ticket, worktrees, frontier scheduling)?
**Scope:** `openspec/schemas/tempa-spec/schema.yaml` v18 (`tasks`, `apply`), `hrt-artifact-lint`, `hrt-align-consistency-review`. Upstream compared at `mattpocock/skills` commit `abeeaf9` (2026-11-19): `skills/engineering/to-tickets`, `implement`, `implement-spec`.
**Outcome:** v19. `apply` follows `implement`, not `implement-spec`. `Depends on:` is required on every group. Test scope from `implement` applies in every mode. `apply-log.md` added. Worktrees rejected.

## 1. Upstream, in one paragraph each

- **`to-tickets`:** tracer-bullet vertical slices, each "sized to fit in a single fresh context window", prefactoring first, wide refactors as expand–migrate–contract. Every ticket declares its blocking edges ("None (can start immediately)" is explicit). A quiz step asks the user whether the granularity and the edges are right, including edges that do not really gate anything.
- **`implement-spec`:** the tickets are a task graph. A fresh implementer subagent per ticket, each in its own worktree and branch, `tdd` inside, a merger subagent onto one integration branch, the frontier refilled as tickets finish, then `code-review` once.
- **`implement`:** one piece of work in one context. `tdd` at pre-agreed seams. "Run typechecking regularly, single test files regularly, and the full test suite once at the end." Then `code-review`, then commit. `to-tickets` reserves this for work that fits one context window.

## 2. How v18 compares

| Concept | v18 | Match |
|---|---|---|
| Vertical slice, demoable | Group heading must be demoable or verifiable | yes |
| Prefactor first, expand–migrate–contract | Prefactor and wide-refactor exceptions | yes |
| Blocking edges | `Depends on:`, optional; a group without it depends on the previous one | partly: optional, and the instruction said most changes need none |
| Fresh context per ticket | Only when groups run in parallel; in order, all groups share one context | only on the parallel path |
| Worktree, integration branch, merger | One shared working tree, `apply` never commits | deliberately different |
| Size: fits one fresh context | Size rule on tasks ("one session"), none on groups | missing, but see §3 |
| Single test files regularly, full suite once | Written only for parallel group subagents | missing on the in-order path |

`Depends on:` in v18 also means more than an upstream edge: because the working tree is shared, independent groups must not edit the same files. Upstream resolves file overlap at merge time.

## 3. Measured on downstream changes

257 `tasks.md` files from the 20 local repositories whose `openspec/config.yaml` says `schema: tempa-spec`. 25 were written after v13 (2026-10-08), when parallel apply shipped. Dates come from the archive folder name or the first git commit of the file; a few fall back to file modification time and are approximate.

| Since v13 (n = 25) | Median | p90 | Max |
|---|---|---|---|
| Groups per change | 7 | 14 | 19 |
| Tasks per change | 35 | 81 | 105 |
| Tasks per group (n = 191) | 5 | 9 | 23 |

- `Depends on:` appears in 4 of 25. One is a plain chain (1 → 2 → … → 6), so nothing could run in parallel. Three have real fan-out, all large security-hardening changes (7, 15 and 17 groups).
- Nothing in the change folders records whether `apply` was then run in parallel; `apply` did not log the choice.
- Groups are already small (median 5 tasks), so a group-size rule is not needed now.
- The maintainer has not noticed compaction during `apply`, but finds implementation slow.

## 4. Findings

1. **Parallelism is limited by the test environment, not by CPU or memory.** In one Odoo repository the per-task test command is `odoo -d "$DB" -u "$module" --test-tags ...`: a module update on one shared database. Two group subagents running it at the same time collide (locks, a half-updated registry), and with one working tree each run also loads the other group's unfinished code. The v18 limit `min(cores / 3, GB / 2)` does not see this. Worktrees would remove the shared-tree problem but need one Odoo container and one database copy per worktree, which a typical developer laptop cannot carry.
2. **One fresh subagent per group, run in order, would not make `apply` faster.** It costs a context re-read per group (`align.md`, `tasks.md`, design sections: design is about 4,000 words at the median, per `2026-10-21-tempa-spec-weight-and-phase-reduction.md`), makes a blocker pause clumsier (the subagent must stop, report, and be continued or re-spawned), and has no commit to point the next group at. Its benefit, a clean context per group, addresses a problem the maintainer has not seen.
3. **The likely time sink on the usual path was test scope.** The in-order path had no rule against running the full suite per task. The same Odoo repository had to add one in its own `rules:` ("NEVER write `./scripts/dev.sh test` as a per-task … verification step — it is an hours-long at_install gate").
4. **An optional graph is rarely written.** With the line optional and the instruction saying most changes need none, 21 of 25 changes left the graph implicit, so no one decided whether their groups were independent.

## 5. Decisions (maintainer, 2026-11-20)

| Option | Decision | Reason |
|---|---|---|
| Test scope from `implement` in every mode | adopted | §4.3; lowest risk, applies to every change |
| `Depends on:` required on every group | adopted | §4.4; the graph becomes a checked decision. Parallel apply itself stays as in v18 (user choice, in order in dark mode) |
| `apply-log.md` per group: mode, times, problems, resolutions | adopted | retrospective material, and data for where `apply` is slow; times from the system clock |
| Worktree per group (`implement-spec`) | rejected | §4.1, test environment per worktree |
| Fresh subagent per group when running in order | not now | §4.2; reopen if later groups show lower quality |
| Group-size rule | not now | §3, groups are small |
| Graph in the `align` WALKTHROUGH | not now | `apply` already shows the graph before a parallel start |

Known gap, accepted: shared-tree parallel apply is still offered on a repository whose tests share one live database. The user is asked before any parallel start, and dark mode runs in order. If `apply-log.md` shows such a collision, gate parallel on the repository declaring that its tests can run concurrently.

## Sources

1. `mattpocock/skills` at `abeeaf9`: `skills/engineering/to-tickets/SKILL.md`, `skills/engineering/implement/SKILL.md`, `skills/engineering/implement-spec/SKILL.md` (read from a shallow clone, 2026-11-20).
2. `docs/research/2026-08-09-vertical-slicing-to-tickets.md`, `docs/research/2026-08-27-mattpocock-skills-gate-and-seams.md` (earlier mapping of heading = ticket, checkbox = TDD cycle).
3. `docs/research/2026-10-21-tempa-spec-weight-and-phase-reduction.md` (artifact sizes, measure-first rule).
4. Downstream `tasks.md` counts and the Odoo test command: local repositories, anonymised here.
