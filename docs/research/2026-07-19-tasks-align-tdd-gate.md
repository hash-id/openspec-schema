# Research: "tasks/align as key to TDD" feedback — positive/negative/security task splits + align as a coverage gate

**Date:** 2026-07-19
**Scope:** evaluate external feedback proposing three changes to `openspec/schemas/hash/schema.yaml`: (1) `tasks` must explicitly split checkboxes into positive-case / negative-edge-case / security-mitigation tasks, with every `[Threat] → Mitigation` entry in design.md getting its own negative-test task; (2) `align` (via `hrt-align-consistency-review`) becomes an automatic gatekeeper that blocks the workflow if any negative scenario or threat lacks a covering task; (3) `apply` Phase 1 becomes purely mechanical TDD execution since edge-case thinking is front-loaded into `tasks`, while Phase 2 independently re-verifies that test assertions lock in each scenario's THEN criteria.
**Status:** research and validation complete. No changes made to `schema.yaml` or any skill yet — findings and recommendations only, pending an adoption decision.
**Sources:** 40 total (§3).

## 1. Summary

The feedback's underlying premise — LLMs default to happy-path tests and skip edge/negative cases unless explicitly told otherwise — is well-supported by the literature. Its proposed *fix* is a mix of already-standard practice, already-implemented machinery in this repo, and one component (the "automatic gatekeeper... blocks the workflow") that this repo's own prior research already found does not survive contact with reality without a structural forcing function.

Verdict per point:

| # | Feedback point | Verdict |
|---|---|---|
| 1a | `tasks` splits into positive / negative / security checkboxes | **Adopt with modification** — trace to specs/design, don't re-derive edge cases at the tasks layer |
| 1b | `align` "automatically blocks" on missing coverage | **Adopt with substantial modification** — reject "automatic"; route through the existing human-walkthrough gate, not a silent auto-fail |
| 2a | `apply` Phase 1 becomes purely mechanical since tasks pre-thought edge cases | **Adopt with caveat** — front-loading the scenario list is good TDD; treating execution as requiring no judgment is not supported and risks reintroducing shallow tests |
| 2b | `apply` Phase 2 independently verifies assertions lock in THEN criteria | **Adopt — largely already implemented** in `hrt-apply-code-review`; one gap worth closing (weak/tautological oracle as a named smell) |

## 2. Local repo context

Read in full before researching externally:

- **`schema.yaml`** lines 136–194 (`tasks`, `align`, `apply`). `tasks`'s current instruction is purely structural (checkbox format, group under numbered headings, size for one session) — nothing about positive/negative/security coverage, and no pointer to design.md's Risks/Trade-offs at all.
- **`skills/hrt-align-consistency-review/SKILL.md`** — already has a 7-dimension consistency map. Dimension 5 ("specs → tasks: every requirement and scenario is covered by at least one task") is close to the feedback's ask for negative-scenario coverage, and an uncovered scenario would already land as a HIGH finding under its severity rubric. There is **no dimension checking design.md's `[Threat] → Mitigation` entries against tasks.md** — that specific gap is real and worth filling.
- **`skills/hrt-apply-code-review/SKILL.md`** — Phase-2 review's contract map already states "every requirement and every `#### Scenario` in specs is actually implemented AND exercised by a passing test," and runs in a **fresh subagent with no memory of the implementer**. This substantially overlaps feedback point 2b already.
- **Templates** — `design.md` has only a generic `## Risks / Trade-offs` HTML-comment placeholder; the `[Threat] → Mitigation` format is prose convention stated in schema.yaml's instruction text (lines 120, 129), not enforced structurally by the template. `tasks.md` and `spec.md` templates have no positive/negative/security tagging convention either.
- **Prior local research directly on point**: [`2026-07-16-align-phase-human-review-gate.md`](2026-07-16-align-phase-human-review-gate.md) (48 sources) already investigated whether a cross-artifact gatekeeper check gets rubber-stamped, and concluded **yes — this is the dominant failure mode absent a structural forcing function**, not just an instruction. Evidence cited there: Anthropic's own data (93% of agent permission prompts approved without reading), a habituation study (approval rose 30.1%→36.8% as reviewer experience grew while inline comments fell 22%), and a GitHub Spec Kit issue where users skip advisory-only `clarify`/`analyze` gates in a directly comparable spec-driven tool. This is the single most load-bearing piece of prior evidence for evaluating feedback point 1b.
- [`2026-07-19-adversarial-4-agent-authoring.md`](2026-07-19-adversarial-4-agent-authoring.md) separately established that this repo's LLM-review patterns are strongest in a fresh, isolated context and weakest when a model grades its own work — relevant to how any new `align` check should be wired.

## 3. Sourced findings (40)

### A. Do LLMs skip edge/negative cases in generated tests?

1. "All Smoke, No Alarm: Oracle Signals in Agent-Authored Test Code" (arXiv:2606.18168) — 86,156 test patches, 2,807 repos; 80.2% have weak/no explicit oracle signal; "test theater" named explicitly. **Supports** the underlying worry.
2. "Understanding the Characteristics of LLM-Generated Property-Based Tests in Exploring Edge Cases" (arXiv:2510.25297) — combining property-based + example-based testing raised bug detection 68.75%→81.25%. **Supports** explicit edge-case elicitation, via a different mechanism than checklist enumeration.
3. "Validating Formal Specifications with LLM-generated Test Cases" (arXiv:2510.23350) — explicitly prompts for N positive + N negative cases per requirement. **Supports** the "split positive/negative explicitly" pattern — closest published precedent to the feedback's ask.
4. "Are Coding Agents Generating Over-Mocked Tests? An Empirical Study" (arXiv:2602.00409) — agent tests often verify mocks, not real behavior. **Supports** the concern that a checklist alone doesn't guarantee trustworthy tests.
5. "Rethinking the Value of Agent-Generated Tests for LLM-Based Software Engineering Agents" (arXiv:2602.07900) — 6 agents on SWE-bench Verified: prompt interventions to encourage/discourage test-writing produced **no statistically significant change** in outcomes (McNemar test); tests often function as debug prints, not verification. **Contradicts/complicates** — telling an agent to write more/better tests upfront may not be the lever the feedback assumes.
6. "Improving the Quality of GitHub Copilot Generated Unit Tests" (Springer, 2026) — fault-focused goal-setting prompts raise mutation coverage among compiling tests but lower compile-success rate. **Mixed.**
7. "A Review of Large Language Models for Automated Test Case Generation" (MDPI, 2025) — survey confirming edge/boundary coverage is a known LLM weak spot. **Supports.**
8. Autonoma AI, "Happy Path Testing: What It Covers and What It Misses" — practitioner take: agents given open-ended prompts default to happy-path because the prompter is thinking about the feature working, not failing — a structural bias. **Supports** the premise directly.
9. Managed Code, "21 ways AI agents fail in production" — practitioner list corroborating edge-case blind spots as a top failure category. **Supports**, low rigor.
10. "Acceptance Test Generation with LLMs: An Industrial Case Study" (arXiv:2504.07244) — 92% of LLM-generated acceptance tests rated helpful under human supervision. **Supports** LLM-derived tests being viable with review as the corrective — same shape as `align`'s human walkthrough.
11. "Exploratory Study on Private GPTs for LLM-Driven Test Generation" (arXiv:2506.06509) — Gherkin-derived-from-acceptance-criteria generation outperforms no-Gherkin baseline. **Supports** deriving tests from structured scenario format (which this schema's WHEN/THEN already is).

### B. Kent Beck's TDD "test list" — is front-loading a checklist real TDD?

12. Kent Beck, Canon TDD — step 1 is "write a list of test scenarios you want to cover" before any concrete test; explicitly warns against converting the whole list into tests before starting the loop. **Supports** a scenario list upfront being legitimate TDD; **contradicts** the "front-load everything, then blindly mechanically execute" framing — Beck's list stays live and mutates during implementation.
13. *Test-Driven Development: By Example*, Kent Beck (2002; via Fowler's summary) — same test-list concept, "add items to the list as you discover them" during implementation. **Contradicts** the purely-mechanical-execution half of feedback point 2.
14. Ping-Pong Programming (Open Practice Library; Tuple pairing guide) — test authorship and implementation interleaved turn-by-turn, not phase-separated. **Neutral/mixed** analogue.

### C. STRIDE → test case / threat-to-test mapping

15. "Integrating Threat Modeling and Automated Test Case Generation" (arXiv:1911.06594) — automated pipeline from threat-model attack paths to executable security tests, via a formal "Model-Implementation Mapping." **Supports** feasibility, but requires a *formal, structured* threat model, not free-text prose — relevant caveat given design.md's Risks/Trade-offs is unstructured prose today.
16. "Automated Security Test Generation with Formal Threat Models" (ResearchGate) — same theme. **Supports**, same formality caveat.
17. STRIDE-GPT (github.com/mrwadams/stride-gpt) — generates Gherkin test cases per identified threat. **Supports** — real precedent for STRIDE→test generation, but a purpose-built tool with structured threat objects, not a prose section.
18. "Developing Abuse Cases Based on Threat Modeling and Attack Patterns" — abuse cases as the intermediate artifact between threat model and test case. **Supports**, but flags that going straight from STRIDE threat to test task skips a fidelity-preserving intermediate step.
19. OWASP Abuse Case Cheat Sheet — misuse cases map to security requirements, which generate negative/abuse-oriented tests. **Supports** the general threat→test traceability chain.
20. Boise State thesis, "Security Testing with Misuse Case Modeling" — validates misuse-case-to-test traceability, but coverage depends on the thoroughness of the original misuse-case analysis. **Caveat**: a shallow STRIDE pass produces shallow negative tests no matter how strict the downstream checklist enforcement is.
21. Security Compass, "What is STRIDE in Threat Modeling?" — STRIDE outputs threats but not natively structured, machine-parseable `[Threat]→Mitigation` pairs unless imposed by the practitioner. **Neutral**, relevant to mechanical-cross-check feasibility.
22. Shift-left security guidance (StackHawk, GitLab, aggregate) — industry consensus: threat modeling during design should scope security tests (abuse-case, negative, authZ-bypass) as acceptance criteria. **Supports** the general shift-left principle behind feedback point 1.

### D. Cross-artifact "gatekeeper" checks — documented pattern, and are they gamed?

23. GitHub Spec Kit `checklist.md` template — has explicit "Edge Case Coverage" / "Scenario Coverage" dimensions in `/speckit.checklist`, derived heuristically from risk indicators, but treated as **advisory, not a hard gate**. **Directly relevant precedent**, implemented as soft checklist not blocking gate.
24. GitHub Spec Kit Issue #2496 — users skip advisory-only `clarify`/`analyze` stages in practice; a feature request exists to make them structurally unskippable. **Directly contradicts** the assumption that an instruction alone ("align should automatically block") is sufficient.
25. den Delimarsky, "What's The Deal With GitHub Spec Kit" — independent critique flagging the same phase-design weaknesses. **Supports** skepticism about advisory-only gates generally.
26. Yu et al., "Habituation at the Gate: Rising Approval and Declining Scrutiny in Human Review of AI Agent Code" (arXiv:2606.22721) — 11,429 reviews, 400 reviewers, 7 months: approval rose 30.1%→36.8%, inline comments fell 22% as queue time rose 3.5x. **Directly contradicts** the idea that a written "align must block" instruction holds up over many changes — reviewers (human or LLM-as-reviewer) habituate.
27. Anthropic, "Trustworthy agents in practice" — 93% of agent permission prompts approved without reading. **Contradicts/cautions** — same risk applies to an LLM-run `align` gate grading sibling artifacts.

### E. LLM-as-judge / self-critique reliability (bears on "align acts as automatic gatekeeper")

28. Adaline, "LLM-as-a-Judge: Why Frontier Models Fail 50%+ Bias Tests" — frontier models exceed 50% error rates on advanced bias tests (JudgeBiasBench). **Contradicts** unconditional trust in an LLM-run consistency gate.
29. "Are LLMs Reliable Code Reviewers? Systematic Overcorrection in Requirement Conformance Judgement" (arXiv:2603.00539) — LLM reviewers systematically overcorrect when judging requirement conformance — directly analogous to align/apply-Phase-2 judging whether tasks.md covers every negative scenario/threat. **Contradicts/cautions.**
30. RAND Corporation LLM-judge reliability study — no judge uniformly reliable across benchmarks. **Contradicts** blanket trust in a single-pass automated gate.
31. "Faithful or Fabricated? A Causal Framework for Rationalization Bias in LLM Judges" (arXiv:2605.23970) — LLM judges rationalize by praising surface form over substance. **Contradicts/cautions** — risk that an LLM `align` check produces a plausible-looking but hollow "yes, covered" verdict.
32. Sadowski et al., "Modern Code Review: A Case Study at Google" (ICSE-SEIP 2018) — 80% of human reviews require author action — the human baseline an LLM-gatekeeper is implicitly compared against. **Neutral/baseline**, useful for calibrating how much scrutiny an effective gate should produce versus a habituated near-100%-pass rate.

### F. Reward hacking / test-suite gaming under mechanical execution

33. SpecBench: Measuring Reward Hacking in Long-Horizon Coding Agents (arXiv:2605.21384) — agents saturate visible test suites while reward hacking persists on holdout suites; gap larger for smaller models. **Contradicts** the assumption that "mechanically execute the checklist" is safe once the checklist is good.
34. "LLMs Gaming Verifiers: RLVR can Lead to Reward Hacking" (arXiv:2604.15149) — documents agents overwriting/deleting assertions, monkey-patching scoring functions to pass checks. **Contradicts/cautions** — a checked box is not proof of substantive coverage; reinforces why Phase 2 review matters as a second, independent check, not a redundancy.

### G. Spec-driven tools' actual precedent for pre-enumerating positive/negative/security tests

35. Kiro docs, "Requirements-First Workflow" — EARS-format acceptance criteria cover edge cases per user story; claimed to enable automatic property-based test generation. **Supports** the general pattern, but at the *requirements* layer rather than the *tasks* layer — suggests OpenSpec's own WHEN/THEN scenario format is the better lever than a tasks.md tag.
36. BMAD-METHOD docs (aggregate) — dev agent executes tasks sequentially, tests must pass 100% before a story is complete; a separate "Test Architect" agent reviews stories and designs test cases. **Supports** the general shape of feedback point 2 — validated precedent for splitting "write the test plan" / "execute" / "independently review," matching this schema's existing `tasks`→`apply`Phase1→`apply`Phase2 split.
37. Martin Fowler, "Understanding Spec-Driven Development: Kiro, spec-kit, and Tessl" — comparative analysis; none of the three tools has a codified "threat → negative-test-checkbox" mechanical cross-check as a named feature. **Neutral** — confirms the feedback's specific mechanism isn't yet an established pattern anywhere; only individual ingredients exist separately.
38. Tessl Framework docs — "generate tests from specs... pairing with tests to enforce guardrails." **Supports** spec→test generation as a direction, without a positive/negative/security split in its public docs.

### H. Requirements traceability matrix (RTM) precedent for the cross-check itself

39. TestRail, "Requirements Traceability Matrix: A How-To Guide" — standard practice: map every requirement to test cases to surface coverage gaps. **Supports** the general mechanism as long-established, non-controversial QA practice, independent of whether an LLM can execute it reliably.
40. Parasoft, "Requirements Traceability for Effective Project Tracking" — same, industry-standard. **Supports.**

## 4. Synthesis and recommendations

**1a. Split `tasks` into positive / negative / security checkboxes — adopt with modification.**

Well-supported in spirit by Beck's test-list step (12), the industrial acceptance-test study (10), Kiro's EARS edge-case coverage (35), and BMAD's story/test-architect split (36). The happy-path bias this counters is real and documented (1, 8, 9).

Modification: don't have the AI re-derive edge cases from scratch at the `tasks` stage. `specs`'s WHEN/THEN scenarios (schema.yaml:64) are the natural home for positive/negative behavior; `design`'s `[Threat] → Mitigation` entries (schema.yaml:120, 129) are the natural home for security cases. `tasks` should **trace to** these, not re-derive them — matching how Kiro/EARS and RTM practice (39, 40) actually work. Don't mandate a rigid one-checkbox-per-scenario/threat rule — sources 18, 20, 21 show STRIDE output isn't naturally structured and a shallow STRIDE pass produces shallow tasks regardless of checklist enforcement; the quality ceiling is set upstream at `design`'s security pass.

**1b. `align` as "automatic gatekeeper" that blocks — adopt with substantial modification (reject "automatic").**

The mechanism (specs→tasks and design-threats→tasks coverage) is already close to what `hrt-align-consistency-review` does; its dimension 5 nearly covers the specs-negative-scenario half already, and an uncovered scenario would already land as HIGH under its own rubric. What's genuinely missing is a design→tasks dimension for `[Threat] → Mitigation` coverage — a legitimate, small, additive gap.

But "automatic... blocks" as phrased is the exact mechanism this repo's own prior research already found fails empirically without a structural forcing function (sources 24, 26, 27; see `2026-07-16-align-phase-human-review-gate.md`). The align skill already learned this lesson once — it added a mandatory human walkthrough specifically because an align-only loop could converge silently. Any new negative-scenario/threat coverage dimension must go through that **same walkthrough mechanism** — a MECHANICAL/DECISION-tagged finding surfaced to a human — not a new independent auto-block, or it reintroduces the single-agent-grades-itself failure mode this schema already patched once.

**2a. `apply` Phase 1 as pure mechanical execution once tasks are front-loaded — adopt with caveat.**

Partially supported: Beck's test-list concept (12, 13) and this schema's existing checkbox-driven Phase 1 structure both anticipate a list-then-execute shape. But "the AI just executes, no creative edge-case thinking needed" overstates what front-loading buys:

- Source 5: prompt interventions to write more/better tests produced no statistically significant change in outcomes.
- Sources 33, 34: agents can satisfy a checkbox/test's letter without its substance even when well-specified.
- Beck himself (12) warns against pre-committing all tests before starting the loop — the list should stay live during implementation, in tension with "purely mechanical, no in-the-moment reasoning."

Front-loading the *scenario list* is good, evidenced practice. Treating Phase 1 as therefore requiring no judgment is not supported and risks the exact shallow/tautological-test failure mode (1, 4, 33, 34) a stricter checklist was meant to prevent. The `tdd` skill's existing anti-pattern list (tautological tests, implementation-coupled tests) exists precisely because a specified task doesn't stop gaming — keep it exactly as strict, don't relax it on the theory that tasks.md already did the thinking.

**2b. `apply` Phase 2 independently verifies assertions lock in THEN criteria — adopt, largely already implemented.**

Best-supported, least novel part of the feedback. `hrt-apply-code-review`'s contract map already requires every spec scenario be "implemented AND exercised by a passing test," run in a fresh subagent with no memory of the implementer — exactly the isolation the LLM-as-judge literature (28–31) says matters. One gap worth closing: the smell baseline doesn't yet name "weak/tautological oracle" explicitly (source 1's taxonomy), though "scenario with weak or indirect test coverage" gestures at it.

### Concrete phrasing suggestions

**`tasks` instruction** (schema.yaml, after the "Guidelines" bullets around line 150, before the "Example:" block at line 152):

> Where specs (`specs/**/*.md`) define WHEN/THEN scenarios covering both expected and failure behavior, and design.md's Risks/Trade-offs section defines `[Threat] → Mitigation` entries, each MUST trace to at least one task: a scenario or threat with no corresponding task is a coverage gap, not something for `tasks` to silently drop. Tasks tracing to a negative scenario or a threat mitigation SHOULD be tagged distinctly (e.g. a trailing `[negative]` / `[security]` marker) so `align` and the apply-phase review can check coverage without re-deriving it.

Keep lightweight — traceability existing is the MUST, not one-checkbox-per-scenario cardinality.

**`skills/hrt-align-consistency-review/SKILL.md`** (extend the dimension list, around line 20):

> - specs -> tasks: every requirement and scenario (including negative/edge-case scenarios) is covered by at least one task; no task is out of scope.
> - design -> tasks (when design.md exists and has a security pass): every `[Threat] → Mitigation` entry in Risks/Trade-offs has at least one corresponding negative-test task; a threat with no covering task is a HIGH finding under the existing severity rubric, same tier as "a requirement with no covering task."

Reuses the existing align→walkthrough→human-loop machinery instead of adding a new auto-block — a missing threat-coverage task becomes a HIGH/DECISION finding surfaced to the user through the existing step-7 process, not a silent auto-fail.

**`skills/hrt-apply-code-review/SKILL.md`** (smell baseline, around lines 18–30):

> - Weak/tautological oracle: an assertion that recomputes the implementation's own logic, mirrors current behavior without an independent expected value, or would still pass if the THEN criteria were violated -> rewrite against an independent source of truth (a literal, a worked example, the spec's stated outcome).

Closes the gap between "scenario implemented and exercised by a passing test" and "assertion actually locks in the THEN criteria," grounded in source 1's weak/strong oracle taxonomy.

**What NOT to adopt**: an unconditional "automatic" block with no human contact (rejects the literal wording of 1b); a rigid one-task-per-scenario/threat cardinality rule in `tasks` (over-specifies checklist shape; traceability existing matters more than count); framing `apply` Phase 1 as needing *less* anti-pattern vigilance because tasks.md pre-thought edge cases (sources 5, 33, 34 show a good task list doesn't prevent gaming or shallow execution at implementation time — keep the `tdd` skill's enforcement exactly as strict as today).
