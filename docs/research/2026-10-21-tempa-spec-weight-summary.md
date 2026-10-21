# tempa-spec weight and phase reduction — one-page summary

**Date:** 2026-10-21
**Full study:** [2026-10-21-tempa-spec-weight-and-phase-reduction.md](2026-10-21-tempa-spec-weight-and-phase-reduction.md) (evidence, sources, impact estimates, touch list)
**Status:** R1-R6 and R8 implemented in schema v15 (see the 2026.10.21 CHANGELOG entry); R7 and R9 are open follow-ups outside the schema. This page lists what was changed and what was decided.

## What the study found

- **The process is heavy, and the weight is identifiable.** Four loops wait for a human (an uncapped interview, adversarial findings one at a time, `align` walkthrough cycles, `apply` review), about 8-10 subagents run before any code, and one decision can be restated in up to five documents.
- **Measured on 27 real changes in three downstream repositories:** the median change is about 13,200 words. Design is 30% of all words, specs 26%, tasks 13%, `align` 12%, discovery 8.5%, proposal 7.7%. Removing `discovery` helps but is not the biggest lever.
- **`align` is the multiplier.** 58 cycles across 25 changes (median 2, maximum 10). VERIFY found something new in 8 of 47 runs, 7 of them in cycle 1.
- **Proposals already run long.** Median about 1000 words, and prose caps of 800 and 1000 words in two repositories are mostly exceeded. A written cap does not hold without a check.
- **Nothing is measured for effectiveness.** No study compares a heavy schema with a light one, and this repo has no evals. Anthropic's playbook, the closest outside reference, is guidance without outcome data.

## What to change, in order

| Order | Change | Why |
|---|---|---|
| 1 | **R3.** A `Covers:` line per task group; every threat answered by a negative scenario or a named check; lint enforces both | Task coverage is checked today only by a model; this is the Lead's top need and is deterministic |
| 2 | **R2 + R5.** One digest instead of per-item prompts; HIGH DECISION findings shown together and answered one by one; walkthrough led by specs and design with a size-facts line | 90% of questions are answered "yes"; only 18 HIGH DECISION findings in 25 changes |
| 3 | **R1 + R4.** Remove `discovery` (interview, capped at 4 questions x 3 rounds, moves into `proposal`); change-size rule in the interview; no `BACKLOG.md`; proposal lint rules; no model review of the proposal; VERIFY only on a HIGH | One intent document, fewer phases, fewer subagents |
| 4 | **R6, R8.** Drop the `humanizer` pointers; tag every gate with its origin and give a wrong gate a record | Less instruction weight; gates added by guess become visible |

Every change needs a CHANGELOG entry, and any change to the skill list must be mirrored in both installers.

## Decided by the maintainer

- Interview cap 4 per round, 3 rounds. `Covers:` per group. VERIFY only on a HIGH (accepted after seeing that it skips 3 of 8 productive runs).
- HIGH DECISION findings are answered one by one, never by "ok all".
- The proposal is the entry point for why a change exists: it must not bloat and must not lose information. Lint ceiling of 1500 words (warns only), shape rules, the interview checklist, and the user's read-and-confirm.
- The change-size check stays as a rule inside the interview, without a size threshold (to avoid false alarms). `BACKLOG.md` and its skills are dropped.
- The lint does not run in CI.

## Gaps accepted for now

- A large change with dependent parts does not trigger the change-size question.
- Dropping `BACKLOG.md` makes deferred slices harder to rediscover.
- The lean VERIFY trigger will miss some findings.

## Outside the schema

- **R7.** For the next 3 to 5 real changes, keep a small hand log (questions asked, minutes per phase, "yes" answers, HIGH DECISION count, `align` cycles, proposal words, size facts). It is the baseline for judging the changes above and for tuning the untested values.
- **R9 (parked).** Design and specs are the longest artifacts, but downstream rules explain only part of that. Revisit after the changes above, using the R7 log.
