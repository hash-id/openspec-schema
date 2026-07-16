# Research: does `align` force genuine human review, or just artifact consistency?

**Date:** 2026-07-16
**Scope:** evaluate the `align` phase in `openspec/schemas/hash/schema.yaml` and its skill (`skills/hrt-align-consistency-review/SKILL.md`) against literature on making human review of AI/automated output genuinely effective rather than a rubber stamp. Triggered by user question: is `align` proper as designed, and is there a mechanism (skill or otherwise) that forces real human review before `apply`.
**Status:** research + evaluation complete. Recommendations 1 and 3 applied to `skills/hrt-align-consistency-review/SKILL.md` and `openspec/schemas/hash/templates/align.md`; recommendation 2 is subsumed by the walkthrough's per-section recording (no separate change needed); recommendation 4 remains a usage note, not a schema change. See [§5](#5-recommendations) for what changed and why.

## Contents

1. [Verdict](#1-verdict)
2. [What align gets right](#2-what-align-gets-right)
3. [Where it breaks](#3-where-it-breaks)
4. [Why this specific shape fails](#4-why-this-specific-shape-fails)
5. [Recommendations](#5-recommendations)
6. [Sources (41)](#6-sources-41)

---

## 1. Verdict

Not proper as originally written. `align` had strong machine-checkable structure — a 7-dimension consistency map, severity (HIGH/MEDIUM/LOW) plus resolution-type (MECHANICAL/DECISION) tagging, a 3-pass loop — but zero anti-rubber-stamp design for the one human touchpoint it relied on. The loop could converge and hand off to `apply` (the phase that writes code) without a human ever reading `align.md`, if pass 1 found nothing above LOW.

**Update:** this gap is now closed, and the loop shape changed twice during implementation. First pass: a mandatory walkthrough step ran once, after the old capped 3-pass ALIGN loop exited. Second pass, on user reflection: the "capped ALIGN loop, then one walkthrough" shape still had a seam — walkthrough feedback had nowhere well-defined to go back into. The skill was restructured around a single uncapped cycle: ALIGN (consistency check) -> WALKTHROUGH (human reads every artifact section by section) -> any walkthrough feedback re-enters ALIGN -> WALKTHROUGH again, repeating until a walkthrough round raises nothing new or the user explicitly signs off (only valid after at least one full walkthrough round has completed). No pass cap; cycle count is reported to the user as it runs instead of hidden. The DECISION-surfacing order in ALIGN was also flipped to state the tradeoff before the recommendation (§5, rec. 3). The findings below (§3) describe the pre-fix state; kept for the record and because §4's evidence is what motivated the fix.

## 2. What align gets right

The skill (`hrt-align-consistency-review`) is a legitimate structured inspection, not theater. It maps closely to what the literature calls perspective-based, checklist-driven review — the technique with the strongest evidence behind it (Fagan 1976: structured inspection caught 82% of eventual defects vs. much lower rates from unit testing alone; Basili et al. 1996 on perspective-based reading outperforming ad hoc review).

Concretely: seven explicit consistency dimensions (discovery→proposal, proposal→specs, proposal↔design, specs↔design, specs→tasks, spec structure, design/tasks→codebase); a forced separation of "build the consistency map" from "classify severity" (skill step 3 is a hard STOP before classification); a HIGH/MEDIUM/LOW × MECHANICAL/DECISION tagging scheme that routes only genuinely judgment-laden findings to a human, fixing the rest automatically. The loop caps at 3 passes and hard-stops if a HIGH issue remains unresolved when it ends. This part is sound and doesn't need to change.

## 3. Where it breaks

**Convergence requires no human contact (HIGH).** If pass 1 finds no HIGH or MEDIUM, the loop exits immediately (`hrt-align-consistency-review/SKILL.md:35-37`). The agent that authored the artifacts in the prior phases is also the agent grading them in align. `schema.yaml`'s `apply.requires: [align]` (line 179-180) only checks that `align.md` exists as an artifact — nothing checks that a human opened it.

**No anti-silence language, unlike its sibling phase (HIGH).** `discovery` explicitly forbids inferring confirmation from silence: "Do NOT proceed to write discovery.md until the user has explicitly confirmed shared understanding has been reached. Do not infer confirmation from silence or from answering the last question alone." (`schema.yaml:16`). `align`'s only human contact — skill step 7, DECISION findings — says "apply only what the user confirms or adjusts" (`SKILL.md:30-32`), with no definition of what counts as confirmation and no ban on treating silence as agreement.

**Agent's recommendation is shown first, every time (MEDIUM).** Step 7 always leads with "your recommended resolution first." Anchoring a suggested answer before the human has formed their own view is a documented driver of automation-biased approval — the cheap path becomes agreeing with what's already on screen rather than independently evaluating the tradeoff.

**No outcome accountability, no drift detection (MEDIUM).** Nothing in the schema or the `align.md` template tracks how often passes converge with zero findings, how often DECISION points get accepted verbatim vs. amended, or whether a "confirmed" decision later gets reverted during `apply`. Without a signal like this, decay into habituated rubber-stamping is invisible until something ships broken.

## 4. Why this specific shape fails

This isn't hypothetical. It's the empirically dominant outcome of exactly this structure — repeated review of AI-drafted artifacts, across many change proposals, with no forcing function — measured in three independent settings:

- **Anthropic, internal data** (`Trustworthy agents in practice`, 2026): developers approve 93% of agent permission prompts without reading them; clarification rate on complex tasks is only 16.4%.
- **Habituation at the Gate** (Yu et al., arXiv:2606.22721, 2026): 11,429 reviews of AI-agent-generated code across 400 repeat reviewers over 7 months. Approval rate rose from 30.1% to 36.8% with reviewer experience; inline comments fell 22% while time-in-queue rose 3.5x. The authors' read: reflexive habituation under growing workload, not rational trust calibration.
- **GitHub Spec Kit, Issue #2496**: real users of a comparable spec-driven pipeline skip its `clarify`/`analyze` review stages when they're advisory-only, prompting a feature request to make them structurally unskippable — direct evidence that "surface it and ask" without structural enforcement gets bypassed in practice, in an adjacent tool.

What held up instead, in the same literature:

- **Anthropic's fix (Plan Mode)**: collapse many small per-action approvals into one substantive up-front plan review, and shift the burden of *triggering* scrutiny onto the agent's own judgment rather than the human's memory to stay vigilant.
- **WHO Surgical Safety Checklist** (Haynes et al., NEJM 2009, popularized by Gawande): a single mandatory, explicitly-worded pause before the irreversible step cut mortality 47% and complications 36% across 8 hospitals. The forcing function was the pause itself — a fixed, spoken confirmation — not the checklist's content.

Both point the same direction: the fix isn't more prompt text asking to review carefully — `align` already has that, tucked into skill step 7. It's a structural pause with an explicit, worded confirmation, mirroring what `discovery` already does one phase earlier in this same schema.

## 5. Recommendations

**1. APPLIED — mandatory section-by-section walkthrough, not a single confirmation gate.** The original proposal here was a single terminal "have you read align.md, yes/no" confirmation, mirroring `discovery`'s anti-silence language. The user redirected this during implementation: a single end-of-process confirmation is still cheaply rubber-stampable (it's exactly the shape of the 93%-approve-without-reading permission prompt in Anthropic's data, §4) — what's actually needed is evidence the developer walked through the *content*, not just acknowledged that a review happened.

  What shipped instead, added as a new "Walkthrough" section in `skills/hrt-align-consistency-review/SKILL.md` (after "Loop exit"): once the consistency-check loop exits — including on a zero-finding convergence — the skill walks the user through every artifact in build order (proposal.md → specs/**/*.md → design.md → tasks.md → align.md's own findings), one named section at a time. Each section gets an explicit "what needs fixing here, if anything" prompt and a recorded answer in align.md's new `## Walkthrough` log (added to `openspec/schemas/hash/templates/align.md`); "nothing" is a valid answer but must be given per section, not once for the whole set. Anything the user raises mid-walkthrough re-enters the severity/mechanical-decision classification from the main loop. This is a structured walkthrough (Yourdon-style) done in build order, which doubles as perspective-based reading (§6, sources 36–37) — proposal context is fresh before the reader hits spec detail, spec detail is fresh before design, etc.

  Basis: `schema.yaml:16` (existing anti-silence pattern in this repo, generalized) · Fagan 1976 and Basili et al. 1996 (§6, sources 35, 37) on structured/perspective-based review outperforming a single pass-fail gate · Anthropic, *Trustworthy agents in practice* (§6, source 19) on why single blanket confirmations get rubber-stamped.

**2. SUBSUMED by recommendation 1.** The original concern — a zero-finding pass shouldn't look identical in align.md to one that was never run properly — is now structurally impossible: the walkthrough requires a recorded answer for every section regardless of how many findings the loop produced. No separate change was needed once rec. 1 shipped.

**3. APPLIED — tradeoff stated before the recommendation, on DECISION points.** Skill step 7 previously led with the agent's recommended resolution. It now states the tradeoff and the valid resolution options first, and the agent's recommendation second — so the human forms a view before seeing the agent's answer, rather than anchoring on it. Basis: Bansal et al., ACM JRC 2024 (§6, source 10) — always-on explanations/recommendations shown up front can increase over-reliance rather than calibrate it.

**4. NOT APPLIED — usage note, not a schema change.** Tracking whether DECISION points get accepted verbatim with no amendment across many changes, or whether convergence happens on pass 1 nearly every time, is a drift signal worth watching periodically by whoever operates this schema — but it requires observing usage over time, not something `align.md` for a single change can self-report. Left as an open item; not automatable inside the schema itself. Basis: Yu et al. 2026, arXiv:2606.22721 (§6, source 27) — the 400-reviewer study this schema's walkthrough is designed to avoid replicating.

## 6. Sources (41)

### Automation bias & complacency

1. Parasuraman & Riley, "Humans and Automation: Use, Misuse, Disuse, Abuse." *Human Factors* 39(2), 1997. https://journals.sagepub.com/doi/10.1518/001872097778543886 — Misuse vs. disuse as distinct automation failure modes.
2. Parasuraman & Manzey, "Complacency and Bias in Human Use of Automation: An Attentional Integration." *Human Factors* 52(3), 2010. https://journals.sagepub.com/doi/10.1177/0018720810376055 — Attentional resource withdrawal persists even in expert populations.
3. Mosier, Skitka, Heers & Burdick, "Automation Bias, Accountability, and Verification Behaviors." *HFES Proceedings* 40(4), 1996. https://journals.sagepub.com/doi/10.1177/154193129604000413 — Outcome accountability reduced errors; process-only accountability ("did you look at it") did not.
4. Skitka, Mosier & Burdick, "Does automation bias decision-making?" *Int. J. Human-Computer Studies* 51(5), 1999. — Automated recommendations replace independent verification behavior.
5. Bahner, Hüper & Manzey, "Misuse of automated decision aids: Complacency, automation bias and the impact of training experience." *Int. J. Human-Computer Studies* 66(9), 2008. https://www.researchgate.net/publication/222414340 — Exposure to real automation failures during training reduces complacency; being told does not.
6. Bahner, Elepfandt & Manzey, "Misuse of Diagnostic Aids in Process Control." *HFES Proceedings* 52(19), 2008. https://doi.org/10.1177/154193120805201906 — Complacency reduction from calibration decays once automation appears reliable again.
7. "What is Wrong With Automation Bias?" *Philosophy & Technology* (Springer), 2026. https://link.springer.com/article/10.1007/s13347-026-01090-9 — Automation bias as a designed consequence of offloading verification effort, not just individual failing.
8. Passi & Vorvoreanu, "Overreliance on AI: Literature Review." Microsoft Research MSR-TR-2022-12. https://www.microsoft.com/en-us/research/wp-content/uploads/2022/06/Aether-Overreliance-on-AI-Review-Final-6.21.22.pdf — Interfaces that make acceptance the path of least resistance drive overreliance.
9. Microsoft Research, "Appropriate reliance on GenAI: Research synthesis." 2024. https://www.microsoft.com/en-us/research/wp-content/uploads/2024/03/GenAI_AppropriateReliance_Published2024-3-21.pdf — Classifier-era mitigations (confidence scores) transfer poorly to GenAI, can increase overreliance.
10. "A Systematic Review on Fostering Appropriate Trust in Human-AI Interaction." *ACM J. Responsible Computing*, 2024. https://dl.acm.org/doi/10.1145/3696449 — Always-on explanations can paradoxically increase over-reliance rather than calibrate it.

### Human-in-the-loop design

11. EU AI Act, Article 14 (Human Oversight). https://artificialintelligenceact.eu/article/14/ — Oversight requires observability, informed understanding, and controllability (override/reverse/interrupt), not just presence; two-person independent verification mandated for sensitive categories.
12. Fink, "Human Oversight under Article 14 of the EU AI Act." SSRN 5147196. https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5147196 — Article 14 oversight is satisfiable on paper while practically empty without competency/time/workload provisions.
13. NIST AI Risk Management Framework 1.0, GOVERN function. https://airc.nist.gov/airmf-resources/playbook/govern/ — Oversight should be measured (override rates, adjudication stats, response times), not merely asserted.
14. Faas, Kerstan, Uth, Langer & Feit, "Design Considerations for Human Oversight of AI." arXiv:2510.19512, 2025. https://arxiv.org/pdf/2510.19512 — Oversight roles need task significance and feedback loops or reviewers disengage regardless of stated policy.
15. "Designing meaningful human oversight in AI." *AI and Ethics* (Springer Nature), 2026. https://link.springer.com/article/10.1007/s43681-026-01147-7 — Names the "collapse into rubber stamp" failure mode explicitly; proposes exploiting the solve-verify asymmetry as a fix.
16. Passi, "Agentic AI has a Human Oversight Problem." SSRN 5529058, 2025. — Diagnoses why oversight mechanisms bolted onto agentic AI pipelines fail in practice.
17. MindStudio, "Human-in-the-Loop Checkpoints for AI Agents: Why Full Autonomy Is the Wrong Goal." https://www.mindstudio.ai/blog/human-in-the-loop-checkpoints-ai-agents-full-autonomy — Near-universal approval rate is itself the signal a checkpoint has become theater; review must precede the irreversible step, not follow it.
18. Anthropic, "Our framework for developing safe and trustworthy agents." 2025/2026. https://www.anthropic.com/news/our-framework-for-developing-safe-and-trustworthy-agents — States "keeping humans in control" as a stated design principle.
19. Anthropic, "Trustworthy agents in practice." 2026. https://www.anthropic.com/research/trustworthy-agents — 93% of permission prompts approved without reading; Plan Mode collapses many small approvals into one substantive up-front review; agent is trained to over-ask relative to user's own intervention rate.
20. Anthropic, "Measuring AI agent autonomy in practice." 2026. https://www.anthropic.com/research/measuring-agent-autonomy — Source of the 16.4% clarification-rate figure.
21. Santoni de Sio & van den Hoven, "Meaningful Human Control over Autonomous Systems: A Philosophical Account." *Frontiers in Robotics and AI* 5:15, 2018. https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2018.00015/pdf — A veto held but never exercised does not constitute meaningful control; overseer must remain "reason-responsive."

### Code review effectiveness

22. Sadowski, Söderberg, Church, Sipko & Bacchelli, "Modern Code Review: A Case Study at Google." ICSE-SEIP 2018. https://sback.it/publications/icse2018seip.pdf — 80% of reviews require author action; the quantitative signature of non-rubber-stamp review.
23. Google, "The Standard of Code Review." https://google.github.io/eng-practices/review/reviewer/standard.html — Never approve a change that "definitely worsens" code health, regardless of reviewer fatigue or deadline pressure.
24. Bosu, Greiler & Bird, "Characteristics of Useful Code Reviews: An Empirical Study at Microsoft." MSR 2015. https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/bosu2015useful.pdf — Prior familiarity with the artifact under review nearly doubles defect-finding effectiveness vs. seeing it cold.
25. Microsoft Research, "Expectations, Outcomes, and Challenges of Modern Code Review." ICSE 2013. — Understanding, not defect-spotting, is the primary cognitive bottleneck in review.
26. Cohen, "Best Kept Secrets of Peer Code Review" (SmartBear/Cisco study). 2006. https://static0.smartbear.co/support/media/resources/cc/book/code-review-cisco-case-study.pdf — Review effectiveness collapses above 400 LOC or 500 LOC/hour; 61% of reviews found zero defects at baseline.
27. Yu, Liu, Jiang, Jia, Wang, Qian & Chen, "Habituation at the Gate: Rising Approval and Declining Scrutiny in Human Review of AI Agent Code." arXiv:2606.22721, 2026. https://arxiv.org/pdf/2606.22721 — 11,429 reviews, 400 reviewers, 7 months: approval rose 30.1%→36.8%, inline comments fell 22% as queue time rose 3.5x. The single most directly relevant source.
28. cubic.dev, "Does PR size actually matter?" 2026. https://www.cubic.dev/blog/does-pr-size-actually-matter — Contemporary replication of size/defect-rate findings in AI-assisted coding.

### Forcing functions & confirmation UX

29. Johnson & Goldstein, default-framing research (Columbia). Summarized via https://medium.com/design-bootcamp/default-settings-and-soft-opt-in-as-silent-consent-design-f40f8a20c299 — Opt-out→opt-in reframing roughly halves affirmative-consent capture; whatever the default action is dominates over stated preference.
30. Utz et al., "(Un)informed Consent: Studying GDPR Consent Notices in the Field." ACM CCS 2019. https://arxiv.org/pdf/1909.02638 — Interface asymmetry (prominent accept, buried reject) drives near-universal passive acceptance.
31. Habib et al., "'Okay, whatever': An Evaluation of Cookie Consent Interfaces." CHI 2022. https://dl.acm.org/doi/fullHtml/10.1145/3491102.3501985 — Habituation causes users to stop processing what a repeated dialog is even about.
32. Anderson, Vance, Kirwan, Eargle & Jenkins, "Tuning Out Security Warnings: A Longitudinal Examination of Habituation." *MIS Quarterly* 42(2), 2018. https://misq.umn.edu/misq/article/42/2/355/1716/Tuning-Out-Security-Warnings-A-Longitudinal — Neural habituation (reduced P300 response) measurable within 2-3 exposures; polymorphic (visually varying) warnings proposed as a countermeasure.
33. Egelman, Cranor & Hong, "You've been warned: An empirical study of the effectiveness of web browser phishing warnings." CHI 2008. — Interrupting the primary task is necessary but not sufficient for a warning to be genuinely processed.
34. Smashing Magazine, "Designing For Agentic AI: Practical UX Patterns For Control, Consent, And Accountability." 2026. https://www.smashingmagazine.com/2026/02/designing-agentic-ai-practical-ux-patterns/ — Consent checkpoints need a live menu of choices, not an implicit OK; undo rate under 5% proposed as a health metric for whether a gate is working.

### Requirements/spec review effectiveness

35. Fagan, "Design and Code Inspections to Reduce Errors in Program Development." *IBM Systems Journal* 15(3), 1976. — Structured inspection caught 82% of eventual defects pre-release; foundational evidence for process design (roles, entry/exit criteria) over ad hoc review.
36. Porter & Votta, "Comparing Detection Methods for Software Requirements Inspections: A Replicated Experiment." *IEEE TSE* 21(6), 1994, replicated 1998. https://link.springer.com/article/10.1023/A:1009776104355 — Scenario-based reading outperformed both plain checklists and ad hoc review; a checklist alone isn't sufficient.
37. Basili et al., "How Perspective-Based Reading Can Improve Requirements Inspections." *IEEE Computer* 29(7), 1996. https://ieeexplore.ieee.org/document/869376/ — Assigning reviewers distinct stakeholder perspectives (user, designer, tester) sharpens defect detection vs. one homogeneous read-through.
38. "An Empirical Comparative Study of Checklist-Based and Perspective-Based Reading." arXiv:0909.4260. https://arxiv.org/pdf/0909.4260 — Effect of structured technique vs. ad hoc review is real but inconsistent in size/direction across studies; honest caveat on categories 35-37.
39. Haynes et al. (WHO Surgical Safety Checklist trial), popularized by Gawande, *The Checklist Manifesto*. NEJM 2009; summary https://pmc.ncbi.nlm.nih.gov/articles/PMC4953332/ — Mandatory pause before the irreversible step cut mortality 47%, complications 36%, across 8 hospitals; the forcing function was the pause itself.

### AI-agent pipeline / spec-driven-development practices

40. GitHub, Spec Kit. https://github.com/github/spec-kit — Recommends its `clarify`/`checklist`/`analyze` steps be treated as mandatory quality gates, not optional steps, for production features with meaningful ambiguity.
41. GitHub Spec Kit, Issue #2496. https://github.com/github/spec-kit/issues/2496 — Real users of a comparable pipeline skip advisory-only review stages in practice; feature request to make them structurally unskippable.
42. den Delimarsky, "What's The Deal With GitHub Spec Kit." https://den.dev/blog/github-spec-kit/ — Independent critique of the same phase design's weak points in practice.
43. GitHub Blog, "Agent pull requests are everywhere. Here's how to review them." https://github.blog/ai-and-ml/generative-ai/agent-pull-requests-are-everywhere-heres-how-to-review-them/ — Streamed reasoning and explicit pre-action approval are now the baseline expectation for reviewing agent-authored PRs.
44. SonarSource / industry survey, "AI Coding Agents 2026" (7,000 engineers). https://internet-pros.com/blog/ai-coding-agents-software-engineering-2026/ — 66% refuse to merge AI-generated code without manual review; only 3% report actually trusting the output — stated distrust doesn't guarantee genuine scrutiny.

### Decision fatigue & batch-approval pacing

45. Danziger, Levav & Avnaim-Pesso, "Extraneous factors in judicial decisions." *PNAS* 108(17), 2011. https://www.pnas.org/doi/10.1073/pnas.1018033108 — Favorable-ruling rate fell from ~65% to near 0% across a session, resetting after a break; sequential decisions drift toward the cognitively cheaper default.
46. Weinshall-Margel & Shapard reply; Glöckner, "The irrational hungry judge effect revisited." *PNAS* 108(42), 2011; various. — Scheduling confounds may explain part of the judicial-decisions effect; mechanism contested, directional finding widely replicated.
47. Baumeister et al., ego-depletion research, summarized in "The Depleted Mind." https://gc-bs.org/articles/the-depleted-mind-the-science-of-decision-fatigue-and-ego-depletion/ — Underlying limited-resource model for the judicial-decisions interpretation; itself contested in the replication-crisis literature.
48. "Casting votes of antecedents play a key role in successful sequential decision-making." PMC9955594. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9955594/ — Ordering of sequential judgments affects collective accuracy; no canonical source found specifically on optimal batch size for sequential AI-approval decisions — a genuine gap in category 7, not papered over.
