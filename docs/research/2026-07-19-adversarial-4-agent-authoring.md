# Research: generic "4-Agent Adversarial Authoring" pattern across proposal/specs/design

**Date:** 2026-07-19
**Scope:** validate a proposed 4-agent pattern (Author / Destructive Critic / Structural Auditor / Synthesizer) for the planning phases in `openspec/schemas/hash/schema.yaml`, against two reference GitHub repos (`addyosmani/agent-skills`, `addyosmani/adverse`), 51 additional sources (papers, repos, forums), and the skills already running in this repo (`skills/hrt-adversarial-authoring/SKILL.md`, `skills/hrt-align-consistency-review/SKILL.md`). §1–6 cover `proposal`/`specs`, the two phases the pattern was originally proposed for. §7 extends to the code-review phase (`hrt-apply-code-review`). §9 extends further to the `design` phase, which — unlike `proposal`/`specs` — currently has no adversarial-review step of any kind in this repo.
**Status:** research and validation complete. No changes made to `schema.yaml` or any skill yet — findings and recommendations only, pending an adoption decision.
**Sources:** 53 total — §6 lists 25 for the planning-phase question, §8 adds 20 for the code-review extension in §7, §10 adds 8 for the design-phase extension in §9.

## Contents

1. [Summary](#1-summary)
2. [Findings from the two reference repos](#2-findings-from-the-two-reference-repos)
3. [Validating the 4-agent proposal](#3-validating-the-4-agent-proposal)
4. [Documented failure modes](#4-documented-failure-modes)
5. [Recommendations](#5-recommendations)
6. [Sources (1–25)](#6-sources-1-25)
7. [Extension: adversarial patterns for code review (not just planning)](#7-extension-adversarial-patterns-for-code-review-not-just-planning)
8. [Sources (26–45)](#8-sources-26-45)
9. [Extension: adversarial patterns for the design phase](#9-extension-adversarial-patterns-for-the-design-phase)
10. [Sources (46–53)](#10-sources-46-53)

---

## 1. Summary

The proposed 4-role split was not found documented anywhere as a single named pattern, but is a plausible recombination of roles that do appear independently: a generator/author, one or more differentiated critic personas, and a synthesis stage that in the strongest precedent is deterministic, not another LLM call. The closest precedent, `addyosmani/adverse`, runs 3 critic personas (Auditor/Adversary/Pragmatist) plus a cross-review round, but makes synthesis **deliberately deterministic Node code, not a 4th LLM call** — the opposite of the proposed Subagent 4 (an LLM Synthesizer with auto-fix judgment authority).

"Premortem Analysis" is real but thinly evidenced here. Gary Klein's version is human decision-making; its one LLM analogue, InvThink (arXiv:2510.01569), applies premortem-style reasoning to model *safety*, not spec/requirements quality. No source shows premortem improving spec quality specifically.

Against this repo's existing skill (`hrt-adversarial-authoring`), the proposal is a genuine partial improvement — splitting one generic reviewer into two orthogonal lenses (content/logic vs. structure/format) mirrors `adverse`'s proven "stay in your lane" design. But it is silent on, or weakens, three things this skill and its sibling (`hrt-align-consistency-review`) already treat as load-bearing: fresh-context isolation between author and critic, a human approval gate for anything non-mechanical, and a Synthesizer without unilateral auto-fix authority.

Failure modes in the literature — sycophancy/correlated blind spots when critic and author share a model, a synthesizer/judge over-trusting the critic, super-linear token cost with diminishing returns past 1–2 rounds, single-model anchoring bias — all apply directly and are not anticipated by the proposal as written.

**Recommendation: adopt with modifications, not as-is.** See [§5](#5-recommendations).

## 2. Findings from the two reference repos

### `addyosmani/adverse` — https://github.com/addyosmani/adverse

A multi-agent adversarial **code** review tool (CLI + Claude Code Skill). Not spec authoring — it reviews diffs/directories — but its critic/synthesis architecture is the most directly relevant precedent available.

- **3 personas, one model, deliberately orthogonal lenses**, each scoped with an explicit "don't flag this, another persona covers it" boundary:
  - **Auditor** — correctness, logic, algorithmic soundness.
  - **Adversary** — security, abuse, trust boundaries.
  - **Pragmatist** — maintainability, complexity, design fit.
- **Round 1:** all three review in parallel, blind to each other, structured JSON (`verdict`, `summary`, `findings[]`).
- **Round 2 (cross-review):** each persona sees all round-1 outputs and must validate or challenge the others' findings with a concrete reason, or add new findings — this produces "cross-validated" vs. "disputed" findings.
- **Synthesis is deliberately not a 4th LLM call.** Per the README: *"Synthesis is deterministic Node code, not another LLM call. A fourth model invocation would cost more, add another failure mode, and inherit the same single-model bias the personas have."* Synthesis is pure counting/grouping.
- **Honestly-named limitation: single-model anchoring bias** — "one model running three personas correlates more than three independent models would." Mitigated by cross-review; README recommends re-running with a different backing model for real decorrelation.
- Cost: 6 model calls per review (3 personas × 2 rounds); `--single-round` halves it.

### `addyosmani/agent-skills` — https://github.com/addyosmani/agent-skills

~23 lifecycle skills for coding agents, 79k stars. Most relevant:

- **`doubt-driven-development`** — closest analogue to "Destructive Critic," for any non-trivial decision. CLAIM → EXTRACT (separate artifact from author's reasoning) → DOUBT (fresh-context reviewer, explicitly adversarial: "assume the author is overconfident... do NOT validate") → RECONCILE (orchestrator classifies: contract misread / valid-actionable / valid-tradeoff / noise) → STOP (capped at 3 cycles). Forbids passing the original CLAIM to the reviewer ("biases toward agreement"); offers cross-model escalation as optional, user-authorized, never silent. Names a checkable "doubt theater" anti-pattern: 2+ cycles with findings but zero classified actionable means the loop is validating, not doubting.
- **`spec-driven-development`** — SPECIFY → PLAN → TASKS → IMPLEMENT, human-gated at each step, surfaces assumptions explicitly before writing. No AI critic step — relies on human review alone.
- **`idea-refine`** — the only place premortem appears, one of several optional lenses for evaluating *product ideas* ("imagine this idea has already failed... work backwards"), not specs or code.
- **`code-review-and-quality`** — 5-axis review (correctness, readability, architecture, security, performance) with severity taxonomy and a "Multi-Model Review Pattern" (Model A writes → Model B reviews → Model A fixes → human decides) — the Author→Critic→human shape, generalized.
- Across both repos, no sequential 4-role authoring pipeline with a synthesizer was found. The closest 4-agent shape is `adverse`: 3 critics + deterministic synthesis.

## 3. Validating the 4-agent proposal

### 3.1 Is the 4-role split supported, or novel?

**Partially supported as a recombination; not documented anywhere as one named unit.**

- **Author** — maps to the generator half of every generate→critique→refine pattern found (Self-Refine, Constitutional AI phase 1, AutoGen Reflection, this repo's own `hrt-adversarial-authoring` draft step).
- **Destructive Critic** — maps to `doubt-driven-development`'s fresh-context adversarial reviewer, `adverse`'s Adversary/Auditor personas, and the OpenReview Adversarial Review paper's finding that structured disagreement beats naive LLM-reviews-LLM. Best-evidenced of the four roles.
- **Structural Auditor** — no direct academic analogue; closest real instances are this repo's own `hrt-align-consistency-review` structural checks and `adverse`'s deterministic JSON-schema validation. Effectively a linter dressed as an LLM role — useful, but the literature (and `adverse`'s own design choice) suggests format-compliance checking suits a cheap deterministic check or narrow rubric at least as well as a full LLM subagent.
- **Synthesizer** — where the proposal diverges most from the best-evidenced precedent. `adverse` deliberately makes synthesis deterministic code specifically to avoid a costlier, bias-inheriting 4th model call. The proposed Subagent 4 instead performs judgment (auto-fixing minor issues, deciding what's critical) — closer to the CollabEval/Multi-Agent-as-Judge line of research, which shows judge-style synthesis can work but carries its own bias-amplification risk (see "Judging with Many Minds," §6.13) that the proposal doesn't anticipate.

So: 3 of 4 roles have solid individual precedent; the specific 4-way combination — and especially giving the Synthesizer unilateral auto-fix authority — is a novel design choice not found replicated anywhere in this search.

### 3.2 Is "Premortem Analysis" evidenced, or borrowed terminology?

**Mostly borrowed, with one adjacent precedent and no direct evidence for spec/requirements quality.**

Gary Klein's premortem (1998/2007) is a human facilitation method, not an LLM technique. InvThink (arXiv:2510.01569) is the only paper operationalizing premortem-style reasoning *inside* an LLM's generation (enumerate failures → analyze consequences → generate under mitigation constraints), showing up to 32% harm reduction — but the outcome measured is safety, not requirements completeness. `idea-refine` (§2) offers premortem as an optional lens for product ideas, by analogy, with no evaluation data. No source reports premortem-style critique improving spec/requirements quality specifically. The proposed Subagent 2's framing ("assume the system fails in production") is a reasonable, directionally-consistent adaptation — **plausible, not evidenced**, for this use case.

### 3.3 Comparison with the existing `hrt-adversarial-authoring` skill

The existing skill already implements a 2-role author→reviewer split for `proposal`/`specs`, with design decisions the 4-agent proposal doesn't mention and would need to preserve or explicitly override:

- **Fresh-context isolation, not just role differentiation.** The reviewer explicitly doesn't see the author's reasoning/notes — same isolation principle as `hrt-apply-code-review`'s fresh-session review. This is the direct, primary mitigation for the sycophancy/correlated-blind-spot risk documented in §4. The 4-agent proposal doesn't specify whether the Critic or Auditor see the Author's reasoning — if they do, it inherits the risk `adverse` itself names as its core limitation.
- **Structural/format compliance is already checked** in the same reviewer pass ("is every requirement testable, is every scenario genuinely WHEN/THEN"). The proposal's real contribution: splitting adversarial-content scrutiny from structural compliance into two orthogonal lenses mirrors `adverse`'s proven Auditor/Adversary/Pragmatist separation and would likely yield cleaner, less conflated findings than one reviewer doing both jobs.
- **Unconditional human resolution gate.** Nothing is auto-applied without the user seeing it — not even mechanical items. The sibling skill `hrt-align-consistency-review` does allow auto-fixing, but only for items tagged MECHANICAL (one correct fix, no scope/intent judgment); everything else is surfaced one at a time with tradeoffs stated. The proposed Synthesizer's authority to auto-fix "minor" issues by its own judgment is a real regression here — what looks "minor" to an LLM synthesizer (e.g., a scope-narrowing rewrite framed as clarification) is exactly what `hrt-align-consistency-review` tags HIGH+DECISION and refuses to auto-resolve.
- **Fallback discipline.** The existing skill asks the user if a subagent can't be spawned, rather than silently degrading. The 4-agent proposal specifies no fallback for any of its 4 stages.

Bottom line: a plausible **refinement** (2 reviewer lenses instead of 1), not a wholesale improvement — silent on, or implicitly weakening, context isolation, human-gated resolution, and fallback handling.

## 4. Documented failure modes

- **Sycophancy / correlated blind spots when critic and author share a model.** Documented in "How RLHF Amplifies Sycophancy" (§6.14), "Sycophancy Is Not One Thing" (§6.15), and the OpenReview Adversarial Review paper's finding that naive LLM-reviews-LLM "overwhelmingly approves... because reviewer and generator share similar blind spots." `adverse` names this as its top limitation. Applies directly to a same-model 4-agent pipeline unless fresh-context isolation (as `hrt-adversarial-authoring` already does) is preserved.
- **Synthesizer/judge over-trusting critic output, bias amplification.** "Judging with Many Minds" (§6.13) shows debate/aggregation can amplify bias after initial rounds; CollabEval and Multi-Agent-as-Judge (§6.12) show judge-style synthesis is workable but non-trivial — not the free deterministic step `adverse` insists on.
- **Cost/latency, with real numbers.** "The Cost of Consensus" (§6.8): debate consumes 2.1–3.4× more tokens than isolated self-correction for equal-or-worse accuracy in unguided setups. `adverse` runs 6 model calls per review as an explicit tradeoff, and still offers `--single-round` as a cheaper path. A *sequential* 4-agent pipeline (as proposed) adds latency serially — worse than `adverse`'s parallelized structure.
- **Diminishing returns beyond 2–3 rounds.** §6.10 and §6.7 both report most gains happen early and saturate — consistent with this repo's `hrt-apply-code-review` 3-pass cap and `doubt-driven-development`'s 3-cycle bound with "doubt theater" detection. The 4-agent proposal, as a fixed single pass rather than a loop, doesn't have this failure mode in the same form, but also has no mechanism to detect a Critic that starts rubber-stamping across repeated invocations.
- **Single-model anchoring bias.** Named honestly in `adverse`'s README as its central unresolved limitation, mitigated there by cross-model escalation. The 4-agent proposal is silent on whether all 4 subagents share a model; if so, this bias applies uncorrected.
- **Parallel merge can be fundamentally broken.** The LLM Consortium topology study (§6.19, 520 runs) found this specifically for LLM-merged divergent design proposals. Relevant only if the Synthesizer merges parallel critic outputs by LLM judgment rather than sequentially — the proposal's apparent sequential ordering avoids this, and `adverse`'s parallel critic round avoids it differently, by keeping its own merge deterministic rather than an LLM synthesis.

## 5. Recommendations

**Adopt with modifications — do not adopt as-is.**

1. **Split the existing single reviewer into two orthogonal lenses** — content/logic ("Destructive Critic") vs. structural/format ("Structural Auditor") — following `adverse`'s "stay in your lane" pattern. Most directly precedented part of the proposal, clearest incremental value.
2. **Keep fresh-context isolation for the Destructive Critic** exactly as today (no visibility into the Author's reasoning) — the single most evidence-backed mitigation against sycophancy found across sources; must be preserved explicitly since the proposal doesn't mention it.
3. **Do not give the Synthesizer unilateral auto-fix authority based on its own judgment of "minor."** Reuse the MECHANICAL/DECISION tagging from `hrt-align-consistency-review`: auto-fix only single-correct-fix items with no scope/intent judgment; everything else — including anything the Synthesizer might call "minor" but that touches scope, wording, or intent — goes to the human, one at a time, tradeoff stated first. Consider making the merge step partly deterministic rather than a full 4th LLM call, per `adverse`'s reasoning.
4. **Treat "Premortem Analysis" as a prompt heuristic for the Destructive Critic, not a proven methodology** — cite it as "adapted from Klein's premortem / InvThink-style failure enumeration," not as an established spec-quality technique.
5. **Cap total rounds and specify fallback**, mirroring `hrt-apply-code-review`'s 3-pass cap and `doubt-driven-development`'s "doubt theater" detection, plus an explicit fallback if a subagent can't be spawned (existing skill has one; the proposal doesn't).
6. **If cost matters, run the two critics in parallel** rather than strictly sequentially — nothing about the Critic/Auditor split requires one to see the other's output first, and parallel is the cheaper, better-evidenced topology.

In short: the two-critic-lens idea is worth adopting; the unilateral-Synthesizer idea should be rejected or heavily constrained; premortem framing should stay a prompt-writing technique, not validated methodology.

## 6. Sources (1–25)

### Requested reference repos

1. `addyosmani/adverse`. https://github.com/addyosmani/adverse — 3-persona critic + cross-review + deterministic synthesizer.
2. `addyosmani/agent-skills`. https://github.com/addyosmani/agent-skills — `doubt-driven-development`, `spec-driven-development`, `idea-refine`, `code-review-and-quality`.

### Academic foundations: refine, debate, consensus

3. Self-Refine: Iterative Refinement with Self-Feedback. https://arxiv.org/abs/2303.17651 — generate→feedback→refine loop, ~20% absolute improvement with no fine-tuning.
4. Constitutional AI: Harmlessness from AI Feedback. https://arxiv.org/abs/2212.08073 — AI self-critique against written principles; root of "auditor checks against a written rubric."
5. Self-Consistency Improves Chain of Thought Reasoning. https://arxiv.org/abs/2203.11171 — multiple independent reasoning paths + majority vote.
6. Improving Factuality and Reasoning in LLMs with Multiagent Debate. https://composable-models.github.io/llm_debate/ — foundational multi-agent debate paper.
7. Debate Only When Necessary: Adaptive Multiagent Collaboration. https://arxiv.org/abs/2504.05047 — debate should trigger selectively, not always.
8. The Cost of Consensus. https://arxiv.org/abs/2605.00914 — debate costs 2.1–3.4× more tokens than self-correction for equal-or-worse accuracy; sycophantic conformity up to 85.5%.
9. Talk Isn't Always Cheap: Failure Modes in Multi-Agent Debate. https://arxiv.org/abs/2509.05396 — catalogs conformity/fragility/collapse failure modes.
10. Literature Review of Multi-Agent Debate for Problem-Solving. https://arxiv.org/abs/2506.00066 — gains concentrate early, then saturate.
11. Multi-Agent Reasoning Improves Compute Efficiency. https://arxiv.org/abs/2605.01566 — accuracy/cost Pareto frontier for ensemble size.

### Synthesis, judging, and bias

12. CollabEval: Enhancing LLM-as-a-Judge via Multi-Agent Collaboration. https://arxiv.org/abs/2603.00993 — whether the Synthesizer itself should be multi-agent.
13. Judging with Many Minds: Bias Amplification in Multi-Agent LLM-as-Judge. https://arxiv.org/abs/2505.19477 — debate frameworks can amplify bias after initial rounds.
14. How RLHF Amplifies Sycophancy. https://arxiv.org/abs/2602.01002 — mechanistic explanation of same-model-family critic agreement bias.
15. Sycophancy Is Not One Thing. https://arxiv.org/abs/2509.21305 — sycophancy is controllable/separable but present by default.

### Premortem and red-teaming

16. InvThink: Premortem Reasoning for Safer Language Models. https://arxiv.org/abs/2510.01569 — enumerate failures → consequences → generate under constraints; evidenced for safety, not spec quality.
17. PersonaTeaming: Persona-Driven Red-Teaming for Generative AI. https://arxiv.org/abs/2509.03728 — differentiated adversarial personas measurably improve red-team coverage.

### Code review and adversarial spec design

18. Adversarial Review: Cooperative Code Review through Structured Disagreement. https://openreview.net/forum?id=fOHvpLs6zp — naive LLM-reviews-LLM overwhelmingly approves; structured disagreement + rewrite-mandate reviewer outperforms.
19. LLM Consortium for Software Design Refinement. https://arxiv.org/abs/2606.01490 — 520-run, 12-topology experiment; "structural adversarial" ranks #1; "parallel merge is fundamentally broken."
20. iReDev: A Knowledge-Driven Multi-Agent Framework for Requirements Development. https://arxiv.org/abs/2507.13081 — closest academic work to multi-agent spec authoring as a category.
21. Can LLMs Generate User Stories and Assess Their Quality? https://arxiv.org/abs/2507.15157 — baseline for spec-quality evaluation without a 4-agent pipeline.
22. Exploring the Use of LLMs for Requirements Specification in an IT Consulting Company. https://arxiv.org/abs/2507.19113 — practitioner study: LLM-drafted specs need human revision.

### Framework docs and practitioner writeups

23. Reflection design pattern (AutoGen docs). https://microsoft.github.io/autogen/stable//user-guide/core-user-guide/design-patterns/reflection.html — canonical generator/critic/loop pattern.
24. `intent-driven-dev/intent-driven-template`. https://github.com/intent-driven-dev/intent-driven-template — independent OpenSpec-adjacent template implementing the same author→reviewer shape as this repo's `hrt-adversarial-authoring`.
25. Why AI Agent Outputs Need Adversarial Review. https://dev.to/rih0z/why-ai-agent-outputs-need-adversarial-review-and-how-to-add-it-in-one-api-call-42ho — practitioner framing, consistent with academic sycophancy findings.

*One anecdotal LinkedIn post endorsing adversarial review generally was also found; not numbered above, adds no evidence beyond the sources already listed.*

---

## 7. Extension: adversarial patterns for code review (not just planning)

**Scope note:** §§1–6 validated the 4-agent pattern for the *planning* phases. This section asks the same question of `apply` Phase 2 (`skills/hrt-apply-code-review/SKILL.md`), which already differs architecturally from `hrt-adversarial-authoring` — single reviewer role, multi-pass loop, contract-map-then-classify, MECHANICAL/DECISION tagging — rather than an author/critic split. Should it move toward `adverse`'s multi-persona differentiation, or something else?

### 7.1 `adverse` reread through a code-review lens

`adverse` is, unlike the planning-phase precedents, actually a code review tool. Its stated motivation is explicitly anti-single-pass: *"The naive way to do 'AI code review' is one model, one shot."* `hrt-apply-code-review` answers the same critique by a different mechanism — repetition over time (multi-pass, fresh context) rather than differentiation within one pass. `adverse`'s README claims each persona catches a category the others structurally will not (Auditor: logic bugs the Adversary won't look for; Adversary: attack chains the Auditor won't consider; Pragmatist: design problems both ignore) — a real, load-bearing claim, though architectural/theoretical rather than benchmarked in the repo itself (independent benchmark evidence for the general question does exist — see §7.2). It also, in the same breath, names single-model correlation as an unresolved limitation (see §2).

Applying this to `hrt-apply-code-review`: the 3-persona split answers a real, named gap (one reviewer prompt doing three jobs); the cross-review round answers a different gap (nothing today makes one finding corroborate or challenge another within a pass). Neither is free — see §7.5.

### 7.2 Does multi-pass already substitute for multi-persona?

**No — they target different failure modes, and both are evidenced, but neither subsumes the other.**

- **Multi-pass has real, positive, quantified evidence — for a narrower failure mode.** SWR-Bench (§8.27) shows a single review pass is stochastic (different runs miss different defects), and aggregating 5 independent same-role passes improves F1 by up to 43.67% by canceling per-run randomness. Direct evidence for "run it more than once" — exactly what `hrt-apply-code-review`'s 3-pass loop does. But it reduces stochastic miss-rate within one lens; it doesn't add a lens the reviewer wasn't using. A role that never checks for SQL injection won't start, no matter how many fresh passes it runs.
- **Multi-turn review (where the reviewer sees prior rounds) has negative evidence.** "More Rounds, More Noise" (§8.28): single-pass review (F1 0.376) beats multi-turn variants (F1 0.263–0.303), because later rounds fabricate findings once real defects are exhausted and drift into critiquing the prior exchange. This directly validates `hrt-apply-code-review`'s existing fresh-context-per-pass rule as the correct choice, not an arbitrary one — the alternative (a reviewer that remembers and follows up on itself) is the version the literature shows backfires.
- **Persona differentiation is evidenced separately, for a complementary failure mode.** Qodo 2.0 (§8.33) and AutoReview (§8.32) both split by concern (bug/logic, security, quality, test coverage) as parallel agents rather than sequential passes, and both report gains attributed to the differentiation (Qodo: highest F1/recall of 8 tools benchmarked; AutoReview: +18.72% F1 for security detection specifically). Neither compares against "run the same reviewer 3× with fresh context," so this isn't head-to-head evidence against multi-pass — it's evidence that a differentiated lens catches more in its specialty than a generalist does, a different axis of improvement than repetition.

Multi-pass reduces *stochastic* miss-rate; persona differentiation reduces *systematic* miss-rate — a reviewer never prompted to think adversarially about trust boundaries won't find an auth bypass no matter how many times it re-reads the diff. `hrt-apply-code-review`'s contract map already narrows the systematic gap somewhat (a fixed code-smell checklist covers maintainability), but security is conspicuously absent from it, and "spec/design compliance" vs. "does this code do what it claims" are still one undifferentiated pass.

### 7.3 Real-world tool architectures

The commercial landscape converges on differentiation **plus** a distinct judge/synthesis layer — not on `adverse`-style cross-review debate:

- **CodeRabbit** (§8.29): 7–8 models as pipeline stages (compress context → build task graph → investigate → separate judge model scores and drops ungrounded findings), not parallel debating personas. The judge-filters-before-human-sees-it step is architecturally close to `adverse`'s deterministic synthesis and to `hrt-apply-code-review`'s own severity/MECHANICAL-DECISION step.
- **Qodo 2.0** (§8.33, §8.34): the architecture most comparable to a persona-split `hrt-apply-code-review` — 4 parallel specialized agents plus a separate judge agent that "resolves conflicts, removes duplicates, and filters low-signal results." Highest F1 (60.1%) and recall (56.7%) of 8 tools benchmarked.
- **CodeGuru Reviewer** (§8.30) and **Google Tricorder/Critique** (§8.31) predate LLM personas entirely — ML-plus-static-analysis-rule ensembles, the oldest battle-tested version of "differentiate by concern, not repetition."
- **GitHub Copilot code review** (§8.35): single-pass, advisory-only, never blocks merge — explicit vendor acknowledgment that single-pass AI review isn't trusted as a sufficient gate alone, consistent with `hrt-apply-code-review` hard-gating on deterministic test/lint failure rather than LLM judgment.
- **Practitioner sentiment** (§8.36, §8.37) converges on: (a) current tools already over-flag ("20 speculative reasons... along with the one critical error") — an argument for a synthesis/filter step at least as much as for more personas that would each add their own noise; (b) the review agent should be architecturally separate from the coding agent — the sycophancy argument from §3.3/§4, restated commercially, arguing for session/model separation (already present via fresh subagent sessions) more than for splitting the reviewer into personas.

No surveyed production tool ships pure differentiation without a judge layer, and none ships `adverse`-style persona-vs-persona cross-review — the closest thing in production (CodeRabbit's judge model) is closer to `hrt-apply-code-review`'s own severity classification than to `adverse`'s round-2 mechanic.

### 7.4 Failure modes specific to code review

New material not covered by §4 (which was about critique of reasoning/content generally, not alert fatigue or code-review-specific sycophancy):

- **False-positive-driven habituation is measured.** SonarSource: 3.2% false positives across 137M issues after years of tuning; untuned LLM reviewers: 40–80% (§8.38); a separate study of GPT-4-class security reviewers: 63–97% (§8.43). Security-warning habituation research shows attention drops sharply after the first few exposures — high per-pass noise doesn't just waste time, it trains the human to stop reading. Direct support for `hrt-apply-code-review`'s severity triage and one-DECISION-at-a-time discipline as load-bearing, not incidental.
- **Code-review-specific sycophancy:** a reviewer that accepts a wrong API assumption baked into the diff and edits around it instead of flagging it, because the diff itself functions as an implicit "user opinion" (§8.39, §8.40). Same root cause as §4's sycophancy sources, different manifestation — `hrt-apply-code-review`'s fresh-context-per-pass design (reviewer never sees the implementer's reasoning) directly interrupts the priming this failure mode requires.
- **LLM reviewers are more robust to adversarial-comment social engineering than expected** — two 2026 papers (§8.41, §8.42) found "trust me, this is safe" comments don't reliably fool reviewers into missing planted vulnerabilities (non-significant across 8 models, 14,012 cases). Reassuring on persuasion; doesn't address the more common failure — a lens never applied in the first place.
- **Multi-file/cross-context vulnerabilities are missed regardless of pass count or persona** when the relevant information isn't in the prompt context at all (§8.44) — a context-assembly problem, not a reviewer-architecture one. `hrt-apply-code-review`'s contract-map step already pushes toward whole-artifact grounding, but doesn't currently instruct explicit cross-file call-chain/data-flow tracing as its own line item.

### 7.5 Recommendation for `hrt-apply-code-review`

**Keep the core design — multi-pass, fresh-context-per-pass, contract-map-before-classify, MECHANICAL/DECISION tagging — and make one targeted addition, rather than adopting `adverse`'s full persona/cross-review architecture.**

1. **Don't replace multi-pass with multi-persona.** §7.2 validates the current fresh-context-per-pass design over the obvious alternative (a reviewer that remembers its own prior passes) — this is confirmation the existing choice was correct, not a place to change anything.
2. **The strongest gap is security, not general persona-splitting.** The contract map already has a named lens for maintainability (12-item code-smell baseline) and for spec/design/task compliance (first three bullets) — 2 of `adverse`'s 3 lenses, inside one pass. It has no equivalent lens for security: no prompt to think adversarially about trust boundaries, injection, auth, secrets, or abuse paths. Given AutoReview's +18.72% F1 gain from a security-specialized pass, and given security is exactly the systematic (not stochastic) omission more passes won't fix, this is where the evidence points.
3. **Concrete, minimal change: add a sixth contract-map bullet for security**, modeled on `adverse`'s Adversary framing, inside the existing single-reviewer pass — not a separate parallel agent. E.g.: "Security: trust boundaries, injection, authZ/authN, secrets handling, and abuse paths relevant to the code touched — independent of whether the spec calls it out, since specs rarely enumerate abuse cases explicitly." Feed it into the same HIGH/MEDIUM/LOW and MECHANICAL/DECISION classification already in steps 4–5; don't add a second synthesis stage — the skill's human-gated DECISION handling already serves that role, the same role CodeRabbit/Qodo use their judge layer for.
4. **Don't adopt `adverse`'s cross-review round as-is.** Least code-review-evidenced part of `adverse`'s design: "More Rounds, More Noise" shows same-artifact multi-round exchange degrades precision, and no surveyed production tool ships persona-vs-persona cross-examination — all use a separate judge/filter stage instead. If cross-validation is wanted later, prefer that shape (CodeRabbit/Qodo) over `adverse`'s — though a human is already the DECISION-arbiter here, which an autonomous pipeline like CodeRabbit's lacks.
5. **Don't spin security out as a fully separate parallel subagent unless cost data later says otherwise.** That trades the proven cheap multi-pass design for orchestration complexity `adverse` itself pays for (6 calls/review) and that practitioner sentiment (§8.36) suggests already drives noise complaints, without head-to-head evidence that parallelization beats a well-specified single-pass lens at this repo's size and cadence. Revisit only if the new security bullet is empirically found insufficient (a real vulnerability slips through 3 passes despite it).

In short: the evidence doesn't support restructuring `hrt-apply-code-review` into an `adverse`-style multi-persona/cross-review pipeline. The one genuine, evidence-backed gap is the missing security lens — add it as a sixth contract-map bullet inside the existing single-reviewer pass, not as a new architectural layer.

---

## 8. Sources (26–45)

26. `addyosmani/adverse`, revisited for code-review framing (= source 1). https://github.com/addyosmani/adverse
27. SWR-Bench: Assessing LLM Performance in Real-World Code Review Comment Generation. https://arxiv.org/abs/2509.01494 — aggregating independent same-role passes improves F1 up to 43.67%; strongest direct evidence for multi-pass specifically.
28. More Rounds, More Noise: Why Multi-Turn Review Fails to Improve Cross-Context Verification. https://arxiv.org/abs/2603.16244 — single-pass (F1 0.376) beats multi-turn (F1 0.263–0.303); validates fresh-context-per-pass.
29. How CodeRabbit Works. https://docs.coderabbit.ai/overview/architecture and https://theaiengineer.substack.com/p/how-coderabbit-actually-works — compression → task graph → investigation → judge-model filtering pipeline.
30. How Amazon CodeGuru Reviewer works. https://docs.aws.amazon.com/codeguru/latest/reviewer-ug/how-codeguru-reviewer-works.html — pre-LLM ML-plus-static-analysis-rules precedent.
31. Tricorder: Building a Program Analysis Ecosystem (Sadowski et al., Google). https://research.google.com/pubs/archive/43322.pdf — narrow specialized analyzers feeding one review surface.
32. AutoReview: LLM-based Multi-Agent System for Security Issue-Oriented Code Review (FSE 2025). https://dl.acm.org/doi/10.1145/3696630.3728618 — +18.72% F1 for security detection vs. general-purpose baselines.
33. Introducing Qodo 2.0. https://www.qodo.ai/blog/introducing-qodo-2-0-agentic-code-review/ — 4 parallel specialized agents + distinct judge agent.
34. Qodo: Why Code Review Needs Its Own AI (benchmark methodology). https://www.qodo.ai/blog/why-code-review-needs-its-own-ai-with-state-of-the-art-precision-recall/ — F1 60.1%, recall 56.7%, 8 tools, 580 defects/100 PRs.
35. About GitHub Copilot code review. https://docs.github.com/en/copilot/concepts/agents/code-review — single-pass, advisory-only, never a required approval.
36. "There is an AI code review bubble" (Hacker News). https://news.ycombinator.com/item?id=46766961 — practitioner noise complaints, not missing-lens complaints.
37. There is an AI Code Review Bubble (Greptile). https://www.greptile.com/blog/ai-code-review-bubble — "the same AI write AND approve code is logically absurd."
38. Diagnosing False Positives in AI Code Review, Part 2. https://tech.bdigitalmedia.io/blog/diagnosing-ai-review-false-positives/ — SonarSource 3.2% vs. untuned LLM 40–80% false-positive rates; habituation research.
39. LLMs in Coding and their Impact on the Commercial Software Engineering Landscape. https://arxiv.org/pdf/2506.16653 — tool accepts wrong API assumption baked into a diff instead of flagging it.
40. Interaction Context Often Increases Sycophancy in LLMs. https://arxiv.org/pdf/2509.12517 — sycophancy triggered by presence of a stated position/framing.
41. LLM Code Reviewers Are Harder to Fool Than You Think. https://arxiv.org/html/2602.16741v1 — adversarial comments fail to suppress vulnerability flagging, non-significant across 8 models.
42. SEVRA-BENCH: Social Engineering of Vulnerabilities in Review Agents. https://arxiv.org/pdf/2606.13757 — companion benchmark to source 41.
43. An Empirical Study of Security Calibration in Large Language Models for Code. https://arxiv.org/abs/2606.31159 — 63–97% false-positive rates for GPT-4-class security reviewers.
44. From Vulnerabilities to Remediation: A Systematic Literature Review of LLMs in Code Security. https://arxiv.org/html/2412.15004v4 — LLM review misses vulnerabilities whose relevant info isn't in prompt context (call chains, cross-file data flow).
45. Rethinking Code Review Workflows with LLM Assistance (WirelessCar/Chalmers, ESEM 2025). https://arxiv.org/abs/2505.16339 — field study: context-switching, reviewer fatigue, inconsistent depth, trust/false-positive concerns as adoption barriers.

*O'Reilly Radar's "AI Code Review Only Catches Half of Your Bugs" and Addy Osmani's "Agentic Code Review" (both 2026) were also reviewed; both cover ground already captured more rigorously by sources 27–28 and 37 respectively — not numbered separately.*

---

## 9. Extension: adversarial patterns for the design phase

**Why this section exists:** §§1–6 validated the 4-agent pattern for `proposal`/`specs`; §7 extended it to code review. Neither covers `design` (`schema.yaml:103-132`, generates `design.md`), which sits between them (`requires: [proposal, specs]`). This is a real gap, not an oversight in scope: `design`'s own instruction never invokes `hrt-adversarial-authoring` — only the conditional security skills (`stride-analysis-patterns`, `threat-mitigation-mapping`) when a trust boundary is touched — and `skills/hrt-adversarial-authoring/SKILL.md` itself has zero mentions of `design`. So today, `design.md` is the one build-order artifact with no adversarial-content review at all.

It isn't reviewed for consistency either, but that's a different check than this section is about: `hrt-align-consistency-review` (used in the `align` phase) does read `design.md` — cross-checking it against `proposal`/`specs` for scope drift and against the actual codebase for factual claims (`skills/hrt-align-consistency-review/SKILL.md:18-22`). That's traceability and fact-checking, not a challenge to whether the *decisions themselves* are sound — no step anywhere asks "was a cheaper alternative dismissed too quickly," "is this risk mitigation actually sufficient," or "does this trade-off analysis hold up." That's the specific gap this section evaluates.

### 9.1 Why design.md is a different review problem than proposal/specs

`hrt-adversarial-authoring`'s reviewer checklist (`SKILL.md:25`) is built around **traceability**: does every claim trace back to `discovery.md`/`proposal.md`, is scope creeping beyond what was asked, is every requirement testable. This fits `proposal`/`specs` because their content — problem statements, requirements, scenarios — has a ground truth to trace against (discovery, or the proposal's own Capabilities section).

`design.md`'s content (per `schema.yaml:116-122`'s section list: Context, Goals/Non-Goals, **Decisions** with rationale and alternatives considered, Risks/Trade-offs, Migration Plan, Open Questions — though the template file `templates/design.md` itself currently only stubs the first four; Migration Plan and Open Questions exist in the instruction prose but not yet as template placeholders, a pre-existing drift orthogonal to this section's question) has no equivalent ground truth to trace against — a "Decision" is not right or wrong relative to a source document, it's right or wrong relative to whether the reasoning holds up and whether a better alternative was overlooked. A traceability-style reviewer ("does this decision trace back to the proposal?") would correctly confirm the decision is in scope while missing that it's a bad decision. This is exactly the distinction the classical Architecture Tradeoff Analysis Method (ATAM) was built around — evaluating whether design decisions support quality attributes and where the trade-offs actually are, not whether a document is internally consistent.

### 9.2 What the literature says about adversarial review of design/architecture documents specifically

This is a thinner, more recent literature than code review's, but several sources are directly on-point:

- **The closest architectural precedent to the proposed 4-agent shape: CAPRA** (§10.47) — a 4-agent pipeline for feedback on software architecture *deliverables* specifically (not code, not requirements): SpecificationAuditorAgent (requirements/use-case/UML/pattern alignment), TestAuditorAgent (test-plan coverage), FeatureCheckAgent (rubric-based feature presence), TraceabilityMatrixAgent (requirement→use-case→design→test mapping), synthesized by a deterministic-leaning **ConsistencyManager** that merges, cross-verifies, and deduplicates findings — plus a distinct **evidence-anchoring** mechanism (fuzzy-matched source quotes, findings below a confidence threshold discarded) built specifically to suppress hallucinated findings. Measured: 88.8% pass rate under strict aggregation against human evaluators, moderate agreement (κ=0.582) overall but near-perfect on extractive checks (κ=1.00, e.g. "is this requirement present") and weak on interpretive judgment (κ=0.348, e.g. "is this issue actually grounded/valid") — i.e., the same 4-role shape works well for checking a design deliverable is *complete and consistent*, and is measurably less reliable exactly where the proposed Destructive-Critic-for-design would need to operate: judging whether a decision is *good*. The paper's own conclusion: "human oversight remains essential for subjective assessment dimensions."
- **Architecture Decision Records specifically need a different review than status tracking.** The `documentation-and-adrs` skill in `addyosmani/agent-skills` (§10.46) — the direct sibling to `design.md` in that repo's lifecycle — was checked directly and confirmed to have **no critique, adversarial-review, or premortem mechanism at all**: it covers ADR structure, lifecycle status (proposed→accepted→superseded), and convention-matching, nothing else. This mirrors this repo's own gap exactly, in an independent, widely-used skill collection — evidence the gap is common, not evidence it's fine to leave unaddressed.
- **A synthesized "Adversarial Decision Review" pattern, distinct from adversarial spec/code review, is being named in current practitioner writing** (found via search, not a single paper): the recurring shape is a review that evaluates *decision quality itself* — was the context complete, were reasonable alternatives actually considered, are negative outcomes acknowledged — rather than a review that checks the document against another document. This is a different rubric than either `hrt-adversarial-authoring`'s traceability checklist or `hrt-align-consistency-review`'s cross-artifact consistency checklist, and closest to the *intent* the original 4-agent proposal's "Destructive Critic" role was reaching for, just never pointed at `design.md`.
- **TriAdReview** (§10.48) — Generator/Reviewer/Refiner triangle for technical document generation generally (not architecture-specific) — the closest general precedent to a 3-role generate-critique-refine loop for prose documents, but notably makes synthesis **LLM-based** (Refiner is itself a model call), the opposite of `adverse`'s and this repo's existing preference for keeping resolution non-LLM or human-gated. Its own measured gains (coherence, technical accuracy, completeness) are against a single-pass baseline, not against a human-gated alternative — so it's evidence multi-role beats single-pass, not evidence LLM-driven refinement beats human-gated resolution.
- **ADR-violation detection is a different, better-evidenced problem: checking a decision was followed, not whether it was good.** A 980-ADR, 109-repo study (§10.49) using a primary LLM plus 3 independent LLM validators found 90%+ accuracy detecting whether code *complies* with a documented decision, substantial inter-model agreement (Fleiss' κ=0.724) — but this measures compliance-checking (does the code match what the ADR says), not decision-quality review (was the ADR's decision correct). The paper's own error analysis is informative regardless: of 92 errors, the largest categories were infrastructure/deployment decisions requiring specialized operational knowledge (42.4%) and abstract "principle-driven" decisions lacking explicit operational standards (26.1%) — i.e., LLMs (reviewer or otherwise) are weakest on exactly the kind of qualitative, principle-level content `design.md`'s Decisions/Trade-offs sections are made of.
- **A single LLM's evaluation of a design document is measurably contingent on the input document's own quality, and is not yet consistent enough to trust unsupervised.** A study evaluating LLMs against software-architect judgments of real architecture documents in a digital-marketplace setting (§10.50) found LLM–human evaluation agreement rose with the quality of the document being evaluated, and explicitly cautioned that "results showed inconsistencies that need further analyses before generalizing them." Relevant here specifically because it's evidence against a single-pass LLM Structural-Auditor-for-design being sufficient on its own — the noisier the design.md draft (exactly the case where review matters most), the less reliable a single LLM's evaluation of it was found to be.
- **ARCADE** (§10.51) reinforces the general shape (critic-style structured critique + iterative refinement improves reliability over ungrounded RAG-style summarization) for complex document evaluation generally, but is domain-general (policy/health/legal documents), not architecture-specific, and its methodology detail wasn't independently verifiable beyond the abstract in this search — treated as thin corroboration, not load-bearing evidence.

### 9.3 Does design.md's content make premortem more, or less, applicable than for specs?

More applicable, if anything — and better-evidenced here than in §3.2's finding for specs. `design.md`'s own template already has a **Risks / Trade-offs** section with an explicit `[Risk] → Mitigation` format (`schema.yaml:120`) — i.e., the artifact already asks the author to do premortem-adjacent thinking as part of drafting, unreviewed. A Destructive Critic applying Klein/InvThink-style "assume this fails in production, work backwards" framing has a natural, pre-existing target in this artifact (interrogate the stated Risks/Trade-offs: are they the real risks, or the comfortable ones; what alternative was in "Decisions" but not chosen, and was that dismissal actually justified) in a way `proposal`/`specs` don't structurally offer. This remains **directionally plausible, not directly evidenced** — no source found benchmarks premortem-style critique against design-doc quality specifically — but the fit is closer than for specs, because InvThink's own mechanism (enumerate failures → analyze consequences → generate under mitigation constraints) maps almost directly onto what the Risks/Trade-offs section is already asking the author to do solo.

### 9.4 Recommendation for the design phase

**Add adversarial review to `design`, but with a rubric different from `hrt-adversarial-authoring`'s traceability checklist — not a straight reuse of the existing skill, and not the 4-agent pattern as originally proposed.**

1. **Extend `hrt-adversarial-authoring` with a `design` mode rather than building a separate skill**, since the surrounding mechanics (fresh-context reviewer, human-gated `Required Changes`, fallback discipline) are architecture-agnostic and already proven for this repo — reuse the shell (`SKILL.md:22-31`'s Draft → Review → Resolve → Finalize loop), but swap the reviewer's checklist for `design`.
2. **The `design` reviewer's checklist should target decision quality, not traceability**, per the "Adversarial Decision Review" shape in §9.2: for each entry in Decisions, was a reasonable alternative dismissed without justification; for each entry in Risks/Trade-offs, is the stated mitigation actually sufficient, and is a plausible failure mode missing entirely (the InvThink/premortem framing from §9.3, adapted the same cautious way recommendation 4 in §5 treats it for specs — a heuristic, not a validated method). This is a genuinely different lens than "does this trace back to the proposal," and reusing the specs checklist verbatim would under-serve design.md the way a Structural Auditor checking format compliance would under-serve content quality (§3.1's point about the original Structural Auditor role, recurring here).
3. **Do not expect a single LLM reviewer pass to be reliably consistent, per §9.2's CAPRA and digital-marketplace findings** — both show LLM-human agreement on design/architecture evaluation is strong on extractive/compliance checks and weak on interpretive judgment specifically, which is most of what a design reviewer would be doing. This argues for keeping the human resolution gate at least as strict as `hrt-adversarial-authoring` already enforces for specs (recommendation 3 in §5, the MECHANICAL/DECISION split) — if anything, default *more* findings to DECISION for design.md than for specs, since the CAPRA/digital-marketplace evidence suggests LLM judgment is least reliable exactly on the kind of assessment this reviewer would be doing most.
4. **Keep synthesis non-LLM or human-gated, not TriAdReview's LLM-Refiner shape** — consistent with recommendation 3 in §5 and §7.5's recommendation for the other two phases, and for the same reason: TriAdReview's own evidence is against a single-pass baseline, not against a human-gated alternative, so it doesn't override the stronger evidence (adverse, CAPRA's ConsistencyManager) for deterministic-or-human synthesis over a 4th LLM judgment call.
5. **This is lower urgency than the security gap identified in §7.5 for code review, but is a real, evidenced gap** — `design.md` is currently the only build-order artifact reviewed for consistency (via `align`) but never for the soundness of its own content, and every source in §9.2 that measured this directly (CAPRA, the digital-marketplace study, the ADR-violation study) found LLM judgment specifically weaker here than on the compliance/traceability-style checks this repo's existing skills already do well.

In short: `design` should get an adversarial review step — the gap is real and independently confirmed (the closest external analogue, `documentation-and-adrs`, has the same gap). But the reviewer's job for `design.md` is different from `hrt-adversarial-authoring`'s existing checklist: judge decision quality and risk completeness, not traceability — and the evidence available here argues for an even stricter human gate than specs currently has, not a looser one.

---

## 10. Sources (46–53)

46. `addyosmani/agent-skills` — `documentation-and-adrs/SKILL.md`, checked directly for adversarial-review content. https://github.com/addyosmani/agent-skills/blob/main/skills/documentation-and-adrs/SKILL.md — confirmed no critique, reviewer role, or premortem step; ADR review is limited to lifecycle-status tracking.
47. CAPRA: Scaling Feedback on Software Architecture Deliverables with a Multi-Agent LLM System. https://arxiv.org/html/2606.18976v1 — 4-agent pipeline (spec/test/feature/traceability auditors) + deterministic-leaning ConsistencyManager synthesis + evidence-anchoring against hallucination; 88.8% pass rate, κ=0.582 overall, κ=1.00 extractive vs. κ=0.348 interpretive — the closest architectural precedent to the original 4-agent proposal, and direct evidence that LLM judgment on design deliverables is reliable for completeness/consistency checks but weak on judging decision quality.
48. TriAdReview: Triangular Adversarial Review Architecture for Multi-Model Technical Document Generation. https://arxiv.org/pdf/2606.15074 — Generator/Reviewer/Refiner triangle for technical documents generally; synthesis is LLM-based (Refiner), unlike `adverse`'s and this repo's deterministic/human-gated preference; measured against single-pass baseline only.
49. Evaluating Large Language Models for Detecting Architectural Decision Violations. https://arxiv.org/html/2602.07609v1 — 980 ADRs/109 repos, primary LLM + 3 independent validator LLMs; 90%+ accuracy, Fleiss' κ=0.724 on whether code complies with a documented decision (not whether the decision itself was sound); weakest on infrastructure/deployment (42.4% of errors) and abstract principle-driven decisions (26.1%) — exactly the qualitative content design.md's Decisions/Risks sections contain.
50. Using LLMs to Evaluate Architecture Documents: Results from a Digital Marketplace Environment. https://arxiv.org/abs/2601.19693 — single-pass LLM evaluation of real architecture documents vs. software-architect judgment; agreement rose with input document quality; authors caution results are inconsistent and not yet ready to generalize — evidence against trusting a single unsupervised LLM pass on design-doc quality, especially for lower-quality drafts where review matters most.
51. ARCADE: Enhancing Automated Document Analysis Through Adversarial Multi-Agent Validation. https://www.medrxiv.org/content/10.64898/2025.12.21.25342744.full.pdf — critic-style structured critique + iterative refinement outperforms ungrounded RAG-style summarization for complex document evaluation; domain-general (policy/health/legal), not architecture-specific; thin corroboration only, full methodology not independently verified in this search.
52. Supporting architecture evaluation for ATAM scenarios with LLMs. https://arxiv.org/pdf/2506.00150 — LLMs supporting the Architecture Tradeoff Analysis Method (ATAM), the classical human methodology for evaluating whether design decisions support quality attributes and where trade-offs actually lie; includes an LLM "devil's advocate" questioning mechanism; findings are promising-but-preliminary, human validation still required — grounds §9.1's point that design-decision quality (ATAM's question) is a different evaluation target than document traceability (`hrt-adversarial-authoring`'s question).
53. DRAFT-ing Architectural Design Decisions using LLMs. https://arxiv.org/abs/2504.08207 — checked and excluded from load-bearing use: this paper is about *generating* ADRs via fine-tuning/RAG (a 4,911-ADR dataset), not reviewing or critiquing them: no adversarial or critique mechanism present. Listed here only to record it was checked and found off-topic for the review question this section asks.

