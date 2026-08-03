# Summary: What to Adopt from .NET/Alibaba/hrt-apply-code-review Comparison

Consolidates three research passes into one decision-ready document (the three intermediate pass reports were superseded and removed once this summary absorbed their conclusions):
1. Original research — 6 findings, ~40 sources
2. Follow-up — closed several verification gaps, ~25-30 new sources
3. Gap closure — targeted the two hardest-remaining gaps (Finding 1 and 3's core value questions)

Origin: comparing this repo's `skills/hrt-apply-code-review/SKILL.md` against Microsoft's `code-testing-generator` agent (.NET skills repo) and Alibaba's `open-code-review`, looking for adoptable patterns.

Across three passes, zero verdicts reversed direction. What moved was evidence quality — some findings went from "plausible" to "verbatim-confirmed," others stayed genuinely unsettled despite dedicated searching. That itself is a finding: this repo's design already independently converged on several patterns the wider literature validates, and a couple of ideas are architecturally clean but empirically unprovable with what's public today.

---

## Final status, all 6 findings

| # | Finding | Confidence | Verdict | Action |
|---|---|---|---|---|
| 2 | Mutation/vacuous-test gate | **High — fully confirmed** | Established, decades-old "equivalent mutant problem" restated; Meta production numbers | **Adopt** |
| 5 | Deterministic/LLM hybrid split | **High** | Established; confirms existing design; precision-vs-recall sub-question stays open | **Adopt (confirms), decide sub-question deliberately** |
| 1 | Strategy tiering (3-tier) | **Medium** | General principle established; exact 3-tier taxonomy is single-source; dynamic decomposition is a real competing pattern | **Adopt lighter version, not the .NET taxonomy wholesale** |
| 4 | VCS/workspace boundary rule | **Medium** (was Medium-Low) | Real in code-mutation contexts; thin outside it; mechanism doesn't match this repo's failure mode | **No action** |
| 6 | Positioning/reflection module | **Medium** (was Medium-Low) | Real, narrow, code/RAG-citation-specific; generalizable part already covered by existing skills | **No action** |
| 3 | Ephemeral scratch files | **Medium** | .NET's use of it is now verbatim-confirmed; whether it *helps* is unevidenced anywhere, in three passes | **Optional, low-risk note only — not backed by measurement** |

---

## Adopt: Finding 2 — formalize the mutation-style gate

**Evidence:** Meta's ACH system (arXiv 2501.12862, FSE 2025 Industry, production-scale on 10,795 Android Kotlin classes) — LLM-based equivalent-mutant detection at 0.79/0.47 precision/recall raw, 0.95/0.96 with pre-processing. The .NET agent.md (verbatim-confirmed on re-fetch) runs this as a **mandatory pre-completion gate** for any non-trivial test addition (≥5 tests or specific behaviors described), using its own `test-gap-analysis` skill:

> "A test that passes vacuously — that would still pass if the function body were emptied or returned a default — is a bug, not a test."

This already exists conceptually in [`hrt-apply-code-review/SKILL.md`](../../skills/hrt-apply-code-review/SKILL.md) as one smell-baseline item among many:

> "Weak/tautological oracle: an assertion that recomputes the implementation's own logic, mirrors current behavior without an independent expected value, or would still pass if the THEN criteria were violated -> rewrite against an independent source of truth."

**Gap between current state and evidence:** right now it's one MEDIUM-severity judgement call in a list of ~12 code-smell items (step 2 of the review). The evidence supports treating it as its own explicit, mandatory check — not because the smell-baseline framing is wrong, but because the literature (Meta's production deployment, arXiv 2410.21136's oracle-fidelity study, TOGLL's 3.8x-more-correct-oracles result) treats vacuous/tautological oracles as a distinct, well-studied failure class deserving a dedicated pass, not a single line-item among Feature Envy and Message Chains.

**Recommended change:** in `hrt-apply-code-review/SKILL.md` step 2, pull the weak-oracle check out of the general smell list into its own explicit sub-step — for every test the contract map credits as covering a scenario, ask "would this test still pass if the implementation under test were replaced with a stub / empty body / default return?" This mirrors the .NET pattern's mutation-style reasoning without requiring new tooling (no `test-gap-analysis`-equivalent skill needed — it's a reasoning check the fresh-session reviewer already does, just not as its own named step).

**Caveat to carry into any schema change:** Meta's own raw numbers (0.79/0.47) show real false-negative risk before pre-processing — don't oversell this as catching everything. Also, arXiv 2607.22880 (a replicability study) questions whether mutation/coverage scores actually correlate with real test effectiveness — cite the practice, not "mutation testing = ground truth."

---

## Adopt (with a decision, not just confirmation): Finding 5 — deterministic/LLM split + precision-vs-recall

**What's confirmed:** the deterministic-layer/LLM-layer split (Alibaba's file-selection/rule-matching/positioning done algorithmically, LLM for judgement only) is well-evidenced — arXiv 2510.10290's ablation shows removing structured/deterministic context degrades recall proxies more than latency improves; Uber's uReview (65% same-changeset address rate vs. 51% human, 1,500 dev-hours/week saved) runs a comparable staged-filtering design; QASecClaw shows the same deterministic-tool-plus-LLM-refinement pattern cutting false positives 88.6% in SAST. This **confirms** `hrt-apply-code-review`'s existing design (failing test/lint = automatic HIGH regardless of subagent judgement) is well-founded — no schema change needed here, just validation.

**What's genuinely unresolved, now well-characterized instead of just flagged:** precision-vs-recall as the optimization target. Three passes converged on:
- **Precision-favoring** is the dominant production choice when the tool is developer-facing and trust/adoption is the scarce resource — OpenAI's alignment team explicitly ran a Pareto sweep and chose precision (*"we optimize for signal-to-noise first"*), Uber and CodeAnt's benchmark data lean the same way, and alert-fatigue literature backs it (up to 40% of AI review alerts reportedly ignored).
- **Recall-favoring** is defensible specifically when a human is a reliable final filter and a missed detection is costlier than reviewing a false one — CHI 2023's matched-F1 zealous/restrained study (adjacent domain, video annotation) found recall-favoring AI produced faster completion and higher recall for human-AI teams, with restrained-AI-trained annotators showing *negative transfer* once assistance was removed.
- Addy Osmani's practitioner analysis found **93.4% of flagged issues across 4 tools were caught by only one tool** — meaning precision- and recall-favoring tools are catching different things, not the same things at different confidence thresholds. The honest conclusion: **this isn't a question with a universal right answer; it's a cost-ratio decision** (cost of a missed issue vs. cost of a false alarm, for your specific context).

**Decision framework, applied to this repo specifically** (from the gap-closure pass): openspec-schema is a prompt-engineering schema repo, not a live production codebase. A missed issue here (an instruction ambiguity, a broken `requires` edge) is typically caught downstream — `openspec validate --strict` in a consuming repo, or the instruction failing visibly when an agent runs it — not shipped silently. Low change volume, small maintainer set, human always reviews DECISION-tagged findings before they land. That combination (reliable downstream/human filter + low volume + non-catastrophic miss cost) sits closer to **precision-neutral-to-precision-favoring** than the recall-first regime that would justify inflating HIGH/MEDIUM thresholds to catch more at the cost of noise.

**Recommended action:** no schema change required — `hrt-apply-code-review`'s existing HIGH/MEDIUM/LOW thresholds and hard test/lint gate already sit in a reasonable place given this repo's risk profile. If thresholds are ever retuned, retune with this framework in hand rather than by instinct.

---

## Adopt, lighter-weight: Finding 1 — strategy tiering by scope

**What's established:** scaling process to task size is ubiquitous — Cursor ("not every task needs a detailed plan... jumping straight to the agent is fine" vs. Plan Mode), Redis (model-tiering as "standard operational discipline"), multiple arXiv papers (Code2UML's two-tier SINGLE/DEEP routing, AgriAgent's System-1/System-2 split) all converge on *some* form of scope-based strategy selection.

**What's NOT established:** the specific .NET Direct/Single-pass/Iterative 3-way taxonomy. After three passes, it remains essentially a single-source pattern. More importantly, the follow-up pass found a real competing alternative in production: **Devin/Cognition doesn't use fixed tiers at all** — it uses dynamic decomposition, triggered by an informal signal ("when one agent tries to handle too many things in a single session, context accumulates, focus degrades"), coordinating sub-agents rather than selecting from N discrete modes upfront. A separate architecture-comparison study (arXiv 2604.03515) found heavier orchestration tiers yield only +2.4–5.5pp success-rate gain for real token-cost increases — evidence of diminishing returns from more tiers, not evidence for any specific tier count.

**Recommended change:** this repo's schema already always runs the full multi-phase pipeline regardless of change size — a genuine gap worth addressing, but import the *principle* (don't force a one-line typo fix through the same process as a multi-file feature), not the .NET *taxonomy*. Given the evidence leans toward "2-tier or dynamic beats fixed-3-tier" rather than validating 3 discrete tiers, prefer a lightweight 2-tier split (e.g., in `discovery` or `apply`: a trivial/mechanical path that skips the fresh-subagent review loop entirely vs. the full pipeline for everything else) over importing Direct/Single-pass/Iterative wholesale. This is a real schema change worth scoping as its own follow-up — not done in this research pass.

---

## No action: Finding 4 — VCS/workspace boundary rule

**Where it stands:** real and well-documented for coding agents specifically — ClayBuddy (arXiv 2606.19380) catalogs "NEVER COMMIT DIRECTLY TO main" / "NEVER AUTO-COMMIT" as observed patterns; the .NET agent.md (verbatim-confirmed) states *"Treat the workspace as delivered... Never run `git checkout`, `git restore`, `git reset`, `git clean`, `git stash`, `git rm`... never 'repair', revert, regenerate, or reconstruct source that looks deleted, gutted, synthetic, or incomplete."*

**Why it still doesn't transfer here, even after finding one non-code example:** the follow-up pass found Notion's whole-document-rewrite problem (editing one paragraph on an 847-block page triggers a full-page rewrite because the API lacks block-level granularity) — a real non-code example, but a **different failure mechanism**. Notion's problem is a *tooling-granularity limitation* forcing coarse rewrites regardless of agent intent. The .NET rule addresses *agent discipline* — a model choosing to "repair" or regenerate content it decides looks wrong, despite having surgical tools available. This repo's `apply` phase edits files via normal file-write tools with the model choosing what to touch — an agent-discipline situation, not a tooling-granularity one — and that discipline concern is already subsumed by `hrt-apply-code-review`'s existing DECISION-vs-MECHANICAL tagging (any deviation from spec-documented behavior gets surfaced to the user, not silently applied). No net-new gap.

---

## No action: Finding 6 — positioning/reflection module

**Where it stands:** the narrow pattern (an independent, separate step verifying that a generated position claim is actually grounded) does exist somewhere — arXiv 2512.12117 documents a mechanical interval-arithmetic citation-range check with a **100% prevention rate** for hallucinated/out-of-range line citations, across 1,080 verified responses. This is the closest match found across three passes. But it's explicitly scoped to Python code repositories and RAG-citation contexts — the paper doesn't claim to generalize beyond that, and direct checks of CodeRabbit's public engineering docs found a general verification-agent step but no documented *dedicated* positioning-check distinct from general accuracy checking. Qodo, Greptile, and Bito show no public evidence of one either.

**Why it doesn't surface a gap here:** this repo has no diff/line-anchored comments to verify positions of. The broader principle this generalizes into — "verify a generated claim is actually grounded in its stated source before finalizing" — does apply to spec-authoring (e.g., does a claim in design.md actually trace back to something in proposal.md), but that need is already served by `hrt-apply-code-review`'s contract-mapping step and `hrt-align-consistency-review`'s cross-referencing design. Confirms existing design does the generalizable part; no new mechanism needed.

---

## Optional, low-confidence only: Finding 3 — ephemeral scratch files

**What's confirmed:** the .NET agent uses this exactly as originally described — verbatim-confirmed on re-fetch: *"All state is stored in `.testagent/` folder"*, deleted or gitignored after pipeline completion. This is a real, working pattern in production.

**What's never been shown, across three dedicated passes, including one narrowly targeted at exactly this question:** that ephemeral non-committed scratch files measurably help a single long task versus writing directly into a persistent artifact. Every source found (nikiforovall.blog, a second DEV Community post, general agent-memory posts) argues from architecture and plausibility — context-window pressure, repo cleanliness, developer trust — never from measurement. Anthropic's own context-management benchmarks (39% combined improvement, 29% from context editing alone, 84% token reduction) looked like the closest thing to real evidence, but on direct inspection they measure "state moved outside the active context window" vs. "everything in context" — a different variable than "ephemeral scratch" vs. "persistent artifact." A counter-finding (arXiv 2603.24631, "Coherence Collapse") found 60-69% of long-task agent failures are edit-quality collapse with a length-independent sub-type dissociated from context-window degradation — undercutting the causal story that motivates scratch files in the first place.

**Conclusion:** this is a genuine, standing gap in the public literature, not a search-effort shortfall — the gap-closure pass concluded further searching along the same axes is unlikely to find what doesn't appear to exist. openspec's `proposal.md`/`design.md`/`tasks.md` already serve macro-resumability (surviving a session end) — nothing here challenges that. The one narrow, honestly-uncertain case worth naming: a long research sub-loop *within* a single phase (e.g., gathering many small facts before writing a design.md section) might benefit from a lightweight, non-committed working file to avoid polluting the durable artifact with half-formed notes — but if adopted, describe it as "consistent with general context-engineering practice," not as empirically shown to outperform the current approach. Not worth a schema change on this evidence.

---

## Bottom line

Two concrete actions worth scoping as real changes:

1. **`hrt-apply-code-review/SKILL.md`** — promote the weak/tautological-oracle check from one smell-baseline item to its own explicit mandatory sub-step in the contract-mapping pass (Finding 2, high confidence).
2. **Schema-wide** (`discovery`/`apply` or wherever full-pipeline overhead is heaviest) — add a lightweight 2-tier scope split (trivial/mechanical vs. full pipeline), not a 3-tier import (Finding 1, medium confidence, scope as separate follow-up).

Everything else (Findings 3, 4, 6) is either already covered by existing design or unsupported by evidence strong enough to justify a change. Finding 5 needed no schema change, just confirmation the existing gate design is sound plus an explicit decision (precision-neutral) for future threshold-tuning conversations.

---

## Appendix: full source list (all three passes)

Reconstructed after the three intermediate pass files were deleted; grouped by finding, deduplicated. Credibility notes preserved from the original passes.

### Finding 1 — Strategy tiering

- [.NET code-testing-generator agent.md](https://github.com/dotnet/skills/blob/main/plugins/dotnet-test/agents/code-testing-generator.agent.md) — primary source, verbatim-confirmed on re-fetch. High credibility.
- [Cursor: Best practices for coding with agents](https://cursor.com/blog/agent-best-practices) — "not every task needs a detailed plan" vs. Plan Mode; cites a University of Chicago study. High credibility (vendor blog, self-serving framing).
- [Redis: AI agent pipelines — what they are & how they work](https://redis.io/blog/ai-agent-pipeline/) — model-tiering as "standard operational discipline." Medium credibility.
- [Code2UML: Agentic LLMs with context engineering for scalable software visualization (arXiv 2605.24453)](https://arxiv.org/pdf/2605.24453) — two-tier SINGLE/DEEP routing by diagram complexity. Medium credibility (narrow domain).
- [AgriAgent (arXiv 2601.08308)](https://arxiv.org/pdf/2601.08308) — System 1/System 2 dual-pathway selection. Medium credibility (agriculture domain).
- [Cursor: Working with Agents docs](https://cursor.com/docs/cookbook/agent-workflows) — background vs. interactive mode as de facto 2-tier split. High credibility (primary docs).
- [How Coding Agents Fail Their Users (arXiv 2605.29442)](https://arxiv.org/pdf/2605.29442) — ~79% of failures trace to specification/coordination problems, not model capability; counter-evidence for tiering-as-specification-decision risk.
- [Beyond Resolution Rates: Behavioral Drivers of Coding Agent Success and Failure (arXiv 2604.02547)](https://arxiv.org/pdf/2604.02547) — "self-initiated overreach" as a mechanism for tier misclassification.
- [Devin: Devin can now Manage Devins](https://cognition.ai/blog/devin-can-now-manage-devins) and [2025 Performance Review](https://cognition.ai/blog/devin-annual-performance-review-2025) — dynamic decomposition (coordinator/worker), not fixed tiers. High credibility (primary vendor source).
- [Aider chat modes docs](https://aider.chat/docs/usage/modes.html) — architect/editor role-split, orthogonal axis to scope-tiering.
- [SWE-agent NeurIPS 2024 paper](https://proceedings.neurips.cc/paper_files/paper/2024/file/5a7c947568c1b1328ccc5230172e1e7c-Paper-Conference.pdf) — ACI design is the variation axis, not task-scope tiering.
- [Inside the Scaffold: A Source-Code Taxonomy of Coding Agent Architectures (arXiv 2604.03515)](https://arxiv.org/html/2604.03515) — heavier orchestration yields only +2.4–5.5pp success-rate gain for real token-cost increase; diminishing-returns evidence.
- [ADEPTS capability framework (arXiv 2507.15885)](https://arxiv.org/pdf/2507.15885) — 5-tier task-complexity taxonomy, but an evaluation framework, not an execution-strategy framework; noted as a category distinction, not supporting evidence.

### Finding 2 — Mutation/vacuous-test gate

- [Mutation-Guided LLM-based Test Generation at Meta (arXiv 2501.12862, FSE 2025 Industry)](https://arxiv.org/pdf/2501.12862) — ACH system, 0.79/0.47 → 0.95/0.96 precision/recall, production-scale (10,795 Android Kotlin classes). Very high credibility; strongest single number across all findings.
- [Engineering at Meta: LLMs Are the Key to Mutation Testing and Better Compliance](https://engineering.fb.com/2025/09/30/security/llms-are-the-key-to-mutation-testing-and-better-compliance/) — companion engineering blog. High credibility.
- [MuTAP (arXiv 2312.15223)](https://arxiv.org/pdf/2312.15223) — iterative mutant-killing refinement loop, alternative design to a one-shot gate. Medium credibility.
- [Do LLMs generate test oracles that capture the actual or the expected program behaviour? (arXiv 2410.21136)](https://arxiv.org/pdf/2410.21136) — directly on-topic for the vacuous/tautological-oracle distinction. High credibility.
- [TOGLL (arXiv 2405.03786)](https://arxiv.org/abs/2405.03786) — 3.8x more correct oracles, 1,023 unique mutants caught that EvoSuite missed. High credibility.
- [Do Coverage and Mutation Scores of LLM-Generated Test Suites Correlate with Their Effectiveness? (arXiv 2607.22880)](https://arxiv.org/html/2607.22880v1) — replicability/skeptic study questioning the mutation-score-as-proxy assumption. High credibility, key counter-evidence.
- [Understanding LLM-Driven Test Oracle Generation (arXiv 2601.05542)](https://arxiv.org/html/2601.05542v1) — fully fetched in follow-up pass (was abstract-only originally): zero-shot 54.56% / few-shot 51.30% / CoT 31.11% / ToT 29.26% accuracy; 25.30pp spread between best/worst prompting strategy, larger than model-choice or context-level spread. High credibility, AIware 2025.
- [Test vs Mutant: Adversarial LLM Agents for Robust Unit Test Generation (arXiv 2602.08146)](https://arxiv.org/pdf/2602.08146) — adversarial agent-vs-mutant framing. Medium credibility (abstract-level).
- [Augment Code: Mutation Testing for AI-Generated Code](https://www.augmentcode.com/guides/mutation-testing-ai-generated-code) — practitioner guide. Medium credibility (vendor content, corroborating not sole basis).

### Finding 3 — Ephemeral scratch state files

- [scratch: Structured Scratchpads for Coding Agents (nikiforovall.blog)](https://nikiforovall.blog/ai/2026/06/08/scratch.html) — plan.md-as-index pattern, ephemeral, kept out of source tree. Medium credibility.
- [Everything is Context: Agentic File System Abstraction for Context Engineering (arXiv 2512.05470)](https://arxiv.org/pdf/2512.05470) — file-system-as-context-store, general framing. Medium-high credibility.
- [5 Architectural Patterns for Persistent Memory and State in AI Agents (MachineLearningMastery.com)](https://machinelearningmastery.com/5-architectural-patterns-for-persistent-memory-and-state-in-ai-agents/) — ephemeral vs. persistent memory taxonomy. Medium credibility.
- [Towards Transparent Checkpointing with AI-driven Code Generation (arXiv 2606.30921)](https://arxiv.org/pdf/2606.30921) — checkpoint-after-state-update pattern. Medium credibility.
- [Quine: Realizing LLM Agents as Native POSIX Processes (arXiv 2603.18030)](https://arxiv.org/pdf/2603.18030) — OS-process-like ephemeral state, speculative framing. Medium credibility.
- [Agent READMEs: An Empirical Study of Context Files for Agentic Coding (arXiv 2511.12884)](https://arxiv.org/pdf/2511.12884) — empirical study of persistent (not ephemeral) context files, the comparison class openspec's own artifacts sit in. High credibility.
- [AI Agent Scratchpad: Keep Coding Agents Fast Without Polluting Git (DEV Community)](https://dev.to/jackm-singularity/ai-agent-scratchpad-keep-coding-agents-fast-without-polluting-git-329c) — trust/repo-cleanliness justification, no performance measurement. Medium credibility.
- [Anthropic: Managing context on the Claude Developer Platform](https://claude.com/blog/context-management) and [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — 39%/29%/84% benchmarked numbers; measures memory-tool-outside-context vs. no-memory-tool, a different variable than ephemeral-vs-persistent. High credibility, most careful caveat needed.
- [Claude Code GitHub Issue #21248](https://github.com/anthropics/claude-code/issues/21248) — scratchpad persistence feature request, closed "not planned"; documents scratchpad as a usability pain point, not a performance-benefit case. High credibility (primary source), negative/neutral evidence.
- [qubytes.substack.com: "scratchpad.md in Claude Code: The Problem No One Explains"](https://qubytes.substack.com/p/scratchpad-claude-code-context-window-task-state) — purely theoretical/illustrative, no measured data. Medium credibility.
- [Coherence Collapse: Diagnosing Why Code Agents Fail After Reaching the Right Code (arXiv 2603.24631)](https://arxiv.org/abs/2603.24631) — 60-69% of failures on SWE-Agent/OpenHands are edit-quality collapse, with a length-independent sub-type dissociated from context-window degradation. High credibility, key counter-evidence to the context-pollution rationale for scratch files.

### Finding 4 — VCS/workspace boundary rule

- [ClayBuddy: A Framework, Evaluation, & Mitigation of Coding Agent Failures (arXiv 2606.19380)](https://arxiv.org/pdf/2606.19380) — catalogs "NEVER COMMIT DIRECTLY TO main" / "NEVER AUTO-COMMIT" as observed patterns. Medium-high credibility.
- [Rethinking Version Control for an Agentic World (Pedro Piñera blog)](https://pepicrft.me/blog/rethinking-version-control-for-agents/) — traditional VCS assumptions breaking down with agents. Medium credibility.
- [Freestyle: Version Control for AI Agents](https://www.freestyle.sh/blog/engineering/version-control-for-ai-agents) — vendor blog, agent-aware VCS patterns. Low-medium credibility.
- [Why AI Agents Rewrite Your Whole Doc (and the Fix) (octaria.com)](https://www.octaria.com/blog/notion-mcp-rewrites-whole-doc-ai-agent-editing-alternative-june-2026) — Notion's 847-block whole-page-rewrite problem from lacking block-level API granularity; the clearest non-code example found, though a different failure mechanism (tooling-granularity, not agent-discipline). Medium credibility.
- [Git as a Safety Net for AI Agents](https://rpatrik96.github.io/research-agora/git-backup.html) — applies git-safety discipline to research/writing workflows (LaTeX, Overleaf), a boundary-straddling example. Medium credibility.

### Finding 5 — Deterministic/LLM hybrid split, precision vs. recall

- [alibaba/open-code-review GitHub](https://github.com/alibaba/open-code-review) — primary source, deterministic pipelines + LLM judgement split. High credibility.
- [Grounded AI for Code Review: Resource-Efficient Large-Model Serving in Enterprise Pipelines (arXiv 2510.10290)](https://arxiv.org/html/2510.10290) — ablation: removing deterministic context degrades recall proxies more than latency improves. High credibility.
- [Combining Large Language Models with Static Analyzers for Code Review Generation (arXiv 2502.06633)](https://arxiv.org/html/2502.06633v1) — RAG-based KBS+LLM integration, public replication package. High credibility.
- [Uber Engineering: uReview](https://www.uber.com/ug/en/blog/ureview) — 65% same-changeset address rate vs. 51% human, ~90% of ~65,000 weekly diffs, ~1,500 dev-hours/week saved. Very high credibility (primary, production-scale).
- [QASecClaw (arXiv 2605.01885)](https://arxiv.org/html/2605.01885v1) — SAST false-positive reduction, precision 0.695→0.951, FP rate reduced 88.6%. High credibility.
- [MultiVer (arXiv 2602.17875)](https://arxiv.org/html/2602.17875) — counter-example: 4-agent ensemble underperforms a simpler fine-tuned baseline without strong deterministic grounding. High credibility, key counter-evidence.
- [CodeAnt: AI Code Review Benchmark 2026 (200,000 real PRs)](https://www.codeant.ai/blogs/ai-code-review-benchmark-results-from-200-000-real-pull-requests) — 65%/55%/59% precision/recall/F-score at industry scale. Medium credibility (vendor benchmark).
- [Augment Code: Deep Code Review: Why Recall Beats Precision for Agents](https://www.augmentcode.com/guides/deep-code-review-recall-vs-precision) — original recall-favoring argument, later superseded by Augment's own newer posts. Medium credibility.
- [How Many False Positives Are Too Many in AI Code Review (CodeAnt)](https://www.codeant.ai/blogs/ai-code-review-false-positives) — alert-fatigue framing, 40% ignored / 60-80% FP-rate figures (different metrics, not interchangeable). Medium credibility.
- [Comparing Zealous and Restrained AI Recommendations in a Real-World Human-AI Collaboration Task (CHI 2023 / arXiv 2410.11860)](https://arxiv.org/html/2410.11860) — matched-F1 zealous/restrained study, adjacent domain (video annotation); recall-favoring AI produced faster completion + higher team recall; negative transfer for restrained-AI-trained annotators. High credibility, strongest matched-comparison found.
- [OpenAI: A Practical Approach to Verifying Code at Scale](https://alignment.openai.com/scaling-code-verification/) — primary alignment-team source, explicit Pareto-sweep methodology, chose precision deliberately; 52.7% of comments trigger code changes, >80% positive external reactions. High credibility, strongest precision-side source.
- Qodo "Precise" vs. "Exhaustive" product configurations — confirms both strategies are viable enough to productize side-by-side, but no matched per-configuration precision/recall numbers were found (only a blended 60.1% F1). Medium credibility.
- Hybrid-filtering study claiming 72.39–97.50% LLM-call reduction — **could not be independently verified or located across two dedicated search attempts; treat as unconfirmed, do not cite without re-locating the source.**
- [OpenAnt / reachability-filtering analysis (arXiv 2606.19149)](https://arxiv.org/abs/2606.19149) — 97% analysis-surface reduction on OpenSSL via reachability filtering; independently confirmed, suggested substitute for the unverified 72-97% claim above. High credibility.
- [Addy Osmani: "Agentic Code Review"](https://addyosmani.com/blog/agentic-code-review/) — 93.4% of 617 flagged issues across 4 tools caught by only one tool; explicit cost-of-being-wrong framing over "one best tool." High credibility, key reframing source.
- [Martian Code Review Bench / CodeRabbit coverage](https://www.coderabbit.ai/blog/coderabbit-tops-martian-code-review-benchmark) — independent (not single-vendor-run) benchmark methodology, ~300,000 real PRs; CodeRabbit 49.2% precision, highest recall in field. Medium-high credibility.
- [Augment Code: How we built a high-quality AI code review agent](https://www.augmentcode.com/blog/how-we-built-high-quality-ai-code-review-agent) and [We benchmarked 7 AI code review tools on real-world PRs](https://www.augmentcode.com/blog/we-benchmarked-7-ai-code-review-tools-on-real-world-prs-here-are-the-results) — Augment's newer position: pursue both precision and recall via better context retrieval, not recall-first; 7-tool comparative benchmark table. Medium credibility (vendor, but methodologically transparent, and the relevant "did the position evolve" follow-up source).
- [On the Costs and Profit of Software Defect Prediction (arXiv 1911.04309)](https://arxiv.org/pdf/1911.04309) — cost-sensitive-learning framework, false-negative-cost-as-multiple-of-false-positive-cost, generalizable decision framework. Medium-high credibility.

### Finding 6 — Positioning/reflection module

- [LLM Hallucinations in AI Code Review (diffray blog)](https://diffray.ai/blog/llm-hallucinations-code-review/) — practitioner framing of line-position hallucination. Medium credibility.
- [CR-Bench: Evaluating the Real-World Utility of AI Code Review Agents (arXiv 2603.11078)](https://arxiv.org/html/2603.11078) — benchmark including positional/grounding accuracy axis. High credibility.
- [Trust-Calibrated Code Review (arXiv 2606.01969)](https://arxiv.org/pdf/2606.01969) — participatory design study, comments "securely tied to exact code locations." High credibility.
- [HalluJudge (arXiv 2601.19072)](https://arxiv.org/pdf/2601.19072) — reference-free hallucination detection for context misalignment. High credibility.
- [Rethinking Code Review in the Age of AI: A Vision for Agentic Code Review (arXiv 2605.17548)](https://arxiv.org/pdf/2605.17548) — vision/position paper. Medium credibility.
- [Beyond Document Grounding: Span-Level Hallucination Detection over Code, Tool Output, and Documents (arXiv 2607.00895)](https://arxiv.org/pdf/2607.00895) — span-level grounding verification, explicitly covers documents alongside code; the strongest generalization candidate found in the original pass. High credibility.
- [Citation-Grounded Code Comprehension: Preventing LLM Hallucination Through Hybrid Retrieval and Graph-Augmented Context (arXiv 2512.12117)](https://arxiv.org/html/2512.12117) — mechanical interval-arithmetic citation-range check, 100% prevention rate for hallucinated/out-of-range line citations across 1,080 verified responses; closest match to the originally-scoped "positioning module" pattern, but Python-code/RAG-citation-scoped only. High credibility, strongest source found across all three passes for this finding.
- [CodeRabbit: How CodeRabbit's agentic code validation helps with code reviews](https://www.coderabbit.ai/blog/how-coderabbits-agentic-code-validation-helps-with-code-reviews) — general verification-agent step exists, but no documented dedicated positioning-check distinct from general accuracy checking. High credibility, direct negative result.

### Cross-finding / methodology sources

- [How Coding Agents Fail Their Users (arXiv 2605.29442)](https://arxiv.org/pdf/2605.29442) — 20,574 real sessions analyzed; also cited under Finding 1.
- Consistency-audit note (original pass): three explicit cross-source contradictions were tracked rather than silently resolved — precision-vs-recall optimization target (Finding 5), false-positive-rate figures measuring different things (Finding 5 background), and Meta's raw-vs-pre-processed mutation-detection numbers (Finding 2).
