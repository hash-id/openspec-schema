# Does splitting a dense multi-constraint instruction into an explicit sequential checklist improve LLM compliance — and what would that look like for `hash`'s align/apply?

**Date:** 2026-07-12
**Scope:** narrow, deep follow-up researching one specific unresolved question — whether decomposing a single dense instruction (re-read context, multi-dimension consistency check, severity classification, resolution tagging, conditional resolution, structured reporting — `hash`'s align/apply shape) into an explicit, sequentially-ordered checklist measurably or credibly improves instruction-following compliance, what that decomposition concretely looks like in real agent-instruction files, and what it costs. Pure research — no changes applied from this document.
**Trigger:** this follows up directly on `docs/research/2026-07-12-cross-model-instruction-following.md` §8 recommendation #3, which flagged align/apply's instruction density (§7's last table row: "6+ simultaneous demands... AGENTIF's models show 20-30+ point drops at that density") as a DECISION-tier consideration worth "a future dedicated research or design pass on whether splitting align/apply's instruction into an explicit sequential checklist would help" — but explicitly declined to answer that question, noting "no controlled study isolating that specific intervention on a schema.yaml-shaped prompt was found." This document is that dedicated pass.

## Contents

1. [Answer up front](#1-answer-up-front)
2. [What the prior document already covers (not repeated here)](#2-what-the-prior-document-already-covers-not-repeated-here)
3. [Controlled/measured evidence on decomposition specifically](#3-controlledmeasured-evidence-on-decomposition-specifically)
4. [AGENTIF's own paper: does it test or propose a mitigation?](#4-agentifs-own-paper-does-it-test-or-propose-a-mitigation)
5. [Real-world precedent: how dense review/classification instructions are actually structured](#5-real-world-precedent-how-dense-reviewclassification-instructions-are-actually-structured)
6. [Costs and counter-evidence: decomposition is not free](#6-costs-and-counter-evidence-decomposition-is-not-free)
7. [Illustrative sketches: what decomposition could look like for align/apply](#7-illustrative-sketches-what-decomposition-could-look-like-for-alignapply)
8. [Recommendation](#8-recommendation)
9. [Sources](#9-sources)

---

## 1. Answer up front

No controlled study was found that isolates "one dense multi-constraint instruction vs. the identical content split into an explicit sequential checklist" as its actual independent variable — this exact intervention remains empirically untested, and this document says so plainly rather than stretching adjacent findings to sound conclusive. What does exist is a convergent, indirect case *for* decomposition: chain-of-thought and least-to-most prompting reliably improve multi-step task accuracy by forcing serial processing instead of one-shot generation; DecIF shows an 8-18% IFEval/MultiIF/LiveBench gain from training on *decomposed* instruction data (a training-time, not inference-time, mechanism, and an important distinction); and — most persuasively — three unrelated real-world spec-driven-dev/code-review systems (BMAD-METHOD, spec-kit, and a widely-used SKILL.md) that face `hash`'s exact problem (re-read + multi-dimension-check + severity-classify + tag + resolve + report) have all independently converged on splitting that work into explicit sequential steps or checkpoints rather than one dense paragraph — none of them ship the single-block shape `hash`'s align/apply instructions currently use. Real-world convergence across three unrelated projects is not a controlled study, but it is not nothing either: it is the strongest evidence this document found, and it points the same direction as the (thin) academic evidence. Counter-evidence is real too — "More Rounds, More Noise" shows added review *rounds* introduce false-positive pressure, a related but distinct risk from added *steps within one pass*, and multi-step decomposition trades instruction-density risk for context-continuity risk, latency, and cost, none of which are free. Net recommendation for `hash`: decomposition is worth a scoped, reversible trial — specifically splitting align/apply into forced checkpoints between "detect/classify" and "resolve/report," the intra-file-step shape (closest to BMAD/spec-kit precedent), not full separate LLM calls — but this document does not implement it; that stays a future, separately-scoped proposal per the pure-research constraint.

## 2. What the prior document already covers (not repeated here)

The prior document's §6 "Structured format effects" already concluded no controlled study exists for the shallower "XML vs markdown vs prose" question, and its §7 last row / §8 rec #3 already named AGENTIF's constraint-count finding as the reason to suspect (not confirm) that decomposition might help. This document does not re-derive AGENTIF's headline numbers, the Chroma context-rot findings, or the Cross-Context-Review F1 result — see the prior doc's §6-7 for those. Where this document cites AGENTIF or Cross-Context Review again, it is for a genuinely new angle (AGENTIF's paper-access limits in §4; a distinct reading of "More Rounds, More Noise" in §6) not already extracted.

## 3. Controlled/measured evidence on decomposition specifically

### Task-decomposition prompting techniques (measured, but not on this exact variable)

- **Least-to-most prompting** (Zhou et al., referenced via multiple secondary syntheses) decomposes a complex problem into an ordered list of simpler subproblems, then solves them sequentially, each step conditioned on prior answers. It shows large accuracy gains on symbolic manipulation, compositional generalization, and math reasoning tasks versus single-shot chain-of-thought. This is decomposition of a *reasoning task* into sequential subtasks — structurally close to, but not the same experiment as, decomposing an *instruction* (a set of simultaneous constraints on one output) into sequential sub-instructions. [learnprompting.org; PromptHub]
- **Divide-and-Conquer (D&C) prompting** (arXiv 2402.05359, "An Examination on the Effectiveness of Divide-and-Conquer Prompting in Large Language Models") explicitly tests a three-stage structure — task decomposition, sub-task resolution, solution merge — against single-shot prompting on tasks involving repetitive sub-tasks and deceptive content (arithmetic, fake-news detection). Result: D&C measurably reduces error rates on these tasks, and the paper frames the mechanism as avoiding the "carry-over" of earlier mistakes that a single continuous generation is prone to. This is the closest arXiv paper found to a controlled decomposition-vs-single-block comparison, but its task type (repetitive computational sub-tasks) is a poor structural match for `hash`'s task type (multi-dimension qualitative review + classification), so treat the *direction* as suggestive, not the *effect size* as transferable. [arxiv.org/pdf/2402.05359]
- **DecIF** (arXiv 2505.13990, "Improving Instruction-Following through Meta-Decomposition") is the most directly relevant new source found. Its method decomposes complex instructions into simpler constituent sub-instructions and uses that decomposition to *generate training data* (SFT), not as an inference-time prompting technique — an important distinction from what §8 rec #3 in the prior document was asking about (whether to reword `hash`'s live prompt into an explicit checklist). Reported results: **8-18% absolute gains on IFEval, MultiIF, and LiveBench** and **~3% on FollowBench** versus UltraIF, using the same training-data volume; gains plateau or decline on some benchmarks as data scales further, while FollowBench keeps improving. Read honestly: this is strong evidence that *models trained on decomposed-instruction data* handle complex instructions better — it is not evidence that *prompting an already-trained model* with a decomposed version of one particular instruction (`hash`'s live use case, since schema.yaml can't retrain a model) produces the same gain. It is suggestive by analogy, not directly transferable. [arxiv.org/html/2505.13990v1; github.com/HypherX/DecIF]
- **Chain-of-thought prompting** (Wei et al., arXiv 2201.11903) is the best-established general finding: forcing explicit intermediate reasoning steps before a final answer reliably improves multi-step task accuracy, and per multiple practitioner syntheses, forces "the transformer's attention heads [to] spend more tokens on each sub-problem, reducing shortcut guesses." This is the mechanism most analogous to what an explicit checklist would do to `hash`'s align/apply instructions: force serial attention allocation to each of the 6+ simultaneous demands instead of a single generation pass that has to satisfy all of them at once. No source found quantifies this mechanism specifically for *constraint-satisfaction* instructions (as opposed to reasoning/math tasks) — an honest gap, not a resolved point.
- **TICKing All the Boxes** (arXiv 2410.03608) generates checklists of yes/no sub-questions from a complex instruction, but uses them primarily as an **evaluation/feedback mechanism**, not a generation-time instruction structure: checklist-based LLM judging improves agreement with human preference judgments from 46.4% to 52.2% (a 5.8-point gain), and when checklists are fed back as *refinement* critique (Self-TICK), models improve 6.5-7.8 percentage points across WildBench/InFoBench/LiveBench. This is closer to `hash`'s align/apply loop structure than it first appears — align/apply already work as a pass-then-critique loop, and TICK's finding supports the *critique* half of that loop (a checklist sharpens what counts as "done"), but it does not test giving the model the checklist *before* first-pass generation, which is what "decompose the instruction into a checklist" for `hash` would actually mean. Worth flagging precisely because it is easy to over-read as more directly relevant than it is.

### The honest gap

No paper found runs the specific ablation: same instruction content, same model, condition A = one dense paragraph/numbered-list block combining re-read + multi-check + classify + tag + resolve + report, condition B = the identical content split into forced sequential sub-steps or separate calls, compliance measured per-constraint on both. AGENTIF, FollowBench, Multi-IF, and IF-RewardBench all measure compliance *as a function of constraint count or instruction length*, not as a function of *whether the same constraint set is delivered in one block or several*. This is the scarcity the research brief anticipated, and it is real — stated plainly rather than papered over. [arxiv.org/abs/2505.16944; arxiv.org/pdf/2603.04738 (IF-RewardBench); github.com/facebookresearch/Multi-IF]

## 4. AGENTIF's own paper: does it test or propose a mitigation?

This document attempted to re-fetch AGENTIF (arXiv 2505.16944) specifically for its error-analysis and discussion sections, since the prior document's citation stopped at the headline constraint-count finding. Result, reported honestly: the full PDF/HTML text was not extractable through available tooling in this research pass (binary/compressed content defeated text extraction on both the abstract page and full PDF fetch attempts; the project page and GitHub README were checked as fallbacks and confirmed to contain no error-analysis or mitigation discussion — they are leaderboard/usage pages, not paper mirrors). What is confirmed from the abstract and project page:

- The abstract states the paper "conduct[s] error analysis and analytical experiments on instruction length and meta constraints, providing some findings about the failure modes of existing LLMs" — confirming such an analysis exists in the paper, but this research pass could not extract what it concludes.
- The project leaderboard page (agentif.github.io) shows constraint-*category* breakdowns — "Semantic" and "Tool" constraints have the lowest success rates (10-27% across models) versus other constraint types — which is a finer-grained cut than the prior document's headline number, but still doesn't speak to decomposition as a mitigation.
- No mention of decomposition, checklists, or step-by-step mitigation was found on either the project page or GitHub README.

**This is a genuine, disclosed gap**, not a finding: AGENTIF's own paper may or may not discuss mitigation in sections this research pass could not access. A future pass with direct PDF text extraction (e.g. downloading and running `pdftotext` locally, which this research environment's WebFetch tool could not do reliably) could close this gap; this document does not claim to have closed it.

## 5. Real-world precedent: how dense review/classification instructions are actually structured

This is the strongest evidence this document surfaces, and it is concrete rather than inferential: three unrelated projects that each face a structurally similar problem to `hash`'s align/apply (multi-dimension review, severity classification, resolution routing, structured reporting) have all independently chosen *some* form of decomposition over one dense block. None chose `hash`'s current shape.

### BMAD-METHOD's `bmad-code-review` — one file per sequential step

`bmad-code-org/BMAD-METHOD`'s code-review skill (already surfaced at a high level in the prior benchmark doc, `2026-07-12-skills-and-schema-benchmark.md` §1 candidates #1-2) splits the review pipeline into **physically separate files**, each ending with an explicit hand-off:

```
steps/
  step-01-gather-context.md
  step-02-review.md
  step-03-triage.md
  step-04-present.md
```

`step-02-review.md` dispatches parallel review-layer subagents and collects raw findings — nothing else. It ends with:

> "## NEXT — Read fully and follow `./step-03-triage.md`"

`step-03-triage.md` — the step structurally closest to `hash`'s align/apply combined classify+tag+resolve work — is itself a **9-item sequential checklist**, not a single paragraph: (1) normalize findings into a uniform schema, (2) deduplicate, (3) evaluate each remaining finding independently ("do not reject a finding because a related finding was rejected"), (4) **"Read the code before rating"** — an explicit instruction to re-verify against source before scoring, forced as its own numbered step rather than folded into "assign severity", (5) assign severity (low/medium/high), (6) route into one of four buckets (`decision_needed` / `patch` / `defer` / `dismiss`), (7) drop dismissed findings, (8) report failed layers, (9) announce a clean pass only if steps 1-8 leave zero findings. Each numbered instruction targets exactly one cognitive operation; severity-assignment (5) is not reachable without re-reading code (4) having already happened as its own discrete, completed step. This is a **within-file, numbered-checklist decomposition** — the same file, but far more granular and more strictly sequenced than `hash`'s align step 3 ("classify every finding by severity") and step 4 ("tag each finding..."), which read as two items in a single continuous instruction rather than nine gated sub-steps with an explicit "verify against reality before you score" checkpoint. [github.com/bmad-code-org/BMAD-METHOD, steps/step-02-review.md, steps/step-03-triage.md]

### spec-kit's `/speckit.analyze` — one file, nine numbered execution steps

`github/spec-kit`'s `/speckit.analyze` command (already named at a high level in the prior benchmark doc) is a **single markdown file**, but internally organized as an explicit, numbered, strictly sequential pipeline distinct from BMAD's file-per-step approach:

1. Initialize context (run prerequisite scripts)
2. Load artifacts progressively (spec, plan, tasks, constitution)
3. **Build a semantic inventory** — extract requirements, user stories, and coverage maps into structured form *before* any detection runs
4. Run detection passes (duplication, ambiguity, underspecification, etc. — each as its own labeled sub-pass, e.g. "A. Duplication Detection," "B. Ambiguity Detection," "C. Underspecification")
5. Assign severity heuristics
6. Produce a compact markdown report with tables
7. Suggest next actions
8. Offer remediation (user-approved only)
9. Check post-analysis hooks

The structurally significant choice here is step 3: spec-kit forces a **separate "build the semantic model first" checkpoint** before detection begins, rather than letting "re-read artifacts" and "check consistency" blend into one instruction the way `hash`'s align step 1 ("re-read all artifacts") and step 2 ("check consistency across the whole chain") currently do — align's step 1 and 2 are already two numbered items, but nothing forces the model to produce an intermediate structured representation (a requirement-to-task coverage map, e.g.) between them the way spec-kit's step 3 does. [github.com/github/spec-kit, templates/commands/analyze.md]

### `addyosmani/agent-skills`' `code-review-and-quality` SKILL.md — sub-headers as forced checkpoints

A third, independent example, not previously surfaced in either prior research doc: this SKILL.md structures its "Review Process" as five explicit `### Step N` sub-headers within one file — Step 1 "Understand the Context," Step 2 "Review the Tests First," Step 3 "Review the Implementation" (itself walking five review axes in order: correctness, readability, architecture, security, performance), Step 4 "Categorize Findings" (with a severity-prefix table: Critical / *(unprefixed required)* / Nit / Optional / Consider / FYI), Step 5 "Verify the Verification" (checking the author's own testing story). The explicit design rationale given in the file itself: **"Lead with what matters. Order findings by leverage... Don't bury a real issue under cosmetic nits."** Severity classification (Step 4) is deliberately positioned as its own late checkpoint, occurring only after context (1), tests (2), and full five-axis implementation review (3) are already complete — not interleaved with detection the way `hash`'s apply-REVIEW step 3 ("classify every finding by severity") immediately follows step 2's detection work in the same continuous instruction block. [github.com/addyosmani/agent-skills, skills/code-review-and-quality/SKILL.md]

### obra/superpowers' `requesting-code-review` — orchestrator/template split

A fourth data point, extending what the prior benchmark doc already covered at a summary level: the *skill file* (`requesting-code-review/SKILL.md`) and the *dispatched-subagent prompt* (`code-reviewer.md`) are physically separate files with a clean division of labor — the SKILL.md handles *when* to request review, how to compute git SHAs, and how to *act* on feedback (fix Critical immediately, fix Important before proceeding, push back if wrong); the dispatched template handles *what to check* (plan alignment, code quality, architecture, testing, production readiness — five labeled categories) and *how to report* (Strengths, then Critical/Important/Minor). This is decomposition by **audience/role**, not by sequential step — a different axis of splitting than BMAD or spec-kit use, but still not a single block asking one session to both decide when to review and perform the review and classify and act on results.

### Reading across all four

No real-world example found keeps `hash`'s exact shape (one instruction block, one session, re-read + multi-check + classify + tag + resolve + report all as items in a single numbered list with no forced checkpoint between detection and classification, or between classification and resolution). Every comparable system found splits *somewhere* — by file (BMAD), by numbered sub-phase within a file with an explicit intermediate artifact requirement (spec-kit), by late-positioned sub-header checkpoint (agent-skills), or by role/audience (superpowers). The convergence is the finding: four unrelated projects solving the same category of problem, none choosing the single-dense-block shape. This is real-world precedent, not a controlled experiment — it cannot establish an effect size, only that practitioners building comparable systems have consistently judged decomposition worth the overhead. That is evidence of a different, weaker kind than a controlled study, and this document is explicit about that distinction rather than treating precedent as proof.

## 6. Costs and counter-evidence: decomposition is not free

### "More Rounds, More Noise" — a related but genuinely distinct question

The prior document's §6 already cites arXiv 2603.16244 for its topline finding (single-pass Cross-Context Review outperforms multi-turn variants). Re-examined here for whether it generalizes from "more review *rounds*" to "more decomposition *steps within one pass*" — the specific distinction the research brief asked to be checked honestly:

**It does not directly test that question, and this document does not claim it does.** The paper's mechanism, read precisely: single-pass CCR (F1 = 0.376) beats all multi-turn variants, including one with a full question-and-answer exchange (F1 = 0.303) and one with fresh re-review of the same artifact (F1 = 0.263). The stated cause is **"false positive pressure"** — a *second round of review* creates a demand to produce new findings the artifact may not actually contain, because a reviewer asked to look again feels obligated to find something. This is a finding about **re-reviewing already-reviewed material across separate review passes**, not about **decomposing a single review pass's own instructions into ordered sub-steps**. The two are structurally different: BMAD's step-03-triage.md 9-item checklist is still *one* review pass looking at the artifact *once*, just with the internal work sequenced explicitly — it is not a second, independent look at the same material after the first look already happened. Whether *that* kind of within-pass decomposition also invites false-positive pressure (e.g. a forced "find something at each of 9 checkpoints" structure nudging toward manufactured findings) is a plausible risk by analogy, but this paper does not measure it, and this document flags the analogy as speculative rather than citing the paper as if it had tested the within-pass case.

### Trading one risk for others

Even setting aside the "more rounds" question, splitting a dense instruction into multiple sequential LLM calls or forced checkpoints is not a free lever:

- **Context loss between steps.** If decomposition means separate tool-calls or separate subagent dispatches (rather than sub-headers within one continuous generation), each boundary is a place where context the model built up in step N may not carry cleanly into step N+1 unless explicitly threaded through — the same class of risk `hash`'s own apply-REVIEW fresh-subagent-per-pass design already accepts deliberately (per the prior document's §6/§7, that trade is evidence-backed for *cross-pass* review, but paying it *within* a single pass for the sake of a checklist is a different, unforced trade).
- **Added latency and cost.** More LLM calls or more forced intermediate outputs (e.g. spec-kit's step-3 semantic inventory, BMAD's step-1 gather-context) means more tokens generated and more round trips before a result lands — a real cost `hash`'s current design avoids by doing align/apply in one instruction per pass.
- **Coordination overhead.** BMAD's file-per-step design requires an orchestration mechanism ("Read fully and follow `./step-03-triage.md`") that itself can fail or be skipped — a new failure mode (skipping a step, or misreading the hand-off) that a single self-contained instruction block doesn't have. `hash`'s schema.yaml has no equivalent runtime step-chaining mechanism today; adopting BMAD's exact shape would require building one.
- **Superpowers' own 5.0.x reversal is a directly relevant caution, already surfaced in the prior benchmark doc.** `obra/superpowers` 5.0.4-5.0.7 *removed* a subagent-dispatch review loop from its brainstorming/writing-plans (design-stage) skills specifically because the added round-trip cost ~25 minutes of overhead with no measured quality gain, replacing it with an inline checklist. This is evidence *against* one specific form of decomposition (cross-session subagent dispatch for a design-review step) while simultaneously being evidence *for* another form (an inline checklist replaced it, and was reported to catch "3-5 real bugs in ~30s" — i.e., decomposition-as-checklist-within-one-session survived the cut, decomposition-as-separate-subagent-dispatch did not). Read precisely, this cuts in favor of the within-file/within-pass decomposition shapes (BMAD's numbered steps, spec-kit's numbered phases, agent-skills' sub-headers) and against decomposing align/apply into additional cross-session subagent round-trips — a meaningful distinction for what "decomposition" should mean if `hash` ever pursues this.

### Net honest read

The costs are real but are concentrated in the *cross-call/cross-session* form of decomposition, not the *within-one-instruction, more-explicit-sequencing* form. This matters directly for §7 below: it argues for sketching the lighter-weight shape (numbered checkpoints within the same instruction/pass) as the more defensible candidate, not the heavier shape (separate subagent dispatches per sub-step).

## 7. Illustrative sketches: what decomposition could look like for align/apply

These are illustrative shapes for discussion only — not a proposed rewrite, and nothing here is applied to `schema.yaml`.

### Sketch A — within-instruction forced checkpoints (BMAD/spec-kit-style granularity, same file, same pass)

Closest in spirit to spec-kit's step-3 "build the semantic inventory before detecting" and BMAD's step-4 "read the code before rating." Align's current steps 1-2 ("re-read artifacts" / "check consistency") and steps 3-4 ("classify severity" / "tag mechanical-or-decision") could each gain an explicit intermediate artifact requirement forcing a checkpoint rather than a fluid transition:

```
1. Re-read all artifacts... run `openspec validate --strict`.
2. Build a consistency map: for each of the 6 dimensions below, list what
   you checked and what you found — BEFORE moving to classification.
   [the 6 existing bullet dimensions, unchanged]
3. STOP. Do not classify yet. Confirm the consistency map above is complete
   for all 6 dimensions before proceeding.
4. Classify every finding in the map by severity: [...]
5. Tag every classified finding MECHANICAL or DECISION: [...]
6. Resolve: [...]
7. Append this pass to align.md: [...]
```

The added elements versus today's schema.yaml text are the explicit intermediate artifact (the "consistency map," analogous to spec-kit's semantic inventory) and the forced stop-and-confirm between detection and classification (analogous to BMAD forcing "read the code" as its own numbered step before "assign severity" can happen). Evidence for: matches the real-world precedent in §5 most directly, costs little (no new sessions, no new files, same single LLM call), and chain-of-thought research (§3) supports that forcing an intermediate explicit artifact before the next reasoning step generally helps rather than hurts. Evidence against / open question: no controlled study (§3's honest gap) confirms this specific restructuring changes compliance versus just adding words to an already-long instruction — it could as easily just make the block longer, and Chroma's context-rot findings (prior doc §6) say raw length itself is not free either. This is a real tension the sketch does not resolve.

### Sketch B — separate sequential files per stage (BMAD-style, heavier)

A structurally larger change: split align into `align-detect.md` (re-read + consistency check, steps 1-2 of today's instruction), `align-classify.md` (severity + tag, steps 3-4), and `align-resolve.md` (resolve + report, steps 5-7) — each its own artifact-generation `id` in schema.yaml's `artifacts[]`, `requires`-chained, or each a distinct instruction the orchestrating session works through with an explicit hand-off comparable to BMAD's "Read fully and follow `./step-03-triage.md`." This more closely matches BMAD's actual mechanism, and would let each stage's instruction be genuinely short (closer to the "safest shape" the prior document's §7 identified for discovery's one-question-gate). Evidence against: this is the heavier form flagged in §6 as costing more (more round trips, a new step-chaining mechanism `hash`'s schema format doesn't currently have, and — per superpowers' own 5.0.x reversal — the specific pattern of adding *cross-call* structure to a *design/review* stage was tried and rolled back elsewhere for measured-not-hypothetical cost reasons). This sketch is included for completeness because it is the closest match to BMAD's actual precedent, but §6's analysis argues Sketch A is the more defensible starting point if `hash` pursues this at all.

Both sketches leave the actual severity tiers, MECHANICAL/DECISION definitions, and stop conditions completely unchanged — the open question this document researched is sequencing/structure, not the classification scheme's content, which the prior document's §7 already found well-evidenced as-is.

## 8. Recommendation

**Pure research. No schema.yaml edit is made or proposed for immediate adoption by this document.** If a future, separately-scoped proposal pursues this:

1. **Do not expect a controlled-study citation to justify the change** — none exists for this exact intervention, confirmed after a harder search pass than the prior document ran (§3). Any future proposal should be honest that its justification is real-world convergent precedent (§5) plus adjacent, non-identical academic support (chain-of-thought, D&C prompting, DecIF), not a direct measured result.
2. **If `hash` trials decomposition, trial Sketch A's shape first** (within-instruction forced checkpoints), not Sketch B's (separate files/cross-session hand-offs) — §6 and §5's "Reading across all four" both point the same direction: the lighter, same-pass, same-session decomposition has real-world precedent (BMAD's step-03, spec-kit's step-3, agent-skills' Step 4) and avoids the specific cross-call costs (latency, coordination overhead, context-continuity risk) that `obra/superpowers` measured and walked back for a structurally similar design-stage change.
3. **Treat this as reversible and measurable, not a one-way door.** Since no prior study establishes the effect size, any actual change to align/apply's instruction shape should be evaluated the way `hash`'s own maintainers already validate schema changes per this repo's CLAUDE.md (`openspec validate --strict` on a real downstream repo) plus informal before/after observation of whether findings are more complete or fewer steps get silently skipped — not assumed to work because precedent exists elsewhere.
4. **This document does not resolve whether the gain (if any) is worth the length increase.** Sketch A's own text is longer than today's align instruction, which cuts against it by Chroma's context-rot logic (prior doc §6) even as it cuts for it by chain-of-thought/BMAD logic (§3, §5) — this is a genuine, unresolved tension inherent to the problem, not a gap in this research pass, and a future proposal will have to make a judgment call `hash`'s maintainers are better positioned to make with real usage data than this document is in the abstract.

## 9. Sources

### Academic / Papers (12)

1. [arXiv 2505.16944 — AGENTIF: Benchmarking Instruction Following of Large Language Models in Agentic Scenarios](https://arxiv.org/abs/2505.16944)
2. [AGENTIF project page / leaderboard](https://agentif.github.io/)
3. [GitHub — THU-KEG/AgentIF](https://github.com/THU-KEG/AgentIF)
4. [arXiv 2505.13990 — DecIF: Improving Instruction-Following through Meta-Decomposition](https://arxiv.org/html/2505.13990v1)
5. [GitHub — HypherX/DecIF](https://github.com/HypherX/DecIF)
6. [arXiv 2402.05359 — An Examination on the Effectiveness of Divide-and-Conquer Prompting in Large Language Models](https://arxiv.org/pdf/2402.05359)
7. [arXiv 2410.03608 — TICKing All the Boxes: Generated Checklists Improve LLM Evaluation and Generation](https://arxiv.org/html/2410.03608)
8. [arXiv 2201.11903 — Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://arxiv.org/pdf/2201.11903)
9. [arXiv 2603.16244 — More Rounds, More Noise: Why Multi-Turn Review Fails to Improve Cross-Context Verification](https://arxiv.org/abs/2603.16244)
10. [arXiv 2603.04738 — IF-RewardBench: Benchmarking Judge Models for Instruction-Following Evaluation](https://arxiv.org/pdf/2603.04738)
11. [GitHub — facebookresearch/Multi-IF](https://github.com/facebookresearch/Multi-IF)
12. [PromptHub — Least-to-Most Prompting Guide](https://www.prompthub.us/blog/least-to-most-prompting-guide)

### Official docs / blogs (4)

13. [Augment Code — A good AGENTS.md is a model upgrade. A bad one is worse than no docs at all.](https://www.augmentcode.com/blog/how-to-write-good-agents-dot-md-files)
14. [Augment Code — How to Build Your AGENTS.md (2026)](https://www.augmentcode.com/guides/how-to-build-agents-md)
15. [learnprompting.org — Least-to-Most Prompting](https://learnprompting.org/vocabulary/least-to-most_prompting)
16. [Emergent Mind — Decomposed Prompting in LLMs](https://www.emergentmind.com/topics/decomposed-prompting)

### Repo examples (7)

17. [bmad-code-org/BMAD-METHOD — steps/step-02-review.md](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/src/bmm-skills/4-implementation/bmad-code-review/steps/step-02-review.md)
18. [bmad-code-org/BMAD-METHOD — steps/step-03-triage.md](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/src/bmm-skills/4-implementation/bmad-code-review/steps/step-03-triage.md)
19. [github/spec-kit — templates/commands/analyze.md](https://github.com/github/spec-kit/blob/main/templates/commands/analyze.md)
20. [addyosmani/agent-skills — skills/code-review-and-quality/SKILL.md](https://github.com/addyosmani/agent-skills/blob/main/skills/code-review-and-quality/SKILL.md)
21. [obra/superpowers — skills/requesting-code-review/SKILL.md](https://github.com/obra/superpowers/blob/main/skills/requesting-code-review/SKILL.md)
22. [obra/superpowers — skills/requesting-code-review/code-reviewer.md](https://github.com/obra/superpowers/blob/main/skills/requesting-code-review/code-reviewer.md)
23. [github/spec-kit (repo root)](https://github.com/github/spec-kit)

---

*No changes applied to `schema.yaml` from this document. §8 sets out a scoped, evidence-flagged path (trial Sketch A's shape, treat as reversible, measure rather than assume) for a future, separately-scoped proposal — nothing here is applied. What remains genuinely open after this pass: (1) whether AGENTIF's own paper discusses mitigation in sections this research pass could not extract from PDF/HTML (§4 — a disclosed, not resolved, gap); (2) no controlled study of the exact "one block vs. sequential checklist" intervention exists anywhere found, for `hash`'s shape or any comparable one — real-world precedent (§5) is the strongest available signal and remains one category weaker than a measured result; (3) the length-vs-structure tension in §8 point 4 (a more decomposed instruction is also a longer one) is not resolved by any source found and may not be resolvable without `hash`-specific measurement. See the prior document, `2026-07-12-cross-model-instruction-following.md`, for the broader three-model survey this document narrows from.*
