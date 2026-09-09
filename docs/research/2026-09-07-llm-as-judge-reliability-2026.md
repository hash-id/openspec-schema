# Research: LLM-as-judge reliability, bias, and multi-agent aggregation — 2025–2026 state of the art

**Date:** 2026-09-07
**Scope:** Broad literature pass on recent LLM-as-judge research, prompted by newer work than the 2026-08-03 pass ([2026-08-03-judge-bias-collusion-adversarial-authoring.md](2026-08-03-judge-bias-collusion-adversarial-authoring.md)). Focus on: what large-scale 2026 evaluations found about judge validity vs. reproducibility, which biases persist at frontier scale, whether multi-agent/jury aggregation helps or hurts, and the mitigation consensus. Ends with what this implies for this repo's review subagents (`hrt-adversarial-authoring`, `hrt-apply-code-review`, `hrt-align-consistency-review`) and the cheap-model pass ([memory: project_schema_cheap_model_pass], [memory: project_adversarial_4agent_research]).
**Status:** research only. No schema or skill changes made. Findings and repo-implications only, pending an adoption decision.
**Method:** WebSearch + WebFetch against arXiv HTML/PDF and practitioner writeups, Sept 2026. arXiv IDs with a `26xx` prefix are 2026 preprints; some fetched as PDF (full numeric tables not extracted — flagged where it matters).

## Contents

1. [Headline finding: reliability without validity](#1-headline-finding-reliability-without-validity)
2. [Biases that persist at frontier scale](#2-biases-that-persist-at-frontier-scale)
3. [Multi-agent / jury aggregation: not a free win](#3-multi-agent--jury-aggregation-not-a-free-win)
4. [Methodology critique](#4-methodology-critique)
5. [Mitigation consensus 2026](#5-mitigation-consensus-2026)
6. [Sources](#6-sources)
7. [Implications for this repo](#7-implications-for-this-repo)
8. [Corroborating and contrary references](#8-corroborating-and-contrary-references)

---

## 1. Headline finding: reliability without validity

**arXiv 2606.19544 — "Reliability without Validity: A Systematic, Large-Scale Evaluation of LLM-as-a-Judge Models Across Agreement, Consistency, and Bias."** 21 judges, 9 providers, 3 benchmarks (MT-Bench, JudgeBench, RewardBench), ~541,000 judgments. Four results:

1. **Kappa deflation is universal.** Raw exact-match agreement overstates judge quality. On MT-Bench every judge showed a 33.8–41.3 percentage-point gap between exact match and Cohen's κ, because exact match does not correct for chance agreement on balanced label sets. The size of the gap tracks the benchmark, not the judge.
2. **Rankings do not transfer across benchmarks.** Judge rankings shift by up to 14 positions between datasets. Only 2 of 21 judges stayed top-3 across all three. Single-benchmark validation is not a basis for a deployment decision.
3. **Consistency–bias paradox.** Test-retest reliability >0.95 coexists with position bias >0.10. Example cited: Qwen 3 8B — 0.992 reproducibility, 0.192 position bias. The most reproducible judges were among the least valid.
4. **Verbosity bias is now small** (<0.011 across all 21 judges), down sharply from 2023-era reports of 20–40% swing — but only under their specific pairwise rubric.

**Minimum Viable Validation Protocol** the paper proposes before deploying a judge:
- Headline metric = Cohen's κ or Krippendorff's α, never raw exact match.
- Audit position bias with paired AB+BA runs; flag if |P(A wins) − 0.5| > 0.10.
- ≥3 independent replicates at temperature 0, response caching disabled.
- Cross-validate on ≥2 datasets spanning preference-style and correctness-style labels.
- When test-retest > 0.95, explicitly confirm position bias < 0.10 (catch the paradox).
- Frontier models (Claude Opus, Gemini Pro class) showed more stable cross-benchmark behaviour and lower position bias.

## 2. Biases that persist at frontier scale

- **Position bias** — still severe, including in two production-deployed judges in 2606.19544. The single most robust finding across the literature.
- **Authority / citation bias** — judges favour answers containing citations even when the citations are fabricated (Adaline writeup; consistent with arXiv 2604.16790 "Bias in the Loop" from the prior pass).
- **Format / authoritative-tone bias** — well-formatted, confident-sounding output scores higher independent of content.
- **Self-preference bias** — judges favour their own model family's output (established: arXiv 2410.21819, 2604.22891 from the prior pass; still current).
- **Fragility to surface perturbation** — the Judge Reliability Harness (arXiv 2603.05399) evaluated 4 judges on safety/persuasion/misuse/agentic benchmarks; consistency broke on formatting changes, paraphrasing, and verbosity shifts alone. Practitioner reporting claims frontier models exceed 50% error rates on advanced bias stress tests.

Net: verbosity bias has largely been engineered out under good rubrics; position, authority, format, and self-preference biases have not.

## 3. Multi-agent / jury aggregation: not a free win

**arXiv 2505.19477 — "Judging with Many Minds: Do More Perspectives Mean Less Prejudice? On Bias Amplification and Resistance in Multi-Agent Based LLM-as-Judge."** Multi-agent judging can *amplify* bias rather than cancel it. (PDF fetched; per-condition numeric tables not extracted — verify specific deltas against the paper before external citation.)

| Helps | Hurts |
|---|---|
| Structured debate format | Simple voting/averaging over similar models |
| Diverse model architectures | Unconstrained discussion → consensus pressure |
| Explicit bias-awareness prompting | Homogeneous agent population |
| Disagreement-based aggregation | Majority rule without a diversity mechanism |

- Role diversity is the active ingredient — if every agent shares a persona, the benefit collapses. Distinct roles (factual accuracy / style / user relevance) mirror a mixed human committee.
- **Correlated-error trap:** contemporary LLMs share pretraining corpora, so their errors correlate; majority vote then systematically suppresses a correct minority (arXiv 2606.29270 "Minority Sentinel"; consistent with the prior pass's 2605.00914 and 2604.18005).
- Upside when combined well: practitioner reports of +10–16% correlation with human judgment over single-agent prompting, and 8–15% reliability gains from Meta-Judge / JudgeBench-style pipelines (Arize; not independently verified against a primary source).

This reinforces the prior pass's conclusion: same-model panels with unguided aggregation are a known failure mode; the levers that work are context separation, role/model diversity, calibrated-confidence communication, and disagreement-preserving aggregation.

## 4. Methodology critique

**arXiv 2512.16041 — "Are We on the Right Way to Assessing LLM-as-a-Judge?"** (PDF fetched; summary-level extraction). Argues current assessment is insufficient:
- Existing benchmarks do not capture real judging complexity.
- Inter-annotator disagreement is used as a performance ceiling while the human baseline itself is unstable and under-documented.
- Single-metric evaluation misses judicial reasoning quality and edge-case handling.
- Recommends: multi-metric assessment (accuracy + consistency + robustness), pre-deployment bias documentation, cross-domain validation, and grounding against multiple human-annotator baselines rather than one.

## 5. Mitigation consensus 2026

Converging across FutureAGI, Openlayer, and Adnan Masood's rubric writeup (practitioner sources — treat as directional, not primary):

- **Position:** run both orderings and average; or score each output independently against the rubric and derive A-vs-B from scores. Randomize slot assignment; aggregate over many comparisons.
- **Verbosity:** length-normalization or an explicit length-penalty clause in the rubric.
- **Self-preference:** use a judge from a different model family than the candidate.
- **Chain-of-thought:** raises human agreement 10–20%. Treated as mandatory.
- **Rubric design:** explicit, criterion-separated, calibrated. Re-calibrate against humans on a fixed cadence (monthly cited).
- **Statistical correction:** calibration-based bias correction with confidence intervals that account for imperfect judge sensitivity/specificity; item response theory applied to the judges themselves.
- **Anthropic guidance (2026):** pair deterministic unit tests for correctness with an LLM rubric only for open-ended quality. Do not use a rubric for anything mechanically checkable.

## 6. Sources

Primary (arXiv):
1. **2606.19544** — "Reliability without Validity: A Systematic, Large-Scale Evaluation of LLM-as-a-Judge Models Across Agreement, Consistency, and Bias." HTML fetched. §1, §2.
2. **2512.16041** — "Are We on the Right Way to Assessing LLM-as-a-Judge?" PDF fetched, summary-level only. §4.
3. **2603.05399** — "Judge Reliability Harness: Stress Testing the Reliability of LLM Judges." Search-snippet + title only; not fetched in full. §2.
4. **2505.19477** — "Judging with Many Minds: Do More Perspectives Mean Less Prejudice? ..." PDF fetched; numeric tables not extracted. §3.
5. **2606.29270** — "Minority Sentinel: When to Overturn Majority Voting in Multi-Agent LLM Debates." Search-snippet only. §3.
6. **2411.16594** — "From Generation to Judgment: Opportunities and Challenges of LLM-as-a-judge" (survey). Reference.
7. **2608.29168** — "JudgePanel: A Compact Judge with Panel Deliberation via Adaptive Multi-Reward Reinforcement Learning." Not fetched; noted for follow-up.

Secondary (practitioner — directional only, not primary-verified):
8. Adaline — "LLM-as-a-Judge: Why Frontier Models Fail 50%+ Bias Tests." https://www.adaline.ai/blog/llm-as-a-judge-reliability-bias
9. Arize — "LLM-as-a-Jury: What It Is and How To Implement." https://arize.com/llm-as-a-jury/
10. FutureAGI — "LLM-as-Judge Best Practices in 2026: Calibration, Bias, and Cost." https://futureagi.com/blog/llm-as-judge-best-practices-2026/
11. Openlayer — "LLM-as-judge: A complete guide to evaluation best practices in March 2026." https://www.openlayer.com/blog/llm-as-judge-evaluation-guide
12. Adnan Masood — "Rubric-Based Evaluations & LLM-as-a-Judge." https://medium.com/@adnanmasood/rubric-based-evals-llm-as-a-judge-methodologies-and-empirical-validation-in-domain-context-71936b989e80
13. Survey repo — https://github.com/CSHaitao/Awesome-LLMs-as-Judges

Verification debt: sources 3, 5, 7 not fetched in full; source 4's per-condition deltas not extracted; all secondary sources carry unverified magnitude claims (8–15% / 10–16% gains). Re-fetch primaries before citing any specific number externally — same rule as the 2026-08-03 pass's source 6.

## 7. Implications for this repo

1. **The cheap-model pass sits exactly on the consistency–bias paradox.** A small judge model can be highly reproducible (temp 0, deterministic) yet carry large position/format bias. If a benchmark harness gets built for the cheap pass ([memory: project_schema_cheap_model_pass]), the headline metric must be chance-corrected agreement (Cohen's κ) against a gold set, plus an explicit position/format-perturbation test — not exact-match agreement rate, which will look fine and mean little.

2. **`hrt-artifact-lint` is the right architectural move, confirmed.** The Anthropic guidance — deterministic checks for anything mechanically verifiable, LLM rubric only for open-ended quality — is exactly the lint-vs-subagent split already in place. Any pressure to move judgement calls into the lint, or lint-style checks into the subagents, cuts against the evidence.

3. **Adversarial authoring's multi-role design is evidence-aligned but the aggregation step is the weak point.** Distinct roles (Destructive Critic / Structural Auditor) match the "role diversity is the active ingredient" finding. But same model family → correlated errors → the synthesizer/auto-fix step can launder a shared blind spot into a confident change. This is the same weak point flagged in [memory: project_adversarial_4agent_research] and the 2026-08-03 pass. Options worth weighing: (a) disagreement-preserving output (surface both reviewers' findings unmerged, as the skill already partly does), (b) a different model family for one role, (c) never auto-applying a synthesized fix without a human gate.

4. **Add a position/order-sensitivity note to any pairwise judgement in the schema.** `align`'s `specs <-> seams` and similar dimensions that compare two artifacts should score each side against the rubric independently, then derive the comparison — not judge "does A match B" in one pass, which inherits position bias.

5. **CoT is already implicit in the instruction style; keep it explicit.** Instructions that ask the subagent to reason before verdict are worth 10–20% agreement per the consensus. Don't compress that out for token savings in the cheap pass — but see §8 for the faithfulness caveat.

## 8. Corroborating and contrary references

Cross-check of the §1–§5 claims against other credible sources. `26xx` = 2026 preprint.

### 8.1 "LLM judges align well with humans" — the pro case §1 downplays

- **arXiv 2306.05685 — "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena"** (Zheng et al., NeurIPS 2023). The founding result: GPT-4 reaches >80% agreement with human evaluators, matching the 81% human–human agreement level. When humans disagreed with GPT-4, 75% still found its reasoning convincing and 34% changed their choice. **Supports** judge usefulness; **tension with** 2606.19544's κ-deflation point — 80% raw agreement on a balanced set is a much weaker κ. Both can be true: judges are useful *and* raw agreement oversells them.
- **arXiv 2404.18796 — "Replacing Judges with Juries: Evaluating LLM Generations with a Panel of Diverse Models" (PoLL).** A panel of 3 smaller models (Command-R, GPT-3.5-turbo, Haiku) with max-vote / average-pool beats a single GPT-4 judge on Cohen's κ with human experts across MT, code-gen, essay scoring, QA, summarization — at >7x lower cost, with lower intra-model bias. **Directly contradicts** §3's "multi-agent is not a free win" as a blanket claim: diverse-model panels with simple aggregation *do* help. The nuance: PoLL's models span families (low error correlation); §3's failure cases are same-family panels.

### 8.2 "Multi-agent amplifies bias" — corroboration and the boundary

- **Amazon Science — "When LLM judges agree, should we believe them?"** Judges sharing training lineage produce correlated errors; naive vote-counting overstates evidence strength. A dependence-aware aggregation model beat weighted-majority-vote by 9–14% accuracy on 10-judge panels (relevance 0.912 vs 0.820; toxicity 0.792 vs 0.694; summarization 0.806 vs 0.737). **Strongly supports** §3's correlated-error trap and the memory note that the synthesizer step is the weak link. Practical lever: discount correlated votes, report correlation-adjusted confidence.
- Net of 8.1 + 8.2: panels help **when members are genuinely diverse (different families) and aggregation accounts for correlation**; they hurt when members are same-family and votes are counted naively. This sharpens §3 rather than overturning it.

### 8.3 CoT for judges — mixed, with a faithfulness problem

- **Pro:** Arize's evidence-based prompting work and arXiv 2604.23178 (below) both find requiring explanations reduces variance across repeated judgments and raises human agreement.
- **Con / caveat — arXiv 2601.14691 "Gaming the Judge: Unfaithful Chain of Thought Can Undermine Agent Evaluation."** LLM judges accept a candidate's CoT assertions ("successfully selected the correct date") without checking them against the action trace, even when the actions contradict the claim. The judge trusts the narrative over the evidence.
- **Con — arXiv 2605.11746 "When Reasoning Traces Become Performative."** Step-level evidence that CoT is an imperfect oversight channel; text-only judges reach high inter-judge consistency yet systematically disagree with activation-based labels.
- Implication for the repo: CoT in review instructions helps the *reviewer's* consistency, but a review subagent judging an authored artifact's own stated rationale should verify claims against the artifact/code, not accept the rationale prose. Already partly handled by `hrt-artifact-lint`'s deterministic checks and align's `specs <-> seams` grounding.

### 8.4 Bias-mitigation strategies — systematic test

- **arXiv 2604.23178 — "Judging the Judges: A Systematic Evaluation of Bias Mitigation Strategies in LLM-as-a-Judge Pipelines."** Works: CoT prompting (consistency), **reference-based / rubric-anchored evaluation** (cuts position and length bias vs. bare pairwise). Limited/inconsistent: simple prompt-instruction tweaks ("ignore length"), in-context demos. Conclusion: no single strategy eliminates bias; combine, and validate on your own task. **Supports** §5's rubric emphasis and the deterministic-first split.

### 8.5 Judges on hard reasoning / correctness — the strongest con

- **arXiv 2410.12784 — "JudgeBench" (ICLR 2025).** On response pairs where one is objectively correct and one objectively wrong, across multi-step math/logic/knowledge, LLM judges perform far worse than their MT-Bench numbers suggest — frequently validating flawed reasoning. **Supports** 2606.19544's finding that JudgeBench has a 60pp κ spread (it discriminates judge quality precisely because it's hard). Message: raw agreement on chat-style preference data does not predict judge accuracy on correctness-style tasks — exactly the tasks a spec/code review is.
- **arXiv 2604.27727 — "LLM-as-a-Judge for Human-AI Co-Creation: A Reliability-Aware Evaluation Framework for Coding."** Large proprietary models (GPT-4-turbo class) are consistently the most reliable code judges; smaller/open models often misclassify incorrect code as correct and misrank. **Supports** the cheap-model-pass caution in §7.1 — a small judge is where "passes broken code" shows up.
- **arXiv 2604.16790 — "Bias in the Loop: Auditing LLM-as-a-Judge for Software Engineering"** (also cited in the 2026-08-03 pass). Judges shift verdicts on stated authorship, declared peer consensus, verbosity, emotional tone. Repeated eval of the same case disagrees; small prompt edits swing outcomes.

### 8.6 Verbosity bias — is it really gone?

- **Contrary detail within 2606.19544 itself:** the <0.011 aggregate hides heterogeneity — Llama 3.3-70B +0.44, Gemini 2.5 Pro +0.40, Gemini 2.5 Flash +0.24 on length-expansion pairs, while GPT-4o (-0.04) and Claude Sonnet 4 (-0.12, mild conciseness preference) are near-neutral or reversed. The paper explicitly says not to generalize past its single rubric and fixed length-differential.
- Takeaway: "verbosity bias solved" holds only for frontier Anthropic/OpenAI judges under a tight rubric. A Gemini-family or open-model cheap judge still has it.

### 8.7 Net assessment

| §1–§5 claim | Verdict after cross-check |
|---|---|
| Exact-match overstates judge quality (κ deflation) | **Corroborated** (2306.05685's own 80% is a weak κ; JudgeBench spread) |
| Position bias persists at frontier scale | **Corroborated** (2604.23178, 2604.16790) |
| Rankings don't transfer across benchmarks | **Corroborated** (JudgeBench vs MT-Bench gap) |
| Multi-agent amplifies bias | **Partly contradicted** — true for same-family + naive vote; false for diverse-family panels (PoLL) with correlation-aware aggregation (Amazon) |
| CoT worth 10–20% agreement | **Mixed** — helps reviewer consistency; judges over-trust *candidate* CoT (2601.14691, 2605.11746) |
| Verbosity bias now small | **Corroborated only for frontier Anthropic/OpenAI**; Gemini/open models still biased |
| Rubric-anchored / deterministic-first | **Strongly corroborated** (2604.23178, 2604.27727) |

### 8.8 Additional sources

14. **2306.05685** — "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena." Search-snippet; well-known result. §8.1.
15. **2404.18796** — "Replacing Judges with Juries (PoLL)." Search-snippet. §8.1.
16. Amazon Science — "When LLM judges agree, should we believe them?" Fetched. https://www.amazon.science/blog/when-llm-judges-agree-should-we-believe-them §8.2.
17. **2601.14691** — "Gaming the Judge: Unfaithful Chain of Thought Can Undermine Agent Evaluation." Search-snippet. §8.3.
18. **2605.11746** — "When Reasoning Traces Become Performative." Search-snippet. §8.3.
19. **2604.23178** — "Judging the Judges: A Systematic Evaluation of Bias Mitigation Strategies in LLM-as-a-Judge Pipelines." PDF fetched, summary-level. §8.4.
20. **2410.12784** — "JudgeBench: A Benchmark for Evaluating LLM-based Judges" (ICLR 2025). PDF fetched, summary-level. §8.5.
21. **2604.27727** — "LLM-as-a-Judge for Human-AI Co-Creation: A Reliability-Aware Evaluation Framework for Coding." Search-snippet. §8.5.
22. **2603.29403** — "Security in LLM-as-a-Judge: A Comprehensive SoK." Not fetched; noted for a future prompt-injection-of-judge follow-up.
23. Arize — "Evidence-Based Prompting Strategies for LLM-as-a-Judge: Explanations and Chain-of-Thought." https://arize.com/blog/evidence-based-prompting-strategies-for-llm-as-a-judge-explanations-and-chain-of-thought/ §8.3.

Verification debt (additive to §6): sources 14, 15, 17, 18, 21 are search-snippet only; 19, 20 are PDF summary-level (numeric tables not extracted). Re-fetch before external citation.
