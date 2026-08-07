# Research: plain-language standards for non-native-English-speaking users — agent communication vs. artifact prose

**Date:** 2026-08-07
**Scope:** `openspec/schemas/tempa-spec/schema.yaml` line 16 currently cites ASD-STE100 ("Simplified Technical English") for one narrow purpose — the discovery-phase recap/confirmation prompt an agent adds beyond the `grilling` skill's own questions. This doc investigates whether ASD-STE100 is the right standard, and separately investigates whether a *different* standard is needed for artifact prose (discovery.md, proposal.md, specs/*.md, design.md, tasks.md, align.md), since both are read by non-native-English-speaking developers but under very different conditions.
**Status:** research complete, including an evidence-grading pass requested after the initial rule synthesis was challenged as unvalidated. Final rule sets in §4 are the ones to carry forward. No changes made to schema.yaml yet — pending a placement decision (§5).
**Sources:** ~40+ total across four research passes (standard/rule discovery for Case A and B, then empirical-evidence grading for Case A and B, then standard-as-package effectiveness), primarily WebSearch/WebFetch verified (not independently re-fetched at the depth of the citation-verification pattern used in other docs in this directory — treat source list as a starting point, not a fully audited bibliography).

## Contents

1. [Problem framing: two audiences, not one](#1-problem-framing-two-audiences-not-one)
2. [Case A — live agent-to-user communication](#2-case-a--live-agent-to-user-communication)
3. [Case B — artifact prose (discovery/proposal/specs/design/tasks/align)](#3-case-b--artifact-prose)
4. [Evidence grading and final rule synthesis](#4-evidence-grading-and-final-rule-synthesis)
5. [Recommendations](#5-recommendations)
6. [Sources](#6-sources)

---

## 1. Problem framing: two audiences, not one

The initial question ("non-native OpenSpec users struggle with AI agent responses") turned out to bundle two distinct problems with different constraints:

- **Case A — communication**: interview questions, confirmation prompts, status updates, blocker/pause messages. Ephemeral, read once in real time, no downstream reviewer, no format constraints beyond being understandable in the moment.
- **Case B — artifacts**: discovery.md, proposal.md, specs/*.md, design.md, tasks.md, align.md. Persistent documentation, re-read repeatedly, reviewed by others (who may be native speakers), must preserve normative force (SHALL/MUST/WHEN-THEN) and existing structured formats mandated elsewhere in schema.yaml (checkbox tasks, `#### Scenario:` headers, delta-spec operations).

A single standard does not fit both. Applying a conversational plain-language standard to specs/*.md risks damaging the SHALL/MUST/WHEN-THEN normative language the schema already mandates (schema.yaml lines 56-66); applying a rigid requirements-writing standard to interview questions would make the agent sound stilted mid-conversation.

## 2. Case A — live agent-to-user communication

**Candidates evaluated:**

1. **ASD-STE100 (Simplified Technical English)** — Built 1980s by European aerospace industry (AECMA/now ASD) for aircraft maintenance manuals. 53 grammar rules + ~900-word approved dictionary, one meaning per word. **Misfit**: designed for unambiguous written procedure, not dialogue. Bans gerunds-as-nouns, restricts to a closed dictionary — an agent following it literally could not phrase many ordinary confirmations ("Does this look right?") without violating the dictionary. Useful only as a loose source for sentence-level discipline (short sentences, one idea each), not as the literal rule set to cite.
2. **Federal Plain Language Guidelines / Plain Writing Act 2010 (plainlanguage.gov)** — US government mandate for public-facing documents. Write for the audience, active voice, short sentences, common words over jargon, "you"/"we". Good fit, no fixed vocabulary, plays well with status/blocker messages. Content was pulled from the live site in 2025 but is archived on GitHub.
3. **ISO 24495-1:2023 (Plain Language)** — International, language-independent standard, successor to national plain-language movements. Four principles: findable, understandable, usable, consistent. Strongest overall candidate for this case — modern, audience-driven, not English-only, not tied to a fixed dictionary.
4. **Plain English Campaign (UK, est. 1979)** — Advocacy/certification body (Crystal Mark). 15-20 word average sentences, active voice, jargon-free. Overlaps heavily with #2/#3; contributes a concrete sentence-length heuristic.
5. **Controlled Natural Languages / STE-derived checkers for software** (e.g. Boeing's Simplified English Checker) — same lineage as STE applied to UX text; confirms "borrow STE's discipline, not its literal vocabulary" is the right altitude for developer-facing writing, no single standard here beats ISO 24495-1 or Federal Plain Language for this case.

**Recommendation for Case A**: anchor on **ISO 24495-1** in place of ASD-STE100, synthesized into 5 rules:

1. Prefer common, everyday words over technical jargon or idioms. *(Federal Plain Language Guidelines)*
2. One idea per sentence; keep sentences short, roughly under 20 words. *(Plain English Campaign)*
3. Use active voice and address the user directly as "you". *(Federal Plain Language Guidelines; ISO 24495-1)*
4. Structure multi-part messages with clear headings or lists rather than dense paragraphs. *(ISO 24495-1 — findable/usable)*
5. Avoid culturally specific idioms, humor, or ambiguous pronoun references — write for a reader who may be translating mentally. *(STE's non-native-reader design intent, applied loosely, not its fixed dictionary)*

## 3. Case B — artifact prose

**Candidates evaluated (~8 standards, 15+ sources):**

1. **EARS (Easy Approach to Requirements Syntax)** — Rolls-Royce/Alistair Mavin, 2009 (IEEE RE'09). Fixed clause-order templates ("WHEN \<trigger\>, the \<system\> SHALL \<response\>"), limited keyword vocabulary, explicitly marketed as reducing training burden for global/non-native teams. **Fit: very high** — near-identical grammar to schema.yaml's existing WHEN/THEN + SHALL format, so adopting EARS phrasing conventions is additive, not conflicting.
2. **INCOSE Guide for Writing Requirements (GfWR) v4** — INCOSE Requirements WG, 2022, ~42 rules. Most directly actionable candidate found: R2 (active voice, explicit subject), R7 (ban vague words — "adequate," "reasonable," "user-friendly" — use measurable criteria), R8 (ban escape clauses — "where possible," "as appropriate"), R9 (ban open-ended lists — "etc.," "including but not limited to"), R24 (avoid pronouns like "it/they/this" — repeat the noun so each requirement stands alone), R16 (avoid negatives — state positive criteria). **Fit: very high** — rules exist for precision/testability but happen to also remove ambiguity for non-native readers; none touch SHALL/MUST or WHEN/THEN.
3. **ISO/IEC/IEEE 29148:2018** — umbrella requirements-engineering standard, defines 9 single-requirement quality characteristics (unambiguous, complete, conforms to template, etc.) plus 5 set-level ones. **Fit: high as governance framing**, but it's a meta-standard describing what "good" means, not a prose style guide — pairs with INCOSE/EARS for the actual writing rules.
4. **RFC 2119 / RFC 8174** — IETF, 1997/2017. RFC 8174's specific contribution: normative keywords carry force only in ALL CAPS; lowercase "must/should" is just English. **Fit: directly relevant and already implicitly assumed by the schema** — worth stating explicitly since it lets prose stay natural elsewhere without accidentally creating stealth requirements.
5. **Gherkin/BDD style guides** (Automation Panda's "BDD 101," community best practices) — one behavior per scenario, 3-7 steps, consistent vocabulary (pick one term and never switch), avoid jargon/idiom in step text. **Fit: high** for the specs artifact's scenario blocks specifically; only the scenario-hygiene rules transfer, not Gherkin's own SHALL-free syntax.
6. **Global English / John Kohl's *The Global English Style Guide*** (SAS Institute) — most on-point trade-book source: writing simultaneously clear for native speakers, non-native readers, and MT engines. Restrict passive voice, avoid noun stacks and phrasal verbs with ambiguous particles, put conjunctive adverbs sentence-initial, prefer literal over idiomatic phrasing, one clause = one idea. Explicit caveat in the source: never make a change that reads as unnatural to native speakers just to satisfy the global-English rule.
7. **Microsoft Writing Style Guide — Global Communications** — distinguishes translation vs. localization, guidance to write for MT-friendliness, avoid culture-bound references. **Fit: moderate**, supporting citation, less requirements-specific than INCOSE/EARS.
8. **Google Developer Documentation Style Guide — "Write for a global audience"** — short unambiguous sentences, active voice, direct address, ban idioms/humor/seasonal references, terminology consistency. **Fit: moderate-high**, aimed at prose docs rather than normative requirement statements.
9. **Readability metrics (Flesch-Kincaid, Gunning Fog)** — **rejected as a target metric.** Multiple sources (arXiv 2502.11150, ACM 3524666) confirm these formulas were normed on native speakers and are poor predictors of reading ease for non-native readers; they also reward short-word/short-sentence gaming without tracking actual comprehension.
10. **Controlled Natural Language (CNL) literature** — ACM Computing Surveys 2026 systematic review notes CNLs reduce ambiguity but "fail to address the specific stumbling stones of non-native speakers" and carry their own learning-curve cost. **Fit: low as wholesale adoption** (too heavyweight/tooling-dependent for a Markdown schema), but validates EARS-style light templating as the right altitude rather than full CNL formalization.

**Recommendation for Case B**: anchor on **INCOSE GfWR + EARS** as the primary standards (both are requirements-native and already grammatically compatible with SHALL/MUST/WHEN-THEN), with Kohl's Global English and RFC 8174 as supporting citations. Do not adopt Gherkin's own syntax, only its scenario-hygiene conventions. Synthesized into 6 rules:

1. **No vague or escape-clause language.** Ban "adequate," "reasonable," "as appropriate," "where possible," "etc.," "including but not limited to" — replace with measurable criteria or explicit enumeration. *(INCOSE GfWR R7-R9)*
2. **One requirement, one sentence, active voice, explicit subject.** No compound requirements joined by "and/or" hiding multiple obligations. *(INCOSE GfWR R2, R9)*
3. **Avoid pronouns across sentence boundaries; repeat the noun.** Each requirement/scenario step must be interpretable in isolation, without needing the prior sentence or a heading for context. *(INCOSE GfWR R24-R25)*
4. **Normative keywords (SHALL/MUST/SHOULD) appear only in ALL CAPS and only for actual requirements; never lowercase or in narrative prose in discovery.md/design.md.** *(RFC 2119/8174)*
5. **One term per concept, used identically everywhere in the artifact chain.** Do not vary between synonyms (e.g., "user"/"actor"/"consumer") across proposal.md, specs/*.md, and design.md. *(Gherkin/BDD style guides; Google/Microsoft global-audience guidance)*
6. **Prefer literal, non-idiomatic phrasing; avoid phrasal verbs with ambiguous particles, culture-bound metaphors, and humor**, even in free-prose sections (discovery.md, design.md rationale) — never at the cost of sounding unnatural to a native reader. *(Kohl, Global English Style Guide)*

## 4. Evidence grading and final rule synthesis

The rule sets in §2 and §3 were initially derived by treating each cited standard's recommendations as self-justifying. Challenged on this, two further research passes graded individual sub-rules against actual empirical studies (not standards documents), using: **A** = controlled study with non-native participants measuring comprehension/task outcomes, **B** = controlled study, native participants only, assumed to generalize, **C** = practitioner consensus/case study, no controlled measurement, **D** = standards claim, no cited empirical backing.

**Result: rule-by-rule evidence was thin across both cases.** Only one rule per case reached grade A — pronoun/anaphora ambiguity (Case A's "no dangling pronoun," Case B's "no cross-sentence pronoun") — and even that rule's real backing is narrower than a blanket ban: controlled studies (Cambridge *SSLA*, Reading University corpus work) found L2 readers/listeners struggle with anaphora resolution specifically when **two referents of equal prominence are introduced together** (e.g. via a conjoined noun phrase), not with pronoun use generally. Most other rules landed at B (plausible, borrowed from adjacent-field studies, not tested in this exact context), C (practitioner consensus only), or D (pure convention, e.g. RFC 2119/8174's caps-only keyword rule). A genuine negative result recurred in both passes: simplified text is consistently *rated* easier by non-native readers but does not reliably show a *measured comprehension-accuracy* improvement — meaning shallow rule compliance risks being cosmetic. A live-dialogue-specific finding (Case A only, no analogue for static documents): interaction-design factors — being able to ask a clarifying question, turn-taking allowance, system consistency — may matter more to non-native comprehension than sentence-level wording rules; this is not addressed by either rule set below and is noted here as an open gap, not solved by them.

A follow-up pass asked a different, better question: not "is this granular sub-rule proven" but "is the *standard as a package* empirically justified." That evidence is substantially stronger:

- **EARS** — real before/after industrial data (Mavin et al. 2009/2010) measuring reduced ambiguity/vagueness/wordiness on real aerospace requirement sets, plus a decade of documented adoption (Airbus, Bosch, Rolls-Royce, NASA, Siemens, Intel, Honeywell, Dyson) tracked in a 2016 lessons-learned paper.
- **Kimble's plain-language corpus** (legal/government writing) — 50-60 compiled empirical studies; a named case (IRS letter redesign, tested on 400 real taxpayers per prototype) reporting a 50% drop in confusion and 23% drop in call-center volume.
- **Health-literacy plain-language meta-analyses** — simplified medication-warning text raised correct-interpretation rates to ~90.6%; low-literacy comprehension gap narrows (though doesn't close) under simplification.
- **ISO 24495-1** — formalizes a 2014 international expert-consensus definition (~50 experts, 25 countries) plus an externally maintained evidence bibliography (International Plain Language Federation) not independently inspected in this research.
- **INCOSE GfWR** — correlational evidence only (rule violations correlate with requirements-quality defects); no controlled study isolating GfWR-adoption vs. non-adoption with a measured defect-rate delta was found.

**Caveat carried into the final rule sets below**: this package-level evidence is almost entirely from native-English-speaker populations (US legal/government context, aerospace engineering). Non-native/LEP readers are the *policy rationale* cited by these standards' adopters, but outcome data is rarely segmented by native/non-native status. The inference that these standards help non-native readers specifically is reasonable (general comprehension gains plus the L2 working-memory/anaphora literature in §2-§3 point the same direction) but is an extrapolation, not a direct finding.

**Final rule sets** (supersede the draft lists in §2 and §3; credit for effectiveness is attributed to the anchor standard as a package, not claimed independently per rule except where noted):

**Case A — final:**

1. **A1** — Sentences ≤20 words; split anything longer. *(ISO 24495-1 / Plain English Campaign operationalization; grade B support from L2 working-memory literature)*
2. **A2** — One independent clause per sentence; no "and/but/which" joining two distinct ideas. *(same anchor as A1, grade B)*
3. **A4** — No idioms, metaphors, or humor; literal phrasing only. *(grade B trending toward A — L2 idiom-processing literature is the most mature adjacent evidence base in this set)*
4. **A6 (narrowed)** — No dangling pronoun **specifically where two referents of comparable prominence appear in the same or adjacent sentence**; not a blanket pronoun ban. *(grade A — the one rule with direct non-native-participant experimental backing, scoped to what that evidence actually supports)*

Dropped from the earlier draft: A3 (define-on-first-use) and A5 (lists over paragraphs past 2 sentences) — both graded D, no empirical backing located in a live-dialogue or L2 context.

**Case B — final:**

1. **B1** — Ban vague/escape-clause words ("adequate," "as appropriate," "etc.," "including but not limited to"); replace with measurable criteria or explicit enumeration. *(EARS/INCOSE package-level evidence)*
2. **B2** — One requirement or decision statement per sentence, one obligation, no compound "and/or." *(same anchor as B1)*
3. **B3 (narrowed)** — No cross-sentence pronoun **specifically under the same multi-referent condition as A6**; not a blanket ban. *(grade A, narrowed scope)*
4. **B4** — SHALL/MUST/SHOULD in ALL CAPS only inside actual requirement statements, never in narrative prose. *(RFC 2119/8174 convention — retained for a functional reason independent of the readability claim: it keeps this rule consistent with schema.yaml's existing SHALL/MUST mandate at line 63, not because caps-only readability benefit is itself proven)*
5. **B5** — One term per concept, consistent across the whole artifact chain (proposal → specs → design → tasks); no synonym drift. *(weakest individual evidence in the set — grade D — retained as a low-cost SHOULD, not a MUST, because it's cheap to check regardless of comprehension-outcome proof)*

Dropped from the earlier draft: B6 (no idioms in narrative prose) — weak evidence plus a real tension with design.md's need for precise technical rationale that doesn't always have a simple literal equivalent.

## 5. Recommendations

- **Case A and Case B need separate rule sets, not one shared standard.** ASD-STE100 as currently cited in schema.yaml line 16 is the wrong anchor for either case in its literal form — replace with ISO 24495-1 for Case A, EARS/INCOSE GfWR for Case B.
- **Frame both rule sets honestly when adopted**: "evidence-informed operationalization of standards with credible package-level backing; individual rule wording is this project's derivation, not independently validated per rule; A6/B3 (pronoun ambiguity, narrowed) is the one rule with direct non-native-participant experimental support." Do not claim the rule sets are proven to solve non-native comprehension — claim they're the best currently-evidenced approach, with a known gap (interaction-design factors, e.g. clarification mechanisms, are unaddressed for Case A).
- **Case A scope**: currently schema.yaml line 16 only covers the discovery-phase recap/confirmation prompt. If Case A rules are adopted, consider whether other phases with direct user-facing communication (align's human walkthrough narration, apply's blocker/pause messages, PHASE 0's stop message) should carry the same rule — they are the same "live communication" category, just in different phases.
- **Case B scope**: none of the six artifacts currently have any readability rule for non-native readers. If Case B rules are adopted, they'd need to apply schema-wide (all prose-bearing artifacts) without touching the already-mandated structural formats (checkbox syntax in tasks.md, `#### Scenario:` + WHEN/THEN in specs, delta-operation headers). The INCOSE/EARS rule set was specifically chosen because it's additive to, not in tension with, those formats.
- **Neither case should adopt readability formulas (Flesch-Kincaid/Gunning Fog) as a target metric** — evidenced as unreliable for non-native technical readers.
- No decision has been made yet on *where* in schema.yaml these rules would live (a new global block, a new skill, or duplicated per-instruction) — that's a structural question deferred to implementation, not covered by this research.

## 6. Sources

**Case A:**
- [ASD-STE100](https://www.asd-ste100.org/)
- [Wikipedia: Simplified Technical English](https://en.wikipedia.org/wiki/Simplified_Technical_English)
- [Federal Plain Language Guidelines](https://digitalgovernmenthub.org/library/federal-plain-language-guidelines/)
- [digital.gov principles](https://digital.gov/guides/plain-language/principles)
- [ISO 24495-1:2023](https://www.iso.org/standard/78907.html)
- [Plain Language Association International on ISO](https://plainlanguagenetwork.org/plain-language/iso-plain-language-standard/)
- [Plain English Campaign](https://www.plainenglish.co.uk/)
- [Wikipedia: Plain English Campaign](https://en.wikipedia.org/wiki/Plain_English_Campaign)

**Case B:**
- [EARS official guide — Alistair Mavin](https://alistairmavin.com/ears/)
- [EARS — Wikipedia](https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax)
- [EARS — IEEE RE'09 original paper](https://ieeexplore.ieee.org/document/5328509/)
- [INCOSE Guide to Writing Requirements v4 — Summary Sheet](https://www.incose.org/docs/default-source/working-groups/requirements-wg/guidetowritingrequirements/incose_rwg_gtwr_v4_summary_sheet.pdf)
- [INCOSE Requirements Quality: The 42 Rules, Made Simple — reqi.io](https://reqi.io/articles/incose-requirements-quality-42-rule-guide)
- [ISO/IEC/IEEE 29148:2018](https://www.iso.org/standard/72089.html)
- [ISO 29148 Explained — Modern Requirements](https://www.modernrequirements.com/blogs/iso-29148-explained/)
- [RFC 2119](https://www.rfc-editor.org/info/rfc2119/)
- [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174.html)
- [BDD 101: Writing Good Gherkin — Automation Panda](https://automationpanda.com/2017/01/30/bdd-101-writing-good-gherkin/)
- [Gherkin best practices — TestQuality](https://testquality.com/10-essential-gherkin-best-practices-for-effective-bdd-testing/)
- [The Global English Style Guide — John R. Kohl (SAS review)](https://support.sas.com/en/books/reference-books/the-global-english-style-guide/review.html)
- [The Global English Style Guide — review, TechScribe](https://www.techscribe.co.uk/ta/global-english-style-guide.htm)
- [Microsoft Writing Style Guide — Global Communications](https://learn.microsoft.com/en-us/style-guide/global-communications/)
- [Google developer documentation style guide — Write for a global audience](https://developers.google.com/style/translation)
- [Controlled Natural Language for Requirements Specification: A Systematic Literature Review — ACM Computing Surveys](https://dl.acm.org/doi/10.1145/3778169)
- [Readability Formulas, Systems and LLMs are Poor Predictors of Reading Ease — arXiv 2502.11150](https://arxiv.org/html/2502.11150v3)
- [Non-Native English Speaker Readability Metric — ResearchGate](https://www.researchgate.net/publication/317672876_Non-Native_English_Speaker_Readability_Metric_Reading_Speed_and_Comprehension)

**Evidence-grading pass (§4) — Case B rule-level:**
- [Addressing the Challenges of Requirements Ambiguity: A Review of Empirical Literature](https://researchgate.net/publication/279997528_Addressing_the_Challenges_of_Requirements_Ambiguity_A_Review_of_Empirical_Literature)
- [Femmer et al., Rapid Quality Assurance with Requirements Smells](https://arxiv.org/pdf/1611.08847)
- [Krisch & Houdek, The Myth of Bad Passive Voice and Weak Words](https://www.researchgate.net/publication/281548577_The_Myth_of_Bad_Passive_Voice_and_Weak_Words_An_Empirical_Investigation_in_the_Automotive_Industry)
- [A Second Look at Passive Voice Requirements: Bayesian Reanalysis — arXiv 2402.10800](https://arxiv.org/pdf/2402.10800)
- [Anaphora Resolution in L2 English: Discourse Complexity and Cross-Linguistic Interference](https://eric.ed.gov/?id=EJ1235723)
- [Anaphora resolution and reanalysis during L2 sentence processing (visual world paradigm)](https://centaur.reading.ac.uk/66563/)
- [Masson & Waldron 1994, Comprehension of legal contracts by non-experts](https://onlinelibrary.wiley.com/doi/abs/10.1002/acp.2350080107)
- [Exploring the Effect of Plain Terminology on Processing/Comprehension of Administrative Texts in Spanish](https://onlinelibrary.wiley.com/doi/10.1111/ijal.12650)
- [Measuring the Fitness-for-Purpose of Requirements — arXiv 2405.09895](https://arxiv.org/pdf/2405.09895)
- [A Survey and Classification of Controlled Natural Languages](https://aclanthology.org/J14-1005.pdf)
- [Effects of Terminology Consistency on Reader Comprehension (guest post, notes research gap)](https://idratherbewriting.com/2017/03/10/effects-of-terminology-consistency-guest-post/)

**Evidence-grading pass (§4) — Case A rule-level:** primarily WebSearch-sourced SLA/psycholinguistics and HCI literature (L2 sentence-processing working-memory studies, L2 idiom-comprehension studies including a 2025 *Frontiers* phrasal-verb study, non-native chatbot/dialogue-repair studies including a Czech-L2-learner controlled chatbot study, and a Springer LLM-text-simplification study reporting the ease-rating/comprehension-accuracy null result) — not re-verified at citation-audit depth; treat as a starting point for follow-up.

**Standard-as-package effectiveness pass (§4):**
- [GAO Plain Writing](https://www.gao.gov/plain-writing) / [GAO 2022 compliance report](https://www.gao.gov/plain-writing-2022)
- [VisibleThread: How Plain Language Cuts Call Center Costs](https://www.visiblethread.com/blog/how-plain-language-cuts-call-center-costs/)
- [Center for American Progress: IRS Aims for Letter-Perfect Language](https://www.americanprogress.org/article/irs-aims-for-letter-perfect-language/)
- [The Making of the International Standard for Writing in Plain Language, ISO 24495-1](https://www.researchgate.net/publication/378993982_The_Making_of_the_International_Standard_for_Writing_in_Plain_Language_ISO_24495-1)
- [IPLF ISO Standard page](https://www.iplfederation.org/iso-standard/)
- [Applying INCOSE Rules for Writing High-Quality Requirements in Industry](https://www.researchgate.net/publication/308084037)
- [Does Quality of Requirements Specifications Matter? — arXiv 1702.07656](https://arxiv.org/pdf/1702.07656)
- [EARS original paper (Mavin et al., RE'09)](https://ccy05327.github.io/SDD/08-PDF/Easy%20Approach%20to%20Requirements%20Syntax%20(EARS).pdf)
- [Big Ears: The Return of Easy Approach to Requirements Engineering (RE'10)](https://www.researchgate.net/publication/224195362_Big_Ears_The_Return_of_Easy_Approach_to_Requirements_Engineering)
- [Cooley Law: Multiple and Extraordinary Benefits of Writing in Plain Language (Kimble)](https://cooley.edu/news/multiple-and-extraordinary-benefits-writing-plain-language)
- [Scribes: Writing for Dollars, Writing to Please (summary PDF)](https://scribes.org/wp-content/uploads/2022/12/Scribes_vol6_04_Writing_for_Dollars.pdf)
- [Use of Plain-Language Guidelines to Promote Health Literacy](https://www.academia.edu/107300714)
- [An Innovative Health Literacy Approach to Medication Labeling — PMC8492593](https://pmc.ncbi.nlm.nih.gov/articles/PMC8492593/)
