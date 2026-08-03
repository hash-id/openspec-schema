# Research: deterministic grounding for `hrt-align-consistency-review` and pre-review self-checks in `hrt-adversarial-authoring`

**Date:** 2026-08-03
**Scope:** two related "weak-oracle" problems in the hash schema's review skills — (1) `skills/hrt-align-consistency-review/SKILL.md`'s 7 cross-artifact consistency dimensions are checked almost entirely by LLM judgment, with only `openspec validate --strict` as a deterministic anchor; (2) `skills/hrt-adversarial-authoring/SKILL.md`'s Structural Auditor catches mechanical/format errors (hashtag counts, missing scenarios, capability-name mismatches) only at the review step, after a full draft — no self-check exists at draft time.
**Status:** research and synthesis complete. No changes made to any skill file yet — findings and recommendations only, pending an adoption decision.
**Sources:** 20 total — §1 covers 10 for the align-review grounding question, §2 covers 10 for the pre-review self-check question.

## Contents

1. [Deterministic pre-checks for `hrt-align-consistency-review`](#1-deterministic-pre-checks-for-hrt-align-consistency-review)
2. [Sources (align grounding, 1–10)](#2-sources-align-grounding-1-10)
3. [Self-check step for `hrt-adversarial-authoring`'s Draft stage](#3-self-check-step-for-hrt-adversarial-authorings-draft-stage)
4. [Sources (predictable-error self-check, 1–10)](#4-sources-predictable-error-self-check-1-10)
5. [Recommendations](#5-recommendations)

---

## 1. Deterministic pre-checks for `hrt-align-consistency-review`

### The problem

`hrt-align-consistency-review/SKILL.md` (ALIGN step 2, lines 16-23) lists 7 cross-artifact consistency dimensions. Exactly one deterministic anchor exists (`openspec validate --strict`, step 1); the other six are pure LLM reasoning — the agent reads artifacts and judges consistency, with no external, checkable signal grounding that judgment. This is the canonical "LLM-judging-LLM without an oracle" setup that self-correction research shows is unreliable.

### What the literature says

The clearest finding (Huang et al., ICLR 2024, §2 source 1) is that *intrinsic* self-correction — a model correcting its own output using only its own internal judgment, no external tool/signal — reliably fails to improve, and sometimes actively degrades, accuracy. The dividing line the literature draws is not "LLM vs. no LLM" but "internal-only feedback vs. externally-grounded feedback": self-correction *does* work when grounded in something outside the model's own head (a compiler, a test suite, a database lookup, a deterministic parse).

Two sources give a concrete taxonomy for splitting claims into checkable-by-tool vs. requires-judgment. The neuro-symbolic verification paper (§2 source 3) proposes four claim classes: **existence** (does X exist — grep/glob-checkable), **reference** (does X correctly point to Y — deterministically checkable), **structural** (format/syntax/logical-coherence — automatable via rules), and **semantic** (meaning, contextual soundness — needs LLM judgment). Anthropic's own eval guidance (§2 source 4, "Demystifying evals for AI agents") states the same split as a first-class design principle: code-based graders own objectively verifiable outcomes; LLM graders are reserved for genuinely subjective dimensions with multiple valid answers — and warns against blending the two into one LLM judgment call.

A counterweight matters equally here: over-mechanizing produces false confidence. The code-review false-positive research (§2 source 9) documents deterministic tools *appearing* comprehensive while missing real issues (~22% of vulnerabilities missed by SAST tools in one study) — because routing an inherently semantic question ("does this design decision actually hold up") through a mechanical proxy check creates certainty where none is warranted. This directly bounds which of the align skill's 7 dimensions should be mechanized and which must not be.

Two further sources complicate the align skill's existing VERIFY step specifically (a second, fresh-context LLM subagent re-checking ALIGN's own findings). Both the self-consistency-as-confidence-signal audit (§2 source 7) and the reliability-without-validity study (§2 source 8) show that agreement between same-family LLM judgments — including a second LLM re-checking a first LLM's work — can reflect shared bias rather than independent verification; one study found raw agreement overstated actual discrimination by 33-41 percentage points across 21 models. This doesn't invalidate VERIFY (it likely still catches carelessness/sampling noise), but it means VERIFY should not be treated as substituting for external grounding on dimensions that could be externally grounded instead.

### Mapping onto the 7 dimensions

Of the align skill's 7 dimensions (`SKILL.md` lines 16-23):

**Convertible to deterministic pre-checks (existence/reference/structural claims):**
- *"proposal → specs: every New/Modified Capability has a spec file"* — pure existence check: parse capability names from proposal.md, glob `specs/<name>/spec.md`.
- *"specs → tasks: every requirement... is covered by at least one task"* — the existence-of-a-link half (a requirement string with zero task mentions) is grep-checkable; the adequacy-of-coverage half stays LLM judgment.
- *"design → tasks: every [Threat] → Mitigation entry has a corresponding negative-test task"* — same split: link-existence is grep-checkable, mitigation-adequacy is not.
- *"spec structure: every requirement has ≥1 scenario, scenarios use exactly four hashtags with WHEN/THEN, requirements use SHALL/MUST"* — this is already fully structural/format validation and should be entirely mechanized, not left to LLM reasoning at all.
- *"design/tasks → codebase: every concrete claim... is checked against the actual codebase"* — the skill already prefers tools (codegraph/codebase-memory-mcp/ripgrep) for this; existence-checking should be required via tool, not merely preferred, with the LLM only interpreting the tool's answer. Whether the artifact's *characterization* of that code is accurate stays semantic.

**Must stay pure LLM judgment (semantic claims):**
- *"discovery → proposal: every Key Decision and Desired Outcome is honoured; proposal never contradicts discovery"* — inherently semantic; a keyword-match proxy here would create exactly the false-confidence trap §2 source 9 warns about.
- *"proposal ↔ design: design stays within proposal scope"* and *"specs ↔ design: design explains how each requirement is met and contradicts none"* — logical/scope soundness, not reducible to a grep pattern.

## 2. Sources (align grounding, 1–10)

1. **"Large Language Models Cannot Self-Correct Reasoning Yet"** — Huang, Chen, Mishra, Zheng et al., Google DeepMind/UIUC, ICLR 2024. [arxiv.org/abs/2310.01798](https://arxiv.org/abs/2310.01798). Intrinsic self-correction (no external feedback) fails to improve, sometimes degrades, reasoning accuracy; only externally-grounded feedback reliably helps. The canonical "weak-oracle" citation.
2. **VeriCoT: Neuro-symbolic Chain-of-Thought Validation via Logical Consistency Checks** — ICLR 2026 poster. [arxiv.org/abs/2511.04662](https://arxiv.org/abs/2511.04662). LLMs cannot reliably verify their own multi-step logic; formalizing steps into first-order logic lets a solver check validity while natural-language premises stay open to human/semantic inspection.
3. **Neuro-Symbolic Verification of LLM Outputs for Data-Sensitive Domains**. [arxiv.org/pdf/2605.26942](https://arxiv.org/pdf/2605.26942). Explicit taxonomy: existence / reference / structural claims are symbolically/deterministically checkable; semantic claims require LLM judgment. Maps near-directly onto the align skill's 7 dimensions.
4. **Anthropic — "Demystifying evals for AI agents"**. [anthropic.com/engineering/demystifying-evals-for-ai-agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents). Code-based graders for objectively verifiable outcomes; LLM graders for genuinely subjective dimensions — evaluated separately, never blended. Warns rigid deterministic specs can wrongly penalize valid variation.
5. **Anthropic — "Building Effective Agents"**. [anthropic.com/engineering/building-effective-agents](https://www.anthropic.com/engineering/building-effective-agents). Recommends programmatic "gates" on intermediate steps in a prompt chain, so errors don't silently propagate downstream; also cautions against adding complexity that doesn't demonstrably improve outcomes.
6. **Braintrust — "What is an LLM-as-a-judge?"**. [braintrust.dev/articles/what-is-llm-as-a-judge](https://www.braintrust.dev/articles/what-is-llm-as-a-judge). Deterministic checks for format/schema/required fields; LLM judges for language-comprehension dimensions; layer both, and keep human spot-checks in the loop for judge drift.
7. **"When LLMs Agree, Are They Right? Auditing Self-Consistency and Cross-Model Agreement as Confidence Signals"**. [arxiv.org/html/2607.08065v1](https://arxiv.org/html/2607.08065v1). Agreement between an LLM's repeated judgments (or between two same-family reviewers) can reflect shared bias, not independent verification — directly qualifies the align skill's VERIFY step.
8. **"Reliability without Validity: A Systematic, Large-Scale Evaluation of LLM-as-a-Judge Models"**. [arxiv.org/abs/2606.19544](https://arxiv.org/abs/2606.19544). High test-retest agreement can mask severe position/self-bias; raw agreement overstated true discrimination by 33-41 points across 21 models.
9. **cubic.dev — "The false positive problem: Why most AI code reviewers fail"**, and **"Rethinking Code Review in the Age of AI"**. [arxiv.org/pdf/2605.17548](https://arxiv.org/pdf/2605.17548). Deterministic tools can look comprehensive while missing real issues (~22% of vulnerabilities missed in one SAST study) — the concrete counterweight against over-mechanizing semantic questions.
10. **OpenAI — "Evaluation best practices" / Graders documentation**. [developers.openai.com/api/docs/guides/evaluation-best-practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices), [.../guides/graders](https://developers.openai.com/api/docs/guides/graders). "Deterministic-first, LLM-fallback" sequencing named as a best practice: exact match/regex/schema/code-execution first, model-graded checks only for what needs language comprehension.

## 3. Self-check step for `hrt-adversarial-authoring`'s Draft stage

### The problem

`hrt-adversarial-authoring/SKILL.md` step 1 (Draft) produces a draft with no self-check; mechanical/structural errors (wrong hashtag count, missing scenario, capability-name mismatch) are caught only at step 2 by the Structural Auditor, in an independent fresh-context subagent — after a full review round-trip. The question: should the drafting agent self-check its own mechanical output before submitting for review, and if so, how narrowly must that self-check be scoped to avoid the known failure modes of self-critique?

### What the literature says

The Vercel v0 precedent (§4 source 1) is a real-world confirmation that this triage is worth doing: v0 splits corrections into a cheap, pattern-matching layer applied during generation (wrong imports, bad icon names — no semantic reasoning required) versus a heavier post-generation pass for anything needing cross-file or AST-level analysis. The split is by *error class*, not by "which pass catches it" — mechanical/pattern-matchable errors are the ones worth catching immediately and cheaply.

The academic literature draws a consistent, load-bearing line between two regimes. Kamoi et al.'s critical survey (§4 source 2) concludes no prior work demonstrates successful self-correction from an LLM's own prompted feedback alone — except when the feedback is externally groundable (a fixed rule, a compiler, a validator) rather than a re-derived judgment. Checking "does this scenario have exactly 4 hashtags" is exactly the fixed-rule regime; checking "is this Decision's rationale sound" is not.

Two sharper, more recent studies quantify why self-checks fail specifically on the model's *own* prior content. The Self-Correction Bench study (§4 source 3) found the same injected error is caught reliably when attributed to an external source but missed at a 64.5% average rate when it's the model's own output in the same context. A follow-up mechanistic study (§4 source 4) found the same byte-identical error is corrected 23-93 percentage points more often when its role-label is changed from "the agent's own prior thought" to "user message" or "tool response" — the failure is a role/template artifact, not a cognitive limit, meaning framing the self-check as "verify against this external list" (not "review what you wrote") measurably helps.

A closely-matching paper (§4 source 5, "Cross-Context Review") tests the exact mechanical-vs-semantic split this repo needs: same-context self-review performs adequately for format/structural/syntax validation, but is substantially outperformed by fresh-context review for semantic/logic validation. (Caveat: single-author, uncited preprint — treat as suggestive, not settled.) The foundational Self-Refine paper (§4 source 6) is consistent with this: its strongest gains cluster in tasks with a mechanical/stylistic feedback surface, not deep reasoning — and later work (§4 sources 2, 7) shows those gains don't generalize to reasoning-heavy tasks. The sharpest warning (§4 source 7, Huang et al. — the same ICLR 2024 paper as §2 source 1) shows intrinsic self-correction on reasoning benchmarks can *decrease* accuracy: models are more likely to "fix" a correct answer into a wrong one than repair an actual error, which is exactly why a self-check must never touch content decisions, only fixed structural rules.

Anthropic's own current prompting guidance (§4 source 9) directly recommends this pattern — "ask Claude to verify against explicit, enumerable test criteria before finishing" — but flags that newer models can over-verify by default, adding latency for redundant checks; the self-check instruction should be lightweight, not a heavyweight ritual. A general finding on instruction-following degradation (§4 source 10) adds a practical constraint: compliance with individual checklist items decays as the number of simultaneous constraints in one prompt grows, especially for items not at the start or end — so the checklist must be short and positioned for recency (end of the drafting instruction), not buried mid-prompt.

### Recommendation

Add a self-check sub-step at the end of the Draft step (`hrt-adversarial-authoring/SKILL.md` step 1), after the draft is produced, before `## Author Notes` is finalized:

> Before finalizing, check the draft against this fixed list (do not re-examine content decisions, only these items): [structural items copied verbatim from the Structural Auditor's own checklist for this artifact — hashtag counts, one spec file per capability, every requirement has a scenario, capability names match the proposal, no dangling placeholder]. Fix violations directly. Do not use this list to second-guess claims, scope, or tradeoffs — that is the reviewers' job.

Framing matters per the sources: instruct the drafting agent to check "against this external list" (not "review what you wrote"), keep the list copied verbatim from the Auditor's existing checklist (no drift between what's self-checked and what's independently re-checked), and keep it short and at the end of the instruction. The Structural Auditor step stays unchanged and still runs in full — the 64.5% same-context blind-spot rate (§4 source 3) means the self-check reduces round-trips but does not substitute for the independent re-check. This should be stated explicitly in the skill text so a future edit doesn't mistake the self-check for sufficient on its own.

## 4. Sources (predictable-error self-check, 1–10)

1. **"How we made v0 an effective coding agent" — Vercel Engineering Blog**. [vercel.com/blog/how-we-made-v0-an-effective-coding-agent](https://vercel.com/blog/how-we-made-v0-an-effective-coding-agent). Splits corrections by error class: streaming pattern-matching for cheap/predictable errors during generation, a heavier fine-tuned pass for cross-file/AST-level errors after.
2. **Kamoi et al., "When Can LLMs Actually Correct Their Own Mistakes? A Critical Survey of Self-Correction of LLMs"** — TACL 2024. [arxiv.org/abs/2406.01297](https://arxiv.org/abs/2406.01297). No prior work shows successful self-correction from prompted self-feedback alone except when grounded in reliable external feedback (compiler, tests, fixed validators).
3. **"Self-Correction Bench: Uncovering and Addressing the Self-Correction Blind Spot in Large Language Models"**. [arxiv.org/abs/2507.02778](https://arxiv.org/abs/2507.02778). Controlled error-injection: the same error is missed at 64.5% average rate when attributed to the model's own prior output vs. reliably caught when attributed externally.
4. **"The Self-Correction Illusion: LLMs Correct Others but Not Themselves"**. [arxiv.org/abs/2606.05976](https://arxiv.org/abs/2606.05976). Same byte-identical error corrected 23-93 points more often when relabeled from "the agent's own thought" to "user"/"tool" — a role/template artifact, not a cognitive deficit.
5. **Tae-Eun Song, "Cross-Context Review: Improving LLM Output Quality by Separating Production and Review Sessions"**. [arxiv.org/abs/2603.12123](https://arxiv.org/abs/2603.12123). Same-context self-review adequate for format/structural checks, substantially weaker than fresh-context review for semantic/logic checks. Single-author preprint, uncorroborated — treat as suggestive.
6. **Madaan et al., "Self-Refine: Iterative Refinement with Self-Feedback"** — NeurIPS 2023. [arxiv.org/abs/2303.17651](https://arxiv.org/abs/2303.17651). Foundational self-feedback loop; strongest gains cluster on mechanical/stylistic tasks, not deep reasoning.
7. **Huang et al., "Large Language Models Cannot Self-Correct Reasoning Yet"** — ICLR 2024. [arxiv.org/abs/2310.01798](https://arxiv.org/abs/2310.01798). (Same paper as §2 source 1.) Intrinsic self-correction on reasoning benchmarks can decrease accuracy — models "fix" correct answers into wrong ones more often than they repair real errors.
8. **Dhuliawala et al., "Chain-of-Verification Reduces Hallucination in Large Language Models"** — Meta AI, 2023. [arxiv.org/abs/2309.11495](https://arxiv.org/abs/2309.11495). Draft → independently-answered verification questions → revise improved F1 23% on list-based QA; verification questions answered in isolation from the original generation's framing is the load-bearing mechanism.
9. **Anthropic — "Prompting best practices"**. [platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices). Recommends self-check against explicit, enumerable test criteria; flags that newer models (Opus 5) can over-verify by default, adding unneeded latency.
10. **Instruction-following degradation under multi-constraint prompts**. [arxiv.org/pdf/2605.30981](https://arxiv.org/pdf/2605.30981); [blog.promptlayer.com/why-llms-get-distracted-and-how-to-write-shorter-prompts](https://blog.promptlayer.com/why-llms-get-distracted-and-how-to-write-shorter-prompts/). Compliance with individual checklist items decays as constraint count grows, especially for items not at the start or end of a prompt — the practical basis for keeping self-check lists short and positioned for recency.

## 5. Recommendations

1. **`hrt-align-consistency-review`**: add deterministic pre-checks (grep/glob/existence checks) for the 4-5 dimensions identified as existence/reference/structural in §1, run before the LLM classifies findings in ALIGN step 4. Keep discovery→proposal and the two scope/soundness dimensions (proposal↔design, specs↔design) as pure LLM judgment — do not attempt to mechanize these; §1's over-mechanization counterweight (source 9) applies directly. Treat VERIFY's remaining scope as narrower once the deterministic layer removes dimensions that no longer need re-checking.
2. **`hrt-adversarial-authoring`**: add a narrowly-scoped, checklist-only self-check at the end of the Draft step, copied verbatim from the Structural Auditor's existing checklist, framed as "check against this external list" rather than "review your work," explicitly stated as a cost-optimization that does not replace the independent Auditor pass.

Both changes are additive risk-reduction, not replacements for the existing review architecture — no source found here supports removing the LLM judgment layer or the independent Auditor pass, only supplementing them with deterministic grounding where the claim type allows it.
