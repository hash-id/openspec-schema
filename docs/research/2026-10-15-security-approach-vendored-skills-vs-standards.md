# Research: tempa-spec's security approach — vendored wshobson skills vs. OWASP/NIST standards and what industry and academia actually do

**Date:** 2026-10-15
**Scope:** Evaluate how `tempa-spec` handles security and risk today (three vendored `wshobson/agents` skills wired into `specs` and `design`, a `[security]` task tag, an `align` coverage check) and compare it against (a) standards (OWASP ASVS, Top 10, Agentic Top 10, Threat Modeling Manifesto, NIST SSDF, LINDDUN), (b) how Anthropic, OpenAI, Cloudflare, Vercel and Google run security review on AI-written code, and (c) academic evidence on LLM-generated code security, LLM threat modeling, and LLM + static-analysis hybrids.
**Status:** Stages 1 and 2 of §7 were implemented as schema v14 (see CHANGELOG, Unreleased) in a leaner form than this document proposed. ASVS (Stage 3, §10) was evaluated and **not adopted**, because a plan-time check does not justify a lookup script, an attribution file, and a CC BY-SA bundle; `hrt-security-pass` is a short `SKILL.md` (STRIDE questions plus a surface table) with one small reference file per list, read only for the surfaces a change touches: OWASP Top 10 lists for web, API, mobile, LLM, agent and machine identities, the MITRE CWE Top 25 2025, and Odoo hints. Cheat Sheet names, list ids, or CWE ids serve as mitigation sources. The list names were verified against official OWASP and MITRE pages or repositories on 2026-10-15; the Agentic Top 10 titles were not on the official page and are flagged in their file. Sections 1–6 and 8–10 remain as the evidence record.
**Method:** repo read (`schema.yaml`, the three vendored `SKILL.md` files, `hrt-*` review skills, `docs/research/2026-07-16-skills-as-dependencies-plan.md`), then WebSearch plus WebFetch against primary pages where reachable. 42 distinct sources in §8, each tagged by how it was verified. Two primary pages (OpenAI) returned HTTP 403, so those claims rest on search snippets and are marked. A follow-up pass (§10) verified the OWASP material against official pages and the ASVS repository, measured ASVS size, and checked licences.
**Relation to prior passes:** The adoption of the three skills is recorded in [2026-07-16-skills-as-dependencies-plan.md](2026-07-16-skills-as-dependencies-plan.md) (Secure-by-design section). That pass searched the `skills.sh` registry and agent-skill repos only; it never compared against standards or published industry practice. This pass does.

## Contents

1. [Current state](#1-current-state)
2. [Problems found in the current approach](#2-problems-found-in-the-current-approach)
3. [What the standards offer](#3-what-the-standards-offer)
4. [What industry does](#4-what-industry-does)
5. [What the research says](#5-what-the-research-says)
6. [Cross-cutting findings](#6-cross-cutting-findings)
7. [Staged recommendation](#7-staged-recommendation)
8. [Sources](#8-sources)
9. [Verification debt](#9-verification-debt)
10. [Follow-up: official OWASP sources, ASVS licence, size, and SAST tooling](#10-follow-up-official-owasp-sources-asvs-licence-size-and-sast-tooling)

---

## 1. Current state

| Phase | Mechanism | Where |
|---|---|---|
| `specs` | Per-capability trust-boundary check; if hit, SHOULD consider `security-requirement-extraction` categories; result is a normal `### Requirement` | `schema.yaml` (specs instruction) |
| `design` | Trust-boundary check; if hit, MUST use `stride-analysis-patterns`, then `threat-mitigation-mapping`; output is `[Threat] → Mitigation` lines in Risks / Trade-offs | `schema.yaml` (design instruction) |
| `tasks` | Each threat and negative scenario traces to a task; tag `[security]` / `[negative]` | `schema.yaml` (tasks instruction) |
| `align` | A `[Threat] →` entry with no task is HIGH | `hrt-align-consistency-review` |
| `apply` | No security lens in `hrt-apply-code-review`; `hrt-mr-brief` Blast Radius mentions threat coverage | `hrt-apply-code-review`, `hrt-mr-brief` |

The three vendored skills total about 8.3 KB of `SKILL.md` (2.5 / 3.3 / 2.5 KB) plus about 64 KB of `references/details.md` (18.5 / 23.6 / 21.9 KB, Python dataclass templates). The `SKILL.md` bodies are a concept table, a "when to use" list, and Do/Don't bullets.

## 2. Problems found in the current approach

1. **The vendored skills add little beyond what the model already knows.** STRIDE is a six-row table; the rest is generic Do/Don't. The substantive material sits in `references/details.md` as Python dataclasses, which is the wrong artifact for an agent writing markdown.
2. **`threat-mitigation-mapping` is the wrong level.** Its reference material covers investment prioritisation, executive summaries, and roadmaps. `design.md` needs one mitigation line per threat.
3. **No external anchor.** Requirements and mitigations cite no ASVS ID or CWE, so nothing can be checked for completeness against a standard.
4. **No severity.** `[Threat] → Mitigation` carries no likelihood or impact, so `align` and `apply` cannot prioritise.
5. **Apply has no security review.** Threats are verified only through the existence of negative-test tasks. Injection, hardcoded secrets, missing authorisation checks, and vulnerable dependencies in the diff are not examined, and no deterministic scanner runs. This contradicts the repo's own deterministic-first pattern (`hrt-artifact-lint`, the test/lint gate in `hrt-apply-code-review`).
6. **The gate trigger list is narrow and agent-judged.** It omits secrets and credentials, sensitive data in logs, new dependencies (supply chain), file upload and deserialisation, and LLM or agent tool use. `align` checks that written threats have tasks; it does not check that a "no trust boundary, skipped" note is correct.
7. **Modal inconsistency.** The `design` gate says MUST; the `specs` gate says SHOULD for the same underlying decision.

## 3. What the standards offer

**OWASP ASVS 5.0.0** (May 2025). A catalogue of about 350 verifiable security requirements in 17 chapters, three cumulative levels (L1 baseline, L2 for most apps handling sensitive data, L3 high assurance). Requirement IDs are `<chapter>.<section>.<requirement>`; external documents are told to cite `v5.0.0-<chapter>.<section>.<requirement>` so the reference stays stable. A CSV is published. Licence is **CC BY-SA 4.0**, not MIT (§9 notes the vendoring implication). This is exactly the artifact the `specs` phase lacks: a testable, ID-addressable requirement source. [S1, S2]

**OWASP Top 10:2025.** Order as reported by secondary sources: A01 Broken Access Control, A02 Security Misconfiguration, A03 Software Supply Chain Failures (new, expands "vulnerable and outdated components"), A04 Cryptographic Failures, A05 Injection, A06 Insecure Design, A07 Authentication Failures, A08 Software or Data Integrity Failures, A09 Logging and Alerting Failures, A10 Mishandling of Exceptional Conditions (new). SSRF folded into A01. Awareness-level list, suited to a code-review checklist rather than a requirements source. [S3]

**OWASP Top 10 for Agentic Applications 2026** (published 9 Dec 2025, ASI01–ASI10: planning, tool use, identity, supply chain, code execution, memory, inter-agent communication, cascading failures, human-agent trust, rogue agents). Relevant when a change specs an LLM or agent feature, and for this repo's own agent-facing surface. [S4]

**Threat Modeling Manifesto** and OWASP's threat-modeling guidance: four questions — what are we working on, what can go wrong, what are we going to do about it, did we do a good enough job. Methodology-neutral; STRIDE, kill chains, and attack trees are examples of answering question 2. [S5] Mapped to this pipeline, questions 1–3 are covered by `proposal`/`design`/`tasks`. Question 4 is covered only weakly, because `apply` verifies threats through test existence, not through any examination of the resulting code.

**NIST SP 800-218A** extends SSDF 1.1 (SP 800-218) with AI-specific practices; final July 2024, page updated June 2025. Process-level; useful for compliance citation, not for per-change work. [S6] **CISA Secure by Design** is a manufacturer-level principle set (ownership of customer security outcomes, transparency, executive commitment); same conclusion. [S7]

**LINDDUN** (KU Leuven) is the privacy counterpart to STRIDE: seven categories (Linkability, Identifiability, Non-repudiation, Detectability, Disclosure, Unawareness, Non-compliance), DFD-based, with a lightweight GO variant. Conditional on personal data; relevant to Indonesian projects under data-protection law. [S8]

## 4. What industry does

| Source | Pattern |
|---|---|
| **Anthropic** `/security-review` and the GitHub Action | Diff-aware review; a separate false-positive filtering stage with its own model calls; **explicit exclusion list** (DoS, rate limiting, resource exhaustion, generic input validation without proven impact, open redirects); category list covering injection, authn/z, data exposure, crypto, business logic, config, supply chain, code execution, XSS; custom scan and filter instructions per project. Documented limitation: **not hardened against prompt injection**, so only run on trusted PRs. [S9, S10, S11] |
| **Anthropic Claude Code Security** (Feb 2026, limited preview) | Reasoning-based rather than rule-based scanning; multi-stage self-verification to filter false positives; severity and confidence ratings; proposes patches but applies nothing without human approval. Secondary coverage only. [S12] |
| **OpenAI Aardvark → Codex Security** | Builds a **repo-specific, editable threat model** first; scans commits against it; **reproduces the finding in an isolated sandbox** before surfacing it; proposes a patch for human review. Reported noise reductions are vendor figures. Primary pages returned 403; claims from search snippets. [S13, S14] |
| **Cloudflare** AI code review (Apr 2026) | Coordinator plus up to seven specialist agents; **risk tiering by diff size and path, with security-sensitive paths (`auth/`, `crypto/`) always forced to full review**; the security reviewer prompt lists what to flag (injection, authz bypass, hardcoded secrets, weak crypto, missing validation at trust boundaries, only if "exploitable or concretely dangerous") and what **not** to flag (theoretical risks, defence-in-depth suggestions when primary defences are adequate, unchanged code, generic "use library X"); coordinator dedupes, drops speculative findings, reads source when unsure; approval is the default. Measured: 131,246 runs, 48,095 MRs, 30 days, mean $1.19 per review. The post's own findings table has minor internal inconsistencies, so cite the run counts, not the per-reviewer percentages. [S15] |
| **Cloudflare** engineering Codex | Standards stored as RFC statements, each MUST/SHOULD extracted into JSON with a **stable slug ID**; approved RFCs give non-blocking findings, enforced RFCs can withhold approval on an unmet MUST; security named as a cross-cutting domain. Same MUST/SHOULD-with-stable-ID shape this repo uses. [S16] |
| **Vercel v0** | Generation-time and pre-deploy checks for exposed secrets, `NEXT_PUBLIC_` misuse, tokens in logs, unauthenticated routes, unsafe auth/db defaults; deploy blocked until flagged items are reviewed. Vendor-reported scale (over 100k blocked deployments). Promotional source. [S18] |
| **Vercel** security boundaries | Four actors (agent, agent secrets, generated-code execution, filesystem/environment) at different trust levels; recommends sandboxing generated code and injecting secrets at the network layer. Frames prompt injection as the entry point and code execution as the amplifier. [S19] |
| **Google CodeMender / Big Sleep** | Detect-then-patch agents with automated validation against regressions; every patch human-reviewed. Secondary coverage. [S20] |

Convergent shape across all of these: **candidate generation by LLM or scanner, then a distinct verification or filtering stage, then human approval of any change**. Convergent prompt design: an explicit exclusion list. Convergent scoping: tie review depth to blast radius (path, size) before involving a model.

## 5. What the research says

**LLM-generated code is routinely insecure.** BaxBench (ICML 2025): 392 backend tasks; the best model reached about 62% functional correctness and exploits succeeded against roughly half of each model's correct programs. [S21] Fu et al. (TOSEM): of Copilot, CodeWhisperer and Codeium snippets found in GitHub projects, 29.5% of Python and 24.2% of JavaScript had weaknesses across 43 CWE categories. [S22] Pearce et al. is the original Copilot study. [S23] Consequence: design-time security text alone cannot be the only control; the code needs checking.

**Prompting helps, with iteration.** Tony et al. tested prompting techniques for secure code generation; Recursive Criticism and Improvement performed best, on GPT-3/3.5/4 (dated models). [S24] `hrt-adversarial-authoring` is an RCI-shaped loop, so our authoring side is directionally supported; there is no equivalent loop on the code side.

**LLM threat modeling is mediocre without grounding.** Five LLMs classifying six 5G threats under STRIDE peaked at 72% accuracy; the authors recommend fine-tuning. [S25] ASTRIDE extends STRIDE for agentic systems with diagram-reading models. [S26] Consequence: a STRIDE pass by an unaided model is a draft, not a completeness proof; it needs an external anchor and review.

**Grounding in ASVS beats free generation.** F2SRD (FSE 2025) retrieves relevant ASVS verification requirements and uses them to prompt GPT-4, outperforming two baselines on specificity and diversity. [S27] An ASVS classification study reached macro-F1 0.941 with few-shot Gemini 2.0. [S28] A practitioner write-up reports that an ungrounded model hallucinated ASVS requirements. [S28b] Consequence: if ASVS is the anchor, its text must be supplied, not recalled.

**Hybrid beats either alone.** IRIS (CodeQL plus LLM) found more vulnerabilities and cut false alarms. [S29] ZeroFalse uses the analyser's output as structured input and has the LLM adjudicate each finding with CWE-specific context. [S30] Firouzi and Ghafari found only about 65% (Semgrep) and 61% (CodeQL) of reports matched human-validated ground truth on LLM-generated code, so neither side can be the sole judge. [S31] SAST-Genius reports a large false-positive cut but is a single-team result. [S32]

**Agent-facing attack surface is real.** A 2026 systematization of prompt injection against coding assistants (Claude Code, Copilot, Cursor, skills, MCP) argues for architectural mitigations over ad-hoc filtering, and notes that skills can grant broad tools without file scoping; its attack-success numbers are quoted from other work, not replicated. [S33]

## 6. Cross-cutting findings

1. **We verify threats by test existence, industry verifies by reproduction.** OpenAI's sandbox reproduction and Anthropic's second-stage filter both exist to avoid unverified findings. Our `[security]` task, written test-first with RED output kept by `apply` Phase 1, is already a reproduction in miniature. What is missing is a check that the RED test actually exercises the threat, not just that a test exists.
2. **Deterministic triggers beat agent judgement for the gate.** Cloudflare forces full review by path. Our gate is a sentence the agent interprets, and `align` does not audit a skip. A keyword or path trigger in `hrt-artifact-lint` (auth, token, session, password, upload, deserialize, exec, secret, dependency manifests) would make the gate structural, consistent with how `proposal`'s External Dependencies table made the `research` trigger structural.
3. **An exclusion list is the cheapest quality lever.** Both Anthropic and Cloudflare publish what not to flag. Our consequence gate (finding must name what an implementer concretely hits) is the same idea in general form; a security-specific exclusion list would tune it.
4. **A persistent, editable threat model is the main idea we do not have.** OpenAI builds one per repo and lets humans edit it. Ours is per-change inside `design.md`. A repo-level `openspec/threat-model.md` is plausible but adds an artifact, a maintenance burden, and a drift problem; treat as an option, not a recommendation, until the cheaper stages are measured.
5. **Run a scanner before asking a model.** Every hybrid result points the same way. If the downstream repo has Semgrep, gitleaks, osv-scanner, `npm audit` or CodeQL configured, `apply` should run them as a deterministic gate and treat findings as HIGH, with the LLM adjudicating reachability.
6. **The vendored skills are the weakest link, but STRIDE is not.** STRIDE as a method is well supported (Manifesto, OWASP, Microsoft lineage). The finding is against the packaging: a thin skill adds a vendored dependency without adding knowledge.
7. **Our own supply chain is an attack surface.** Skills are prompt content with tool access. Vendoring with commit pins and per-file SHA-256 (already done) is the mitigation the literature points toward; keep it for whatever remains vendored.
8. **Evidence that spec-time security guidance improves outcomes is thin.** No source found benchmarks "security requirements in a spec" against downstream code security. Any adoption should include a small A/B run on the benchmark harness proposed in [2026-07-12-skills-and-schema-benchmark.md](2026-07-12-skills-and-schema-benchmark.md) (not yet built), or be framed explicitly as untested.

## 7. Staged recommendation

> **Superseded in part by [§10.5](#105-updated-recommendation).** Where this section says "ASVS L1 default" or "mitigation cites ASVS ID or CWE", §10 corrects it: default level is chosen per change because ASVS V16 has no L1 requirements, and mitigations cite OWASP Cheat Sheets or CWE while ASVS IDs go on requirements.

**Stage 1 — highest evidence, lowest risk (apply side):**
- Add a deterministic security gate to `hrt-apply-code-review` step 1: run whichever of SAST, secret scan, and dependency audit the repo already configures; a finding is HIGH, same as a failing test. Skip with a one-line note if none exist.
- Add a security lens to the judgement pass, scoped to the diff, using Top 10:2025 categories as the checklist and an explicit exclusion list modelled on Anthropic's and Cloudflare's (DoS, theoretical risk, unchanged code, defence-in-depth suggestions when primary controls hold).
- Check that each `[security]` task's RED output exercises the threat it traces to.

**Stage 2 — replace the vendored skills:**
- Retire `stride-analysis-patterns`, `threat-mitigation-mapping`, `security-requirement-extraction` (vendor count 8 → 5).
- Add one local skill, `hrt-security-pass`: six-row STRIDE table inline; output `[Threat · STRIDE letter · H/M/L] → Mitigation (ASVS ID or CWE)`; ASVS L1 default and L2 for sensitive data; requirements still written as normal `### Requirement` blocks with the ASVS ID in a source line.
- Widen the gate triggers (secrets, logging of sensitive data, new dependency, upload/deserialisation, LLM or agent tool use) and make the same modal word apply in `specs` and `design`.
- Add `align` checks: ASVS ID present, severity present, and a skip note is consistent with a deterministic keyword scan.
- Conditional pointers: Agentic Top 10 when the change specs an LLM or agent feature; LINDDUN when personal data is in scope.

**Stage 3 — evaluate before committing:**
- Persistent `openspec/threat-model.md` (finding 4).
- A second-stage verification reviewer for security findings (Cloudflare coordinator / Anthropic filter shape), only if Stage 1 shows false-positive noise.

**Not recommended:** autonomous patching, continuous repo scanning, or a full NIST/CISA mapping; all are outside a per-change spec pipeline.

**Open design question for Stage 2:** how to supply ASVS text. Options: (a) vendor the CSV under `skills/vendor/` (largest fidelity, but CC BY-SA 4.0 needs attribution and the share-alike terms need a decision, and `vendor-lock.json` currently assumes MIT-style entries); (b) vendor a chapter index only and have the agent fetch requirement text (fragile offline, fails the hallucination finding); (c) cite chapters only, not individual IDs (cheap, loses most of the testability benefit). Option (a) with a filtered subset per chapter is the best fit for the evidence but needs a legal read.

## 8. Sources

Verification tags: **P** = primary page fetched and read; **S** = search result with snippet only; **2** = secondary coverage (news, vendor-neutral blog); **V** = vendor self-report.

**Standards and frameworks**

- S1 — OWASP ASVS repository (v5.0.0, CSV, ID format, licence). **P**. https://github.com/OWASP/ASVS
- S2 — "What's new in ASVS 5.0", SoftwareMill. **2**. https://softwaremill.com/whats-new-in-asvs-5-0/
- S3 — OWASP Top 10:2025 coverage: Qualys https://blog.qualys.com/qualys-insights/2026/06/15/what-changed-in-owasp-top-10-2025-and-recommendations-for-each-category ; Knowit https://blog.knowit.eu/owasp-top-10-2025-what-is-new-and-what-has-actually-changed ; Eclypsium https://eclypsium.com/blog/owasp-top-10-2025-software-supply-chain-risk/ . **2** (owasp.org not fetched).
- S4 — OWASP Top 10 for Agentic Applications 2026. **S**. https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026
- S5 — Threat Modeling Manifesto https://threatmodelingmanifesto.org/ and OWASP Threat Modeling https://owasp.org/www-community/Threat_Modeling . **S**.
- S6 — NIST SP 800-218A. **S**. https://csrc.nist.gov/pubs/sp/800/218/a/final
- S7 — CISA Secure by Design principles, news coverage (FedScoop). **2**. https://fedscoop.com/cisa-and-partners-issue-secure-by-design-principles-for-software-manufacturers/
- S8 — LINDDUN, KU Leuven. **S**. https://lirias.kuleuven.be/1656390

**Industry**

- S9 — anthropics/claude-code-security-review. **P**. https://github.com/anthropics/claude-code-security-review
- S10 — "Automate security reviews with Claude Code", Anthropic. **P**. https://claude.com/blog/automate-security-reviews-with-claude-code
- S11 — Anthropic support article on automated security reviews. **S**. https://support.claude.com/en/articles/11932705-automated-security-reviews-in-claude-code
- S12 — Claude Code Security launch coverage, The Hacker News. **2**. https://thehackernews.com/2026/02/anthropic-launches-claude-code-security.html
- S13 — "Introducing Aardvark", OpenAI. **S** (403 on fetch). https://openai.com/index/introducing-aardvark
- S14 — "Codex Security now in research preview", OpenAI. **S**, **V** (403 on fetch). https://openai.com/index/codex-security-now-in-research-preview
- S15 — "Orchestrating AI Code Review at scale", Cloudflare. **P**. https://blog.cloudflare.com/ai-code-review
- S16 — "How Cloudflare enforces engineering standards using AI", Cloudflare. **P**. https://blog.cloudflare.com/engineering-standards-enforcement/
- S17 — Cloudflare open-source security audit skill, third-party write-up. **2**, low confidence, not used for any finding. https://www.remio.ai/post/cloudflare-security-audit-skill-turns-ai-code-review-into-an-adversarial-workflo
- S18 — "v0: vibe coding, securely", Vercel. **P**, **V**. https://vercel.com/blog/v0-vibe-coding-securely
- S19 — "Security boundaries in agentic architectures", Vercel. **P**. https://vercel.com/blog/security-boundaries-in-agentic-architectures
- S20 — CodeMender / Big Sleep coverage, The Hacker News. **2**. https://thehackernews.com/2025/10/googles-new-ai-doesnt-just-find.html

**Academic**

- S21 — Vero et al., "BaxBench: Can LLMs Generate Correct and Secure Backends?", ICML 2025. **P** (abstract). https://arxiv.org/abs/2502.11844
- S22 — Fu et al., "Security Weaknesses of Copilot-Generated Code in GitHub Projects", ACM TOSEM. **S**. https://arxiv.org/abs/2310.02059
- S23 — Pearce et al., "Asleep at the Keyboard? Assessing the Security of GitHub Copilot's Code Contributions". **S**. https://arxiv.org/abs/2108.09293
- S24 — Tony et al., "Prompting Techniques for Secure Code Generation: A Systematic Investigation". **S**. https://arxiv.org/abs/2407.07064
- S25 — "LLMs' Suitability for Network Security: A Case Study of STRIDE Threat Modeling". **S**. https://arxiv.org/abs/2505.04101
- S26 — "ASTRIDE: A Security Threat Modeling Platform for Agentic-AI Applications". **S**. https://arxiv.org/abs/2512.04785
- S27 — "Incorporating Verification Standards for Security Requirements Generation from Functional Specifications" (F2SRD), FSE 2025. **P** (abstract). https://arxiv.org/abs/2505.11857
- S28 — "Implicit security requirements classification with LLMs using the OWASP ASVS", METU. **S**. https://avesis.metu.edu.tr/yayin/8428bb1b-ae5b-4a30-bc66-3eb53036757a/implicit-security-requirements-classification-with-large-language-models-using-the-owasp-application-security-verification-standard-a-shift-left-approach
- S28b — "Rags to reqs: Making ASVS accessible through the power of graphs and chatbots", Neo4j developer blog (practitioner, reports ungrounded hallucination). **2**. https://neo4j.com/developer-blog/asvs-security-graph-chatbot/
- S29 — IRIS, "LLM-Assisted Static Analysis for Detecting Security Vulnerabilities". **S**. https://arxiv.org/abs/2405.17238
- S30 — ZeroFalse. **S**. https://arxiv.org/abs/2510.02534
- S31 — Firouzi and Ghafari, "Persistent Human Feedback, LLMs, and Static Analyzers for Secure Code Generation and Vulnerability Detection". **S**. https://arxiv.org/abs/2602.05868
- S32 — SAST-Genius. **S**, **V** (single-team figures). https://arxiv.org/abs/2509.15433
- S33 — Maloyan and Namiot, "Prompt Injection Attacks on Agentic Coding Assistants". **S**. https://arxiv.org/abs/2601.17548

**Added in the follow-up pass (§10)**

- S34 — OWASP Top 10:2025 official site (names A01–A10, licence). **P**. https://top10.owasp.org/2025
- S35 — OWASP/ASVS repository at tag `v5.0.0`: `5.0/en/` chapter files, `0x03-What-is-the-ASVS.md`, `5.0/mappings/`, CSV. **P**. https://github.com/OWASP/ASVS/tree/v5.0.0
- S36 — OWASP GenAI Security Project, Top 10 for Agentic Applications 2026 page (date, site licence). **P** (category names not on the page). https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- S37 — OWASP Cheat Sheet Series (licence, sheet list, ASVS and Top 10 indexes). **P**. https://cheatsheetseries.owasp.org/
- S38 — Creative Commons FAQ (adaptation, ShareAlike with collections, software). **P**. https://creativecommons.org/faq/
- S39 — Semgrep vs Opengrep licensing (engine LGPL 2.1, Semgrep Rules License v1.0). **2**. https://semgrep.dev/docs/faq/comparisons/opengrep
- S40 — CodeQL licence terms. **S** (older GHES docs; current terms page not read). https://securitylab.github.com/tools/codeql/license
- S41 — "Trivy Compromised: Everything You Need to Know about the Latest Supply Chain Attack", Wiz. **2**. https://www.wiz.io/blog/trivy-compromised-teampcp-supply-chain-attack
- S42 — Repository licence metadata for gitleaks, osv-scanner, trivy, opengrep, semgrep, bandit, gosec, trufflehog, read from the GitHub API on 2026-10-15. **P**.

## 9. Verification debt

- **OpenAI pages (S13, S14)** returned 403; the threat-model and sandbox-reproduction claims, and all noise-reduction numbers, come from search snippets and third-party coverage. Re-check against the primary pages before quoting any figure in a schema instruction.
- ~~OWASP Top 10:2025 ordering and A10 name (S3)~~ — **resolved in §10**: names and order confirmed on the official site (S34). The official page does not state final vs release candidate or a release date.
- ~~ASVS 5.0 chapter list~~ — **resolved in §10**: taken from the v5.0.0 CSV and repository (S35). The Security Compass list quoted in the first pass is wrong for 5.0.
- **ASVS licence.** CC BY-SA 4.0 confirmed (S1, S35). §10 analyses what it requires; that analysis is not legal advice and the CC FAQ answer on "adaptation" depends on applicable copyright law, so have the maintainers' counsel confirm before releasing a bundle.
- **NIST SSDF practice IDs** (for example PW.1 design, PW.7 code review, PW.8 testing) were not checked against the PDF; the SP 800-218A page was read only through search results. Still open.
- **Agentic Top 10 category names (ASI01–ASI10).** The official page does not list them; the names in §3 come from a secondary summary. Still open; read the downloadable PDF.
- **CodeQL terms (S40)** come from older GHES documentation; confirm against the current terms before relying on the restriction as stated.
- **Opengrep rules licence.** `opengrep/opengrep-rules` is archived (last push 2025-11-28) and reports no SPDX licence; not investigated further.
- **CISA (S7)** is news coverage; the primary document was not opened.
- **Cloudflare (S15)** per-reviewer percentages are inconsistent with its own totals; only run counts, tier definitions, and the flag/don't-flag lists are used here.
- **Vendor-reported figures** (S14, S18, S32, S12) are directional only.
- **No benchmark found** that measures whether spec-time security requirements or design-time threat lists improve downstream code security. Finding 8 and Stage 3 stand on that gap.
- **Pearce (S23) and Fu (S22)** used older models; magnitudes may not hold for current ones, so use them for direction only.

## 10. Follow-up: official OWASP sources, ASVS licence, size, and SAST tooling

Prompted by three questions: does CC BY-SA actually block adopting ASVS, is ASVS too bloated for this pipeline, and could a SAST script run by the agent do part of the job (in `apply`, not in artifact creation). Numbers below are measured from the v5.0.0 CSV (S35) in a scratch directory; nothing was added to the repo.

### 10.1 Official OWASP facts (replacing the secondary-source versions in §3)

| Item | Verified fact | Source |
|---|---|---|
| ASVS version | 5.0.0, May 2025; next planned 5.0.1; master is unreleased | S35 |
| ASVS size | 345 requirements. Minimum level per requirement: L1 = 70, L2 = 183, L3 = 92 (a requirement's `L` is the lowest level at which it applies) | S35, measured |
| ASVS chapters | V1 Encoding and Sanitization (30) · V2 Validation and Business Logic (13) · V3 Web Frontend Security (31) · V4 API and Web Service (16) · V5 File Handling (13) · V6 Authentication (47) · V7 Session Management (19) · V8 Authorization (13) · V9 Self-contained Tokens (7) · V10 OAuth and OIDC (36) · V11 Cryptography (24) · V12 Secure Communication (12) · V13 Configuration (21) · V14 Data Protection (13) · V15 Secure Coding and Architecture (21) · V16 Security Logging and Error Handling (17) · V17 WebRTC (12) | S35, measured |
| ASVS CSV columns | `chapter_id, chapter_name, section_id, section_name, req_id, req_description, L` | S35 |
| ASVS ID format | `v5.0.0-<chapter>.<section>.<requirement>`, lowercase `v`; without a version prefix an ID means "latest" and may change | S35 |
| ASVS extras | `5.0/mappings/` has a CWE mapping JSON, a NIST note, and v4.0.3↔v5.0.0 mappings | S35 |
| Top 10:2025 | A01 Broken Access Control · A02 Security Misconfiguration · A03 Software Supply Chain Failures · A04 Cryptographic Failures · A05 Injection · A06 Insecure Design · A07 Authentication Failures · A08 Software or Data Integrity Failures · A09 Security Logging and Alerting Failures · A10 Mishandling of Exceptional Conditions. Page states no release date or final/RC status. Licence **CC BY 3.0** (attribution only, no share-alike). | S34 |
| Agentic Top 10 | Published 9 Dec 2025; site content CC BY-SA 4.0; names not on the page | S36 |
| Cheat Sheet Series | CC BY-SA 4.0; has Threat Modeling, Secure Product Design, Input Validation, Authorization, Logging, Vulnerable Dependency Management, Software Supply Chain Security, and LLM Prompt Injection Prevention sheets; has "Index ASVS" and "Index Top 10" | S37 |

Two facts in ASVS's own text change the earlier recommendation:

1. **ASVS defines a division of labour.** Requirements say *what* must hold and must be pass/fail verifiable; *how to implement* is deliberately left to the Cheat Sheet Series, and *how to test* to the Web Security Testing Guide (S35, `0x03`). So the right mapping for this pipeline is ASVS → `specs` requirement (what), Cheat Sheet → `design` mitigation (how), and the negative test → `tasks`/`apply` (verify). The first pass proposed ASVS IDs for both; mitigations should cite a Cheat Sheet or CWE instead.
2. **ASVS has "documented security decisions" requirements.** The standard says that for controls such as permissions, input validation and data sensitivity, the application must *document* its decisions, that these requirements sit in the first section of a chapter, and that each has a matching implementation requirement. That is exactly what `design.md` Decisions is for. A security-relevant design decision can cite the documentation requirement it satisfies, and the matching `specs` requirement cites the implementation one. This strengthens the case for ASVS over free-form STRIDE-only output.

### 10.2 Is CC BY-SA 4.0 a problem?

Not for the use this pipeline needs, but two cases need care. This is a reading of the Creative Commons FAQ (S38), not legal advice.

- **ShareAlike attaches to adaptations that are publicly shared.** The FAQ says SA "requires adaptations of the material be released under the same license", that an adaptation generally needs "sufficient new creativity to be copyrightable", and that format changes are not adaptations. It also says SA does not make a *collection* SA-licensed and that unmodified licensed material sitting alongside other material does not pull that other material into SA, provided no adaptation is created.
- **Case 1 — bundling the CSV verbatim** (as a separate file inside a skill folder, with attribution, licence text, and a link, the same way `skills/vendor/*/LICENSE` and `VENDOR.md` already work for MIT sources). That is redistribution of unmodified material, not an adaptation. Obligations: attribution, licence notice, indication of any changes. This repo's own code and prose stay MIT (repo `LICENSE`: MIT, PT Hash Rekayasa Teknologi). Slicing by chapter at read time, without writing a modified copy to disk, is a format/selection step, not new creativity.
- **Case 2 — agent text that paraphrases ASVS** into a downstream `spec.md`. A requirement sentence rewritten to fit a feature may be an adaptation. SA then matters only if that spec is shared publicly; specs in a private repo are not "shared". Cheap mitigation that also helps traceability: the spec requirement is written in the project's own words and carries the ID (`v5.0.0-6.2.1`) as a reference, not a copy of the sentence. An ID is a citation.
- **Where it does bite:** do not edit the bundled CSV in place (that creates an adaptation we would have to share alike), do not relicense it, and keep the attribution file intact. `scripts/vendor-skills.cjs` already treats `LICENSE` and `VENDOR.md` as local-only files and stores a free-form `license` string per entry, so a non-MIT licence is representable; but its source model is "skill folder in a GitHub repo", and ASVS is not a skill. Either the tool needs a "single file" source type, or the CSV is fetched once into the skill by a small dedicated step with a pinned tag and SHA-256.
- **CC's own recommendation against CC for software** applies to licensing *code*; we are redistributing a text/data standard, which CC licences are designed for. Keeping the CSV out of the code files is what keeps the two licences from mixing.

Conclusion: licence is a hygiene task (attribution file, no in-place edits, cite IDs rather than copy sentences), not a blocker. A counsel read is still advisable before publishing a release that contains the bundle.

### 10.3 Is ASVS too bloated?

Whole-standard loading would be; slice loading is not. Measured with a 4-characters-per-token estimate:

| Load | Requirements | Approx. tokens |
|---|---|---|
| Entire ASVS 5.0.0 | 345 | about 21,200 |
| L1 + L2 | 253 | about 15,500 |
| L1 only | 70 | about 4,200 |
| One chapter at L1 (range across chapters) | 0–13 | about 0–760 |
| For reference: the three current vendored skills | n/a | `SKILL.md` about 2,100 + `references/details.md` about 16,000 (64 KB) |

The CSV file is 105 KB. Observations:

- **A triggered capability costs about 0.5–3K tokens** if the agent receives only the chapters its trust-boundary hit maps to (auth → V6/V7/V9/V10, authorization → V8, input/injection → V1/V2, files → V5, API → V4, frontend → V3, crypto/transport → V11/V12, config and dependencies → V13/V15, data → V14, logging/errors → V16). That is less than the current skills' reference material and is real requirement text instead of generic advice. Capabilities that hit no boundary pay nothing, as today.
- **Level choice has a trap.** Chapters V16 (logging and error handling) and V17 contain **zero** L1 requirements; every V16 item is L2 or L3. An "L1 by default" rule would silently drop all logging and error-handling requirements, which map to Top 10 A09 and A10. The default should be L2 for anything touching sensitive data and stated per change, not hard-coded to L1.
- **Delivery as a script, not a prompt dump.** A zero-dependency Node helper in the skill folder (same pattern as `hrt-artifact-lint/lint.cjs`), for example `asvs.cjs --chapters V6,V8 --level 2`, prints only the matching rows. This also fixes the hallucination risk (S27, S28b) because the agent quotes IDs from the file, and lets `lint.cjs` check that a cited ID exists in the pinned CSV, deterministically.
- **ASVS is web-application-centred.** Chapters V3, V7, V10 and V17 assume browsers, sessions, OAuth, or WebRTC. For non-web work (CLI, batch, data pipeline), few chapters apply; the gate must allow "no applicable ASVS chapter" and fall back to Top 10 plus CWE. This is a real limit of ASVS as the sole anchor.
- **Bloat risk in the artifacts, not the prompt.** Requiring an ASVS ID on every requirement would clutter specs. Keep it optional on `### Requirement` for trust-boundary capabilities only, and required on `[Threat]` lines in design only when an applicable chapter exists.

### 10.4 SAST and other scanners as scripts in `apply`

Agreed that this belongs to `apply` (Phase 2, deterministic gate), not artifact creation. Artifact phases stay prompt-based; the scanner runs against code.

Licences read from the GitHub API on 2026-10-15 (S42) unless noted:

| Tool | Does | Licence | Notes |
|---|---|---|---|
| gitleaks | secret detection | MIT | language-agnostic |
| osv-scanner | known-vulnerable dependencies from lockfiles | Apache-2.0 | language-agnostic, maintained by Google |
| Trivy | dependencies, secrets, misconfiguration, filesystem | Apache-2.0 | its GitHub Action and binaries were compromised in March 2026 (S41); if used, run a pinned, verified binary, never `@latest` or a mutable action tag |
| Opengrep (engine) | multi-language pattern/taint SAST | LGPL-2.1 | rules repo `opengrep-rules` is archived and has no SPDX licence |
| Semgrep CE (engine) | same | LGPL-2.1 | **Semgrep-authored rules are under the Semgrep Rules License v1.0**, limited to internal, non-competing, non-SaaS use (S39); fine to run in a team's own repo, not fine to bundle into our distributed package |
| Bandit / gosec | Python / Go SAST | Apache-2.0 | single-language |
| TruffleHog | secret detection | AGPL-3.0 | avoid bundling; running it is a separate matter |
| CodeQL | deep SAST | free only for open-source codebases (and then only in a restricted way); paid GitHub Advanced Security otherwise (S40, older docs) | not a safe default |

Design implications:

1. **Do not bundle or mandate a scanner in `tempa-spec`.** The schema is language-agnostic, the installer copies only `schema.yaml` and `templates/*` by design, rules licences differ, and tool supply chains have been attacked (S41). Instead the `apply` instruction says: run the repo's already-configured security commands (discover them from `package.json` scripts, `Makefile`, pre-commit config, CI workflow, `semgrep.yml`/`.gitleaks.toml`/`osv-scanner.toml`); if none exist, record "no scanner configured" in `mr-brief.md` Evidence and Merge Danger, and recommend a baseline.
2. **Documented baseline, not a requirement:** gitleaks plus osv-scanner cover secrets and dependency CVEs in any language under permissive licences. A language-appropriate SAST (Opengrep/Semgrep with the team's own rules, Bandit, gosec) is the next layer. Mention in README, do not install.
3. **Scope findings to what the change introduced.** A scanner on a legacy repo returns noise. Compare against the base branch or use the tool's baseline feature; "new finding in changed lines is HIGH, pre-existing finding is reported once, not blocking". Cloudflare's "issues in unchanged code" exclusion (S15) and Anthropic's diff-awareness (S9) are the same rule.
4. **Treat tool output as untrusted data.** Agents must not execute fix commands that tool output suggests, and a scanner must not be fetched from the network without user approval. Anthropic's own security-review action documents that it is not hardened against prompt injection (S9); the same caution applies to anything we feed model-readable scanner text.
5. **Pair with the LLM as adjudicator**, per the hybrid results (S29–S31): scanner finds candidates, the review pass judges reachability and exploitability and drops findings that fail the consequence gate.
6. **Keep the existing RED test as the reproduction** for `[security]` tasks (finding 1 in §6). A scanner finding that the agent fixes should also get a regression test, otherwise the fix has no durable evidence.

### 10.5 Updated recommendation

Changes relative to §7:

- **Stage 1 stays first and gets simpler:** the scanner step is "run what the repo already has, scoped to the diff", with the baseline noted in README. No tool is bundled.
- **Stage 2 ASVS delivery:** verbatim CSV pinned to tag `v5.0.0`, a small `asvs.cjs` slice/lookup script, attribution file, and a `lint.cjs` check that cited IDs exist. Default level is per-change (L2 for sensitive data), not L1. Mitigations cite Cheat Sheets or CWE; requirements cite ASVS IDs; design Decisions can cite ASVS documentation requirements.
- **Add a fallback path** for non-web work (Top 10:2025 categories and CWE instead of ASVS chapters) so the gate does not force irrelevant chapters.
- **Open decision for the maintainers:** whether to extend `vendor-skills.cjs` with a single-file source type or keep ASVS as a one-time pinned fetch with its own SHA-256 in `vendor-lock.json`.

