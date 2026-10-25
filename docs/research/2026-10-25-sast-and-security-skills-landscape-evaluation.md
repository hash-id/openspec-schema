# Research: eleven SAST and security-review repositories, and what they offer tempa-spec

**Date:** 2026-10-25
**Scope:** Read the source of eleven public repositories (tools and skills) that scan or review code for security, and decide which parts would raise software quality or security in `tempa-spec` without making the process heavier. Bar: the repo's Lean principle (no new phase, artifact or model-review loop unless it is a deterministic check), and the earlier decisions in `2026-10-15-security-approach-vendored-skills-vs-standards.md` (§10.4: bundle no scanner) and `2026-10-25-addyosmani-agent-skills-evaluation.md`.
**Status:** Recommendations R1 to R4 are not applied yet; they are small enough to adopt together. R5 needs a measurement first (§5). The R6 variant (optional opengrep rules for Odoo, §4.2) was applied on the maintainer's decision: results are candidates only, but running the scan is required when the diff touches Python, JavaScript/TypeScript or Odoo XML, with no skip (see §4.2 for the measurement and CHANGELOG, Unreleased).
**Method:** Shallow clone of each repository at the commit below, read from disk. No code from any of them was run. Where a number is quoted it is the repository's own claim unless the text says it was reproduced (none were).

| Repository | Commit (date) | Licence | Size on disk |
|---|---|---|---|
| utkusen/sast-skills | `3a5bf8f` (2026-10-23) | MIT | 16 skills, 374,821 B of `SKILL.md` |
| weareaisle/nano-analyzer | `5d05d0a` (2026-04-14) | Apache-2.0 | one file, `scan.py`, 1,776 lines |
| openhackai/OpenHack | `6a0675e` (2026-10-16) | MIT | 638 files |
| anthropics/claude-code-security-review | `0c6a49f` (2026-02-11) | MIT | 251 files |
| alibaba/open-code-review | `375f64c` (2026-10-20) | Apache-2.0 | Go CLI, 3,955 files |
| vercel-labs/deepsec | `4fa6722` (2026-09-29) | Apache-2.0 | TypeScript, 200 matchers |
| lambdasec/frame | `2499efe` (2026-10-10) | Apache-2.0 | Python, Z3-based core |
| visa/visa-vulnerability-agentic-harness | `0e6f00d` (2026-10-22) | Apache-2.0 | Python, 17 playbooks, 91,766 B |
| semgrep/skills | `68177b8` (2026-07-27) | Semgrep Rules License v1.0 | 3 skills |
| mukul975/Anthropic-Cybersecurity-Skills | `54a7988` (2026-08-31) | Apache-2.0 | 818 skills, 8.0 MB of `SKILL.md` |
| SunWeb3Sec/llm-sast-scanner | `fedaf6a` (2026-08-22) | README says MIT; no LICENSE file | 1 skill, 25,050 B, plus 34 references (356,940 B) |

**What was and was not read.** Read in full or nearly: `claudecode/prompts.py`, `findings_filter.py`, `claude_api_client.py`, `action.yml`, and the slash command (claude-code-security-review); all prompts and the triage and arbiter logic in `scan.py` (nano-analyzer); the validator prompt, `static_validator.py` and `quality.py` heads and `SCANNER_AUGMENTATION_PLAN.md` (OpenHack); the review, filter and re-location prompts, the Python rule doc, rule map, benchmark image and assurance case (open-code-review); the core and revalidate prompts and FAQ (deepsec); the benchmark READMEs for Endor and SusVibes, and `CLAUDE.md` (frame); `limitations.md`, the S6 prompt, the S5 gates, 6 of 17 playbooks (injection only in part) and one `probe.sh` (VVAH); `SKILL.md` and two rule files in each skill repo; all of llm-sast-scanner's `SKILL.md` and two of its 34 references; 4 of the 818 skills in mukul975. **Not read:** the Z3 and separation-logic engine (frame), the individual deepsec matchers (only their names), 11 of 17 VVAH playbooks, most sast-skills class skills beyond the shared structure, the Go code of open-code-review, the TUI and sandbox code of OpenHack. Conclusions about those parts rest on the READMEs and documentation, and are marked as such.

## Contents

1. [What the evidence says, across all eleven](#1-what-the-evidence-says-across-all-eleven)
2. [Repository by repository](#2-repository-by-repository)
3. [Gaps in tempa-spec the sources fill](#3-gaps-in-tempa-spec-the-sources-fill)
4. [Cost-benefit](#4-cost-benefit)
5. [Recommendations](#5-recommendations)
6. [Things the sources got wrong, for the record](#6-things-the-sources-got-wrong-for-the-record)

---

## 1. What the evidence says, across all eleven

**E1. Automated detection after the fact misses most real, semantic vulnerabilities.** Frame's own SusVibes run uses real CVE fix pairs in Python (`benchmarks/susvibes/README.md`): recall is 0.011 for its symbolic core, 0.061 for Semgrep `p/security-audit`, and 0.138 for the best LLM configuration, on a local 35B model. The authors' reading: those CVEs "are mostly authorization gaps, information exposure, resource exhaustion, and sanitizer bypasses. Those are semantic flaws, not source-to-sink patterns." deepsec's FAQ gives a false-positive rate of 10 to 29% on HIGH+ findings *after* a paid revalidation pass. open-code-review's best configuration in its own benchmark reaches F1 25.1% (precision 33.9%, recall 20.0%); the same model through Claude Code scores F1 11.57% (precision 7.23%, recall 28.9%). Consequence for us: the primary quality lever stays plan-time threat modelling, negative scenarios and RED tests. Detection tools are a supplement.

**E2. The headline benchmarks are weak evidence.** llm-sast-scanner reports recall 1.000 on four *intentionally vulnerable* public Java apps (JavaSecLab, SecExample, VulnerableApp, verademo; 56 vulnerabilities in all). OpenHack's own plan says "Every number we have is from vuln-DENSE seeded apps. We have ZERO data on real, mostly-CLEAN production code, where the false-positive rate ... actually gets decided." Frame discloses that its pooled ground truth is "enriched by Frame's own LLM detection" and labelled by an LLM judge. open-code-review's benchmark is its own dataset (AACR-Bench, on the Alibaba-Aone Hugging Face account). sast-skills and nano-analyzer publish no accuracy numbers at all. VVAH states that its "Verifier confirmation rate ... is not a precision figure". Only VVAH and Frame state their limits plainly.

**E3. The sources split on false positives, and the better-evidenced side is "drop only with positive evidence".**

| Drop when unsure | Drop only with positive evidence |
|---|---|
| claude-code-security-review: drop findings scored below 8 of 10 | open-code-review `review_filter_task_system.md`: remove a comment only if the diff *proves* it wrong; "'Suspicious', 'I cannot verify this', 'low value' ... all mean approve" |
| OpenHack validator: "Be RUTHLESS about false positives" | Frame triage: "keeping a finding unless it *finds* the mitigating control" |
| | llm-sast-scanner: "`UNCERTAIN` on any check is NOT sufficient to declare FALSE POSITIVE" |
| | VVAH S6: a false positive "deletes the finding and no later stage looks at that code again ... If you did not establish it, return INCONCLUSIVE" |

The second column comes with its own failure data. Frame's SusVibes note says triage "dropped real true positives (net F1 down)" and that thinking mode made the model talk "itself out of subtle findings". llm-sast-scanner has an "Under-Reporting Guardrails" section whose rules, it says, each exist "because a real vulnerability was previously missed". tempa-spec's consequence gate already demotes rather than drops, which sits in the second column. Keep it that way.

**E4. Exclusion lists are context-bound, and several of the popular entries are wrong for an ERP codebase.** The Anthropic reviewer's lists (`claude_api_client.py` lines 243 to 296, mirrored in the slash command) are tuned for web services and GitHub Actions, and Anthropic's own docs tell each organisation to tune them (`docs/custom-filtering-instructions.md`). Copied unchanged into an Odoo project they would hide real findings:

| Entry (source) | Why it is unsafe for tempa-spec's downstream repos |
|---|---|
| "Lack of audit logs is not a vulnerability" | Audit trail is a compliance requirement for financial and stock records |
| "Only report a race condition if it is extremely problematic" | Check-then-act on stock, balance and sequence numbers is a first-class ERP risk |
| "Vulnerabilities related to outdated third-party libraries ... should not be reported" | Conflicts with `hrt-security-pass`'s supply-chain gate (a package added or upgraded) |
| "Only include MEDIUM findings if they are obvious" | Hides privileged-caller issues that `hrt-apply-code-review` deliberately rates MEDIUM |
| "Environment variables and CLI flags are trusted" | Right for a CLI; Odoo's real configuration inputs are `ir.config_parameter` and server actions, which are data an admin edits |
| OpenHack criterion E: a code comment saying "by design" or "intentionally public" signals intent; a popular project "has been reviewed by thousands of developers" | An implementing agent can write the comment itself, which is the same self-excuse the floor guard exists to catch. Private in-house modules have few reviewers |

VVAH's Rule F states the opposite of OpenHack's E: for an intentionally vulnerable target, intent "does NOT apply ... on the basis of that intent alone".

**E5. Repeat runs on the same code raise false positives.** The Anthropic GitHub Action stores a marker per PR and, unless `run-every-commit` is set, "forc[es] disable to avoid false positives" on later pushes (`action.yml`). `hrt-apply-code-review` runs up to three passes; it already limits passes 2 and 3 to the security lens only when pass 1 raised a security finding, which is consistent with this.

**E6. Three of the sources ground findings deterministically before any model judges them.** OpenHack `static_validator.py` Layer A drops a finding if the file does not exist, the reported line does not contain the claimed pattern, the line is in a comment, or it is in a test path. VVAH S5 `gates.py` rejects a finding whose file is not in the repo inventory or whose line is outside the file. open-code-review names "position drift" (comments citing the wrong line) as the main failure of general agents and adds an external re-location module. This is the same idea as `2026-08-03-deterministic-grounding-align-review.md`, applied to code review output.

---

## 2. Repository by repository

### 2.1 anthropics/claude-code-security-review

**What it is.** A GitHub Action plus the `/security-review` slash command that ships with Claude Code. A diff-aware audit prompt (`prompts.py`), a hard-exclusion regex pass over each finding's text (`findings_filter.py`), then one Claude call per finding with a 16-item exclusion list and 17 precedents, and a 1 to 10 confidence score (`claude_api_client.py`). The slash command does the same with sub-tasks and a cutoff of 8.

**Verified details.**
- The regex pre-filter (`HardExclusionRules`) matches words in the *finding's description*, not code: DoS, rate limiting, resource leaks, open redirect, regex injection, memory safety outside `.c/.cc/.cpp/.h`, SSRF in `.html`, any `.md` file. It is cheap and fully deterministic, and crude.
- On API failure the filter keeps the finding with confidence 10 (fail open). The default model in `constants.py` is `claude-opus-4-1-20250805`, and the last commit is 2026-02-11.
- The README says the action "is not hardened against prompt injection and should only be used to review trusted PRs".
- No accuracy figure is published anywhere in the repository; `claudecode/evals/` is a runner, not a benchmark.
- The Action is GitHub-only. `hrt-mr-brief` and the downstream workflow are merge-request based, so the Action does not fit.

**Pro.** The best public example of an exclusion list plus precedents, with an explicit mechanism to tune them per project. **Con.** The lists are web-service shaped (E4). Using the Action means sending diffs to a second pipeline that duplicates `/security-review`, which the user already has.

**Verdict.** Adopt the *mechanism* (project-tunable precedents, R4), not the lists.

### 2.2 weareaisle/nano-analyzer

**What it is.** One Python file. Stage 1 writes a security briefing for the file, stage 2 scans function by function with one few-shot example, stage 3 triages each medium-or-higher finding in up to five rounds, each round seeing the previous reasoning, then a fresh arbiter. Confidence is "the fraction of rounds that said VALID" (`scan.py` lines 1342 to 1428).

**Verified details.**
- Every prompt is written for C and C++ memory safety (buffer sizes, NULL dereference, tagged unions). The README admits this; the few-shot example is C.
- There is no test, no benchmark, and no zero-day or CVE list in the repository, although the README says it "is able to detect real zero-day vulnerabilities".
- Confidence from five votes of the *same* model is not calibrated; the rounds are correlated.
- The triage prompt has one idea worth keeping: a defence may be cited only if its function and line are named and its actual value is resolved ("There exists a bound is NOT the same as the bound is sufficient"). It also asks for a single `crux`, "the key fact the verdict depends on".

**Pro.** Cheap by design (default model `gpt-5.4-nano`). **Con.** Wrong language bias for us; five rounds multiply token cost for correlated votes.

**Verdict.** Do not adopt. The "name the defence and prove it holds" rule is folded into R2.

### 2.3 openhackai/OpenHack

**What it is.** A TUI scanner: recon, hunter swarm, feature hunters, validator swarm, optional Docker sandbox and headless-browser verification. About 9,700 lines across `agents/` and the validator and recon modules, plus prompts with framework variants for Django, Flask, Express, Next.js and Supabase.

**Verified details.**
- `SCANNER_AUGMENTATION_PLAN.md` records that the validator defaulted to the *same model* as the hunter and that this "inflat[es] precision". That supports the existing design of a fresh-session reviewer, and it is the only first-hand measurement of that effect among the eleven.
- The static validator's five criteria (attacker prerequisites, browser and protocol limits, existing mitigations, damage, design intent) are useful except E (§1, E4). Criterion A's chained-vulnerability rule ("if the PoC requires a separate, pre-existing vulnerability ... downgrade to LOW") matches `hrt-security-pass`'s severity definition already.
- The tool sends source to the chosen model provider; the sandbox verifier attacks a live Docker target. Neither is a fit for a plan-and-apply pipeline.
- The plan also states that chain tracing is n=1 and that a clean-code false-positive measurement is still owed.

**Verdict.** Do not adopt. Two ideas confirmed: cross-model validation matters, and deterministic anchor checks (E6).

### 2.4 alibaba/open-code-review

**What it is.** A Go CLI (`ocr`) for diff review and whole-file scan. Deterministic file selection and bundling, rule resolution by path glob (57 rule docs, `system_rules.json`), a tool-using agent per bundle, then a "reflection" filter and a re-location module. A `delegate` mode produces the file selection and rules with no LLM call so a host agent can do the review. Engineering maturity is high: OpenSSF Gold badge, assurance case, threat model, SPDX headers, large test suite.

**Verified details.**
- Benchmark image (`imgs/benchmark-en.png`), 200 PRs, 1,505 ground-truth issues, own dataset:

| Model / harness | F1 | Precision | Recall | Avg tokens |
|---|---|---|---|---|
| Claude 4.6 Opus via OCR | 25.1% | 33.9% | 20.0% | 385K |
| Claude 4.6 Opus via Claude Code | 11.57% | 7.23% | 28.9% | 5,664K |
| Claude 4.8 Opus via OCR | 17.9% | 37.8% | 11.7% | 352K |
| GPT-5.5 via Codex | 8.36% | 27.82% | 4.92% | 525K |

So the claim "higher precision and F1 with about 1/9 of the tokens" holds on this table (about 1/15 for the 4.6 row), but absolute precision is at most 37.8%, the dataset is general code review (style and correctness, not security), and the vendor ran it.
- The rule docs pair every check with a "do not report when" clause (python.md: "Do not report when the function never mutates the argument", "confirm the data source with `file_read` before flagging"). The Python rules are generic (mutable defaults, bare `except`, `is` with literals, security basics). There is no Odoo or ERP rule.
- The filter prompt is the clearest statement of the asymmetric cost (§1, E3).
- Install is a Go binary delivered through per-platform npm packages; it needs an LLM endpoint or `delegate` mode with a host agent.

**Pro.** Strongest engineering; the deterministic-selection design answers a real failure of agent reviewers (cutting corners on large diffs). **Con.** Duplicates the `apply` review that already runs; adds a binary dependency in every downstream repo; benchmark is general review. tempa-spec's contract map already forces coverage of every scenario and task, which is where agent review cuts corners.

**Verdict.** Do not adopt as a tool. Pattern worth copying later: pair each Odoo hint with a "not a finding when" clause (R4).

### 2.5 vercel-labs/deepsec

**What it is.** Regex matchers produce candidate files (free), then AI agents investigate each candidate and the repository has a `revalidate` step, a cheap `triage` classifier, a PR mode (`process --diff origin/main`) and a sandbox fan-out. 200 matchers; Python coverage is 13 (Django, Flask, FastAPI, Starlette, Celery, Airflow, raw SQL, and so on). No Odoo.

**Verified details.**
- Published cost (FAQ, Claude Opus, `--concurrency 5 --batch-size 5`): 100 files about $25 to $60; 500 files $130 to $300; 2,000 files $500 to $1,200. `revalidate` costs about the same as `process`. `triage` about one cent a finding.
- The core prompt's rule on auth is the sharpest in this set: "only middleware that *wraps the handler directly* counts ... Edge/proxy/CDN/WAF rules ... are NOT sufficient on their own".
- Runs the agent with "full shell access" by its own security note; recommends sandboxing.
- The README says it is for "legacy code ... never reviewed", not per-change work.

**Pro.** The right tool for a one-off audit of an existing module. **Con.** Different job from a per-change pipeline; real money per run; Node and an AI gateway or API key.

**Verdict.** Not for the schema. Reasonable as a separate, periodic audit by the team, outside tempa-spec.

### 2.6 lambdasec/frame

**What it is.** A neuro-symbolic scanner: tree-sitter frontends lower Python, Java, JS/TS, C/C++ and C# to an intermediate language, taint and heap analysis with Z3 path feasibility, and an optional LLM layer for detection and triage; plus `exploit` and `fix` commands.

**Verified details.**
- The benchmark READMEs are candid (E2). On the Endor-style corpus: Frame with LLM detection and triage has recall 0.67, precision 0.51; Semgrep `p/default` 0.52 and 0.40; five seeded or demo apps (juice-shop, webgoat, and so on), labels by an LLM judge. On SusVibes (real Python CVEs) see E1.
- The authors tested "thinking mode" and found no recall gain; "reason step by step, then emit JSON" nearly doubled recall (0.077 to 0.138). This is the only controlled prompt comparison in the eleven.
- No Odoo support; Python frameworks are Flask, Django, FastAPI.
- Heavy dependency footprint (Z3, five grammars), and suppression comments (`# frame: ignore[...]`) of its own.

**Verdict.** Do not adopt. Useful as evidence (E1, E3).

### 2.7 visa/visa-vulnerability-agentic-harness (VVAH)

**What it is.** An eleven-stage pipeline: deterministic pattern seed, a context graph (tree-sitter plus community detection, embedded graph database), threat modelling, deep dive with 17 playbooks, deterministic gates, adversarial verification with CVSS, dedup, attack chains, SARIF, then optional fix and a three-reviewer fix validation panel. Python 3.11 or newer; model roles configurable.

**Verified details.**
- The most mature design of the set. `limitations.md` is unusually honest: findings are "LLM-generated triage candidates"; "No stage votes across runs"; "An empty report does not prove the code is safe"; the S11 staged copy leaves out `CLAUDE.md`, `AGENTS.md`, `.cursorrules` and `.mcp.json` "because they can give the panel instructions".
- The S6 prompt (`pipeline/stages/s6/prompts.py`) has six exclusion groups (no real attacker, no security impact, wrong layer, handled elsewhere, noise floor, intentionally vulnerable target), three verdicts where a refutation not established must be INCONCLUSIVE, and a rule that "a wrong label is not a wrong finding" (`corrected_cwe`).
- Playbooks use a hard gate. Injection: a sink that interprets input, a source an external actor can reach, and no effective defence. Access control: show the entry point, the identity, and *where ownership is verified for this object*; "'Endpoint requires login' is NOT authorization". Absent-control: enumerate every site of the kind the control protects and judge each; "storage without enforcement is a decoy" (a `LoginAttempt` model is not rate limiting unless code reads it and refuses). Sensitive-data: three sections count as findings when *empty* (no key-derivation function, no `Cache-Control`, no HSTS).
- `sibling-instances` (5,049 B): after one confirmed weakness, grep the whole repository for the same pattern in two or three phrasings and report one finding per site; "do not sweep speculatively for classes you have no evidence of".
- `skills/*/probe.sh` are POSIX `grep` lists of candidate sites per class, capped at 20 lines, plus a "defence census" counting files that contain each defence marker. Candidates are inputs to the hard gate, not findings.
- No accuracy or cost figures are published. Docs say to run `vvaharness estimate` first and to validate on labelled apps of your own.

**Pro.** Source of the three best small ideas in this study (hard gate, sibling sweep, asymmetric verdict). **Con.** Far too large to adopt (92 KB of playbooks alone, plus a pipeline); most patterns name Python APIs but nothing Odoo-specific.

**Verdict.** Adopt three ideas (R2, R3, R6), not the tool.

### 2.8 utkusen/sast-skills

**What it is.** Fourteen vulnerability-class skills plus `sast-analysis` and `sast-report`, orchestrated by a `CLAUDE.md` or `AGENTS.md` that you must place in the project's root after copying the project into `sast-files/`. Each class skill runs recon, batched verify (three candidates per subagent) and merge, all written to files under `sast/`.

**Verified details.**
- The class skills are 18 KB to 34 KB each, with the same structure and the same multi-language vulnerable/secure examples (Django, Flask, Express, Rails, Spring, Go, Laravel, ASP.NET). No Odoo.
- The README says the goal is "as many vulnerabilities as possible at the lowest possible cost" but no cost or accuracy figure is published. By the structure it is one recon subagent, one verify subagent per three candidates, and a merge, for each of 14 classes; that is a lot of subagents on a real repository (our estimate, not measured).
- The `sast-businesslogic` skill is the exception worth reading: it derives attack scenarios from the *application's domain* (price and payment, quantity limits, workflow bypass, coupons, race conditions, refunds, entitlement, inventory, transfers, time and date) and then verifies each. See §3.

**Verdict.** Do not adopt. One checklist is worth rewriting in our own words (R1).

### 2.9 semgrep/skills

**What it is.** Three skills: `code-security` (28 rule files, 144 KB of vulnerable and secure examples in 15+ languages), `llm-security` (OWASP LLM Top 10 2025), and `semgrep` (CLI usage and test-first custom rules with `ruleid:` and `ok:` annotations).

**Verified details.**
- Licence: `LICENSE` is one line, "Semgrep Rules License v1.0". The licence page says "You may use the rules only for your own internal business purposes" and "This license does not allow you to distribute the rules, or to make them available to others as a service." The installer distributes skills, so vendoring into `skills/vendor/` is not allowed. This matches S39 in the 2026-10-15 study.
- The `semgrep` skill's quick scan is `semgrep --config auto .`. Semgrep's metrics page says metrics are sent "whenever rules are pulled from the Semgrep Registry" (a hash of the project URL, a rules hash, an anonymous ID, the client IP; no source). It also pulls rules from the network at scan time. `hrt-apply-code-review` step 1 says to run only scanners the repository already configures, and not to install or download one; installing this skill would nudge an agent the other way.
- The `code-security` examples cover knowledge a model already has; the 2026-10-15 study reached the same conclusion about the `wshobson/agents` skills.
- The test-first custom-rule workflow is sound and parallels our RED-before-fix rule for `[security]` tasks. It matters only to a team that runs Semgrep.

**Verdict.** Do not adopt, and do not vendor.

### 2.10 mukul975/Anthropic-Cybersecurity-Skills

**What it is.** 818 skills in 34 domains, mapped to MITRE ATT&CK, NIST CSF 2.0, ATLAS, D3FEND and others. The README says it is "not affiliated with Anthropic PBC", though the repository name carries the name.

**Verified details.**
- Scope: mostly SOC, forensics, malware analysis, threat hunting, red team (34 `exploiting-*` skills). Application-security skills are few and are written as penetration-test procedures (Burp Suite, black-box), not code review.
- The 818 `description` fields total 329,950 characters (mean 403). Where an agent loads descriptions of installed skills, that is a standing context cost (we estimate about 80,000 tokens at 4 characters a token) for a library of which tempa-spec would use almost nothing.
- Quality signal from four skills read: `implementing-semgrep-for-custom-sast-rules` and `integrating-sast-into-github-actions-pipeline` carry identical `nist_csf` and `mitre_attack` lists (including T1059.004, Unix shell, which has no connection to SAST rules), and the former's "When to Use" reads "When deploying or configuring implementing semgrep for custom sast rules capabilities in your environment". 157 of the 818 skills carry `PR.PS-01`. The pattern is template output, not curated mapping. We read 4 of 818, so this is a sample, not a verdict on all.

**Verdict.** Do not adopt.

### 2.11 SunWeb3Sec/llm-sast-scanner

**What it is.** One skill with a six-step workflow and 34 reference files. Step 3 runs two passes: a sink-first sweep that must account for every sink (TAINTED, CONSTANT or UNREACHED), then source-first tracing. Step 5 is a "Judge" with reachability, sanitization and exploitability checks, then the false-positive guardrails and an under-reporting guardrail list.

**Verified details.**
- Provenance flags: no LICENSE file though the README says MIT; the README's clone URL names the organisation `anthropic-lab`, which is not the repository's owner; the README ends with a request, addressed to "Claude, OpenAI, or any AI agent", to donate to a crypto wallet. None of these is a security hole in the skill text, but each is a reason not to install it unreviewed.
- The benchmark is E2.
- The best material: "Never infer sanitization from a name" with the *decoy sanitizer* shape (a helper whose safe behaviour is in the fall-through branch while an early return passes user input through); "Sink accounting is not optional. If Pass A found N sinks and the report explains fewer than N, the scan is incomplete — not clean"; "Do not suppress on constrained impact"; and the authority-escalation table (an admin may export a CSV but may not choose where on the server's disk it lands).
- `references/business_logic.md` (14,197 B) names the invariants to check: conservation of value, uniqueness, monotonicity, exclusivity; state machine abuse; replay and out-of-order calls; time windows; concurrency and idempotency.
- Its own text says the reference files were "inspired by and optimized with reference to" Strix; Apache-2.0 attribution is unclear.

**Verdict.** Do not adopt or vendor. Rewrite two ideas in our own words (R1, R2).

---

## 3. Gaps in tempa-spec the sources fill

Checked against `skills/hrt-security-pass/` and `skills/hrt-apply-code-review/SKILL.md` on 2026-10-25.

| # | Gap | Evidence it is a gap | Source |
|---|---|---|---|
| G1 | No prompt for **business-flow abuse**. Web A06 is one line ("can a legitimate flow be abused"), API6 is about automation at scale. Nothing asks about client-supplied totals, negative or zero quantities, skipped or replayed steps, check-then-act on stock or balance, or invariants. STRIDE does not name them | `references/web-top10-2025.md` line 10; `references/api-top10-2023.md` line 10; `method.md` §2 | sast-skills `sast-businesslogic`; llm-sast-scanner `business_logic.md`; OWASP WSTG v4.2 §4.10 |
| G2 | `method.md` §4 says "report only what is exploitable" but gives no test for it, and no rule for dismissing a finding because "a defence exists" | `method.md` §4, `hrt-apply-code-review` step 2 | VVAH hard gates; nano-analyzer triage; llm-sast-scanner Judge |
| G3 | After a confirmed security finding, nothing looks for the same defect elsewhere. The agent fixes the cited site and the next review sees only changed code | `hrt-apply-code-review` step 8 | VVAH `sibling-instances` |
| G4 | Project-specific security facts have no named home. The exclusion list in `method.md` §2 is four items and is global; `context:` is read for a named standard only | `method.md` §3 (last bullet on `context:`) | claude-code-security-review `docs/custom-filtering-instructions.md` |
| G5 | The review's findings have no deterministic anchor check. A finding that cites a line that does not contain the claimed code reaches the orchestrator and possibly the user | `hrt-apply-code-review` step 7 | OpenHack Layer A; VVAH S5 gates; open-code-review re-location |
| G6 | The reviewer reads hints (`odoo.md`) but nothing lists the candidate sites in the diff for it | `odoo.md`, `method.md` §4 | VVAH `probe.sh` and absent-control lens |

Checked and **not** a gap:

- A missing access rule on a new Odoo model: Odoo's own tutorial says that a model with no access rights is treated as inaccessible to all users, with a warning in the log. The dangerous direction, a row with empty `group_id`, is already in `odoo.md`. The earlier idea of flagging "model without access rule" is dropped for that reason.
- `t-raw`, `safe_eval`, `sudo()`, raw SQL and domain injection: already in `odoo.md`.
- Exploit verification by running attacks: out of scope; `apply` never touches a live target.
- Scanner as gate: already step 1 of `hrt-apply-code-review`.

---

## 4. Cost-benefit

Byte counts are from the files on disk; token figures use 4 bytes a token and are estimates.

### 4.1 Adopt now

| Id | Change | Cost | Benefit | Risk |
|---|---|---|---|---|
| R1 | New `skills/hrt-security-pass/references/business-flow.md` plus one row in the `method.md` §1 table. Questions written for this skill from WSTG v4.2 §4.10 titles (4.10.1 Data Validation, 4.10.2 Forge Requests, 4.10.3 Integrity Checks, 4.10.4 Process Timing, 4.10.5 Number of Times a Function Can Be Used, 4.10.6 Circumvention of Work Flows, 4.10.7 Application Misuse) and the invariants list | About 1.2 KB, read only when a change touches money, stock, quantity or state flows (the gate already fires on those) | Closes G1 for the domain where this schema is used most. Feeds `specs` negative scenarios, which are already linted and covered by tests | The WSTG page carries "© OWASP, all rights reserved", so quote titles only, as the other OWASP reference files do |
| R2 | Two sentences in `method.md` §4 (and one pointer in `hrt-apply-code-review` step 2): a finding names its source, its interpreting sink and the absent defence; a defence counts, for or against, only after its body is read and every return path checked, with file and line; an unproven dismissal is kept as a LOW DECISION finding, never dropped silently | About 0.4 KB | Closes G2. Cuts both false positives (a named defence that holds) and false negatives (a "sanitizer" credited by name). Four independent sources agree (E3) | A finding kept as LOW costs the user one line in the digest at most |
| R3 | One bullet in `hrt-apply-code-review` step 8: after a confirmed security finding, grep the repository for the same pattern in two or three phrasings; a sibling in lines the change added or edited is a finding of the same severity, one elsewhere is reported once as a LOW known issue (the rule already used for pre-existing scanner findings) | About 0.5 KB; extra tokens only after a confirmed security finding | Closes G3. The cheapest of the three | A sibling outside the diff is not blocking, so the change's scope is unchanged |
| R4 | One sentence in `method.md` §2: security precedents specific to the project (for example "all RPC goes through gateway X", "this module is internal only") may be written in `config.yaml`'s `context:`; the review honours them. Do **not** copy the Anthropic or OpenHack lists (E4). Later, give each `odoo.md` hint a "not a finding when" clause, verified against Odoo's own documentation (open-code-review pairs every check with one) | About 0.2 KB now; the `odoo.md` pass is a separate, larger job | Closes G4 without a schema change; the precedent is versioned in the project | A project could over-exclude. It is the project's own recorded decision, which is the point |

Total always-read increase on the `apply` path: about 1.1 KB on a skill set where `method.md` is 5,285 B and `hrt-apply-code-review/SKILL.md` is 14,126 B. No new phase, no new artifact, no model call.

### 4.2 Measure first

| Id | Change | Cost | What to measure before adopting |
|---|---|---|---|
| R5 | Each reviewer finding quotes the offending line with `file:line`; the orchestrator re-reads the line and, if the quote is not there, sends it back to the reviewer instead of asking the user (closes G5) | About 0.3 KB | How often a finding's anchor is wrong in practice. Check §5 of `2026-08-03-deterministic-grounding-align-review.md` first so this is not re-proposed against an earlier decision |
| R6 | A zero-dependency Node script, in the style of `floor-guard.cjs`, that lists candidate sites in the *diff* only, from the patterns already in `odoo.md`: `auth='public'` or `'none'` and `csrf=False` routes, `sudo()`, non-literal `cr.execute`, `t-raw`, `safe_eval`, `Markup` built with f-strings, access rows with empty `group_id`. Candidate list for the reviewer, never a finding (closes G6) | About 150 lines plus tests; maintained per ecosystem; touches the §10.4 decision "bundle no scanner" | Run it read-only over the git history of three downstream repositories, as was done for the floor guard, and count candidates and true flags per rule. Adopt a rule only if it surfaces something the reviewer missed. Decide the §10.4 tension explicitly |

**R6 variant, tried on 2026-10-25 (supersedes the Node-script form).** Write the candidate patterns as our own opengrep rules in `skills/hrt-security-pass/opengrep/`, with `ruleid:` and `ok:` test annotations, and let step 1 of `hrt-apply-code-review` run them with `opengrep` when it is installed. Applied for every repository, not only Odoo: a `common.yml` for Python and JavaScript/TypeScript plus an `odoo.yml`. The engine is LGPL-2.1 and the rules are ours, so the licence on Semgrep-authored rules (§2.9) does not apply. A throwaway trial with `opengrep` 1.11.1 (local, offline, no registry): six rules (public route with `sudo()`, `cr.execute` with a built string, `csrf=False`, `eval` or `safe_eval`, `Markup` built with an f-string, `t-raw` in QWeb XML) passed 6 of 6 `opengrep test` cases, and `--baseline-commit HEAD~1` reported only the finding on the line the commit added (the identical legacy finding was not reported). Limits: the rules were tested on hand-written fixtures only, so their false-positive rate on real Odoo code is unknown; they match constructs, not missing authorisation (E1); Semgrep CE's taint analysis does not cross files; no public Odoo rule pack was found. Severity mapping needed: only near-zero-false-positive rules (a built string in `cr.execute`) could be an automatic HIGH under step 1; the others are candidates for the reviewer. Not run: the same rules over real downstream Odoo repositories, which is the measurement R6 still needs.

**Measurement of the bundled rules, 2026-10-25 (read-only, five repositories: two Odoo, three AdonisJS/TypeScript).**

| Repo | Full-tree candidates, first run | After fixing the rules |
|---|---|---|
| sricandra/erp (Odoo) | 37 | 22 (4 in team addons, 18 in third-party addons) |
| hash-business/erp (Odoo) | 19 | 17 (2 team, 15 third-party) |
| ims-core, sip, m21-ng-core-app-service (TypeScript) | 0, 0, 0 | 23, 23, 17 |

- **The first run found nothing in all three TypeScript repos, and that was a false negative.** The rules knew only `.query()` and `$queryRawUnsafe`; the repos use the Knex/Adonis idioms `whereRaw`, `rawQuery` and `Database.raw`. In `sip`, `whereRaw(\`msisdn ilike '%${msisdn}'\`)` and about twenty similar lines interpolate values into SQL. Whether the values are validated before they get there was not traced.
- Other fixes from the data: `<t t-raw="0"/>` (the standard layout placeholder) was flagged; one Odoo route produced 15 hits for 15 `sudo()` calls (now one per route); the `migrations/` folders gave 100 of 163 SQL hits (now excluded); `IN (${ids.map(() => '?')...})` and `${this.table}` are not flagged (a variable named `placeholders`, an ALL_CAPS constant, or `this.<x>Table` are skipped too).
- **Per commit, the last 30 non-merge commits of each repo** (`--baseline-commit <commit>~1`, in local clones): Odoo 0 candidates in 60 commits (28 of them touched `.py`, `.xml` or `.js`); TypeScript 6 candidates in 90 commits (55 touched `.ts`), in 3 commits. All six were false positives of the first version (placeholder lists, fixed fragments). The rules were then narrowed; the six were not re-run. Typical run time 4 to 7 s for a whole tree, about 2 s per commit.
- **Registry packs on the same engine** (`opengrep --config p/python --config p/typescript --config p/javascript --config p/owasp-top-ten --config p/security-audit`, rules fetched from the registry): the Odoo repos got 19 and 29 findings, mostly plaintext `http://` links (10 and 20), MD5/SHA-1 use, `defusedxml`, and a `shell=True` already found by our rule; none of the Odoo-specific constructs. TypeScript: 0, 0 and 1 (`gcm-no-tag-length`). **The registry packs did not report the `whereRaw` interpolations in `sip` that our rule found.** `opengrep` loads Semgrep registry packs, so using them does not require the Semgrep engine.
- **Conclusion for the choice of engine:** the value came from rules written for the stack's own idioms, not from a bigger rule library. Staying on `opengrep` costs nothing in coverage; Semgrep CE would add no capability that matters here (neither engine does cross-file taint in its free edition, per Semgrep's own comparison page). Registry packs stay an opt-in choice of each repository: they are licensed for internal use only (cannot be bundled), need the network at scan time, and added noise on these five repositories.
- Limits of this measurement: five repositories, 150 commits, one reviewer (the author) judging candidates, and the rules were changed after the first run, so the final rules have not been run on a second, untouched set of commits.

### 4.3 Not adopted

| Source | Why not | Standing cost avoided |
|---|---|---|
| sast-skills | Wrong language mix, no Odoo, no evidence, heavy fan-out | 374,821 B of skills (about 94,000 tokens if all are read); many subagents per run |
| nano-analyzer | C and C++ prompts, five correlated rounds | 5 triage calls per finding |
| OpenHack | Needs Docker and a hosted or BYOK model, attacks live targets | A second pipeline |
| claude-code-security-review | Duplicates `/security-review`; GitHub-only; lists unsafe for ERP | One more LLM pass per merge request |
| open-code-review | Duplicates `apply` review; Go binary; general-review precision 34 to 38% at best | A binary and an LLM endpoint in every downstream repo |
| deepsec | A periodic audit, not a per-change tool | $25 to $60 per 100 files, per run |
| frame | Z3 and tree-sitter stack, no Odoo, self-labelled benchmarks | Heavy install |
| VVAH | Pipeline, graph database, 11 stages | 92 KB of playbooks plus the pipeline |
| semgrep/skills | Rules licence forbids distribution; skill pushes `--config auto` (registry pull plus metrics) | Licence exposure; a conflict with step 1 |
| mukul975 | Off-scope, template-generated | 330,000 characters of descriptions; 8.0 MB of skills |
| llm-sast-scanner | No LICENSE file, odd provenance, benchmark on seeded apps | 25 KB plus 357 KB of references |

---

## 5. Recommendations

1. Adopt **R1 to R4** together as one change (about 1.1 KB on the `apply` path plus one 1.2 KB reference file read only when it applies). Every instruction is a sentence-length pointer or a reference list; none is a new phase or loop. Write the new text in the repository's own words and keep the source convention of the other reference files (official titles quoted, questions written for this skill, a source URL and a licence note).
2. Treat **R5 and R6** as measurements, not decisions. R6 in particular reopens §10.4 of the 2026-10-15 study, so it needs the maintainer's explicit call after the numbers.
3. Do **not** add a model-based false-positive filter stage. E3 says the filters that drop on doubt lose real findings (Frame's own triage did), and `2026-10-15` already deferred this "only if Stage 1 shows false-positive noise".
4. Keep the consequence gate's demote-not-drop behaviour as the house rule for any later filter: a finding is removed only when the diff or the code *proves* it wrong.
5. If the team wants a whole-repository audit of existing modules, run deepsec or VVAH outside tempa-spec, in a sandbox, with a spend cap. That is a separate process with a separate budget.

## 6. Things the sources got wrong, for the record

- A first pass of this evaluation recommended extending the "leave out" list with the Anthropic precedents. After reading `findings_filter.py` and the prompt text, that was wrong for this schema (E4). R4 replaces it.
- A first pass proposed flagging "model without access rule" as an Odoo probe. Odoo's own tutorial says such a model is inaccessible to everyone, so the finding would be a false positive. Dropped (§3).
- Vendor claims that were *not* reproduced and should not be quoted as fact: every benchmark number in §1 and §2, deepsec's cost table, open-code-review's token ratio, and llm-sast-scanner's recall of 1.000.
