# Analysis: what the Elephant-Goldfish Model offers tempa-spec

**Date:** 2026-11-16
**Scope:** Compare the Elephant-Goldfish Model (EGM), as recorded in [2026-11-16-elephant-goldfish-model.md](2026-11-16-elephant-goldfish-model.md), with `tempa-spec` (schema v17) and decide which parts, if any, are worth adopting. The bar is the same as in [2026-10-25-addyosmani-agent-skills-evaluation.md](2026-10-25-addyosmani-agent-skills-evaluation.md): no new phase, artifact, persona or review loop unless the gain is clear, and the weight findings of [2026-10-21-tempa-spec-weight-and-phase-reduction.md](2026-10-21-tempa-spec-weight-and-phase-reduction.md) (cut same-model review layers, keep human loops short, measure first) stay in force.
**Status:** §3.1 and §3.2 applied on 2026-11-16 to the three review skills, with `not run` treated as a blocker (maintainer decision). §3.3, §3.4 and §3.7 are not pursued: they add little to quality. §3.5 applied the same day: with no subagent, each review skill stops and reports, without asking (maintainer decision; which hosts lack subagents was not checked). §3.6 is to be tried on real changes before any adoption.
**Method:** The EGM research record was read in full. Compared against `openspec/schemas/tempa-spec/schema.yaml`, `skills/hrt-adversarial-authoring/SKILL.md`, `skills/hrt-align-consistency-review/SKILL.md` and `skills/hrt-apply-code-review/SKILL.md`, with targeted searches for existing fallback, failure and dismissal rules. Every gap stated in §3 was checked against the skill text and cites the line it rests on. Skill sizes were measured with `wc -c`. Earlier research on the same concerns was re-read where it applies: [2026-08-03-judge-bias-collusion-adversarial-authoring.md](2026-08-03-judge-bias-collusion-adversarial-authoring.md) (same-model blind spots, cross-review risk). No EGM code was run.

## Contents

1. [Evidence behind EGM](#1-evidence-behind-egm)
2. [What tempa-spec already has](#2-what-tempa-spec-already-has)
3. [Candidates for adoption](#3-candidates-for-adoption)
4. [Not adopted, and why](#4-not-adopted-and-why)
5. [Proposed order of work](#5-proposed-order-of-work)

## 1. Evidence behind EGM

EGM reports adoption, not outcomes. The essay's figures are anecdotal (about 30% of Critic suggestions "highly valuable"), the blog's only claim is "Thousands of Googlers use this plugin every day", and Google's own FAQ says completing the workflow "alone does not demonstrate a productivity improvement" (EGM record §2.8, §8). No benchmark, control group or defect measure exists, and the one OpenSpec port's benchmark is a single self-reported run (§9).

So every candidate below rests on its mechanism alone: it must close a gap a reader can see in the current skill text, at a cost small enough not to need evidence.

## 2. What tempa-spec already has

Most of EGM's method already has a counterpart.

| EGM concept | tempa-spec counterpart |
|---|---|
| Growing the Elephant: interview, "No Code" rule | `proposal` with `grilling`, capped at 4 × 4 questions; code is written only in `apply` |
| Alternatives as guardrails | `design.md` Decisions, the sole home for rejected technical alternatives |
| Goldfish Critic in a fresh context | `hrt-adversarial-authoring` (Destructive Critic + Structural Auditor), `align` VERIFY, each `hrt-apply-code-review` pass |
| Implementation Readiness, Zero-Decision Rule | Shape / Seams, `Covers:` per group, `align` MEDIUM for "a non-trivial technical choice with no design decision" |
| `egm-codebase-details` ("Contradicts the Code" is a Blocker) | `align` dimension `design/tasks -> codebase`, a HIGH when a claim does not match reality |
| Zoom Out: leverage existing code | Shape / Seams "prefer boundaries that already exist"; the Critic's "structurally different shape" question |
| New implementation session handed the document | `apply` MUST run in a fresh session; PHASE 0 session check |
| "Mean" code review | `hrt-apply-code-review` plus floor guard and opengrep |
| Severity scale and round cap | HIGH/MEDIUM/LOW; 3 passes in `apply` review; a checkpoint after 3 `align` cycles |
| Human gates, one question each | Review digests: findings that need their own answer shown together, the rest accepted by one "ok" |
| Fail closed on a tool that did not run | `floor-guard.cjs` exit 2 is "never read as clean"; a required opengrep scan that gave no result is an automatic HIGH |

## 3. Candidates for adoption

Ranked by value per cost. All are wording changes to existing skills; none adds a phase, artifact or subagent.

### 3.1 A reviewer that failed or could not read its inputs is "not run", never clean

**EGM rules.** A failed or timed-out reviewer is retried once, then recorded as `not run`: "Never count it as a reviewer with zero findings". A round with a `not run` reviewer is not clean (EGM record §4.3). "A reviewer that cannot read its persona or standard must report the limitation and stop; it has not reviewed" (§7.1).

**Gap.** None of the three review skills says what happens when a subagent runs but fails, times out, returns nothing, or cannot read one of its named inputs (`grounding_inputs`, artifacts on disk, `red-log.md`). Such a reviewer may review what it has and report a verdict, or report nothing, and both look like a clean pass.

**Consequence if unfixed.** `hrt-apply-code-review` stops "when a pass finds no HIGH and no MEDIUM issues" ([SKILL.md:72](../../skills/hrt-apply-code-review/SKILL.md)). A pass whose reviewer silently failed finds none, so the loop can end on a review that never happened. The same holds for `align` VERIFY ("If VERIFY finds nothing new: proceed to WALKTHROUGH").

**Change.** One rule in each of the three skills, extending the floor guard's existing "never read it as clean" to reviewers:

- Each reviewer prompt: if a named input cannot be read, report "review incomplete: <file>" and give no verdict.
- Each orchestrator: a reviewer that fails, times out, returns nothing, or reports "review incomplete" is retried once; if it fails again it is recorded as `not run`. A pass with a `not run` reviewer cannot end the loop or count as clean.
- Record each `not run` in the skill's output (`align.md`, the review report, the loop-exit report). This is the measure: if `not run` never appears after some months, the rule cost one sentence; if it does appear, it caught a false clean pass.

### 3.2 A rejected finding needs checkable evidence

**EGM rule.** From `egm-resolve`: "A contest must be checkable." "'This was intentional' is not evidence." Where the evidence lies outside what the reviewer could read (a team convention, a verbal decision), the finding is escalated to the user, not dismissed (EGM record §3.3).

**Gap.** All three digests already require "the recommended resolution and a one-line reason" ([hrt-adversarial-authoring:41](../../skills/hrt-adversarial-authoring/SKILL.md), [hrt-align-consistency-review:36](../../skills/hrt-align-consistency-review/SKILL.md), [hrt-apply-code-review:63](../../skills/hrt-apply-code-review/SKILL.md)). The reason need not be checkable: "intended behaviour" satisfies it, and an "ok" accepts it.

**Change.** Add to that rule in all three skills: when the recommendation is to reject a finding, the reason cites a file and line the user can check. If the reason is not in a file, say so and leave the call to the user.

### 3.3 Churn in the apply review loop

**EGM rule.** An applied fix does not settle a finding; if the same issue returns at the same scope it is re-opened. Churn is a new finding at the scope of an applied fix that reverting the fix would clear; on churn, list the open findings and ask one question (EGM record §4.3).

**Gap.** `hrt-apply-code-review` handles a repeated finding the user already answered ("Already answered", [SKILL.md:65](../../skills/hrt-apply-code-review/SKILL.md)), but not a fix that creates the next finding. Over 3 passes the loop can trade one problem for another without anyone seeing the pattern.

**Change.** One sentence beside "Already answered": when a pass's finding sits at the scope of the previous pass's fix, mark it as churn and show both findings together. The orchestrator already keeps state across passes, so this needs no new mechanism. Value is moderate, since the loop is capped at 3 passes.

### 3.4 A size limit test for skills (deferred)

EGM enforces a 24,000-byte limit on each skill body in a unit test (second-hand, EGM record §3.9). The largest tempa-spec skill is `hrt-align-consistency-review` at 17,409 bytes, about 6.6 KB under that limit. A test in `scripts/` that fails above a chosen limit would turn the weight study's concern into a check. Low value today; worth it only if skills keep growing.

### 3.5 Stop when a review cannot run in a fresh context (decision needed; recommended: stop)

**EGM rule.** With no subagent tool, review skills stop: "a review in the same context is not a Goldfish review" (EGM record §4.2, §7.1). Issue #252 and the Windsurf adapter follow the same rule.

**Current tempa-spec behaviour.** Uneven across the three skills:

- `hrt-adversarial-authoring` asks the user whether to proceed with single-pass authoring ([SKILL.md:51](../../skills/hrt-adversarial-authoring/SKILL.md)). Its Draft step is itself a subagent ([SKILL.md:24](../../skills/hrt-adversarial-authoring/SKILL.md)), so on such a host the skill is already broken before review starts.
- `align` asks whether to proceed to WALKTHROUGH without VERIFY ([SKILL.md:51](../../skills/hrt-align-consistency-review/SKILL.md)). VERIFY runs only when ALIGN raised a HIGH, which is exactly when skipping it costs most.
- `hrt-apply-code-review` has no rule at all, although every pass runs in a subagent ([SKILL.md:8](../../skills/hrt-apply-code-review/SKILL.md)). Its behaviour on such a host is undefined.

**Recommendation: stop.** A single-pass review in the same context is the author checking its own work, which the judge-bias study found does not catch the author's blind spots. It is also a path around a review step, which the maintainer has rejected elsewhere (opengrep is a hard stop with no waiver). The change is one sentence per skill, and it fills the undefined case in `hrt-apply-code-review`: if a subagent cannot be spawned, say the review cannot run in this environment and stop; do not offer a same-context review.

**Cost, not yet measured.** `tempa-spec` stops working on any host with no subagent tool, where today it degrades with the user's consent. Which supported hosts lack one was not checked for this analysis; check before deciding.

### 3.6 Paraphrase before critique (decision needed; recommended: reject, or the minimal form)

**EGM rule.** `egm-comprehension` writes a paraphrase first ("What this proposes", "How the existing system works, per this document", 2-5 sentences each); a paraphrase it cannot write is a Blocker. Stage 6 bypasses the synthesizer because "the author must see the paraphrase" (EGM record §4.2, §5).

**Gap.** This is the one EGM concept with no counterpart in tempa-spec. Today a misunderstanding by a reviewer shows only indirectly, through odd findings.

**Why not as EGM has it.** There is no evidence it helps. Showing the paraphrase in every digest adds reading to every human gate, which the digest design exists to cut. And it cannot help where a misread costs most: `proposal` has no model review, so no reviewer paraphrases the intent. A separate comprehension subagent is ruled out in any case: it would be a new same-model review layer.

**Recommendation.** Reject. If the maintainer wants the mechanism, take only the minimal form: the Destructive Critic in `hrt-adversarial-authoring` writes a 2-sentence paraphrase before its findings, not shown in the digest; a paraphrase it cannot write becomes a Required Change. That keeps the one useful signal (the artifact cannot be restated) at a few output tokens per review and no added human reading.

### 3.7 The isolation limit (optional)

**EGM finding.** Fresh conversation context does not exclude host instruction files; on Codex and Antigravity a "fresh" reviewer still reads `AGENTS.md` (issue #237, open). In Claude Code, EGM uses `omitClaudeMd: true` in plugin agent frontmatter (EGM record §7.1, §7.2).

**Relevance.** tempa-spec reviewers are spawned from skills, which (per the EGM record, not verified here) cannot set `omitClaudeMd`. Its fresh reviewers therefore read the downstream repo's `CLAUDE.md` and `AGENTS.md`, plus whatever the orchestrator passes on. That is not wrong, since those files carry project rules the review needs, but "fresh context" in tempa-spec means "no conversation history", not "no project assumptions".

**Change.** None needed: this analysis records the limit. If the maintainer wants it where agents read it, one sentence in `AGENTS.md`, not a paragraph.

## 4. Not adopted, and why

| EGM element | Reason |
|---|---|
| Five review stages and eight reviewer personas | The opposite of the weight study's direction. EGM reports reviews of 15 or more subagent runs, and the Cowork run stopped part-way on a usage limit (EGM record §7.3, §8.3) |
| Converge only after two consecutive clean rounds | More rounds, no evidence. EGM's own rules conflict here: `egm-review` allows 1 re-audit per stage, `egm-review-loop` allows 5 rounds (§4.3) |
| Approval gate after every section (`egm-draft`) | Adds human turns; tempa-spec chose digests on purpose |
| One question per response | Conflicts with the 4 × 4 interview cap and the digest design |
| `egm-bootstrap` README tree | For legacy codebases; tempa-spec explores code through codegraph and ripgrep set in `context:` |
| Anti-sycophancy rule block on the author side | The judge-bias study found instructions such as "reflect independently" insufficient on their own; `grilling` is vendored and must not be hand-edited |
| `egm-drift-report` | Useful after archive (`openspec/specs/` against code), but not a phase of a change. Revisit as a separate skill only after a real drift incident |
| Separate synthesizer agent | tempa-spec merges reviewer output in the orchestrator and deliberately never adjudicates between reviewers by model judgement |

## 5. Proposed order of work

1. **One small change, no decision needed:** §3.1, §3.2 and §3.3, all wording in the three review skills.
2. **Maintainer decision first:** §3.5 (recommended: stop; check which hosts lack subagents before deciding) and §3.6 (recommended: reject, or the minimal form).
3. **Optional or deferred:** §3.7 (already recorded here), §3.4 (until a skill nears the limit).

None of these changes `requires` in `schema.yaml` or any template, so no `openspec validate` re-check is needed beyond the usual `npm test` if a test is added for §3.4.
