# tempa-spec weight and phase reduction — is the process too heavy, and what can go?

**Date:** 2026-10-21
**Trigger:** maintainer feedback that the whole process feels slow: too many questions, drafts too long to read, and doubt about whether the effort pays off. Follow-up questions: is `discovery` still needed, are there other steps to drop, how does this compare with Anthropic's "AI-native SDLC playbook", and what do the maintainer's own Lean priorities imply for tempa-spec?
**Scope:** `openspec/schemas/tempa-spec/schema.yaml` (v14) and the `hrt-*` skills it points at, compared with the community schemas in `intent-driven-dev/openspec-schemas`, the built-in `spec-driven` schema, other spec-driven tools, the playbook, and the Lean priorities the maintainer has written down. Pure research — no schema or skill change applied. Artifact sizes, `align` cycles, and `VERIFY` outcomes were also measured on 27 real changes in three downstream repositories (anonymised, see [§2.1](#21-measured-on-27-real-changes)).
**Status:** research complete. R1-R6 and R8 from [§10](#10-recommendations-changes-to-tempa-spec) were implemented in schema v15 on 2026-10-21 (see the CHANGELOG); R7 and R9 are follow-ups outside the schema. The text below is the study as written before implementation. The choices the maintainer has already made are collected in the table at the start of that section; what is still open is in [§12](#12-confidence-and-open-questions). The before/after and impact estimates in [§11](#11-before-and-after-and-impact) combine those measurements with counts derived from reading the instructions; interaction counts (questions, minutes) could not be recovered from archived files.

## Contents

1. [Answer up front](#1-answer-up-front)
2. [Where the weight comes from](#2-where-the-weight-comes-from)
3. [Benchmark: intent-driven-dev/openspec-schemas](#3-benchmark-intent-driven-devopenspec-schemas)
4. [External evidence on effectiveness](#4-external-evidence-on-effectiveness)
5. [How other tools treat discovery](#5-how-other-tools-treat-discovery)
6. [Comparison with Anthropic's AI-native SDLC playbook](#6-comparison-with-anthropics-ai-native-sdlc-playbook)
7. [Lean principles the maintainer prioritizes, applied to tempa-spec](#7-lean-principles-the-maintainer-prioritizes-applied-to-tempa-spec)
8. [What `discovery.md` actually does here](#8-what-discoverymd-actually-does-here)
9. [Two maintainer observations that change the picture](#9-two-maintainer-observations-that-change-the-picture)
10. [Recommendations: changes to tempa-spec](#10-recommendations-changes-to-tempa-spec)
11. [Before and after, and impact](#11-before-and-after-and-impact)
12. [Confidence and open questions](#12-confidence-and-open-questions)
13. [Sources](#13-sources)

---

## 1. Answer up front

- **Where the reading load is, measured on 27 real changes:** the median change is about 13,200 words. Design is 30% of all words, specs 26%, tasks 13%, `align` 12%, discovery 8.5%, proposal 7.7%. Removing `discovery` helps, but it is not the biggest lever; design, specs, and `align` cycles carry more of the load. Design and specs size looks mostly baseline behavior, not a side effect of downstream rules (R9, parked).
- **Effectiveness is unmeasured on both sides.** The community schemas are a catalog with no evaluation. This repo's own CHANGELOG says repeatedly "no benchmark harness, no measured evidence". No study found compares a phase-heavy schema with a light one.
- **The weight is real and has identifiable sources:** four stacked loops that wait for a human, roughly 8-10 subagents before any code, the same decision restated in up to five documents, and a history that mostly adds gates.
- **`discovery` should go as a file, and its interview should stay.** Every reference tool, including Anthropic's playbook, keeps one intent document and none keeps a separate reasoning log. The critical content moves into existing proposal sections, with at most one new optional section: outcomes into Why, scope decisions into What Changes and Out of Scope, assumptions and product-level open questions into one short optional section. A 1:1 fold (a new proposal section per discovery heading) would bloat the proposal and is not recommended. This costs one thing: the proposal loses its only upstream reference for adversarial review, so that review goes too.
- **Spend review effort where the Lead (the reviewer who approves the change) reads:** specs first, then design (seams), then tasks being aligned and TDD-ready. Today effort is spread evenly across every artifact, including ones the Lead rarely opens.
- **The weakest link is the one the Lead cares about most.** Task-to-scenario coverage is checked only by an LLM grep in `align`. Making it deterministic (a `Covers:` line on each task group, checked by the lint) both strengthens TDD readiness and lets `align` shrink. The playbook makes the same move: every task has a done state and a command that fails when it is not met.
- **Per-item questions are mostly noise, or mostly rubber-stamped.** The maintainer reports more than 90% of surfaced questions are answered "yes" to the recommendation. Replace one-at-a-time prompts with one digest per artifact, and keep individual stops only for high-stakes categories. The playbook's rule is the same: attention goes to "what the agent flagged", not to starting each stage from scratch.
- **The maintainer's Lean priorities point the same way.** Taken as a lens (not as a benchmark, since the tool they come from is not comparable): put deterministic checks ahead of model judgement, ask for one confirmation per intent, keep one home per fact, and add a rule only because of an incident, never a guess. By that lens, tempa-spec's per-item prompts and the recent additions the CHANGELOG labels "not yet exercised on a real change" are the weak spots. See [§7](#7-lean-principles-the-maintainer-prioritizes-applied-to-tempa-spec).
- **The playbook's sharpest point for this repo is evals.** It runs a set of 20-50 real tasks whenever instructions, skills, or hooks change. This repo changes exactly those things (14 versions) and has no such set. That is why many claims in this document remain judgements, and why R7 starts with a small hand log.
- **Decided so far** is collected in the table at the start of [§10](#10-recommendations-changes-to-tempa-spec). What is open, and how confident the evidence is, is in [§12](#12-confidence-and-open-questions).

## 2. Where the weight comes from

Counted from reading `schema.yaml` and the skills. Not timed on a real change.

| Source | What happens |
|---|---|
| Instruction size | `schema.yaml` 26 KB; `hrt-*` SKILL.md files about 62 KB; vendored `humanizer` 30 KB (cited in three places); `grilling`, `tdd`, `diagnosing-bugs`, `research`, `plain-language-writing` about 19 KB. Not all loaded at once. |
| Human-waiting loops, stacked | (1) `grilling`: rounds until the frontier is empty, no cap. (2) `hrt-adversarial-authoring`: unanchored single-reviewer findings surfaced one at a time, in three phases. (3) `align`: DECISION findings one at a time, then a WALKTHROUGH every cycle, up to three cycles before it asks. (4) `apply` Phase 2: DECISION findings one at a time, up to three passes. |
| Subagents before code | proposal 3 (draft + 2 reviewers), specs 3, design 2-3, plus a VERIFY per `align` cycle. About 8-10. |
| Restatement | One decision can appear in `discovery.md` Key Decisions, `proposal.md`, `design.md` Decisions, `align.md` (with a source pointer), and `mr-brief.md`. Seven documents in total to read per change (discovery, proposal, specs, design, tasks, align, mr-brief). |
| Duplicated checks | `hrt-adversarial-authoring` reviews proposal, specs, and design when written. `align` then re-reads all of them. `align`'s MEDIUM class includes "a vague or untestable requirement", which is the Structural Auditor's job. |
| History | 59 commits, v1 to v14. Judging by commit subjects, the large majority add or extend a check after a failure. A few simplify or replace (the one-round walkthrough, the security-skill swap, a reverted vendoring). None removed a gate for never firing. |

Size comparison with the community schemas (schema.yaml only; their companion skills live in a separate repo and were not measured):

| Schema | schema.yaml | Flow |
|---|---|---|
| minimalist | 0.5 KB | specs, tasks |
| behaviour-driven | 7 KB | proposal, specs/design, tasks |
| intent-driven | 11 KB | adds ADR |
| spec-driven-with-adr | 11.5 KB | adds ADR to spec-driven |
| event-driven | 3.7 KB | event storming, event modeling, specs, design, AsyncAPI, tasks |
| tempa-spec | 26 KB | discovery, proposal, specs, design, tasks, align, apply (3 phases) |

### 2.1 Measured on 27 real changes

Source: the 27 changes that used `tempa-spec` in three downstream repositories (here called A, B, and C; 9, 8, and 10 changes). All artifacts were counted in words, HTML comments excluded. Repository and change names are left out because this repository is public.

| Artifact | Present in | Median words | Share of all words |
|---|---|---|---|
| `discovery.md` | 27 of 27 | 1048 | 8.5% |
| `proposal.md` | 27 of 27 | 1016 | 7.7% |
| `specs/` | 27 of 27 | 2927 | 26.3% |
| `design.md` | 27 of 27 | 4072 | 30.3% |
| `tasks.md` | 26 of 27 | 1548 | 13.4% |
| `align.md` | 25 of 27 | 1354 | 12.0% |
| `mr-brief.md` | 8 of 27 | 690 | 1.8% |

A whole change has a median of about 13,200 words (maximum about 44,200), roughly 26 pages at 500 words a page. In `design.md`, Decisions is about half of the words (median 1715), Risks / Trade-offs 19%, and Shape / Seams 11%.

**Proposal size.** Median 1016 words (my count includes tables and headings, about 15% above one team's own count of the same file). 25 of 27 exceed 500 words, 20 exceed 800, 14 exceed 1000, and 4 exceed 1500. Two repositories already set a prose cap in their `rules:` block (800 and 1000 words), and most proposals exceed it even allowing for the counting difference (at least 6 of 9 and about 6 of 10). A cap written in prose does not hold without a check. The same `rules:` blocks add content that design also owns: one requires risks, rollback, observability, and a STRIDE threat model in the proposal, and asks for the same threat model again in specs and in design; another adds Financial Impact, Security Considerations, and Rollback Plan sections (5 proposals).

**Do downstream `rules:` blocks explain the size?** Repository B's rules ask for nothing in the proposal, specs, or design, and repository A's rules ask for a lot (threat model, privacy, observability, diagrams). Median words per artifact:

| Repository | Proposal | Specs | Design |
|---|---|---|---|
| A (content rules for proposal, specs, design, tasks) | 977 | 2635 | 4570 |
| B (rules only for tasks) | 904 | 3938 | 3036 |
| C (content rules for proposal, tasks, and others) | 1327 | 2905 | 4011 |

B has the longest specs and still writes proposals of about 900 words and designs of about 3000. A's heavy rules coincide with a design about 50% longer than B's. With three repositories and different domains this cannot separate rules from subject matter, but it says the base size comes mostly from the schema's own sections and from how models write, and that rules add a moderate amount at most.

**The `align` loop.** 25 changes have an `align.md`: 58 cycles in total (counting distinct cycle numbers; some files repeat the cycle heading per step), median 2, mean 2.3, maximum 10. 14 of 25 changes ran two or more cycles, 7 ran three or more, and 11 ran one. Cycles are the multiplier on `align` cost.

**VERIFY.** It ran in 47 of the 58 cycles I could parse and found something new in 8 (17%). Seven of the 8 were in cycle 1 (21 runs, 33% productive); later cycles produced 1 in 26 runs (4%). How each possible trigger rule would have performed on these 47 runs:

| Trigger rule | Runs | Productive runs caught |
|---|---|---|
| Always (the 47 runs observed) | 47 | 8 of 8 |
| Today's rule: skip only when ALIGN found nothing | 29 | 8 of 8 |
| ALIGN raised a HIGH or MEDIUM | 20 | 7 of 8 |
| ALIGN raised a HIGH only | 15 | 5 of 8 |
| Cycle 1 unless ALIGN found nothing; later cycles only on a HIGH | 21 | 7 of 8 |

The HIGH-only rule would have skipped three productive runs, one of which found a HIGH that ALIGN had missed. Only 8 productive runs exist, so treat this as direction.

**HIGH DECISION findings.** 18 across the 25 changes; 7 changes had at least one (28%); the median is 0 and the maximum is 5. The parse counts only findings under a severity heading, so these are lower bounds.

**Change-size gate and `BACKLOG.md`.** Since the gate shipped, 4 of 23 changes deferred slices to `BACKLOG.md`: 18 entries in total (17 in one repository, 1 in another, none in the third). 8 proposals have an Out of Scope section. The mechanism is used where a change was split.

**Threats and negative scenarios.** 7 designs use the `[Threat: ...]` line (the format shipped late). In the one design I read in full, all 6 threats have a matching negative scenario in specs. That supports the assumption behind R3, but it is one design.

**Other usage.** `[negative]` tags appear in 24 of 27 task lists and `[security]` in 17. 16 designs name seams with `Covers:`. 17 proposals carry an External Dependencies section. `Depends on:` appears in 3 (the feature is recent).

**Limits of this measurement.** `align.md` files vary in format, so severities were counted only under `#### HIGH`, `#### MEDIUM`, and `#### LOW` headings and VERIFY outcomes were read from wording. Twenty-seven changes from one team in three repositories is a small sample. Interview questions and minutes per phase are not stored in archived files.

## 3. Benchmark: intent-driven-dev/openspec-schemas

The repo is a catalog of five schemas plus an installer guide. It has no evaluation, no metrics, and no outcome comparison. It cannot say whether any schema produces better results; it can only show how much ceremony each prescribes. None of the five has a grilling-style interview, model review loops, or a seam gate (`event-driven` has event-storming artifacts and a contract-validation gate). tempa-spec is a different kind of schema, not just a longer one.

Useful takeaways: `minimalist` (two artifacts) and `behaviour-driven` (lean prompts) show the floor; the repo recommends choosing a schema by risk, which is a per-change skip path. Not recommended here (see [§10](#10-recommendations-changes-to-tempa-spec)).

## 4. External evidence on effectiveness

Source quality is tagged: **primary** = read the abstract or page; **secondary** = search summary or write-up only; **mirror** = third-party copy of documentation.

| Finding | Source | Quality |
|---|---|---|
| Context files for coding agents did not improve task success and raised inference cost by more than 20%. Agents follow the extra instructions, so they explore and test more. Some summaries claim human-written files gained about 4%; the abstract reports no gain for either kind, and this document uses the abstract. | [Evaluating AGENTS.md, arXiv 2602.11988](https://arxiv.org/abs/2602.11988) | primary (abstract) |
| A spec-driven pipeline with hooks that ground each stage in the repository raised an LLM-judged composite by +0.15 on a 1-5 scale (about 3%), test compatibility about 100%. The measured difference is between having and not having the grounding and validation hooks, not between more and fewer review layers. LLM-judge metric. | [Spec Kit Agents, arXiv 2604.05278](https://arxiv.org/abs/2604.05278) | primary (abstract) |
| Asking clarifying questions when intent is unclear raised resolve rate from 61.2% to 69.4% on underspecified SWE-bench Verified, and the system asked fewer questions on simple tasks. | [Ask or Assume?, arXiv 2603.26233](https://www.alphaxiv.org/abs/2603.26233) | secondary |
| An ungated second refinement pass on code dropped HumanEval accuracy from 95.1% to 66.5% (small local models). More review agents show diminishing returns; agents checking each other tend to converge on agreement. | [Two Calls Beat Five Agents, arXiv 2607.26922](https://arxiv.org/pdf/2607.26922) and write-ups | secondary |
| Spec-driven tools generate lengthy spec files that are hard to review; workflows stay elaborate and opinionated. | [Thoughtworks Radar](https://www.thoughtworks.com/radar/techniques/spec-driven-development) | primary |
| A reviewer told to find gaps will usually report some even when the work is sound, and chasing every finding leads to over-engineering. The page advises telling the reviewer to flag only gaps that affect correctness or the stated requirements. | [Claude Code best practices](https://code.claude.com/docs/en/best-practices) | primary |
| An over-long instruction file makes the model ignore half of it; rules get lost in the noise. An instruction is advisory, while a hook is deterministic. | [Claude Code best practices](https://code.claude.com/docs/en/best-practices) | primary |
| A fully lights-off factory (no human reads anything) failed within months; the fix was four upstream human gates, not a review at the end. | HumanLayer WSFF, summarised in `2026-08-17-dark-factory-autonomous-approval-mode.md` | primary (earlier pass) |
| superpowers removed subagent review loops at the spec and plan stage (5.0.4+) because each added about 25 minutes with no measured quality gain, and kept subagent review of implementation. | `2026-07-12-skills-and-schema-benchmark.md` §2 | secondary (earlier pass) |

What this supports: repository grounding and deterministic checks have evidence; a selective interview has some evidence (secondary); the cap itself is a design choice borrowed from spec-kit, not an evidenced value; stacked same-model review and unconditional extra instructions have none, and some counter-evidence (including Anthropic's own advice to restrict reviewers to findings that affect correctness or requirements, which is what the consequence gate already does). What it does not support: any claim that removing a specific phase is safe. No ablation of that kind was found.

## 5. How other tools treat discovery

| Tool | Interview | Separate discovery document | Question limit |
|---|---|---|---|
| [mattpocock/skills](https://github.com/mattpocock/skills) | `grill-with-docs`, the heaviest human step | No. The spec is synthesised from the conversation; durable terms go to a glossary and ADRs | None |
| [OpenSpec built-in](https://github.com/Fission-AI/OpenSpec/blob/main/docs/workflows.md) | `explore`, optional, "never writes code" | No | n/a |
| [Kiro](https://kiro.dev/docs/specs.md) | Quick Plan asks up front | No (requirements, design, tasks) | n/a |
| [spec-kit](https://www.mintlify.com/github/spec-kit/commands/clarify) | `/clarify`, answers written back into the spec | No | 5, one at a time with a recommended answer (a community variant uses 10) |
| [Anthropic playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook) | None described; the originator writes `intent.md` in their own words and a product owner accepts it | No. `intent.md` is the single intent artifact | n/a |
| tempa-spec | `grilling`, until the frontier is empty | **Yes** | None |

The mattpocock pipeline is inferred from skill descriptions (the page has no diagram). The spec-kit limit comes from third-party mirrors and varies by variant.

## 6. Comparison with Anthropic's AI-native SDLC playbook

[The AI-native SDLC playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook) (Louis Claxton, 21 August 2026) is vendor guidance. It has six stages (plan, design, build, test, deploy, maintain). Each stage ends by committing one artifact the next stage reads: `intent.md`, `spec.md`, `plan.md`, the diff with its tests, the review findings, the incident record. Its thesis: coding is no longer the slow step; planning, review, and deployment still run at human speed, so "the loop keeps running; human judgement stays above it".

It gives no measured outcomes. Its figures are targets ("hours" instead of a multi-week elicitation cycle, review "to minutes"), and it promotes Anthropic products. Treat it as one more design convergence point, with the same evidential weight as the tools in [§5](#5-how-other-tools-treat-discovery), not as an experiment.

| Playbook element | tempa-spec today | Reading |
|---|---|---|
| One intent document in the originator's words, accepted by an owner; replaces backlog entries, stories, and refinement meetings | `discovery.md` plus `proposal.md`, both agent-written after an interview | Supports one intent artifact (R1). Difference: the playbook describes no interview; here the interview replaces the originator writing the text, so keep it, capped. |
| Requirements and design produced in one session into `spec.md` | `specs/` and `design.md` separate, each with its own review | The playbook merges further than R1-R9 do. Not adopted: OpenSpec needs one delta file per capability for archive, and the Lead reads specs and design in that order. A possible later step, not a recommendation. |
| `plan.md` accepted before any build, checked against the diff | `tasks.md`, `align`, and `apply`'s "no scope drift" check | Already matched and exceeded (seams, the change-size rule). |
| Human gates sit at artifact boundaries; "human attention concentrates at the gates, reviewing what the agent flagged rather than starting each stage from scratch" | Per-item questions inside phases, then a walkthrough listing every file | Supports the digest (R2) and a focused walkthrough (R5). |
| "Agents can't approve their own work"; code owners approve | Reviewer subagents of the same model re-judge the author's draft; the human accepts at the walkthrough | The playbook adds no model-reviewing-model stage before the human gate. Weak support for thinning R4. |
| Every task has a quantifiable done state and a command that exits non-zero on failure | `tdd` RED/GREEN at apply time; `tasks.md` states no done condition | Supports R3. |
| Bug fixes start from a failing test the agent cannot weaken; hooks block edits to test files during fix tasks | Weak-oracle gate and `tdd` anti-patterns, as skill text | The playbook enforces with a hook, which is deterministic. Its own caution: a skill is "a control, though an advisory one"; a rule that must always hold needs a hook. Several MUSTs here exist only as skill text. Out of scope for R1-R9, worth a later look. |
| Evals run in CI whenever `CLAUDE.md`, skills, or hooks change; start with 20-50 real tasks; each incident becomes a regression eval | None. CHANGELOG: "no benchmark harness, no measured evidence" | The largest gap. Basis for R7. |
| Layered PR review driven by `REVIEW.md`, capped at "at most five nits per review" | `apply` Phase 2: up to 3 passes, a 12-item smell baseline, LOW findings batched | Supports capping low-value output (added to R2). |
| Parallel sessions: "two or three is a sensible starting point"; add more "only while review is keeping up" | `apply` concurrency = min(cores / 3, available GB / 2) | The playbook bounds parallelism by review capacity; this schema bounds it by hardware. Reasonable to read the hardware figure as an upper limit, not a target. Minor. |
| Policy applied while drafting the spec rather than found in review | `hrt-security-pass` at specs and design | Matched. |
| One source of truth per artifact | A decision restated across up to five documents | Supports removing the restatement (R1). |
| A verifier subagent with fresh context checks before a session reports done | `apply` Phase 2 fresh-context review | Matched. Keep. |

What the playbook does not cover: how many questions an intake interview should ask, seams as a test boundary, task-to-scenario traceability, and splitting an oversized change. tempa-spec has explicit mechanisms for those, none of them measured.

## 7. Lean principles the maintainer prioritizes, applied to tempa-spec

The maintainer prefers a lean approach and pointed to a design document they wrote for a different tool (an agent-skill package that runs a developer procedure on GitLab; private repository, dated 2026-09-29). That tool is not comparable to tempa-spec: it orchestrates a process over structured repository state, while tempa-spec authors prose artifacts. So it is **not** used as a benchmark here. It is used for one thing only: it states which Lean principles the maintainer chooses to prioritize. Those principles are then used as a lens on tempa-spec. Internal details of that document are left out because this repository is public.

### 7.1 The principles and what each implies

The document frames its goals as three pillars: **Jidoka** (build quality in; stop and escalate on an abnormality), **JIT** (flow without waste), **Kaizen** (standards improve from real incidents). Six of its ten design principles bear directly on tempa-spec:

| Principle as stated | What it implies for tempa-spec | Recommendation |
|---|---|---|
| **Checks are deterministic; the model orchestrates, explains, and drafts.** A check gives the same result on the same input and covers form only; substance stays with the human reviewer. | Prefer a mistake-proofing check over a model inspecting afterwards. Where a link can be verified by a script (scenario to task), do not leave it to model judgement. Model judgement is for what a script cannot see. | R3, R4 |
| **One confirmation per intent.** Frequent confirmation makes people approve without reading; independent questions are asked together. | Per-item prompts in four loops are the pattern this principle rejects. A 90% "yes" rate is the symptom this principle describes. Batch the independent ones; stop individually only where a wrong "yes" is costly. | R2, R5 |
| **Rules are added because of incidents or reports, not guesses**, ordered by frequency times impact, to keep the tool from growing into new bureaucracy. | Every gate should say why it exists. Several v13 and v14 additions are labelled in the CHANGELOG "not yet exercised on a real change", which makes them guesses by this test. | R8 |
| **No bypass, always an andon** (a stop-and-report signal). When blocked, there are two exits: escalate (the rule is right, the case is special) or file a reproducible report (the rule is wrong). | A wrong or noisy gate needs a place to be reported with its input and output. This keeps "no bypass" intact, since the gate still ran, and it feeds the data that Kaizen needs. | R8 |
| **State is read from the source of truth, not stored in new files.** | The same decision restated in up to five documents is stored state that can go stale. One home per fact, others point to it. | R1 |
| **Real control lives on the server; the tool is an assist layer.** | A rule that must always hold should not depend on a prompt being followed. The usual analogue would be running the lint in CI; the maintainer does not want that. The lint stays run by the skills and by hand, and `align` records whether it ran clean. | decided: no CI |

Two further points from the same document apply as cautions:

- **Kaizen needs data.** The document names Pareto ordering and defers one limit "until data is collected". For tempa-spec the data does not exist yet, which is why R7, a measurement habit outside the schema, should start alongside the changes.
- **Work in progress is bounded by review capacity.** Agents speed up writing; the reviewer's capacity does not grow. This matches the playbook ([§6](#6-comparison-with-anthropics-ai-native-sdlc-playbook)) and suggests reading `apply`'s hardware-based concurrency limit as a ceiling, not a target.

### 7.2 Waste lens

This uses the standard Lean waste types, not a list taken from that document.

| Waste | Instance in tempa-spec | Addressed by |
|---|---|---|
| Overproduction | `discovery.md` copies the interview; decisions are restated in `proposal.md`, `align.md`, `mr-brief.md` | R1 |
| Waiting | Per-item prompts; up to three walkthrough cycles | R2, R5 |
| Over-processing | Three layers of model review (authoring, `align`, VERIFY) plus a `humanizer` pass over reviewer output | R4, R6 |
| Inspection instead of prevention | Task coverage checked by an LLM grep instead of a deterministic link | R3 |
| Unused knowledge | No record of when a gate fired wrongly or was overruled | R7, R8 |

### 7.3 What the lens cannot decide

- Lean says what to remove and how to control quality. It does not say whether a given check catches real defects. That needs the measurement in R7.
- The principles apply to the recommendations themselves. Most of R1-R6 remove or replace something. The additions (`Covers:` lines, a digest, an origin table) are justified only because each one retires something larger: a model check, a stream of prompts, or a set of unproven gates. If an addition does not retire something, it should be dropped. R7 is the exception: it adds a small measurement log, because nothing here can be judged without one.
- Deterministic checks cover the form half of specs and designs (existence, references, counts). The meaning half stays with people and, at most, one model reviewer. tempa-spec's lint already stops at that line.

## 8. What `discovery.md` actually does here

| `discovery.md` section | Already covered by |
|---|---|
| Desired Outcomes | `proposal.md` Why |
| Key Decisions (scope, rationale, rejected alternatives) | `proposal.md` What Changes; `align.md` copies decisions with source pointers |
| Open Questions | `design.md` Open Questions |
| Assumptions | no other home |

A one-to-one fold, with a proposal section for every discovery heading, would bloat the proposal. Only one discovery section has no home: Assumptions. Outcomes belong in Why, scope decisions are already What Changes with a reason, product-level open questions are rare once the interview has converged (technical ones go to `design.md`), and rejected scope alternatives matter mostly where someone would re-litigate them, which is what Out of Scope is for. So the proposal needs at most one new optional section, not three.

Readers of `discovery.md`: the proposal draft subagent (grounding), the proposal Destructive Critic ("does every claim trace to discovery.md"), `align`'s `discovery -> proposal` dimension, and `hrt-change-size-gate` / `BACKLOG.md`. Two of those four exist only because the file is separate. The Lead rarely reads it (maintainer, 2026-10-21), so no regular human review depends on it.

The interview is the valuable part. The document is a copy of the interview's conclusions that the proposal mostly repeats.

The one real dependency: `hrt-adversarial-authoring` reviews a proposal against `discovery.md` because "nothing else exists yet to check it against". Remove the file and that anchor is gone.

## 9. Two maintainer observations that change the picture

**Reviewer priority.** The Lead's order is specs, then design, then whether tasks are aligned and meet TDD. The Lead rarely reads discovery. The proposal is different: the maintainer reads it as the entry point to why a change exists, so it matters, but it must not bloat. Consequences:

- Model review effort should follow that order: specs and design get the adversarial pass. The proposal is kept short and checked by the lint (size and shape rules), then read and confirmed by the user, instead of getting a three-subagent review.
- The TDD-readiness question ("does every scenario have a task, and can that task be driven RED at the right seam?") is answered today by the weakest mechanism. `lint.cjs` already checks that each design `Covers:` target exists in specs. It does not check tasks at all; `align`'s `specs -> tasks` dimension is an LLM grep, and `templates/tasks.md` is a bare checkbox list.

**Acceptance rate.** More than 90% of the questions surfaced to the maintainer are answered "yes" to the recommendation. This is self-reported, not logged. It has two possible readings:

1. The questions are noise: the agent already knows the answer and the prompt only costs time.
2. The review has collapsed into rubber-stamping, the failure `2026-07-16-align-phase-human-review-gate.md` and the lights-off study warn about.

Both lead to the same fix: stop asking item by item for things that are almost always accepted, and move the real human attention to a place where it is cheap to do well (a short digest, and a walkthrough focused on specs, design, and the coverage table).

## 10. Recommendations: changes to tempa-spec

This section lists the changes to make in tempa-spec itself: the schema, the templates, the skills, and the lint. Measurement habits and parked ideas are in [§10.2](#102-follow-ups-outside-the-schema). Every remaining phase still runs. R1 removes one phase by merging it, and the others reduce volume, replace judgement with deterministic checks, or drop a review layer. The details follow the action list in numeric order.

### Action list

| ID | Change | Main files | Done when | Depends on |
|---|---|---|---|---|
| R3 | Task coverage by `Covers:` per group, and the threat chain | `templates/tasks.md`, `templates/design.md`, `schema.yaml` (`tasks` instruction), `lint.cjs` and `lint.test.cjs`, `hrt-security-pass` (`references/method.md`), `hrt-align-consistency-review` | The lint reports an ERROR for a scenario no group covers, a `Covers:` that names no scenario, a group with no `Covers:` line, and a threat with neither `Covers:` nor `Verified by:`; tests added for each | none |
| R2 + R5 | Digest resolution, HIGH DECISION findings answered one by one, walkthrough led by specs and design with a size-facts line, LOW cap | `hrt-adversarial-authoring` (step 4), `hrt-align-consistency-review` (step 8 and WALKTHROUGH), `hrt-apply-code-review` (step 8), `templates/align.md` | Skills show HIGH DECISION findings together and require an answer to each; everything else goes in one digest; the walkthrough opens with specs, design and seams, the coverage table, and one line of size facts | none |
| R1 | Remove `discovery`; interview with its cap and checklist inside `proposal`; change-size rule; no `BACKLOG.md`; proposal lint rules; user read-and-confirm replaces the proposal's model review | `schema.yaml` (to v15), `templates/proposal.md`, `templates/discovery.md` (deleted), `hrt-change-size-gate` and `hrt-backlog-reconcile` (deleted), `lint.cjs`, skills and repo files listed in [§10.1](#101-touch-list-for-r1-r5) | The schema validates with five artifacts; no `discovery` reference remains outside past CHANGELOG entries; the lint warns on proposal size and shape; both skill folders are gone and both installers match | none |
| R4 | Review once: `align` keeps only the judgement dimensions, VERIFY runs only on a HIGH | `hrt-align-consistency-review`, `hrt-adversarial-authoring` | The `align` skill lists the five remaining judgement dimensions and the HIGH-only VERIFY trigger | R1, R3 |
| R6 | Cut instruction weight with no evidence (`humanizer` pointers) | `hrt-adversarial-authoring`, `hrt-align-consistency-review`, `hrt-apply-code-review` | No `humanizer` reference remains, or a short local list of tells replaces it | none |
| R8 | Origin table for every gate, and a record for a wrong or overruled gate | `AGENTS.md` (or a new `docs/gates.md`), `templates/align.md` | Every gate and check is listed with its origin (procedure, incident, research, or guess); `align.md` has a place to record an overruled gate | R1-R4 (so the table lists the final gates) |

Suggested order: R3 first (deterministic, independent, serves the Lead's top need), then R2 and R5 (cuts prompts without removing a phase), then R1 with R4, then R6 and R8. Each step needs a CHANGELOG entry, and any change to the skill list needs the installer echo updated in both `.sh` and `.ps1`.

**Maintainer decisions so far (2026-10-21).**

| Question | Decision |
|---|---|
| Interview cap | 4 questions per round, at most 3 rounds (12 in total). Leftovers go to Open Questions. |
| Where `Covers:` goes in `tasks.md` | Per group, on the heading line block beside `Depends on:`. A group is the slice that owns a seam. |
| VERIFY in `align` | Keep, in a lean form: run only when ALIGN raised a HIGH finding. Confirmed after seeing the measurements, which show this skips 3 of 8 productive runs (R4); the loss is accepted. |
| HIGH DECISION findings | Shown together in one message, answered one by one. No "ok all" for these (R2). |
| Security in tasks | Every threat must be answered by a test or a named check, so that it can be shown to be handled: threat, then negative scenario, then group; a change-level threat names its check instead (R3). |
| The proposal | Important as the entry point for why a change exists; must not bloat and must not lose information. Shape as in R1: no Decisions section, one optional "Assumptions & Open Questions" section, Out of Scope also carries rejected scope alternatives. Size: a 1500-word alarm plus shape rules, with completeness handled by the interview checklist and the user's read-and-confirm. Values are to be tuned. |
| Change-size gate | Option B: fold the check into the interview as a short rule in the `proposal` instruction, and drop the skill file. It stays as a guard because developers often attempt big changes. No size threshold for now (false alarms); size facts appear in the walkthrough digest instead. `openspec/BACKLOG.md` and `hrt-backlog-reconcile` are dropped; confirmed after seeing that 4 of 23 recent changes used them. |
| Lint in CI | No. |

**R1. Remove `discovery` as a phase and file; keep the interview inside `proposal`.**
- **Interview.** `grilling` runs at the start of the `proposal` phase, capped at 4 questions per round and 3 rounds (12 in total). What is left is recorded as Open Questions. The cap goes in the `proposal` instruction as an override, since the vendored `grilling` skill must not be hand-edited. The old `discovery` convergence checklist moves with it: every scope decision has a reason, every desired outcome and assumption is written down, every open question is answered or recorded, and the user confirms in their own words. For comparison, spec-kit caps `/clarify` at 5 in total; the value here is untested.
- **Proposal shape.** Close to today's sections: Why (the desired outcomes in one to three sentences), What Changes (scope decisions as bullets, each with a reason), Capabilities, External Dependencies, Impact. Two optional sections, omitted when empty: **Assumptions & Open Questions** (product-level only; technical unknowns stay in `design.md`) and **Out of Scope** (deferred slices, and a rejected scope alternative where someone would otherwise re-open it). There is no separate Decisions section. External Dependencies is not new: it is the structural trigger for the `research` skill and costs one line ("none") for an internal change.
- **Size and completeness.** The proposal is the entry point for why a change exists, so it must stay readable and must not lose information. A word count measures only the first, so the checks are layered:
  - A ceiling, not a target: WARN above 1500 words for the whole file (HTML comments excluded). Measured on 27 real proposals ([§2.1](#21-measured-on-27-real-changes)), a ceiling of 500 would flag 25 of them, 1000 would flag 14, and 1500 flags 4. A ceiling that fires on half of all proposals is a false alarm, so it is set to catch outliers only. It says nothing about completeness.
  - Shape rules aimed at what causes bloat: WARN on a paragraph or bullet over about 100 words; on a code fence, a file path, or a function signature (implementation detail belongs in `design.md`); and on more than 5 bullets under Assumptions & Open Questions. These are deterministic and flag content in the wrong place, not length. The limits are untested.
  - Completeness: the lint already checks required sections and the form of each capability and External Dependencies row. The interview checklist above is the check that nothing was left out, and the user's read-and-confirm of the draft is the last one. A gap that survives tends to surface as a finding in specs or design, and the R7 log would show rework caused by missing information.
  - A cap written only in prose does not hold: two repositories already say 800 and 1000 words in their `rules:` and most proposals exceed it. The lint is what makes the ceiling real. Downstream rules explain only part of why proposals are long (R9).
- **Review.** Replace the three-subagent adversarial pass on the proposal with `hrt-artifact-lint` plus one explicit read-and-confirm by the user of Why, What Changes, Assumptions & Open Questions (when present), and Out of Scope. The reason is grounding, not priority: with `discovery.md` gone there is no written upstream for a model reviewer to check the proposal against, and the user already stated the premise in the interview. The External Dependencies "no" row rule stays lint-checked.
- **Change-size rule (replaces the `hrt-change-size-gate` skill).** A short rule in the `proposal` instruction: if the interview shows two or more independent, separately shippable slices, ask once "one change or several?", default to one change, never split without the user's answer, ask even in dark mode, and list deferred slices under Out of Scope. It is an ordinary interview question and counts toward the 12. Its purpose is protection, because developers often attempt big changes (observed by the maintainer, not logged). It is related to, but not the same as, the `wayfinder` skill in mattpocock's set, which turns work too large for one session into a map of decision tickets; this rule splits a bundle into separate changes.
  - `openspec/BACKLOG.md` and the `hrt-backlog-reconcile` skill: the maintainer decided to drop them as rarely used. The measurement in [§2.1](#21-measured-on-27-real-changes) showed some use (4 of 23 recent changes deferred slices there, 18 entries in total, in 2 of 3 repositories), and the maintainer confirmed the drop after seeing it. Deferred slices then live only in the proposal's Out of Scope, which is archived with the change and harder to rediscover.
  - Known gap: the rule fires on independent slices only, so a large change whose parts depend on each other does not trigger it. A threshold on counts (for example more than 3 capabilities) would catch it but would also fire on legitimate large changes, and false alarms train people to ignore the question. No threshold for now. Instead the size is shown as plain facts (capabilities, scenarios, task groups) in one line of the walkthrough digest (R5), without a verdict. The same numbers feed R7, and a threshold can be set later from data on which changes turned out too big.
  - Considered and not chosen: keeping the skill as is (cheap when silent, but it runs after the interview and carries the backlog machinery), and removing the check (loses the one explicit stop on a bundle of stories).
- The files this touches are listed in [§10.1](#101-touch-list-for-r1-r5).

**R2. Replace per-item prompts with one digest per artifact.**
- Findings that need their own answer: every HIGH DECISION finding, a one-way door (the `hrt-mr-brief` Door definition), a change to scope already settled in the proposal, and a High-severity security trade-off. They are shown together in one message, each with the trade-off first and the recommendation second, and the user answers each one; "ok" does not cover them. This keeps the explicit decision and removes the waiting between items.
- HIGH DECISION findings are few: 18 across 25 real changes, none in 72% of them, at most 5 in one ([§2.1](#21-measured-on-27-real-changes)). Showing them together and answering one by one therefore costs little, and R3 should reduce them further by turning coverage gaps into lint errors.
- Everything else (MEDIUM and LOW DECISION findings, suggested improvements): the recommended resolution is listed once, with the reason, in a digest, and "ok" accepts all. The user names exceptions.
- This keeps the human gate (nothing is applied silently, which preserves the existing rule that a single-reviewer unanchored finding never auto-resolves) while removing the per-item round trips. Apply it in `hrt-adversarial-authoring` step 4, `hrt-align-consistency-review` step 8, and `hrt-apply-code-review` step 8.
- Cap low-value output, as the playbook does with its five-nit limit: at most a small fixed number of LOW findings shown per review pass (start at 5; the number is a choice for the maintainer).

**R3. Make task coverage deterministic.**
- What `Covers:` is for: a line that says which scenarios a group delivers. It gives the lint something to check (every scenario has a group, every `Covers:` names a real scenario), gives the Lead a table, and tells `apply` which scenarios' RED tests belong to the group. `design.md` already names the seam for each scenario, so the chain scenario to seam to group needs no extra seam field in `tasks.md`.
- Where: one line under the group heading, beside `Depends on:` (maintainer decision), because a group is the vertical slice that owns a seam. Scenario names are separated by semicolons, since a name may contain a comma. Prefactor and expand/migrate/contract groups change structure only and write `Covers: none`.
- `lint.cjs` reports an ERROR for a scenario in `specs/` that no group covers, for a `Covers:` name that matches no scenario, and for a group with no `Covers:` line. The `[negative]` and `[security]` tags stay as markers for the review lenses.
- Security: every threat must be shown to be answered, by a test where one can exist. Two forms, both checked by the lint. (1) A threat that belongs to a capability ends with `Covers: <negative scenario name>`; the scenario is in that capability's spec, and the group that delivers it covers it in `tasks.md`. `hrt-security-pass` already requires this trace in prose (method section 3); the lint would make it a check, extending its design `Covers:` resolution from Shape / Seams to the threat lines. (2) A change-level threat that fits no capability (a new dependency, a secret in the repository) ends with `Verified by: <command or check>`, for example the scanner or license check `apply` runs, and a group in `tasks.md` carries a task with the `[security]` tag that runs it. Today such a threat needs no scenario and only a task; the named check is what makes it provable. A threat with neither form is a lint ERROR. No new reference type or threat id is needed. In the one design read in full, all 6 threats already had a matching negative scenario; this is a single sample.
- The Lead gets a short scenario to group to seam table as proof of TDD readiness; it can be generated from the links. `align`'s `specs -> tasks` and design-to-tasks threat dimensions stop needing judgement.

**R4. Review once, where it matters.**
- Keep the adversarial pass for `specs` (testability is the first thing the Lead reads) and `design` (decision and seam quality, the thing `align` does not judge). Keep the existing thin-design shortcut.
- Drop it for `proposal` (R1).
- Make `align` the single cross-artifact check and remove from it what the lint now covers (R3). Judgement dimensions that remain: proposal vs design, specs vs design, specs vs seams, design/tasks vs codebase, tasks graph. Gone or deterministic: discovery vs proposal, specs vs tasks, the design-to-tasks threat check (through R3's threat chain), spec structure.
- VERIFY (the fresh-context re-check inside `align`): kept, in the lean form the maintainer chose: it runs only when this cycle's ALIGN raised at least one HIGH finding. Today it also runs on any MEDIUM, any LOW DECISION, or a lint ERROR. The measurements in [§2.1](#21-measured-on-27-real-changes) show what this costs: on 47 real runs, HIGH-only skips 3 of the 8 productive ones, including one that found a HIGH ALIGN had missed; HIGH-or-MEDIUM would skip 1 of 8, and today's rule skips none. The maintainer confirmed HIGH-only with these numbers in view. Only 8 productive runs exist, so recheck with the R7 log and widen the trigger if misses show up. The human WALKTHROUGH that follows is the remaining backstop.

**R5. Point the WALKTHROUGH at what the Lead reads.** Show a one-page digest led by specs, then design/seams, then the R3 coverage table, instead of a list of every file. Add one line of size facts (capabilities, scenarios, task groups) with no verdict. The single-question rule and the "silence is not an answer" rule stay.

**R6. Cut instruction weight that has no evidence.**
- `humanizer` (30 KB, cited in three places) is vendored and must not be hand-edited. Either drop the pointers or replace them with a short local list of tells.
- Keep what has evidence or an incident behind it: the lint (deterministic), the codebase-claim check in `align` (repository grounding is the best-supported lever in [§4](#4-external-evidence-on-effectiveness)), seams with RED output in `apply`, the weak-oracle gate.
- Do not cut `hrt-security-pass` or `hrt-mr-brief` now, but tag them through R8. They are conditional or cheap when not triggered, and the CHANGELOG records that neither has run on a real change yet. Judge them after they have. (The change-size gate is handled in R1.)

**R8. Tag every gate with its origin, and give wrong gates a reportable path.**
- Keep one table of the schema's gates and checks (the lint rules, `align` dimensions, review passes, the change-size rule, the security gate). Give each an origin: **procedure** (a written rule it enforces), **incident** (something that happened, with a pointer), **research** (a cited finding), or **guess**.
- Rule: a gate tagged guess that has not fired on a real change after an agreed number of changes (the number is the maintainer's choice) is a removal candidate. This applies the "incidents, not guesses" principle ([§7](#7-lean-principles-the-maintainer-prioritizes-applied-to-tempa-spec)) and turns the CHANGELOG's "not yet exercised on a real change" into a tracked state instead of a footnote.
- Path for a wrong or noisy gate: a short record with the gate, its input, its output, and what the user did (accepted, overruled, edited). This keeps "no bypass" intact, since the gate still ran, and it supplies the incident data R7 needs. This does not weaken the review skills' rule that "defer it" is not a resolution for a finding. It covers a different case, where the gate itself is wrong.

**Not recommended.** A per-change skip path (use `minimalist` for small changes, or skip planning when the diff is describable in one sentence; Anthropic's best-practices page does say "if you could describe the diff in one sentence, skip the plan"). The maintainer has declined skip paths before; with the interview merged and review thinned, the full pipeline should be light enough. Revisit only if R1-R5 do not fix the load.

### Resulting flow

| Phase | Checks after R1-R5 |
|---|---|
| `proposal` (starts with the capped interview, including the change-size question) | Lint (structure, size, shape); the user's read-and-confirm |
| `specs` | Lint; adversarial pass (Critic and Auditor); security pass if a boundary is touched |
| `design` | Lint; adversarial pass (Critic, plus Auditor unless the design is thin); security pass |
| `tasks` | Lint, including `Covers:` and the threat chain |
| `align` | One cross-artifact check; VERIFY only on a HIGH; walkthrough as a digest |
| `apply` | TDD with RED output; fresh-context review; `mr-brief.md` |

### 10.1 Touch list for R1-R5

Derived from a search for "discovery", "change-size-gate", and "backlog" across the repo, plus the files R3 and R5 change. Past CHANGELOG entries stay as history.

- **Remove:** `templates/discovery.md`; the `hrt-change-size-gate` skill folder; the `hrt-backlog-reconcile` skill folder.
- **`schema.yaml`** (to v15): drop the `discovery` artifact; `proposal` loses `requires: [discovery]` and gains the capped interview, the convergence checklist, and the change-size rule; the `tasks` instruction gains `Covers:`; the `align` and `apply` instructions lose their `discovery.md` references.
- **Templates:** `proposal.md` (optional sections), `tasks.md` (`Covers:` line), `design.md` (threat line form with `Covers:` or `Verified by:`), `align.md` (one `discovery` mention).
- **Skills:** `hrt-align-consistency-review` (drop the `discovery -> proposal` dimension and its re-read, VERIFY trigger, digest walkthrough with size facts, deterministic coverage); `hrt-adversarial-authoring` (no pass on the proposal, grounding inputs, digest resolution); `hrt-apply-code-review` (digest resolution); `hrt-artifact-lint` and `lint.test.cjs` (proposal size and shape WARNs, `Covers:` rules including `Covers: none`, threat `Covers:` and `Verified by:`); `hrt-security-pass` (`references/method.md`, threat line form); `hrt-dark-mode-opt-in`, `hrt-dark-mode-decision-gate`, `hrt-dark-mode-routing`, `hrt-mr-brief`, and `plain-language-writing` (each mentions `discovery` or the gate).
- **Repo files:** `AGENTS.md` (discovery, backlog, and gate paragraphs), `README.md`, both installers (the skill echo, kept in step per `AGENTS.md`), and a new `CHANGELOG` entry.
- **Pointer form:** `align.md` entries that cite "discovery.md > Key Decisions" would cite "proposal.md > What Changes" or "proposal.md > Out of Scope".
- **Not touched:** `lint.cjs` has no `discovery` references today, and neither do the scripts.

Dark mode needs its own check: it is defined as autonomy "after discovery", and its planning-only variant "covers discovery through align". Its entry point moves to the end of the proposal interview. Changes in flight that already have a `discovery.md` need a transition rule.

### 10.2 Follow-ups outside the schema

These are not changes to tempa-spec. They support or follow the changes above.

**R7. Measure before changing, starting small.**
- **Step 1, no schema change.** For the next 3 to 5 real changes on the current schema, keep a hand log with one row per change: interview questions asked, minutes per phase (your own estimate), how many surfaced items were answered "yes" as recommended and how many were changed, HIGH DECISION findings, `align` cycles, proposal word count, and the size facts (capabilities, scenarios, task groups). This is the baseline that R1-R6 are compared with. For archived changes, the HIGH DECISION count can be read from `align.md`, for example `awk '/^#### /{h=($2=="HIGH")} h && /\[DECISION\]/{c++} END{print c+0}' openspec/changes/archive/<change>/align.md`, which counts `[DECISION]` lines under the HIGH heading.
- **Step 2.** After about five rows, tune the untested values (interview cap, proposal ceiling and shape limits, number of LOW findings shown per pass; start the last at 5, the playbook's nit cap). Change a value only when at least three of the five rows show the same pain. Once R5 is in place, the lint can print the size facts and word count so that part of the log fills itself.
- **Step 3, only if the log is not enough.** Build a replay set in the playbook's style (it suggests 20 to 50 real tasks, rerun whenever instructions, skills, or hooks change). A case can be small: a change brief, the repository state, and the expected artifacts and prompts in plain words. Use deterministic outcomes (hidden tests, human minutes) rather than an LLM judge; `2026-09-07-llm-as-judge-reliability-2026.md` explains why.
- Prompts per change and minutes per phase are not in archived artifacts, which is why step 1 records them on new runs.

**R9. Design and specs volume (parked).**
- Measured: design is 30% and specs 26% of all words, and Decisions is about half of each design ([§2.1](#21-measured-on-27-real-changes)). The Lead reads specs and design most closely, so this is where reading time goes.
- The first idea was that downstream `rules:` blocks drive the size. The comparison in §2.1 does not support that as the main cause: repository B, whose rules ask for nothing in the proposal, specs, or design, still has proposals of about 900 words, designs of about 3000, and the longest specs. Repository A, with heavy content rules, has a design about 50% longer. So the base size comes mostly from the schema's own sections and from how models write, and rules add a moderate amount at most.
- Decision: no change now. After R1-R8 are in and the R7 log exists, if reading volume is still the pain, the likely lever is the `design` instruction (for example, write a Decision only when a real alternative existed, and keep Risks / Trade-offs to real threats and risks), judged against the log. One cheap optional step in the meantime: in a repository whose `rules:` ask for the same topic in several artifacts (threat model, observability, privacy), name one home for each topic. This is the downstream team's call, and the expected effect is modest.

## 11. Before and after, and impact

"Before" is schema v14 as read on 2026-10-21. "After" is the schema with R1-R5 applied (R6, R7, and R9 do not change the pipeline shape; R8 appears in its own row). Counts marked *derived* come from reading the instructions; the others come from the measurements in [§2.1](#21-measured-on-27-real-changes).

### 11.1 What changes

| Aspect | Before (v14) | After (proposed v15) | Impact |
|---|---|---|---|
| Schema artifacts | 6 (discovery, proposal, specs, design, tasks, align) plus `apply` | 5 (proposal, specs, design, tasks, align) plus `apply` | One phase and one template removed. |
| Reading volume per change | Median about 13,200 words (27 real changes) | About 12,100 after `discovery` goes (minus 8.5%); more only if R9 trims design or specs | R1-R8 mainly cut interactions and subagent runs, not reading volume. Design and specs carry 56% of the words. |
| Documents read per change | 7 (adds `mr-brief.md`) | 6 | Fewer files; the reasoning log lives in `proposal.md`. |
| Intake | `grilling` as its own phase, no question cap, convergence checklist, then write `discovery.md`; the change-size gate runs later, inside `proposal` | `grilling` opens the `proposal` phase with a cap (4 per round, 3 rounds); the convergence checklist and the change-size question move into it; leftovers become Open Questions | Question count bounded (the cap value is untested). The write-up step and the separate gate disappear. |
| `proposal.md` content | Why, What Changes, Capabilities, External Dependencies, Impact | Outcomes inside Why; one optional Assumptions & Open Questions section; Out of Scope also carries rejected scope alternatives; External Dependencies is one line when internal | Near-zero growth for a typical change; the size budget is enforced by the lint. Scope decisions lose a dedicated home, so rejected alternatives are kept only where they would be re-opened. |
| Proposal review | Draft plus two reviewers (3 subagents), traced to `discovery.md` | `hrt-artifact-lint` (including a size budget) plus one explicit read-and-confirm by the user; the interview answers are the grounding | 3 fewer subagent runs. Loses a model-run premise challenge (see risks). |
| Specs review | Draft plus Critic plus Auditor | Unchanged | Lead's first priority stays fully reviewed. |
| Design review | Critic, plus Auditor unless the design is thin | Unchanged | Seam and decision quality stay reviewed. |
| `tasks.md` | Bare checkboxes; coverage judged by an LLM grep in `align` | `Covers:` per group (`Covers: none` for structure-only groups); threats reach tasks through a negative scenario or a named check; lint checks both directions | A scenario with no group fails before `align`. Small extra writing per group. |
| `align` | LLM judgement across every dimension plus lint, a VERIFY subagent, a walkthrough that lists every file | Judgement on five dimensions (proposal vs design, specs vs design, specs vs seams, design/tasks vs codebase, tasks graph), lint for the rest, VERIFY on a narrower trigger (R4), the threat-to-task check deterministic through R3's chain, walkthrough as a one-page digest | Fewer judged items, fewer subagent runs, a walkthrough shaped like the Lead's reading order. |
| Human prompts | Per-item in four loops (interview, adversarial findings in three phases, `align` DECISIONs, `apply` DECISIONs) | Interview within its cap; one digest each for specs, design, `align`, and `apply` review; individual answers (shown together in one message) for HIGH DECISION findings, one-way doors, settled-scope changes, and High security trade-offs | Routine stops become bounded. If the 90% figure holds, most per-item prompts disappear. Not measured. |
| Subagents before code | About 8-10 *derived* (proposal 3, specs 3, design 2-3, VERIFY per cycle) | About 5-6 *derived* (specs 3, design 2-3, plus 1 for each `align` cycle that meets the VERIFY trigger) | Roughly a third to 40% fewer. |
| Instruction text removed | n/a | The `discovery` block in `schema.yaml` (2.9 KB), the VERIFY section in the `align` skill (2.0 KB), the `hrt-change-size-gate` skill (4.9 KB), and the `hrt-backlog-reconcile` skill (3.0 KB), all measured, plus the discovery template and the proposal branches of the adversarial skill | About 13 KB of roughly 88 KB of schema plus `hrt-*` text, offset by the short change-size rule, the new proposal sections, and the digest and `Covers:` rules. Modest. The main saving is in interactions and subagent runs, not tokens of instruction. `humanizer` (30 KB, R6) is the larger text lever. |
| Audit trail | `discovery.md` Key Decisions, cited by `align.md` source pointers | The relevant `proposal.md` section (What Changes or Out of Scope), cited the same way | Same trail, one file fewer. Changes in flight need a transition rule. |
| Lead's review | Reads artifacts without a stated order | Digest led by specs, then design/seams, then the coverage table | Matches the stated priority. |
| Dark mode | Defined as autonomy after `discovery` | Entry point moves to the end of the proposal interview | Needs its own review; effect unknown. |
| Gate governance | No record of why each gate exists or whether it ever fired | One origin-tagged table (R8); guess-class gates that never fire become removal candidates; wrong-gate reports feed the R7 log | Slows the growth of the schema; adds one small table to maintain. Effect on load not measured. |
| Cost to implement | n/a | About 25 files: 3 removed and about 22 edited (see [§10.1](#101-touch-list-for-r1-r5)), plus a version bump | A moderate change; best split along the action list (R3, then R2 with R5, then R1 with R4, then R6 with R8). |

### 11.2 Expected benefits

- Lower interaction load: bounded interview, digests instead of per-item prompts, a walkthrough built around the Lead's reading order.
- Lower model-run load: about 3-4 fewer subagent runs before code.
- Better TDD readiness: a deterministic scenario-to-task link that exists before `apply` and that the Lead can read as a table.
- Less duplication: one document for scope rationale, one cross-artifact check.

### 11.3 Risks and losses

- **Proposal premise check.** The adversarial proposal review is also where a wrong premise could be caught by a model. After R1 only the user catches it. Mitigation: the interview is the user's own statement, and specs and design reviews still run on top of it. Residual risk: a misunderstood premise travels one phase further before anything flags it.
- **Digest rubber-stamp.** One "ok" is easier to give than ten answers, so the 90% observation could become 100% unread acceptance. Mitigation: individual answers for HIGH DECISION findings and the other high-stakes categories, exceptions named in the digest, and the focused walkthrough. Measure the share of digests that change anything (R7).
- **Lean VERIFY.** With the HIGH-only trigger, 3 of the 8 productive runs in the sample would have been skipped, one of them a HIGH that ALIGN had missed. The consequence gate was designed to be backed by this recheck (CHANGELOG 2026.9.10). Accepted by the maintainer; the human WALKTHROUGH remains. Revisit with the R7 log.
- **Proposal size and shape rules.** Rules that are too tight make authors cut the rationale that justifies the change. They are WARNs, never errors, and the values are to be tuned on real proposals.
- **Thinner decision record.** Without a Decisions section, the reasons for scope choices live in What Changes bullets and Out of Scope only. A later reader or `apply` has less rationale to follow. Mitigated by keeping the reason beside each What Changes bullet; widen the proposal only if R7 shows rework from missing rationale.
- **Interview cap.** Even 12 questions can push real ambiguity into Open Questions that then surface later and cost more. The value needs checking on real changes.
- **Transition.** Changes already in flight have a `discovery.md`; downstream repos on an older schema version need clear handling.
- **Evidence.** The convergence argument is design reasoning, not a measured result. See [§12](#12-confidence-and-open-questions).

### 11.4 How to tell it worked

Using the R7 log, compare before and after on two groups of measures.

- **Load (should fall):** human prompts per change, minutes per phase, subagent runs, tokens, number of documents read.
- **Quality (must not worsen):** HIGH findings in `apply` Phase 2, `align` cycles needed, rework requested by the Lead after review, defects found after merge, share of scenarios with a task and a RED test.

If load falls and quality holds, the simplification is justified. If quality worsens on any guard measure, restore the specific layer that guard points at (for example the proposal review or VERIFY) instead of reverting the whole change.

## 12. Confidence and open questions

**Confidence**

- **No ablation.** The case for removing `discovery` rests on convergence among tools (now including the playbook) and on duplication visible in the files, not on an experiment. Medium confidence. The case for R3 (deterministic over judged) is stronger because it replaces a known-weak check with a cheaper reliable one.
- **The playbook is vendor guidance** with qualitative targets and no outcome data. It strengthens the direction but adds no proof.
- **The 90% figure is self-reported.** R7 would confirm it and give the baseline.
- **External sources are mostly abstracts and summaries**, and several are preprints. Treat the cost and diminishing-returns findings as direction, not magnitude.
- **HIGH DECISION findings per change are measured** at 18 across 25 changes (median 0, maximum 5), so R2 stays cheap; recheck with the R7 log once R3 is in place.
- **Verified:** the guidance "if you could describe the diff in one sentence, skip the plan" is on Anthropic's best-practices page. It is a skip path, so it is not adopted (see Not recommended).
- **Artifact sizes, `align` cycles, and VERIFY outcomes are measured** on 27 real changes in three repositories, with a heuristic parse of free-form `align.md` files ([§2.1](#21-measured-on-27-real-changes)). Subagent and prompt counts are derived from reading the instructions.

**Gaps accepted for now**

- A large change whose parts depend on each other does not trigger the change-size question; it relies on the Lead's review and the size facts in the digest (R1, R5).
- VERIFY runs only on a HIGH, so a wrongly demoted LOW is not rechecked when nothing else was HIGH, and 3 of the 8 productive runs in the sample would have been skipped (R4).
- With `BACKLOG.md` dropped, deferred slices live only in archived proposals and are harder to rediscover (R1).
- The threat rule in R3 was checked on one design read in full (6 of 6 threats had a matching negative scenario); the lint's first run on the other designs will show the rest.

**Open, and how each closes**

- **Untested values** (interview cap of 4 per round and 3 rounds, the proposal shape limits, and LOW findings shown per pass). The proposal ceiling is set from real data (1500 words). Ship the rest as defaults that only warn, keep each in one place so tuning is a one-line edit, and tune them from the R7 hand log after about five real changes.
- **Hooks for must-hold rules.** Anthropic's page confirms the distinction: an instruction is advisory and a hook is deterministic. But this schema installs for many coding agents, and a hook is specific to one tool, so the installer cannot provision it. Park this. Tag the candidate rules (no commit in `apply`, no test-file edits during a fix task) with their origin under R8. If an incident recurs, offer a hook as an optional per-tool add-on. Both rules can already be checked after the fact, by the review in `apply` Phase 2 and the weak-oracle gate.
- **R9 is parked** until the R7 log shows whether design and specs size is still the pain after R1-R8.

## 13. Sources

1. Gloaguen et al., "Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?" arXiv:2602.11988. https://arxiv.org/abs/2602.11988
2. "Spec Kit Agents: Context-Grounded Agentic Workflows." arXiv:2604.05278. https://arxiv.org/abs/2604.05278
3. Edwards and Schuster, "Ask or Assume? Uncertainty-Aware Clarification-Seeking in Coding Agents." arXiv:2603.26233. https://www.alphaxiv.org/abs/2603.26233
4. "Two Calls Beat Five Agents: Evaluating Multi-Agent Pipelines Against Self-Refinement for Local Language Models." arXiv:2607.26922. https://arxiv.org/pdf/2607.26922
5. Thoughtworks Technology Radar, "Spec-driven development." https://www.thoughtworks.com/radar/techniques/spec-driven-development
6. intent-driven-dev/openspec-schemas. https://github.com/intent-driven-dev/openspec-schemas
7. mattpocock/skills. https://github.com/mattpocock/skills
8. Fission-AI/OpenSpec, workflows. https://github.com/Fission-AI/OpenSpec/blob/main/docs/workflows.md
9. Kiro, specs documentation. https://kiro.dev/docs/specs.md
10. spec-kit, `/speckit.clarify` (third-party mirror). https://www.mintlify.com/github/spec-kit/commands/clarify
11. Anthropic, Claude Code best practices. https://code.claude.com/docs/en/best-practices
12. Claxton, "The AI-native SDLC playbook," Anthropic, 21 August 2026. https://claude.com/resources/articles/the-ai-native-sdlc-playbook
13. Maintainer's design document for a different tool (private repository, dated 2026-09-29), used only as a statement of the Lean principles the maintainer prioritizes.
14. Earlier passes in this repo: `2026-07-12-skills-and-schema-benchmark.md`, `2026-07-16-align-phase-human-review-gate.md`, `2026-08-17-dark-factory-autonomous-approval-mode.md`, `2026-09-07-llm-as-judge-reliability-2026.md`.
