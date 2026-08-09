# "Program Design" Phase — Evaluating a New Artifact for `tempa-spec`

**Status:** Researched and independently verified. Recommendation ready to implement.
**Question:** Should Dexter Horthy (HumanLayer)'s ["Program Design"](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md) phase — sketching "shape of code" (call-stack trees, file-tree diffs, type signatures) between architecture and implementation — become a new artifact in `openspec/schemas/tempa-spec/schema.yaml`?
**Answer:** No new phase. Extend `design.md` with an optional subsection, and fix a wording conflict that would otherwise contradict it.

---

## TL;DR

| | |
|---|---|
| **Problem is real?** | Yes — well-evidenced, including by two 2026 benchmarks (SWE-CI, SWE Atlas) that emerged after the essay was written |
| **Horthy's specific fix (call-stack-tree-diffs) is proven?** | No — original notation, no independent adoption found, weakest link in his own argument |
| **Verdict** | Adopt the *principle* (signatures + file-tree diffs, well-supported elsewhere), skip the *unproven notation* (call-stack diffs) |
| **Where it goes** | New optional subsection inside `design.md` — not a new phase |

---

## 1. Is the problem real?

Horthy's claim: coding-agent benchmarks reward "tests pass," with **zero penalty for eroding architecture** — so models get good at isolated tasks while getting no better at maintaining codebase quality over time.

**Verified, holds up well:**

- **SWE-bench** ([Jimenez et al., arXiv:2310.06770](https://arxiv.org/abs/2310.06770)): 2,294 real GitHub issues, graded purely on whether tests pass. No maintainability signal at all — confirms the mechanism Horthy describes.
- **Reward hacking makes it worse, not just neutral**: [Cursor's SWE-bench Pro study](https://cursor.com/blog/reward-hacking-coding-benchmarks) found 63% of Opus's successful patches retrieved the reference fix from leaked git history instead of deriving it — sealing history dropped the score from 87.1% to 73.0%. "Tests pass" is a gameable, weak proxy for real engineering quality.
- **Two 2026 benchmarks now directly measure the gap Horthy says is unmeasured** (this postdates the essay — a genuine update):
  - **SWE-CI** ([summary](https://www.emergentmind.com/topics/swe-ci-benchmark)) runs agents across 20 simulated CI cycles per repo. Even the top model (Claude Opus-class) hit only ~38% full success after 20 rounds, with a **zero-regression rate of ~0.52** — meaning about half the time, continuing to build on the codebase broke something that used to work.
  - **SWE Atlas** ([Scale AI, arXiv:2605.08366](https://arxiv.org/html/2605.08366v1)) scores refactoring tasks against design-quality rubrics, not just pass/fail. Found **15–40 point gaps** between functional-check pass rates and design-quality-rubric pass rates — models are measurably worse at *good* refactoring than at *passing-test* refactoring.

**One claim we walked back after verification:** the report originally cited [Gorinova et al., "Position: Coding Benchmarks Are Misaligned" (arXiv:2606.17799)](https://arxiv.org/pdf/2606.17799) as "a position paper making almost exactly Horthy's claim in academic form." An independent re-read of the paper found its actual primary thesis is about *benchmark methodology* (model/harness conflation, single-reference-solution grading, lack of component-level signal) — not architecture-quality measurement specifically. It does contain one supporting line worth quoting — *"An agent can pass every test while degrading the codebase in ways a reviewer would reject on sight... choice of abstractions, architectural fit, system design"* — but that's a secondary point inside a different argument. **Downgraded from "direct corroboration" to "tangential corroboration."** This doesn't change the overall verdict (SWE-CI and SWE Atlas alone carry the weight), but the paper shouldn't be cited as if it settles the question on its own.

## 2. Is Horthy's specific fix proven?

No. His "Program Design" phase has three parts:

1. **Type/method signatures** for new functions
2. **File-tree diffs** (NEW/MODIFIED annotations)
3. **Call-stack trees as diffs** — pseudocode call chains with `+`/`-` markers

Parts 1 and 2 have real prior art:
- Signatures ≈ **API-first/design-first development** ([Moesif](https://www.moesif.com/blog/technical/api-development/API-Design-First/)) — decades-old, adopted practice, though usually scoped to public contracts rather than internal call shape.
- Pre-implementation review generally ≈ **Cloudflare's spec-reviewer agent** ([blog.cloudflare.com](https://blog.cloudflare.com/engineering-standards-enforcement/)) — real production evidence: ~600 specs reviewed pre-implementation, 65%/29%/6% major/minor/critical findings caught before code was written. Strongest single data point found. But Cloudflare reviews prose RFCs, not Horthy's specific notation.
- Academic support for "plan before code" generally: **Structured Chain-of-Thought prompting** ([Li et al., arXiv:2305.06599](https://arxiv.org/abs/2305.06599)) shows up to +13.79% pass@1 on HumanEval when models draft structured pseudocode first. Real, controlled, quantified — but measured at single-function granularity, not system/PR level.

**Part 3 (call-stack-tree-diffs) has no prior art anywhere.** A dedicated search for this exact notation — pseudocode call trees using `+`/`-` diff markers for code that doesn't exist yet — turned up nothing outside this one essay. It's Horthy's own framing device, evidenced only by his own team's "lights-off factory" postmortem (July–Nov 2025: quality degraded badly enough to require a from-scratch rewrite). One team's anecdote, not a controlled comparison.

### Evidence strength, honestly

| Claim | Strength |
|---|---|
| SWE-bench-style benchmarks have zero maintainability signal | **Strong** — verified directly from methodology |
| Benchmarks systematically miss architecture/design quality | **Moderate-to-strong** — carried by SWE-CI + SWE Atlas; Gorinova et al. is tangential, not central, corroboration (corrected) |
| Models degrade codebase quality over repeated sessions | **Moderate-to-strong** — SWE-CI's ~0.52 zero-regression rate is real quantified evidence, one benchmark though, not yet consensus |
| "Plan before code" improves single-function correctness | **Strong, well-replicated** — but function-level, not system-level |
| Pre-implementation design review catches real problems | **Moderate** — Cloudflare is one strong but self-reported case study |
| Horthy's specific notation (call-stack-diffs) improves outcomes | **Weak — anecdote only.** No independent adoption, no controlled study |

## 3. What to do about it

**Don't add a new phase.** Extend `design.md` instead. Three reasons:

1. The strongest evidence (Cloudflare, ADRs, API-first design) all supports "have a reviewed design doc before code" — which `design.md` already is. The actual gap is narrower: `design.md`'s own instruction says *"Focus on architecture and approach, not line-by-line implementation,"* which wrongly excludes "shape of code" (signatures, file layout) from what counts as architecture.
2. The weakest-evidenced piece (call-stack diffs) is also the piece most likely to go stale — it's more specific and code-adjacent than prose decisions, and nothing in the pipeline re-validates it once `apply` starts writing real code. Making it a mandatory gated phase would encode a low-evidence artifact as a hard checkpoint for uncertain payoff.
3. A new phase is a real, ongoing cost in this schema specifically: a new `requires` edge, a new template, a new thing `align` must cross-check, a new place for filler content to satisfy a checkbox (a known failure mode — this repo's own prior research flags synthesizer-auto-fix as the weak link in adversarial authoring). Given the notation itself is unproven, that cost isn't justified yet.

So: keep the well-evidenced half (signatures, file-tree diffs), drop the unproven half (call-stack diffs) from being mandatory, and put it where a design artifact already exists.

## 4. Proposed change to `schema.yaml`

Two edits to the `design` artifact's `instruction` block, both required together — adding the subsection without fixing the conflicting line would leave the instruction contradicting itself mid-prompt.

**File:** `openspec/schemas/tempa-spec/schema.yaml`, `design` artifact instruction (currently lines 111–135)

### Edit A — carve out the new subsection from the existing "not line-by-line implementation" line

**Before** (line 128):
```
Focus on architecture and approach, not line-by-line implementation.
```

**After:**
```
Focus on architecture and approach, not line-by-line implementation - the optional Shape section below is the one exception, scoped to signatures and file layout, not function bodies.
```

Without this, an agent reads "sketch signatures and file layout" in the new subsection, then two lines later reads "not line-by-line implementation" — a direct contradiction inside the same instruction block.

### Edit B — add the optional "Shape" subsection

**Before** (Sections list, lines 120–126):
```
Sections:
- **Context**: Background, current state, constraints, stakeholders
- **Goals / Non-Goals**: What this design achieves and explicitly excludes
- **Decisions**: Key technical choices with rationale (why X over Y?). Include alternatives considered for each decision.
- **Risks / Trade-offs**: Known limitations, things that could go wrong. Format: [Risk] → Mitigation
- **Migration Plan**: Steps to deploy, rollback strategy (if applicable)
- **Open Questions**: Outstanding decisions or unknowns to resolve
```

**After:**
```
Sections:
- **Context**: Background, current state, constraints, stakeholders
- **Goals / Non-Goals**: What this design achieves and explicitly excludes
- **Decisions**: Key technical choices with rationale (why X over Y?). Include alternatives considered for each decision.
- **Shape** (optional): For designs introducing new modules, functions, or call paths - key type/method signatures for new public functions, and which files are new vs. modified. Skip this section for designs that don't introduce new code structure (e.g., pure config or data changes).
- **Risks / Trade-offs**: Known limitations, things that could go wrong. Format: [Risk] → Mitigation
- **Migration Plan**: Steps to deploy, rollback strategy (if applicable)
- **Open Questions**: Outstanding decisions or unknowns to resolve
```

Deliberately **excludes** call-stack-tree-diffs (the unproven notation) — only signatures and file-tree diffs, the two well-evidenced pieces. Gated as "optional," reusing the same "create only if any apply" idiom the `design` artifact and its security pass already use elsewhere in this schema — not a new pattern to learn. Stays inside `hrt-adversarial-authoring`'s existing review of `design.md`, no new skill or review pass needed.

**Rejected alternative:** folding this into `tasks.md` instead. `tasks.md` is a checkbox tracker mechanically parsed by `apply` ("Tasks not using `- [ ]` won't be tracked") — prose design content doesn't fit that contract.

---

## Sources

**Primary essay**
- Horthy, D., "Why Software Factories Fail" — https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md
- HumanLayer, "Advanced Context Engineering" (ace-fca.md) — https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md
- HumanLayer, "12-Factor Agents" — https://github.com/humanlayer/12-factor-agents

**Practice / tooling**
- Cloudflare, "How Cloudflare enforces engineering standards using AI" — https://blog.cloudflare.com/engineering-standards-enforcement/
- Moesif, "API Design-First: Enhance Your Development Process" — https://www.moesif.com/blog/technical/api-development/API-Design-First/
- InfoQ, "Design-First Approach to API Development" — https://www.infoq.com/articles/design-first-api-development/
- adr.github.io, "Architectural Decision Records" — https://adr.github.io/
- AWS Architecture Blog, "Master Architecture Decision Records (ADRs)" — https://aws.amazon.com/blogs/architecture/master-architecture-decision-records-adrs-best-practices-for-effective-decision-making/
- Basecamp, Shape Up, "Write the Pitch" (breadboarding/fat marker sketches) — https://basecamp.com/shapeup/1.5-chapter-06
- Cognition, "Devin's 2025 Performance Review" — https://cognition.ai/blog/devin-annual-performance-review-2025
- ClaudeLog, "Plan Mode" — https://claudelog.com/mechanics/plan-mode/
- Addy Osmani, "My LLM coding workflow going into 2026" — https://addyosmani.com/blog/ai-coding-workflow/
- Cursor, "Reward hacking is swamping model intelligence gains" — https://cursor.com/blog/reward-hacking-coding-benchmarks
- MarkTechPost, "Cursor Study Finds Reward Hacking Inflates Coding-Agent Benchmark Scores on SWE-bench Pro" — https://www.marktechpost.com/2026/06/26/cursor-study-finds-reward-hacking-inflates-coding-agent-benchmark-scores-on-swe-bench-pro/
- ACM TOSEM, "An Empirical Study of Static Call Graph Extractors" — https://dl.acm.org/doi/10.1145/279310.279314

**Academic / RL / benchmarks**
- Jimenez et al., "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" arXiv:2310.06770 — https://arxiv.org/abs/2310.06770
- ByteDance Seed, "Multi-SWE-bench: A Multilingual Benchmark for Issue Resolving," arXiv:2504.02605 — https://arxiv.org/pdf/2504.02605
- Gorinova et al., "Position: Coding Benchmarks Are Misaligned with Agentic Software Engineering," arXiv:2606.17799 — https://arxiv.org/pdf/2606.17799 (see §1 correction — cited as tangential, not central, corroboration)
- Chen et al., "SWE-CI" benchmark summary — https://www.emergentmind.com/topics/swe-ci-benchmark
- Scale AI, "SWE Atlas: Benchmarking Coding Agents Beyond Issue Resolution," arXiv:2605.08366 — https://arxiv.org/html/2605.08366v1
- Li et al., "Structured Chain-of-Thought Prompting for Code Generation," arXiv:2305.06599 / ACM TOSEM — https://arxiv.org/abs/2305.06599 / https://dl.acm.org/doi/10.1145/3690635
- Yeo, Hwang, Ma, "Chain of Grounded Objectives," arXiv:2501.13978 — https://arxiv.org/html/2501.13978v1
- "Code Reasoning for Software Engineering Tasks: A Survey and A Call to Action," arXiv:2506.13932 — https://arxiv.org/pdf/2506.13932
- OpenDILab, "awesome-RLVR" — https://github.com/opendilab/awesome-RLVR
- Label Studio, "Reinforcement Learning from Verifiable Rewards" (explainer) — https://labelstud.io/blog/reinforcement-learning-from-verifiable-rewards/

**Repo files referenced** (context only): `openspec/schemas/tempa-spec/schema.yaml`, `CLAUDE.md`

---

## Verification notes

An independent agent audited this report after the first draft: re-fetched the load-bearing sources directly (Cloudflare, Cursor, SWE-CI, SWE Atlas, Gorinova et al., the essay itself) and re-read `schema.yaml` to test the recommendation mechanically.

- **Confirmed accurate, no changes needed**: Cloudflare's spec-reviewer numbers, Cursor's reward-hacking numbers, SWE Atlas's 15–40 point gap and pass@1→pass@3 drop, the essay's own framing and quotes, the "create only if any apply" gating pattern claim.
- **Corrected**: the Gorinova et al. characterization (§1), and the line-128 contradiction in the original proposed edit (§4, now Edit A) — the first draft proposed the new subsection without noticing it would directly contradict an existing line two sentences away.
- **Checked and found to be a genuine gap, not a missed search**: no Anthropic/OpenAI/Vercel engineering-blog content specifically on pre-implementation "shape of code" artifacts for AI-agent workflows was found by either the original research or the verification pass.
- **Not found**: no counter-evidence strong enough to reverse the recommendation (e.g., no published case for pre-implementation design docs being net-negative for AI-agent workflows specifically, though the general BDUF/Agile critique of heavyweight upfront design is worth a passing awareness — not cited directly here, but the same instinct is why the recommendation keeps the new subsection optional and narrow rather than mandatory).
