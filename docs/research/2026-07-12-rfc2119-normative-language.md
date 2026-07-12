# Should `hash` schema.yaml instructions adopt RFC 2119 (or similar normative-keyword) style?

**Date:** 2026-07-12
**Scope:** research whether `openspec/schemas/hash/schema.yaml` instruction text should formally declare and consistently apply RFC 2119 (MUST/SHOULD/MAY) or an equivalent normative-keyword convention. Pure research — no changes applied from this document.
**Trigger:** `schema.yaml` already mixes capitalized (`MUST`, `SHALL`) and lowercase (`should`, `must`) normative-sounding words without ever declaring which usage is binding — see [§4](#4-current-state-of-schemayaml).

## Contents

1. [Answer up front](#1-answer-up-front)
2. [What RFC 2119 actually says](#2-what-rfc-2119-actually-says)
3. [How the ecosystem actually uses normative keywords for LLM/agent instructions](#3-how-the-ecosystem-actually-uses-normative-keywords-for-llmagent-instructions)
4. [Current state of schema.yaml](#4-current-state-of-schemayaml)
5. [Recommendation](#5-recommendation)
6. [Sources](#6-sources)

---

## 1. Answer up front

**No full RFC 2119 boilerplate. Yes to disciplined, sparse MUST/SHOULD capitalization — which the schema already does in some places and should extend consistently.**

The full ceremony (a BCP-14 disclaimer paragraph, all ten keywords, applied to every sentence) is built for interoperable standards read by human implementers across organizations. `schema.yaml` is a single-author prompt file read by one kind of reader (an LLM agent) inside one tool. That context changes what's worth borrowing:

- **Worth borrowing:** capitalized MUST/SHOULD used *sparingly*, reserved for the small set of statements where deviation actually breaks something downstream (parsing, phase gating, TDD ordering) — this is what Anthropic's own Skill-authoring guidance independently arrives at, without ever citing RFC 2119.
- **Not worth borrowing:** the formal declaration sentence, SHALL/REQUIRED/RECOMMENDED/OPTIONAL as distinct tiers, or applying keywords to every instruction. Every source surveyed that targets LLM instructions (not IETF-style multi-vendor specs) converges on *less* ceremony, not more.

## 2. What RFC 2119 actually says

RFC 2119 (Bradner, 1997) defines MUST/MUST NOT/REQUIRED/SHALL/SHALL NOT/SHOULD/SHOULD NOT/RECOMMENDED/MAY/OPTIONAL for IETF protocol specs. Two details are load-bearing and frequently missed:

1. **Capitalization is the entire mechanism.** RFC 8174 (2017) was published specifically because RFC 2119's original wording ("are often capitalized") left it ambiguous whether lowercase "must"/"should" also carried normative weight. RFC 8174 closes the gap: the special meaning applies **only** in all-caps; lowercase is ordinary English with no normative force.
2. **A required declaration sentence.** To invoke either RFC, a document must include, near the top: *"The key words MUST, MUST NOT, ... are to be interpreted as described in BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals."* Without this sentence, capitalized MUST is just emphasis, not a standards reference — W3C's own manual of style makes the same point: if a document (or section) is informative rather than normative, it should say so and **not** use RFC 2119 keywords at all in that section.
3. **RFC 2119 itself warns against overuse**: the keywords "must be used with care and sparingly," reserved for requirements genuinely necessary for interoperability — not a stylistic default. This constraint gets cited approvingly by EARS documentation and OASIS's keyword guidelines alike; nobody who has actually implemented RFC 2119 treats it as "capitalize everything."

## 3. How the ecosystem actually uses normative keywords for LLM/agent instructions

Surveyed across four categories — standards bodies, official model-vendor guidance, community agent-instruction formats, and comparable spec-driven-dev tools (including this project's own upstream). Pattern held across all four: **sparse, judgment-gated MUST, no full RFC 2119 ceremony, no SHALL/REQUIRED/RECOMMENDED tier system.**

### Official model-vendor guidance (no RFC 2119 anywhere)

- **Anthropic Skill-authoring best practices** never mentions RFC 2119, but independently reaches the same "use MUST sparingly, for emphasis where compliance is weak" conclusion — verbatim: *"using stronger language like 'MUST filter' instead of 'always filter'"* is offered as a fix specifically when an agent was observed skipping a rule in practice, not as a default style.
- The same doc's **"degrees of freedom"** framework maps directly onto when a MUST-style hard constraint is appropriate: **low-freedom** tasks (fragile, must follow an exact sequence — e.g. "Run exactly this script... Do not modify the command") warrant rigid, MUST-like phrasing; **high-freedom** tasks (heuristics, many valid approaches — e.g. code review steps) should stay as plain numbered guidance with no normative keyword at all, because forcing MUST onto a judgment call is itself the failure mode.
- Anthropic's Claude prompting-best-practices docs push clarity via explicit-context and XML-tag structuring, not normative keywords. A parallel finding (Claude Help Center guidance) explicitly warns that **all-caps emphasis has lost potency** as a compliance mechanism in current-generation Claude: the model now weighs context and logic over shouting, so a capitalized MUST is read as a strong signal, not an unconditional override of contradicted context.
- **OpenAI's GPT-5 prompting guide** makes the sharper version of the same warning: GPT-5-class models follow prompt contracts closely, so **contradictory instructions are more damaging than missing detail** — i.e. inconsistent MUST/should capitalization (schema.yaml's actual current state) is a worse failure mode for a modern model than under-specifying, because the model will try to honor the contradiction literally rather than shrug it off as noise the way older/weaker models might.
- **OpenAI's Model Spec** solves the "which instruction wins" problem structurally instead of lexically: an explicit authority hierarchy (Root → System → Developer → User → Guideline) rather than keyword tiers. Relevant precedent for `hash` if the real goal is "which of these instructions is non-negotiable," since a hierarchy answers that more robustly than a keyword.

### Community agent-instruction conventions (light RFC 2119 borrowing, explicitly bounded)

- **`agent-rules/agent-rules`** (community standard for AI coding-agent config files) recommends MUST/SHOULD "inspired by RFC 2119 conventions" but frames it as *available for clarity*, not mandatory formatting — paired with a stronger, more load-bearing recommendation to keep rules as flat, scannable bullet lists over any formal structure.
- **`strands-agents/agent-sop`** uses MUST/SHOULD/MAY per workflow step specifically to give "precise control... without rigid scripting" — i.e. the keywords bound the *edges* of agent judgment (what's non-negotiable vs. optional) while deliberately leaving *how* to accomplish a MUST up to the agent's reasoning. This is the same shape as Anthropic's degrees-of-freedom framing from a different origin.
- **`agentskills/agentskills`** (the emerging cross-vendor Agent Skills spec, backed by Anthropic + others) is the one place in this survey that *does* use the full formal RFC 8174 declaration sentence — but only because it's a multi-implementer interoperability spec (like IETF RFCs), defining what any tool claiming SKILL.md compatibility must do. That's the genuine RFC 2119 use case; it doesn't apply to `schema.yaml`, which has exactly one implementer (this repo) and one reader (the agent executing a phase).
- A **GitHub feature-request thread** on `anthropics/claude-code` (#42295, "RFC 2119 keyword enforcement layer for CLAUDE.md") makes the limitation explicit: today, MUST and "prefer" are enforced identically — by the model's best-effort probabilistic compliance. There is no mechanical distinction. Absent a harness-level enforcement layer (which doesn't exist yet), a MUST in `schema.yaml` is a strong hint to the agent, not a guarantee — the same ceiling every other source in this survey converges on.
- **Strands Agents' own engineering blog** goes further, arguing prompt-embedded rules (RFC-2119-styled or not) measurably degrade at scale — a "check book status before renewing" MUST-equivalent rule was silently skipped in **43% of failed runs** despite being explicitly stated, because a rule buried in a long upfront prompt competes with everything else the agent is attending to at decision time. Their fix was mechanical (steering hooks that inject the rule at the moment of the relevant tool call), not better wording. Directly relevant ceiling on what capitalization alone can achieve in `schema.yaml`'s instruction blocks, which run to 40+ lines per phase.

### Comparable spec-driven-dev tools (inconsistent in practice — including this project's own ancestor)

- **`Fission-AI/OpenSpec`'s own upstream `schemas/spec-driven/schema.yaml`** — the schema `hash` forked from — uses MUST/SHALL only inside the specs-artifact instruction (`"Use SHALL/MUST for normative requirements (avoid should/may)"`, `"Scenarios MUST use exactly 4 hashtags"`), while proposal/design/tasks instructions stay entirely conversational ("Keep it concise," "create only if any apply"). This is exactly `hash`'s current pattern, inherited rather than invented — worth knowing before treating it as a `hash`-specific inconsistency to fix in isolation.
- **`github/spec-kit`'s `spec-driven.md`** is more inconsistent than `hash`: true capitalized RFC-2119-style MUST/SHALL sentences ("Every feature... MUST begin its existence as a standalone library," "No implementation code shall be written before...") sit alongside emphatic-but-non-standard markers like **"This is NON-NEGOTIABLE"** and "No exceptions" doing the same job with zero normative-keyword vocabulary at all. If GitHub's own flagship spec-driven-dev tool doesn't achieve internal consistency here, that's a signal the inconsistency is a low-cost, low-priority problem in practice for this genre of tool — not a signal to ignore it, but to right-size the fix.
- **EARS ("Easy Approach to Requirements Syntax")** is the one alternative format actually purpose-built for *requirements* text (not general agent instructions): `While <precondition>, when <trigger>, the <system> shall <response>`. This is a stronger fit than raw RFC 2119 specifically for `schema.yaml`'s `specs` artifact instruction (line ~67, "Use SHALL/MUST... avoid should/may"), since EARS's fixed clause order (precondition → trigger → system → response) is more mechanically checkable by a downstream tool than free-form SHALL prose is — same enforceability goal `hash`'s own `####` Scenario / WHEN-THEN convention is already reaching for by a different route.
- **Gherkin (Given/When/Then)** is the format `hash`'s own spec scenarios already resemble (`#### Scenario: ... WHEN/THEN`) — it's a complementary, not competing, convention: Gherkin/EARS structure *what a scenario says*; RFC-2119-style keywords (if used at all) would govern *how strictly a requirement statement itself binds*. The two operate at different altitudes and `hash` already uses the first.

## 4. Current state of schema.yaml

Read in full for this research pass (`openspec/schemas/hash/schema.yaml`, 253 lines). Findings:

- **No declaration.** Nowhere does the file say these words carry special meaning, unlike every genuine RFC 2119 adopter surveyed (agentskills spec, W3C specs).
- **Inconsistent capitalization of the same word.** Capitalized normative use exists and is doing real work: `specs` instruction line ~61 ("**MODIFIED Requirements**: Changed behavior - MUST include full updated content"), line ~69 ("Scenarios MUST use exactly 4 hashtags"), line ~70 ("Every requirement MUST have at least one scenario"), line ~138 ("Each task MUST be a checkbox"). These are all genuinely low-freedom, mechanically-checkable constraints — exactly where Anthropic's guidance says a hard capitalized MUST earns its keep.
- Elsewhere the same concept appears lowercase and non-normative: e.g. discovery's "Keep interviewing until the problem... **is understood**," "Do **NOT** proceed... until the user has explicitly confirmed" (line ~17, capitalized NOT for a genuine hard gate — consistent with the pattern above, good), versus design's "create only **if** any apply" (line ~110, correctly non-normative — this is a heuristic judgment call, matches Anthropic's high-freedom guidance).
- **The one real inconsistency worth naming:** `specs` instruction line 67 tells the *downstream artifact author* to "Use SHALL/MUST for normative requirements (avoid should/may)" — a rule schema.yaml enforces on the specs it generates — while schema.yaml's own instruction prose doesn't hold itself to that same discipline elsewhere (plenty of unemphasized "should"/lowercase-must scattered through discovery/proposal/design/align/apply where the rule *is* actually load-bearing, e.g. align's "the proposal never contradicts discovery" — an unmarked MUST-shaped statement).
- No SHALL/REQUIRED/RECOMMENDED/OPTIONAL tier is used or needed — the file already has its own two-tier severity vocabulary for review findings (HIGH/MEDIUM/LOW, MECHANICAL/DECISION) which is a better-fitted, domain-specific alternative to RFC 2119's generic tiers for that specific use case.

## 5. Recommendation

Don't adopt RFC 2119 formally (no BCP-14 sentence, no SHALL/REQUIRED/RECOMMENDED tier). Instead:

1. **Keep and extend the sparse-capitalized-MUST pattern already in the file**, applied by the same rule Anthropic's docs and `strands-agents/agent-sop` both converge on independently: capitalize MUST/MUST NOT only where the constraint is mechanically checkable and low-freedom (breaks parsing, breaks phase gating, breaks TDD ordering) — not as a blanket style pass over every sentence. Candidates already in this shape: hashtag count, checkbox format, "every requirement needs a scenario," align/apply's stop conditions.
2. **Do not capitalize heuristic/judgment instructions** (design's "create only if any apply," align's severity classification calls) — forcing MUST onto those would misrepresent them as mechanical when the schema's own MECHANICAL/DECISION tagging elsewhere already recognizes they aren't.
3. **If closing the one real inconsistency (§4) is worth the diff**, the fix is narrow: audit each existing "should"/"must" for whether it's actually load-bearing (→ capitalize) or descriptive prose (→ leave alone, maybe reword to avoid the word entirely so no reader mistakes it for emphasis). This is a MECHANICAL-tier find-and-fix, not a DECISION-tier redesign — it doesn't need a declaration sentence to be internally consistent, because there's exactly one author and one reader for this file, not a multi-vendor interoperability audience.
4. **Skip EARS/Gherkin adoption for schema.yaml's own instructions** — right format, wrong layer. `hash`'s specs artifact already asks for Gherkin-shaped scenarios (`#### Scenario: ... WHEN/THEN`) in the documents it generates; EARS-style fixed clause order could tighten *that* instruction's own wording if `openspec validate --strict` ever needs something more mechanically parseable than "use SHALL/MUST" prose — a follow-up worth a separate, narrow proposal, not bundled into this one.

Net effect on `schema.yaml`: small, surgical capitalization/rewording pass, no structural change, no new declaration boilerplate.

## 6. Sources

**Standards bodies / official specs**
1. [RFC 2119 — datatracker.ietf.org](https://datatracker.ietf.org/doc/html/rfc2119)
2. [RFC 2119 — rfc-editor.org](https://www.rfc-editor.org/rfc/rfc2119.html)
3. [RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words](https://www.rfc-editor.org/rfc/rfc8174.html)
4. [RFC 8174 — datatracker.ietf.org](https://datatracker.ietf.org/doc/rfc8174/)
5. [W3C Manual of Style — RfcKeywords](https://www.w3.org/wiki/RfcKeywords)
6. [OASIS Keyword Guidelines for Specifications and Standards](https://www.oasis-open.org/policies-guidelines/keyword-guidelines/)
7. [EARS — Alistair Mavin, official guide](https://alistairmavin.com/ears/)
8. [Jama Software — Adopting EARS Notation for Requirements Engineering](https://www.jamasoftware.com/requirements-management-guide/writing-requirements/adopting-the-ears-notation-to-improve-requirements-engineering/)
9. [QRA Corp — When Not to Use EARS](https://qracorp.com/when-not-to-use-ears/)
10. [Cucumber — Writing better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/)

**Official model-vendor guidance**
11. [Anthropic — Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
12. [Anthropic — Claude prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
13. [Anthropic engineering — Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
14. [Anthropic engineering — Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
15. [Claude Help Center — Give Claude context: CLAUDE.md and better prompts](https://support.claude.com/en/articles/14553240-give-claude-context-claude-md-and-better-prompts)
16. [OpenAI — GPT-5 prompting guide (developers cookbook)](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)
17. [OpenAI — Model Spec (2025/12/18)](https://model-spec.openai.com/2025-12-18.html)
18. [OpenAI — Inside our approach to the Model Spec](https://openai.com/index/our-approach-to-the-model-spec/)

**Community agent-instruction conventions / repos**
19. [`agent-rules/agent-rules`](https://github.com/agent-rules/agent-rules)
20. [`strands-agents/agent-sop`](https://github.com/strands-agents/agent-sop)
21. [`agentskills/agentskills` — specification.mdx](https://github.com/agentskills/agentskills/blob/main/docs/specification.mdx)
22. [`obra/superpowers` — anthropic-best-practices.md](https://github.com/obra/superpowers/blob/main/skills/writing-skills/anthropic-best-practices.md)
23. [GitHub issue — anthropics/claude-code #42295, "RFC 2119 keyword enforcement layer for CLAUDE.md"](https://github.com/anthropics/claude-code/issues/42295)
24. [Strands Agents blog — How Steering Hooks Achieved 100% Agent Accuracy Where Prompts and Workflows Failed](https://strandsagents.com/blog/steering-accuracy-beats-prompts-workflows/)
25. [dev.to — Your AI Agent Configs Are Probably Broken (and You Don't Know It)](https://dev.to/avifenesh/your-ai-agent-configs-are-probably-broken-and-you-dont-know-it-16n1)
26. [AGENTS.md best practices — GitHub gist](https://gist.github.com/0xfauzi/7c8f65572930a21efa62623557d83f6e)
27. [GitHub Blog — How to write a great agents.md: lessons from 2,500+ repositories](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)

**Comparable spec-driven-dev tools**
28. [`Fission-AI/OpenSpec` — schemas/spec-driven/schema.yaml](https://github.com/Fission-AI/OpenSpec/blob/main/schemas/spec-driven/schema.yaml)
29. [`Fission-AI/OpenSpec` — docs/customization.md](https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md)
30. [`github/spec-kit` — spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md)

---

*No changes applied to `schema.yaml` from this document. See §5 for the scoped recommendation if the user wants to proceed.*
