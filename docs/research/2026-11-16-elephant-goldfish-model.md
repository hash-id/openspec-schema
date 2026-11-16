# Research: the Elephant-Goldfish Model (EGM)

**Date:** 2026-11-16
**Scope:** Collect, from credible sources, everything documented about the Elephant-Goldfish Model: its origin, the method as its author describes it, the Google plugin that implements it, the review pipeline and personas, isolation and harness support, the evidence for it, its known limits, and the community work that maps it onto OpenSpec. This is a fact-finding record. It makes no recommendation for `tempa-spec` (see §12 for the author's own observations, kept separate).
**Status:** Research only. Nothing in `schema.yaml`, `templates/` or `skills/` was changed.
**Method:** Primary sources were read directly: the author's essay (a Medium print-out kept at `docs/EGM_dave_rensin.pdf`, all 27 pages, read 2026-11-16), Google's announcement post, and the `google/elephant-goldfish-model` repository (README, all seven skills, all ten `agents/` personas, all five standards and `execution_instructions.md`, the `docs/` guides, `TESTING.md`, `AI_POLICY.md`, the Claude plugin manifest and one adapter, and the issues and PR cited in §7). Secondary sources (four analysis articles, a DEV post, two Medium write-ups read from local PDFs, an OpenSpec issue and a community schema repo) were read to cross-check. Where a source could not be read it is listed in §11. No code from the repository was run. Quotes are short and verbatim; everything else is paraphrase. Star counts and similar figures are point-in-time.

## Contents

1. [Identity and provenance](#1-identity-and-provenance)
2. [The essay: the method as its author describes it](#2-the-essay-the-method-as-its-author-describes-it)
3. [The plugin](#3-the-plugin)
4. [The review pipeline](#4-the-review-pipeline)
5. [Reviewer personas](#5-reviewer-personas)
6. [Document standards](#6-document-standards)
7. [Isolation and harness support](#7-isolation-and-harness-support)
8. [Evidence, claims and limits](#8-evidence-claims-and-limits)
9. [Community work: EGM mapped onto OpenSpec](#9-community-work-egm-mapped-onto-openspec)
10. [Other uses of "elephant" and "goldfish" (not related)](#10-other-uses-of-elephant-and-goldfish-not-related)
11. [Source reliability, discrepancies and gaps](#11-source-reliability-discrepancies-and-gaps)
12. [Author's observations against this repo](#12-authors-observations-against-this-repo)

---

## 1. Identity and provenance

| Item | Finding | Source |
|---|---|---|
| What it is | A way of working with AI coding agents, plus an Apache-2.0 plugin that automates it. Not a machine-learning model: no weights; it runs on whatever agent the user already has | Google blog; repo |
| Method author | Dave Rensin, "Distinguished Engineer - Google" | Medium profile in the PDF |
| Essay | "Elephants, Goldfish and the New Golden Age of Software Engineering", Medium, 27 April 2026, "27 min read". Also listed on Google Research as a 2026 publication | PDF; Google Research listing |
| Essay update | Banner dated 2026-10-21: "Google has allowed my team and I to open source the AI coding assistant plugin we use internally to follow this methodology" (egm.dev) | PDF |
| Announcement | 22 October 2026, Google Open Source Blog, "Introducing the Elephant-Goldfish Model plugin: scaling design-driven AI software development" | Google blog |
| Blog authors | Brian Suchy, Jim Quinn, Elise Ewing, Oliver Newth, Dave Rensin, "on behalf of the Elephant-Goldfish Model team" | Google blog |
| Canonical repo | `github.com/google/elephant-goldfish-model`, Apache-2.0, branch `main`. Homepage egm.dev | repo |
| Status | README: "This is not an officially supported Google product" | repo |
| Fork to avoid | `Pendia/Google-Elephant-Goldfish-Model` is a fork (9 commits, 0 stars, older skill names with underscores). Its description ("created at Google") is the fork owner's wording | repo comparison |
| Internal origin | Blog: the plugin "was developed internally for Google software engineers, and is now open source" | Google blog |

Repo scale when read (2026-11-16): 19.8k stars, 1.5k forks, 204 commits, 72 open issues, 39 open PRs. An analysis article quoted 14.6k stars in the first week; the difference is time, not a conflict.

## 2. The essay: the method as its author describes it

### 2.1 Framing

Rensin states two caveats at the start: the views are personal ("Your mileage may vary"), and "another year might make these words obsolete. Please read with a healthy sense of skepticism". The essay has three parts: Part 1 for any profession, Part 2 for software, Part 3 predictions.

### 2.2 Part 1: "It's a Tool, Not a Toy"

The worked example is buying a car with an LLM. A one-shot "research mode" prompt gives "a toy result" because "We asked it to act as our researcher rather than our interrogator." The better flow has three steps:

1. **Preparation.** The AI interviews the user for 15-20 minutes until the description grows to 2-3 pages. Rule: "argue to learn, not to win".
2. **Acceptance criteria.** The AI plays an "expert skeptical fact checker" and the pair write a 2-3 page grading rubric for the future report.
3. **Execution.** A new session in deep-research mode gets both the description and the rubric.

Points made along the way:

- **Sycophancy.** A model saying "That's a great point! You're a genius!" has "fallen into its sycophantic spiral". Remedy prompt: "When you agree with me you are not being helpful. You are most helpful when you challenge my thinking".
- **Judgment.** "Do not make the mistake of outsourcing your judgment to the machine."
- **Keep three artifacts** (description, criteria, output), not whole conversations: "the rest turns out to be mostly token noise". Reason: later, the user can ask why a decision was made, onboard people, and reconstruct a project's trajectory.

### 2.3 Part 2: why EGM exists

**Background.** In summer 2025 Rensin wrote a small tool with AI help (Google Antigravity and Gemini). "within a few months more than 100,000 Googlers were using the tool regularly". This figure is about that tool, not about the later plugin.

**The problem.** "If we aren't careful, we aren't just writing code faster. We are mass-producing our mistakes." If bad code is produced faster than good code, the project "will eventually collapse under the weight of its own unreadable, unmaintainable slop".

**Three "aha" moments.**

1. A session crashed after an hour; a fresh session was a blank slate and re-feeding code was "tedious, token-heavy". A maintained document of intent and progress would make re-bootstrapping "a 30-second operation".
2. With context restored, the model "ran off the rails", hallucinating APIs and making arbitrary architecture choices. "AI models are eager to please... if you don't build very strict guardrails."
3. `sizeof(docs) << sizeof(code)`: plain-English design documents are a cheaper, faster, more reliable way to give context than reading thousands of lines of code.

**"The Vanishing Code."** Design judgments used to live in two places, the design docs and the code's micro-decisions. When an AI writes the code, the human no longer makes those micro-decisions, so they must "shift left" into the design document before code exists, or the system becomes incomprehensible to the person responsible for it. Two possible futures: code too voluminous to review, or models emitting binaries. Either way "the only artifact that matters is the design. Design is the new code."

### 2.4 The model

- **The Elephant:** "An elephant never forgets." The heavily prompted, context-rich AI session **and** the resulting Design Document. It holds institutional knowledge, micro-decisions, the arguments with the model, and the feature's history.
- **The Goldfish:** "A brand new, completely fresh AI session with zero memory. It only knows exactly what is put right in front of it."
- **Process:** "Feed the Elephant; test it against the Goldfish."

Note: in the essay the Elephant is also the document. Phase 4 relies on this: a crashed implementation session is replaced by a new one handed the document.

### 2.5 Four phases, nine steps

**Phase 1: Growing the Elephant (no code).** Co-design the feature and its evaluation criteria "before a single line of code is written".

1. *Context Loading.* Fresh session, point it at design docs or source, ask what it learned, correct misunderstandings at once. Skip for a greenfield project.
2. *The "No Code" Rule.* Prompt: "I do not want you to create code... Resist your impulse to create code." 20-30 minutes of back-and-forth; point the model at the correcting file when it hallucinates.
3. *The Sycophant Challenge.* If the model only praises, tell it: "You are not being helpful. Your highest and best use is to challenge my thinking." Tip: "Why do you think that?" breaks hallucination loops.
4. *First Draft Technical Proposal.* The AI proposes the first design, in prose and block diagrams (short pseudocode allowed), not the user. Reason: a user-proposed design with an AI reacting "will almost certainly miss some blind spots". Expect the first draft to be wrong; argue to a solid approach. Duration: "might take hours. Some of my sessions with Gemini have lasted 2-3 days". "Do not rush this back-and-forth".

**Phase 2: Teaching the Elephant.** Write the markdown "absolute source of truth and the guardrails", section by section, never one-shot (output token limits). Four sections:

1. The Problem: 3-5 plain sentences.
2. The Technical Plan: jargon-light prose, block diagram if useful.
3. Alternatives: ideas considered and rejected, as "guardrails against future hallucinations and arguments".
4. Detailed Implementation: the longest section; "enumerate *every single file* that will be created or changed, and the rationale". Called "critical".

The file is saved in the tree; it is "your new source code".

**Phase 3: The Goldfish Protocol.** Each step uses a new empty session.

5. *Comprehension Test.* "Read this document and the files it references. Tell me what it's trying to accomplish, and how my system currently works as it relates to this feature." If the Goldfish cannot, the document lacks context: add and repeat. "Do not skip this loop."
6. *Critic Review.* "Assume the role of an expert technical reviewer... Every mistake and ambiguity you find makes you more helpful and useful." Rensin: "Anecdotally, I find about 30% of its suggestions are highly valuable." Repeat until suggestions fall into "nit pick".
7. *Implementation Readiness.* "Does it absolutely have all the information you would require to successfully implement this feature in your first pass?" Answer its questions in the doc; repeat; finally show a human reviewer (if solo, "use your best judgment").

**Phase 4: Implementation.**

8. *Coding with Guardrails.* "Implement the feature as described. Follow the plan exactly." If the session spins out, open a new one with the doc.
9. *The "Mean" Code Review.* "I have a strong intuition that this code is of poor quality. Please tear it to shreds..." Also flag any 10 lines without a comment. Repeat until the critique is trivial.

### 2.6 Existing codebases and onboarding

**Bootstrapping ("peanuts and hay").** Feeding a million-line codebase whole makes the model "choke". Instead build a hierarchy of `README.md` files bottom-up:

1. Start at the leaf directories, one set per developer.
2. The AI writes a `README.md` (purpose; each file with a short description).
3. Human verification: the AI is "about 50% wrong" at the leaves; fixing takes 5-10 minutes each.
4. Roll up one level: read the child READMEs plus this directory's code.
5. Continue to the root.

Total: "about a week, (almost) no matter how large your code base". READMEs are needed only until every code file is referenced in at least one design doc; after that they may be deleted.

**Onboarding.** Load all READMEs and design docs into a notebook (NotebookLM or similar); the new engineer's first task is a design doc that passes the Goldfish test. **Non-engineer contributors:** product or program managers with a little coding background write the design doc for the feature they want; it arrives "~70%-80% correct" and needs one or two more turns.

**Role.** "The job is intent. The job is architecture. The job is design judgment." A human remains responsible for what an agent does, so must understand what it builds.

### 2.7 Part 3: predictions (flagged by the author as probably wrong)

Everyone becomes a manager of agents; advice: take a basic people-management class and add agents gradually (3-5, like a first team). Sustained concentration is a trainable "muscle" (start 30-45 minutes a day, add 5-10 minutes a week). Jevons' paradox: easier work means more work, not less. Closing: value lies in applied judgment; learning is "hard like a hill, not hard like a mountain".

### 2.8 Evidence in the essay

All anecdotal and self-reported: ~30% of Critic suggestions highly valuable; ~50% of leaf READMEs wrong; ~70-80% of PM-written design docs correct; design sessions of 2-3 days; bootstrap about a week. No benchmark, control group or defect measurement. The author states models "are not capable of this kind of judgment" and warns the views may age quickly.

## 3. The plugin

### 3.1 What the announcement says

Google's post gives the problem as AI-driven velocity that "silently introduced a potential reliability crisis", where "we are often auto-scaling our mistakes rather than simply writing code faster". It credits Rensin's essay for "Design is the new code". Goal: "for the AI to correctly produce the code you wanted the first time after you press Enter". The human moves "from micromanager to executive reviewer"; "Human judgment is the artifact."

Three phases in the post:

1. **Brainstorm** ("Growing the Elephant", `egm-brainstorm`): load system context; "No Code" rule; debate trade-offs.
2. **Draft** ("Drafting with the Elephant", `egm-draft`): Markdown design doc with problem, technical plan, alternatives, and an implementation plan that "enumerates the specific files to change".
3. **Review** ("The Goldfish Protocol", `egm-review`): three automated steps, Comprehension Check, Antagonistic Review (the diagram alt text calls it Hostile Critic), Implementation Readiness Check ("strict go/no-go").

These three correspond to essay steps 5-7. The post's only adoption claim: "Thousands of Googlers use this plugin every day to ship production Google code." No count, metric or study is given, and the post does not discuss limitations. It names Antigravity as the first target, "with other development environments upcoming".

### 3.2 Repository layout

Top level: `.agents/plugins`, `.claude-plugin`, `.codex-plugin`, `.cursor-plugin`, `.gemini`, `.github`, `.plugin`, `.vscode`, `.windsurf`, `adapters/opencode`, `agents`, `assets`, `com.github.copilot/agents`, `docs`, `resources`, `scripts`, `site`, `skills`, `tests`; files `AGENTS.md`, `AI_POLICY.md`, `ACCESSIBILITY.md`, `CONTRIBUTING.md`, `LICENSE`, `README.md`, `TESTING.md`, `plugin.json`, `pyproject.toml`.

`resources/README.md` calls the files in `resources/` "the authoritative instructions and rubrics loaded by EGM skills and reviewers": `execution_instructions.md` plus five standards (§6). Human guides should link to them, not summarise them.

### 3.3 Skills (7)

`egm-brainstorm`, `egm-draft`, `egm-resolve`, `egm-bootstrap`, `egm-review`, `egm-review-loop`, `egm-drift-report`. Commands use the `/egm:` prefix in Claude Code and Antigravity; Codex uses a skill picker. Scope note from the README: the built-in draft and design-review workflow targets software specifications; bootstrap and drift report apply to software codebases only.

All seven skills have `disable-model-invocation: true` and Apache-2.0 frontmatter, so an agent reads `SKILL.md` and follows it; the host's Skill tool refuses them. Each opens with a line sending Codex and ChatGPT Work to the Codex guide and Claude Code and Cowork to `${CLAUDE_PLUGIN_ROOT}/docs/claude.md`.

**`egm-brainstorm`** (271 lines) — ideation into `concepts_brief.md`.
- *Step 1, clarification:* open-ended chat questions over several turns (problem, consumers and SLAs, hard constraints, edge cases and out-of-scope, current workaround, success metrics); then a 2-3 sentence "anchored working hypothesis" and a single-select readiness gate ("Review with Goldfishes" or "Clarify additional constraints or assumptions in chat"). No subagent may be spawned before the user confirms readiness.
- *Step 2, review and synthesis:* `egm-synthesizer` in `Mode: BRAINSTORM` runs seven reviewers (`egm-design`, `egm-codebase-details`, `egm-zoom-out`, `egm-comprehension`, `egm-implementation-readiness`, `egm-structural`, `egm-inventive-catalyst`), deduplicates, and writes the brief (Overview, Analysis, Goals vs. Non-Goals, Alternatives Weighed, Key Decisions and Staging for Next Steps). The brief must be a file; printing it in chat is "STRICTLY FORBIDDEN".
- *Step 3, iteration:* tell the user the path, show 2-3 key objections, loop.
- *Step 4, finalise:* four-option gate: publish as an RFC (`docs/designs/<feature_name>.md`, plus `docs/designs/SITEMAP.md` if present), proceed to `egm-draft`, keep refining, or conclude.
- The skill's lens table lists seven lenses (Contrarian/YAGNI, Cost, UX, Migration, Observability, Tech Debt, Inventive Catalyst) whose names do not match the seven reviewer names in Step 2; the page does not explain the mismatch. The six-lens list in an analysis article is the first six of the table.
- No severity scale, no round cap, no headless mode described. `Author` comes from `git config user.name`, then `GIT_AUTHOR_NAME`, else asked.

**`egm-draft`** (321 lines) — section-by-section design document.
- *Intake* by priority: `concepts_brief.md`, then `discussion_summary.md` (in `./`, the artifact directory or `scratch/`), then an interactive chat prompt.
- *Steps 2-5* write `design_draft.md` in order: Overview/Goals/Problem Statement; Technical Plan (prose, ASCII or Mermaid; new components, modified files, API changes); Alternatives Considered (from the brief's `Alternatives Weighed`, each written `Rejected by author: [technical rationale]`); Detailed Implementation (every file to change, create or delete, with rationale; pseudocode, APIs and schemas allowed, "NO CODE").
- *Section Approval Gate* after each of steps 2-5: a visible chat summary, then "Approve [Section Name] and proceed" or "Request revisions to [Section Name]".
- *Step 6:* reconcile against the predecessor (contradictions listed first, one line each, quoting both, each decided by the user); choose the target directory (probe `docs/designs/`); update `SITEMAP.md`; write `<DESIGN_DIR>/<FEATURE>.md`; recommend `egm-review`.
- Rule 13, "Author Decides Architecture": offer up to three options with mechanism, trade-offs and failure conditions; do not rank them or pick a default; mechanical choices (naming, formatting) are the skill's own. The skill spawns no Goldfish; it points to `egm-review` stage 5.

**`egm-resolve`** (187 lines) — the Elephant-side resolver.
- *Inputs:* `TargetFile`, `LineRange` (or `full file`), `FindingsList`. Automated Mode (all inputs given) runs silently as a subprocess; Standalone Human Mode asks for missing inputs one at a time.
- *Four categories,* one per finding:
  - **CONTEST:** the critique is wrong and the evidence is in a file the reviewer could read.
  - **ESCALATE:** the critique is wrong but the evidence is outside what the reviewer could read (team convention, verbal decision); handed to the user, not fixed.
  - **PROPOSE FIX:** the critique is valid; exact replacement defined.
  - **DECLINE:** a Nit, recorded and not fixed.
- *Rules:* "A contest must be checkable." "'This was intentional' is not evidence." "Do not add context only to satisfy a reviewer." "Do not contest a comprehension gap." "Do not change a severity." "A wish to contest is not evidence that the reviewer is wrong."
- *Gate:* ESCALATE items first, then comment on the file, "auto accept" (applies all PROPOSE FIX in one batch), "continue", an item-by-item "interactive breakdown", or a custom instruction; the skill then makes zero tool calls and goes idle. No file edits happen during the interactive loop.
- *Output:* `goldfish_review_report.md` (findings by severity, with `Status: resolved` added at the end) and in-place edits to the target.

**`egm-review-loop`** (199 lines) — the loop driver; see §4.3.

**`egm-bootstrap`** — creates and verifies a `README.md` contract tree. Inputs: `path` (required), `target_filename` (default `README.md`; an alternate such as `EGM.md` keeps human-written READMEs untouched), and two internal worker flags.
- *Rules:* "You are strictly limited to documentation." No `git commit` or `git add`. Per-worker temp files live outside the workspace, "never a fixed, shared path". "never run a recursive search such as `find` or `ls -R`." Discovery is breadth-first, skips symlinks and hidden or system directories, and honours `.gitignore` and `.egmignore`. "If you discover more than 15 subdirectories, you MUST immediately request user approval." "Never infer RPC methods, routes, status enums, or invariants from file or directory names alone." "Never output speculative links to non-existent contract files." An existing target file is not overwritten wholesale; developer notes are kept.
- *Procedure:* detect the verification command from the manifest (`package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`, `*.sln`, `Makefile`, `BUILD`); 5 or fewer directories run directly, more are partitioned by an adaptive depth algorithm into parallel `egm-bootstrap-orchestrator` workers ("without artificial concurrency limits"); each worker walks post-order and calls a read-only `goldfish-explorer` scout that returns JSON `{"interface": [], "invariants": [], "side_effects": []}` with `[file:symbol]` citations (large directories chunked at about 1,500 lines; read order contracts and schemas, entry points, templates and configs; tests ignored; a failed scout leaves "(Details pending/documentation failed)").
- *Peanuts and Hay:* a directory with source files is a **Peanut** (component package README with file contracts); one with only code-bearing subdirectories is **Hay** (repository blueprint rolling up child interfaces). The root is always Hay.
- *Final pass:* the root agent reads every created or modified contract and checks that Interface, Invariants and Side Effects sections exist and cite real symbols, that relative links resolve on disk, and that verification targets match the project's test config (for Bazel, `/...` or `:all`, never `:...`). It then offers a drift report.

**`egm-drift-report`** — compares design documents or READMEs with the current code.
- *Procedure:* list the design files; for each, read it, identify the intent and the filenames and symbols it names, locate and read the current source fresh ("rather than from memory"), compare, and report only differences.
- *Categories:* Missing Features, Incomplete Models, Logic Shortcuts (hardcoded values where dynamic logic was planned), Architectural Divergence.
- *Rules:* "Report ONLY the differences. Do not describe what is working or what matches." If the code matches: "No drift detected." "If a design doc mentions a specific object, field or file name and the code doesn't have it, that is a reportable drift." Logic not referenced in any design or README is also reportable.
- *Output:* appended to `{YYYY-MM-DD}_DRIFT_REPORT.md`, with one `## <DESIGN_DOC_NAME>` section per document. The page does not say where the file is written. Getting-started suggests running it weekly.

### 3.4 Execution rules (`resources/execution_instructions.md`)

Read by `egm-draft` (rule 1) as the behaviour contract for the design-only workflow. It has no numbered phases; the write boundary is called "Design-Only Scope".

- "You are strictly forbidden from writing, modifying, or building any production implementation files" (examples: `.h`, `.cc`, `.py`, `.go`). Code may appear only "inside a markdown draft block or in a temporary scratchpad file".
- Scratchpad code files may be created "ONLY outside the project source tree"; fixed shared paths such as `/tmp/scratch.py` are forbidden.
- Explicit consensus gates: "Do not save the document or move to the next step without the user's explicit "go-ahead"."
- ONE QUESTION AT A TIME: "strictly forbidden from asking more than one question in a single response."
- NO SUMMARIES: the final response must not include a "Summary of work", "Status", "Adherence" or "Rule checklist".
- Contradiction auditing: when a contradiction is found the agent "MUST NOT modify any files"; it replies in text and asks for resolution.
- If production implementation is requested mid-workflow, explain that the workflow yields design docs and illustrative code only, and ask whether to continue designing or leave the workflow.

### 3.5 Anti-sycophancy rules in the skills

`egm-brainstorm` and `egm-draft` (rules 4-12) carry an explicit anti-sycophancy block: a plain-English standard with banned words ("seamless", "robust", "obviously"); "Never agree by default" / "Default to Stress-Testing"; "No Glazing"; "Critique First"; "Reject Echo-Chamber Framing"; "Generate Counter-Arguments"; "Earn Your Agreement"; a ban on validating adjectives ("brilliant", "great", "smart", "correct", "perfect"); and "Banned Apologies" when challenged. This is the plugin's version of the essay's Sycophant Challenge (§2.5 step 3). The reviewer personas have no such block (§5), and `egm-resolve` has only its "checkable" contest rule.

### 3.6 Packaging, release, privacy and contribution policy

- **Manifest.** `.claude-plugin/plugin.json`: name `egm`, display name "Elephant-Goldfish Model", version **0.1.1**, Apache-2.0, author Google, homepage egm.dev, ten agent adapters. Its `privacyPolicyUrl` is Google's general policy, not the EGM-specific `docs/privacy.md`. No `$schema` key (its presence broke omp discovery, issue #186).
- **Claude adapter example** (`.claude-plugin/agents/design_critic.md`): `name: egm-design`, `tools: Read, Grep, Glob`, `model: inherit`, `omitClaudeMd: true`; body tells the agent to read the canonical persona at `${CLAUDE_PLUGIN_ROOT}/agents/design_critic.md`, then the target and standards, stay read-only, and report an incomplete review rather than a verdict if a required file cannot be read. This is the only Claude-side isolation control: a tool allowlist and a prompt, not a sandbox.
- **Release process** (`docs/releases.md`): canonical version is `plugin.json`; every host manifest (`.claude-plugin`, `.codex-plugin`, `.cursor-plugin`, `.plugin`) must match. Pre-1.0: patch for compatible fixes, minor for features or incompatible workflow changes; 1.0 needs a stable contract for skill names, parameters, output paths and report formats. Steps: reviewed version-bump PR, annotated `vMAJOR.MINOR.PATCH` tag, a "Prepare draft release" workflow; never move a tag. Verification: `sha256sum -c SHA256SUMS` and `gh attestation verify`. The page lists no release history.
- **Directory packaging** (`docs/directory.md`): `python3 scripts/pack_plugin.py --target claude|openai`; archives exclude tests, site, workflows, marketplace catalogs, hooks, the AI policy and the PR template; "Build output alone does not establish installation, workflow support, or directory approval."
- **Privacy** (`docs/privacy.md`): "The runtime package does not operate a hosted service, database, analytics client, or telemetry endpoint." No EGM account or credentials. The host assistant processes prompts, files and responses under the host's own policy; EGM does not control host retention and "does not apply an automatic retention period" to outputs. Bootstrap may run local discovery commands and a project formatter, which may contact a package registry. "EGM's runtime declares no MCP server and installs no permission-approval hook."
- **AI contribution policy** (`AI_POLICY.md`): AI tools are encouraged, "purely autonomous contributions are not accepted"; a human must have "personally reviewed, tested, and verified every line"; pasting maintainer comments into an LLM and pasting the reply back is prohibited; a change over 100 non-test lines, or touching 3 or more core files in `skills/` or `agents/`, needs a Feature Inquiry Issue labelled `design-ready`, then a design-doc PR labelled `pr-ready`, then an implementation PR; no artificial splitting to stay under the threshold. The policy applies to contributors, not plugin users. (The repo thus dogfoods its own design-first flow.)

### 3.7 Templates and packaging

- **Design-doc template** (`skills/egm-draft/references/design_doc.md`, 177 lines). Title; metadata Author, Status (`Draft | Proposed | In Review | Approved`), Date. Sections in order: *Overview* (The Problem; Goals and Non-Goals; Open Questions; Critical User Journeys as Given/When/Then; Technical Plan (Architecture); Alternatives Considered with Pros, Cons and Reason for Rejection, and the rule "Do not attribute a rejection to a maintainer without linking their issue, discussion, or PR."; Non-Functional Requirements, which "can be omitted or stated as "None""; Additional Resources; Future Improvements), then *Detailed Implementation Plan* (Target Files to Create/Modify, each with Type/Scope and Proposed Changes; Verification Plan covering Compilation/Build, Unit Tests, Static Analysis and Linting, Test Coverage Requirement, E2E/Integration). Footer: "_Drafted with EGM_".
- **README templates** (`egm-bootstrap/references/templates.md`, 68 lines): three, not two. *Peanut* (Overview, Interface, Invariants, Side Effects, Verification with `Run: <test-command>`); *Hay / repository blueprint* (System Overview, optional Local Interface and Invariants, Subdirectories and System Boundaries, Global Invariants, Global Side Effects, System Verification); *Intermediate blueprint* (Overview, Subdirectories and Boundaries).
- **Worker return schema** (`worker-return.schema.json`, 20 lines): one required property `subtree_index`, an array of objects with required `path` and `summary` and optional string arrays `interface`, `invariants`, `side_effects`.
- **`scripts/pack_plugin.py`** (139 lines): `--target claude|openai --output <dir>` builds `egm-<target>/` and a reproducible `egm-<target>.zip` (sorted files, mode 0644, fixed 1980-01-01 timestamps). It packages the seven skills (the proposed `egm-ask` is not included), ten agent files and five standards. It refuses: an existing output, output inside the source tree, symlinks or paths outside the source, a missing required file, hooks, MCP or apps dependencies (`mcpServers`, `mcp`, `apps`), and manifest references that are absolute, contain `..` or are not bundled. Checksums are not computed in this script.
- **Release history** (GitHub releases): **v0.1.0**, 27 October 2026 (`b3a3595`), "EGM's first tagged release", assets `egm-claude-0.1.0.zip` and `egm-openai-0.1.0.zip`, notes: "Exact release-ZIP host validation remains pending" and "These results do not establish passes for the attached ZIPs". **v0.1.1**, 6 November 2026 (`dea7761`, marked Latest): updated listing copy and three OpenAI starter prompts (#316, #314), the TRIZ inventive-catalyst reviewer with better review-context handling and severity preservation (#299, #289, #279), and the experimental Cursor, OpenCode V1 and Copilot adapters (#164, #165, #163); "Skill names and per-skill prompts are unchanged, and no migration is needed"; checksums and attestations were verified against the commit. The release page showed "45 commits to main since this release".

### 3.8 Contributor rules (`AGENTS.md`, `CONTRIBUTING.md`)

- "You must never automatically open a pull request without explicit human review, testing, and approval." No files in `docs/designs/` for a bug fix. Bug Fix / Minor Patch means a non-test diff of 100 lines or fewer and fewer than 3 core files; larger work is Stage 1 (design-doc PR, needs an issue labelled `design-ready`) then Stage 2 (implementation PR, needs `pr-ready` and a merged design doc). "Never apply these two labels": maintainers control both. "Never split a cohesive feature or refactoring across multiple smaller pull requests to evade the 100-line scope threshold." The PR template must be filled in because "`gh pr create --body` skips the template". PR titles start with an action verb in sentence case and carry no `type(scope):` prefix. Harness changes must record host, version, install result and evidence for brainstorm, draft and review, writing `not run` where not run. Stacked PRs use `Refs #<issue>` below and `Closes #<issue>` on top, aiming at 200-400 changed lines each.
- Track 1 (small fix): direct PR, no prior issue (example: a broken link, checked with `pytest tests/unit/test_link_integrity.py`). Track 2 (feature): a proposal issue (the doc recommends `/egm-brainstorm`), a design doc drafted with `/egm-draft` and stress-tested with `/egm-review`, registered in `docs/designs/README.md`, a design-doc PR, then the implementation PR kept as a draft until the design PR merges. A CLA is required. Each `SKILL.md` needs frontmatter (`name`, `description`, optional `disable-model-invocation`), a `test_scenarios.yaml` and a `TEST.md`.

### 3.9 Tests and design records

- **`tests/unit`** (20 Python files, run offline with `pytest tests/unit`): CI workflow, Claude and Codex trace parsing, Copilot, Cursor, OpenCode and Windsurf adapters, frontmatter, harness tables, link integrity, Markdown tables, packaging, PR triage, releases, scenario coverage, scope advisory, skill load limits, style and boundaries. The skill body size limit is 24,000 bytes (`test_skill_load_limits.py`; second-hand from `ask.md`). Counts reported in PRs: 135 passed (#190), 247 (#245), 378 passed and 2 skipped (#379).
- **`tests/integration`** (opt-in, drive real host CLIs): Claude, Codex, Copilot, Cursor and OpenCode probes; `additional-harnesses.md` says the Codex test has a marker probe and a line-count workflow fixture and the Claude test a project-instruction and parent-marker probe.
- **`docs/verification/skill-discovery-316.md`** (6 November): same prompts without naming EGM skills, baseline `6a8001e` versus candidate `ce3e309`; on Codex CLI 0.166.0 over nine tasks the candidate improved three cases, loaded extra skills during setup and missed the custom review panel; on Claude Code 2.1.319 no EGM Skill tool call occurred in any of nine prompts, which the page says matches the explicit-invocation policy; conclusion: "Repeat those two cases before deciding whether to retain the shorter descriptions."
- **`docs/designs/`** holds the repo's own design records: `architecture`, `ask`, `bootstrap`, `brainstorm`, `draft`, `drift_report`, `review`, `synthesizer`, `triz_integration`, `multi_harness_support`, `additional-harnesses`, `windsurf_support`, `runtime_packaging`, `releases`, `claude_release_branch_distribution`, `plugin_listing_presentation`, `site_documentation`, `skill_icons`, and an index. Two were read: `additional-harnesses.md` (proposal dated 2026-10-24: "This proposal changes no runtime behavior and establishes no support claim"; "No inline simulation of independent reviewers is permitted"; missing delegation must stop the review with an unsupported message) and `ask.md` (draft dated 2026-10-28, issue #175, a proposed read-only `/egm-ask` that detects the stage from artifacts and suggests up to three next steps; "advisory only").

Installation (README): Antigravity `agy plugin install https://github.com/google/elephant-goldfish-model`; Claude Code `claude plugin marketplace add google/elephant-goldfish-model` then `claude plugin install egm@egm`; Codex `codex plugin marketplace add ...` then `codex plugin add egm@egm`; ChatGPT desktop via a published listing. "Install the whole plugin. Skill-only installers that copy `skills/` alone break EGM." (`docs/harnesses.md`)

## 4. The review pipeline

Read from `skills/egm-review/SKILL.md` and `docs/designs/architecture.md`.

### 4.1 Stages

| Stage | Target | Reviewers | Standard |
|---|---|---|---|
| 5 Zoom Out | whole file | `egm-zoom-out`, `egm-inventive-catalyst` | `zoom-out-standard.md` |
| 6 Comprehension | feature range and detailed range | `egm-comprehension` (direct, not via synthesizer) | none |
| 7 Critic | feature range | `egm-design`, `egm-structural`, `egm-style` | `feature-spec-standard.md` |
| 8 Intermediate Zoom Out | whole file | `egm-zoom-out` | `zoom-out-standard.md` |
| 9 Implementation Readiness | detailed range | `egm-implementation-readiness`, `egm-codebase-details`, `egm-style` | `implementation-readiness-standard.md` |

The mapping of three persona names to roles is inferred from the architecture page. The document is split at `## Detailed Implementation Plan` (or a listed synonym) into a feature range and a detailed range; an ambiguous boundary is put to the user.

Presets: **Interactive** (all five, a checkpoint gate after each), **Consolidated** (all five, no pauses, writes `consolidated_review_report.md`), **Feature spec only** (stages 5-8), **Implementation plan only** (stage 9 only).

### 4.2 Rules

- **Severity:** Blocker, Major, Nit. Findings carry reviewer lens, affected scope, discrepancy and rationale.
- **Re-audit cap:** "Each stage allows a maximum of 1 re-audit." After the cap, residual findings are recorded as "accepted trade-offs" and the pipeline advances. A failed reviewer is retried once, then marked `not run`.
- **Stage 6 bypasses the synthesizer** because "its report keeps only findings, and the author must see the paraphrase". Stage 6 reads "the document alone" and uses no standard: "The test is self-containment, not detail."
- **Human gates:** one question each, sole tool call, no "(Recommended)" prefix. Options: proceed, update the doc, resolve with agent, pause.
- **Synthesizer** ("Swarm Compiler and Aggregator"): spawns reviewers (optionally two instances each), deduplicates, normalises line references, groups by severity, writes `goldfish_review_report.md`, and "Never count it as a reviewer with zero findings". It does not review. Where subagents cannot nest, review "falls back to direct dispatch instead of a synthesiser".
- **Implementation:** the plan's `Target Scope & File Boundary` list becomes the write allowlist for later implementation. The architecture page admits the write boundary during design phases is "a convention, and nothing enforces it".
- **Fallbacks:** no subagent tool → stop ("a review in the same context is not a Goldfish review"); named agents not registered → general-purpose subagent told to read the persona first; links needing approval in headless runs are left out.

The essay has three Goldfish checks; the repo has five stages. The two Zoom Out stages, the synthesizer, severities and the re-audit cap are plugin additions.

### 4.3 The review loop (`skills/egm-review-loop/SKILL.md`)

The driver that runs reviewers against a document, passes findings to `egm-resolve`, and repeats.

- **Inputs:** `TargetFile`, `SemanticTarget` (descriptive target or `full file`), `Reviewers` (shortnames map to `agents/{name}.md`), `Standards` (map to `resources/document_standards/{name}.md`), `GoldfishContext` (reading list; URLs must be saved as local files before round 1, because reviewers cannot open URLs; if one cannot be saved and nobody can answer, "as in a headless run, leave it out, tell the user, and keep going").
- **Suggested pairings:** `design_critic` plus `structural` for feature specs; `implementation_readiness` plus `codebase_details` for implementation plans.
- **Each round:** re-scan the target and re-parse its line range before every round ("unconditionally re-parses target line ranges"); launch reviewers (hierarchical via the synthesizer, or direct dispatch); each finding gets an id `<reviewer>-<round>-<n>` and a 🔴 Blocker / 🟡 Major / 🟢 Nit marker; pass findings to `egm-resolve`; check iteration.
- **Termination rules:**
  - A **settled** finding (contested or accepted-risk) is not re-opened when another reviewer raises it again.
  - An applied fix does **not** settle a finding: if the same issue returns at the same scope, it is re-opened.
  - A **clean round** has no unsettled Blocker or Major (Nits do not block); a reviewer marked `not run` makes the round not clean; status is decided before fixes are applied.
  - **Converged** means two consecutive clean rounds; one is "not enough".
  - **Cap:** 5 rounds. **Churn:** a new finding at the scope of an applied fix, where reverting the fix would clear it.
  - On cap or churn, list the open findings by severity and ask one question: accept and proceed, continue past the cap, or return the document to drafting.
- **Turn-taking:** "the loop driver MUST respect the turn-taking checkpoint in egm-resolve"; it waits for explicit confirmation before each new round.
- **Failures:** a failed or timed-out reviewer is retried once, then recorded as `not run` ("Never count it as a reviewer with zero findings"); a synthesizer summary missing a reviewer's status counts as `not run`; no nesting means direct dispatch; no subagent tool means stop.

Unreconciled: `egm-review`'s rule is "Each stage allows a maximum of 1 re-audit" (§4.2), while the loop it calls for stages 7 and 9 has a 5-round cap and a two-clean-rounds convergence rule. The pages do not say which governs when `egm-review` drives the loop as a subflow.

## 5. Reviewer personas

Nine files in `agents/` (Apache-2.0, frontmatter `name` and `description` only): `comprehension`, `design_critic`, `implementation_readiness`, `structural`, `style`, `zoom_out`, `inventive_catalyst`, `codebase_details` (eight reviewers), plus `synthesizer` and `bootstrap_orchestrator`. Every reviewer carries the same three core mandates: strict read-only ("You have NO tools to modify the workspace"), a stateless mindset ("zero conversational history or external assumptions"), and no chit-chat. Most have a REVIEW mode and a BRAINSTORM mode.

| Persona | Role | Mandate, in brief |
|---|---|---|
| `egm-comprehension` | Naive Reader | Writes a paraphrase first ("What this proposes", "How the existing system works, per this document", 2-5 sentences each); a paraphrase it cannot write is a Blocker. Flags only project-specific undefined terms, not general engineering terms |
| `egm-design` | Hostile Design Critic | Stress-tests architecture, scalability, infra economics, unmitigated risk. "You do not accept assertions without proof" |
| `egm-implementation-readiness` | Pragmatic Tech Lead | "Do I know exactly what to code, where, and how, based on this text?" Flags undocumented design choices (database, API signature, error strategy) |
| `egm-structural` | Layout validator | Heading tree against the standard's blueprint; no skipped levels; lists, tables, code blocks, links |
| `egm-style` | Technical copy editor | Strips fluff and subjective judgments; "require every caveat to name a concrete reader/operator decision"; classes DROP, CALIBRATE, RELOCATE, KEEP |
| `egm-zoom-out` | Skeptical Architect | Context sufficiency, root problem, simplicity, anti-weeds, reuse; searches the code for any proposed new utility; flags premature optimisation |
| `egm-inventive-catalyst` | TRIZ | Finds "false compromises" and proposes patterns from a 10-pattern catalog; outputs "No false compromise detected" rather than manufacture one; must declare secondary trade-offs; REVIEW severity is Major or Nit only |
| `egm-codebase-details` | Pedantic quality auditor | Checks documentation against code. "Contradicts the Code" is a Blocker; "Proposed files are not findings"; an unmarked file list is reported once as Major |
| `egm-bootstrap-orchestrator` | Documentation orchestrator | Not a reviewer: crawls and partitions trees, spawns workers, verifies contracts, compiles README indexes; "You must avoid writing functional source code" |

Observations from reading the files:

- **No anti-flattery rule in the personas.** No persona file says "do not flatter" or "do not capitulate". The nearest are "does not accept assertions without proof" (design), "does not accept hand-waving" (comprehension, codebase details), the evidence rule in `style`, and the no-manufacturing rule in `inventive_catalyst`. The explicit rule set lives in the `egm-brainstorm` and `egm-draft` skills instead (§3.5), which guard the Elephant side, not the Goldfish side.
- **Read-only inconsistency.** The eight reviewers say they have no write tools, but the bootstrap orchestrator's Claude adapter grants Write, Edit and Bash and its persona has no read-only block (by design: it writes documentation).
- **Severity lives in the persona files**, not in the standards, and is uniform except for `inventive_catalyst` REVIEW (Major/Nit) and the `style` caveat classes.

## 6. Document standards

Five files in `resources/document_standards/`, all read.

- **`zoom-out-standard.md`** — "A design passes if it solves the root problem in the simplest possible way." Sections: 0 Context Sufficiency (if the reviewer cannot tell what and why, "the review must fail immediately with a request for context"); 1 Root Problem Focus; 2 Simplicity and Extensibility (YAGNI, no premature optimisation, no architectural dead-ends); 3 Anti-Weeds (no premature detail, structural fixes over workarounds, right layer); 4 Leverage Existing (reuse code and patterns, flag anti-patterns such as bypassing auth).
- **`feature-spec-standard.md`** — a competent engineer or fresh AI session, unfamiliar with the codebase, must understand the feature, motivation and trade-offs. The Alternatives Rule: "mandatory evaluation of alternatives", with concrete trade-offs, and no rejection attributed to a maintainer "without linking their issue, discussion, or PR". Required areas: Problem Statement, Goals and Non-Goals, Proposed Architecture, Alternatives Considered, Risks and Mitigations.
- **`implementation-readiness-standard.md`** — executable "without guessing, asking clarifying questions, or making independent design choices". Zero-Decision Rule: "The plan must leave **zero design or architectural choices to the implementer**." Phases must each leave the codebase stable, buildable and testable. Required: Target Scope and File Boundary (exact repo-relative paths marked create, modify or delete), Actionable Steps, Test Plan (happy path and edge cases).
- **`heilmeier-standard.md`** — quality bar for project proposals, based on the Heilmeier Catechism. Passes if a competent engineer or fresh AI session unfamiliar with the project can understand goals, risks and value with every question answered unambiguously. Eight questions as the repo states them: Objectives (what, no jargon); State of the Art (how it is done today, limits); New Approach (what is new, why it should succeed); Impact (who cares, what difference); Risks (risks and payoffs); Cost (resources, compute, headcount); Timeline; Metrics and Exams (mid-term and final checks). Not used by the review stages in `SKILL.md` as read.
- **`re-implementation-standard.md`** — quality bar for documenting codebase state. Passes if a competent engineer or fresh AI session "can write functionally identical code on the first attempt using _only_ the document". Zero-Assumption Rule: it fails if the reader must "guess parameter defaults, assume error handling, choose design patterns, or infer output schemas". Include external contracts, behavioural rules and performance constraints; exclude syntax, variable names, private helpers and non-observable internals. Required elements "if applicable" (non-exhaustive): APIs, logic, data, side effects, dependencies, configuration, constraints, errors, tests (helpers and mocks, if documenting tests). The review skill says it "asks for code-level detail, which the Zoom Out standard forbids in FeatureRange", so it is deliberately not applied to stage 6.
- None of the standards defines an output format or severity scale, and none uses MUST or NEVER wording except where quoted above.

## 7. Isolation and harness support

### 7.1 What "fresh context" does and does not guarantee

- **Rule:** "A Goldfish review needs a fresh context." If no subagent tool exists, review skills stop. `docs/harnesses.md`: "Fresh conversation context does not mean that the host omits its instruction files."
- **Claude Code** (`docs/claude.md`): requires 2.1.271 or later for `omitClaudeMd`; older versions "must not be treated as verified Goldfish isolation environments". Reviewer adapters use tools `[Read, Grep, Glob]`, `model: inherit`, `omitClaudeMd: true`. Normal subagents exclude parent history; `omitClaudeMd` also excludes user, project and local instruction files, though managed policies still apply. The skills set `disable-model-invocation: true`, so agents read `SKILL.md` and follow it in the same thread. Stages 5-9 run sequentially; only reviewers inside a stage run in parallel.
- **Not a sandbox:** reviewers can read any accessible file; they cannot open URLs, so web pages must be saved as workspace files. Plugin subagents ignore hooks and `permissionMode`, and the synthesizer's Write cannot be path-restricted: "write only the requested report" is an instruction. Fail-closed: "A reviewer that cannot read its persona or standard must report the limitation and stop; it has not reviewed."
- **Model:** reviewers inherit the parent's model by default, so Elephant and Goldfish share a model unless the user changes it.

### 7.2 Known leak (issue #237, open, label Bug)

Opened 30 October 2026. Reviewers on Codex and Antigravity do not see the parent conversation, but the host still injects instruction files. Repro with marker files in an empty folder: Codex CLI 0.166.0 reviewer returned the `AGENTS.md` marker (also with `fork_turns: "none"`); Antigravity CLI 1.4.0 returned `AGENTS.md` and `GEMINI.md`; Claude Code 2.1.314 returned `UNKNOWN`. The reporter's reasoning: those files carry the team's assumptions, so a reviewer that starts with them is less independent. PR #245 ("docs(harnesses): clarify instruction-file isolation limits", opened 30 October, merged 3 November as `4ac6b17`; `pytest tests/unit` 247 passed, no live host probe) separates parent-conversation isolation from host instruction-file exclusion and records the two reports without treating them as reproduced; it refs #237, so #237 stays open and no fix for the injection has landed. `docs/codex.md` agrees: `fork_context: false` (or `fork_turns: "none"`) limits parent turns only and "do[es] not prove" that Codex excludes host instruction files; if native subagent tools are absent, "never simulate reviewers in the parent context". `docs/harnesses.md` confirms both caveats: the Codex and Antigravity tests check parent-turn isolation only, and no host-specific exclusion control is verified.

### 7.3 Support matrix (`docs/harnesses.md`, `TESTING.md`)

| Harness | Status | Notes |
|---|---|---|
| Antigravity CLI | PASS | CLI 1.4.5, 16 native reviewers; interactive approvals, bootstrap and synthesizer nesting not tested; bootstrap skill exceeds a load limit; #237 caveat |
| Claude Code | PASS | 2.1.308 review "Pass after fix": an initial stage-order failure was retained, then a nine-reviewer rerun verified sequential stages; up to 3 nesting levels |
| Codex | PASS | 0.163.0: 15 native reviewers, two live tests in 573 s. 0.164.0-alpha: full live suite 482 s. Named personas not supported (runtime detection, direct-dispatch fallback); #237 caveat |
| Antigravity IDE (standalone) | NOT SUPPORTED | lacks `invoke_subagent` |
| Claude Cowork | PARTIAL | Install works; review completed stages 5-7 only before a usage limit; subagents cannot nest, so the main context dispatches directly. Issue #105 (open, Bug): the export has 15 native reviewer transcripts while the parent claimed 16; the stage-9 codebase reviewer skipped its required standard; status review 27 October: "2 of 8 criteria" complete |
| ChatGPT Work | PARTIAL | Nine native reviewers completed; a fresh probe returned `UNKNOWN`; artifact download and final audit open. Issue #106 (open, Bug): first attempt used a wrong persona path, a full-repo ZIP upload failed and a runtime-only ZIP worked; child traces not exported, so "limited UI-and-artifact verification"; "3 of 8 criteria" complete |
| omp | Working install | Community-verified v18.12.6. Issue #186 (open, Feature): two silent discovery failures (underscore skill directories, the `$schema` key) fixed in PR #190 on `main`; brainstorm, draft, review, read-only enforcement and isolation not established; maintainer approval pending |
| Muse 1.4.14 | Working install | Fixtures passed 2026-10-30, 15 fresh-context reviewers, run headless with simulated approvals (interactive gates untested). Install from a local clone (`muse plugins install ./elephant-goldfish-model --scope user`, then `muse plugins approve egm`); `marketplace add` finds zero plugins. Named `egm/egm-*` agents are rejected (`agent_definition_unavailable`), so the general-purpose fallback is used; "do not assume reviewers are read-only" |
| Windsurf (renamed Devin Desktop, 2026-06-02) | EXPERIMENTAL | Devin CLI 3000.12.43 (2026-11-10) passed routing, pauses, read-only reviewers and parent-marker isolation; no workflow ran to a final artifact. Issue #376 (open, 9 November) scopes a thin `.windsurf/rules` and `.windsurf/workflows` adapter; acceptance criteria unchecked. PR #379 ("Add experimental Windsurf (Devin Desktop) adapter") was merged 13 November as `964a4f1` by a maintainer, 18 of 20 checks passing; it stops Goldfish workflows when the host lacks isolated read-only subagents; its description reports 378 unit tests passed (2 skipped) and a parent marker in 0 of 2 reviewer task texts; the IDE and a run to a final artifact were not verified |
| Cursor, OpenCode V1, GitHub Copilot CLI | Experimental adapters | Shipped in v0.1.1 (6 November; #164, #165, #163). Release notes: "Native end-to-end verification of these exact release ZIPs remains open in #60". Per-host detail in §7.5 |

`TESTING.md` states: "A failed workflow or missing native evidence is not a pass." It requires Node 22+ and Python 3.10+ for the offline tests, and its live suites are opt-in. It records no pass or fail counts for the unit tests, and the tests check plugin structure and native execution paths, not defect or delivery outcomes.

### 7.4 Privacy and data handling

See §3.6: no hosted service, analytics or telemetry; host retention applies; bootstrap may run a project formatter that contacts a package registry; no MCP server and no permission hook. `pack_plugin.py` refuses hooks and MCP dependencies at build time, which backs the second claim for the packaged runtime.

### 7.5 Other host adapters

Shared `skills/`, `agents/`, `resources/` and `docs/` sit at the root; adapters route to them. Statements below are from the host guides and manifests.

| Host | What the adapter does | Isolation and tool limits stated |
|---|---|---|
| Codex (`.codex-plugin`) | Manifest `"skills": "./skills/"` and `"requires_local_executor": true`; interface text says "Reviews require a local executor and isolated subagents. Cloud support remains partial." | Parent-turn isolation only (§7.2) |
| Cursor (`.cursor-plugin`) | Manifest points `skills`, `agents` and `rules` into the adapter; the explicit agent path "excludes raw shared personas" | Reviewers declare `readonly: true`, `permissionMode: readonly`, `is_background: false`; the loader reads `permissionMode`; "The native read-only mode restricts writes; it is not a filesystem boundary"; shell and MCP prohibition is a prompt, "not proven tool allowlists"; "Installation, workflow, and isolation remain unverified. Do not add Cursor to the supported-host table yet" |
| OpenCode V1 (`adapters/opencode/install.py`) | Copies canonical trees, makes symlink aliases, generates `opencode.json` (seven commands, eight reviewers, an `egm` primary agent) and an `installation.json` with SHA-256 hashes; "refuses an existing destination" | Reviewers deny every tool except `read` and `glob` (`grep` denied because it "bypass[es] the host's per-file read rules, including the .env exclusions"); task allowlist holds only the eight reviewer types; "Read-only tool configuration is not process or filesystem isolation"; targets OpenCode CLI 1.18.29 |
| GitHub Copilot CLI (`com.github.copilot/agents`) | Nine files: an `egm.agent.md` entry plus eight reviewer profiles mapped to shared personas | Entry profile may delegate and edit; reviewers only read and search; closest `omitClaudeMd` equivalent is `include-custom-instructions: false`, enforcement "unverified"; "Selecting a reviewer as the main session does not establish a fresh Goldfish context"; `COPILOT_HOME` "does not disable every user-level skill or project instruction" |
| Gemini (`.gemini`) | `config.yaml` is a pull-request code-review bot configuration (`comment_severity_threshold: HIGH`, `max_review_comments: 5`), not an EGM adapter. PR #103 removed Gemini CLI packaging in favour of Antigravity CLI | n/a |
| Windsurf, `.plugin`, `.agents/plugins` | Windsurf trees (`rules/`, `workflows/`) not read; `.plugin` follows the agent-plugins.org 1.0.0 schema; `.agents/plugins/marketplace.json` has one plugin entry, category "Productivity", installation `AVAILABLE`, authentication `ON_INSTALL` | not stated |

Manifest metadata: `.claude-plugin/marketplace.json` name "egm", owner "Google", description "Develop ideas with context and review documents with fresh eyes."; root `plugin.json` (0.1.1) interface: category "Productivity", short description "Develop ideas and review plans", capabilities "Develop ideas", "Review plans and documents", "Check software against designs", and the line "Not an officially supported Google product." No manifest has a keywords field. Copilot's guide says the root manifest "takes precedence over the Claude compatibility manifest".

### 7.6 Open and recent work in the repo (isolation label, fetched 2026-11-16)

The `isolation` label list showed 15 issues (state not shown per item in the fetched text, so statuses below are only those confirmed elsewhere in this file): #414 web-compatible EGM chat skill prototype; #376 Windsurf; #375 VS Code Copilot and registry packaging; #295 independent precommit review; #294 independent bug diagnosis; #282 OpenCode V2; #270 `/egm-browser` to inspect live pages; #262 "Limit file access and parallelism during EGM reviews"; #261 "Harden bootstrap execution, reviewer access, and release dependencies" (Bug); #237 host instruction leak (§7.2); #147 Copilot CLI; #146 OpenCode V1; #145 Cursor; #106 ChatGPT Work; #105 Cowork. Related: #252 (open, Bug, "Load the Muse integration guide from every EGM skill": no skill mentions Muse, so `docs/muse.md` is installed but never opened and the `EGM artifact directory:` override does not reach Muse; "This needs a maintainer track decision before implementation").

Merged work worth knowing: PR #103 (merged 22 October, 60 commits) added Claude Code, Cowork, Codex and ChatGPT support and removed Gemini CLI packaging; a reviewer raised nesting, plugin-cache read permissions and the Skill tool refusing `disable-model-invocation` skills, fixed in `f4d342c`, with a PreToolUse hook follow-up planned. PR #190 (merged 27 October) fixed omp discovery. PR #217 (merged 30 October) verified the published OpenAI v0.1.0 ZIP by byte-comparing 53 files (live suite 482.30 s on Codex CLI 0.164.0-alpha.11.1). PR #245 (§7.2). PR #379 (Windsurf adapter, §7.3).

Reading only the titles, #237, #261 and #262 all concern reviewer file access or instruction leakage. This matches what the host guides say (§7.1, §7.5): reviewer limits come from prompts and host flags, not from a filesystem boundary. The issue bodies for #261 and #262 were not read, so their content is not summarised here.

## 8. Evidence, claims and limits

### 8.1 What is claimed

- Essay: anecdotal figures only (§2.8). The "100,000 Googlers" figure is for a different, earlier tool.
- Blog: "Thousands of Googlers use this plugin every day to ship production Google code." No metric.
- Analysis articles: all repeat the adoption claim; none gives a defect, rework or time measure. Two say so outright; Google's own FAQ says completing the workflow "alone does not demonstrate a productivity improvement."

### 8.2 What the FAQ concedes (`docs/faq.md`)

Review "can" become a bottleneck; effect on velocity "depends" and should be measured on one's own tasks; a complete design is enough for a zero-context agent "sometimes, but not always"; engineers do not become obsolete "in our opinion"; there are "many" alternatives; do not open big PRs.

### 8.3 Limits recorded by independent analysts

- **Shared model.** Goldfish default to the Elephant's model, so separate context removes direct carry-over but not model-level blind spots (Digital Applied, Wavect, ByteIota). Wavect: fresh context is not the same as unbiased review.
- **Cost.** One review can mean 15 or more subagent runs; a session cap can end a review part-way (the Cowork run did).
- **Fit.** Poor for one-file fixes ("the review costs more than the code").
- **"No code" is a prompt, not a control** (The Agent Report).
- **Gap from spec to code** is not closed.
- **Config becomes a decision.** Personas, standards and excluded files are a versioned choice the user must read and maintain (DEV article).
- **Human in the chair.** One analyst quotes the point that the model "quietly assumes... someone in the chair who knows when the elephant is wrong".
- **Missing evidence.** No accuracy benchmark; no independent study of effectiveness was found.

### 8.4 Two long-form write-ups (read from local PDFs)

Both were Medium member-only stories that returned HTTP 403 to the fetch tool; the maintainer supplied print-outs (`docs/Googles_Elephant-Goldfish-Model_(EGM)_Plugin_Explained-Towards_AI.pdf`, 15 pages, and `docs/Google_EGM_ Coding_Agent_Truth_LevelUpCoding.pdf`, 20 pages), both read in full. They are secondary sources and are compared below with the primary sources already read.

**A. "The Elephant-Goldfish Model: Why the AI That Knows Least Reviews Best"** — Udaykiran Estari, Towards AI, 27 October 2026, "8 min read", 9 claps when captured. The author says they read "the repo, its docs, the review skill line by line and Google's launch post".

- *Accurate against the primary sources:* the three-role table (Elephant, Goldfish, You); four layers (skills, personas, document standards, living documentation in `docs/designs/`); persona mandates (read-only, read the document "as a naive team member", reports go into files, which the architecture doc calls "artifact-first" to keep long reviews out of the Elephant's context); the five-stage review table; the feature-range / detailed-range split at `## Detailed Implementation Plan`; the synthesizer's optional two independent copies per reviewer, deduplication, Blocker/Major/Nit sorting and per-stage report files; the uninterrupted mode merging five reports into `consolidated_review_report.md` with a table tracing action items to raw findings; `PROPOSE FIX` / `CONTEST` in `/egm-resolve`; "Each stage allows one re-review"; the weekly drift report suggestion; and the stop rule ("is not a Goldfish review").
- *Architecture doc, as quoted by the article:* it rejected running review prompts inside the drafting session for "confirmation bias; the model validates its own mistakes", and names "premature implementation" as a failure mode. The article dates the architecture doc to **6 June 2026** and notes it "describes four review tiers" while the review skill and README now describe five, with a second zoom-out added after the Critic stage. This is the only source that explains the three/four/five-stage differences found in §11.2: the architecture page predates the current review skill.
- *Limits the author lists:* not for small fixes (README: use your normal workflow); the harness must support subagents (on Codex named personas are not registered, so a general-purpose subagent reads the persona file); more agents cost more ("That is my inference; the docs don't publish costs"); "No measured results yet. The launch post reports adoption, not defect rates or speed gains"; it "doesn't replace tests or judgment".
- *Illustrative, not evidence:* a webhook-delivery walkthrough that the author labels "illustrative, not a recorded run".
- *One difference:* the article says brainstorm starts "six goldfish in parallel"; the `egm-brainstorm` skill names seven reviewers (§3.3). Its install line lists Antigravity, Claude Code and Codex.

**B. "Google's Elephant-Goldfish Model: The Death of the Million-Token Chat"** — Nikhil Varma, Level Up Coding, "11 min read", dated only as "6 days ago" in the capture (so on or about 10 November 2026 if the PDF was saved on the 16th; an inference), 284 claps and 5 responses when captured. This is the article behind the search snippet that first described EGM as "Google created it to fix context pollution". It is promotional in tone and closes by asking readers for "50 claps" and reposts.

- *Claims, with how they hold up:*
  - Context pollution: after about "50,000 tokens... the attention weights dilute"; a 45-minute chat degrades; sycophancy anchors the model to the user's design. Mechanism claims and token figures are unsourced and not in the essay or the repo as read. The essay's own problem statement is different: a crashed session needing a costly restart and "mass-producing our mistakes".
  - "His conclusion was blunt: the unstructured, single-session chat model for software engineering is fundamentally broken." That wording does not appear in the essay as read (§2). Treat it as the article's paraphrase.
  - "That is where 90% of software projects fail" (hand-off of a spec straight to a coding agent): unsourced.
  - Elephant "strictly forbidden from writing a single line of executable code", producing one artifact with four contents (architectural context and user intent; exact API schemas and data contracts; explicit boundary conditions and error hierarchies; an actionable implementation checklist). The no-code rule matches `execution_instructions.md`; the four-item list is the article's summary and does not map one-to-one onto the `design_doc.md` template (§3.7).
  - Goldfish receives "only two inputs" (the spec and the repository files it references): matches the primary sources. "Rigorous four-pass review" (Zoom-Out Check, Comprehension Audit, Adversarial Critic, Implementation Readiness Gate): the repo has five stages (§4.1); this is the four-tier shape the architecture doc had on 6 June. "When the Goldfish finds a gap, it never auto-patches the text... The loop repeats until the Goldfish passes the document with zero reservations": consistent in spirit with the review loop (§4.3), but the loop converges on two clean rounds with no Blockers or Majors, not "zero reservations", and caps at five rounds.
  - **Section 4, "The runnable EGM harness: Spec validation and AST auditing":** about 120 lines of Python (`SpecContract`, `GoldfishReviewer`) that parse a candidate implementation with `ast` and flag unauthorised imports, missing required functions and unapproved extra functions. The article says "Google wraps the workflow in automated verification gates" and "the spec is... an executable contract". **No such AST harness was found in the repository files read** (skills, agents, standards, `scripts/pack_plugin.py`, test names). The reviewers are language-model personas with read-only tools, and the drift report is an LLM comparison of documents with code. The code is the author's own illustration; it should not be read as part of EGM.
  - **Section 5, "Code quality benchmarks":** the article states Google's release and Rensin's essay "focus on the architectural workflow rather than publishing a controlled academic benchmark table", then gives "an illustrative comparison modeled on typical 80k-token single-session coding loops versus isolated 8k-token spec-driven subagents" with qualitative claims only (adherence "consistently higher", rework "dramatically lower", unauthorised dependency creep "enforced down to 0%" with AST checks, input token burn "substantially lower"). No data, no study. A reader asked in the responses whether "the benchmark figures are from a published study or an illustrative comparison"; the answer was not visible in the capture. So the section carries no evidential weight.
  - Install steps: `claude plugin marketplace add google/elephant-goldfish-model`, `claude plugin install egm@egm` (matches the README); commands shown as `/egm:egm-brainstorm`, `/egm:egm-draft`, `/egm:egm-review`, `/egm:egm-review-loop`, `/egm:egm-resolve`, `/egm:egm-drift-report` (the README gives only the `/egm:` prefix; see §11.2).
  - Phase 5 "Drift Audit": "EGM parses your git diff against the approved Markdown specification, flagging any unauthorized API changes, dependency additions, or architectural drift before you commit." **This does not match `egm-drift-report`'s `SKILL.md`** (§3.3): that skill reads design documents and the current source and reports differences in four categories; it does not parse a git diff and has no dependency check beyond "reportable drift". The "implementation subagent" the article refers to is not part of EGM either; none of the seven skills writes production code, and `execution_instructions.md` forbids it in the design workflow.
- *Overall:* usable as an example of how the idea is being popularised; not usable as a source for how EGM behaves or for any measured result. Where it disagrees with the repo, the repo wins.

## 9. Community work: EGM mapped onto OpenSpec

- **`lutfi-zain/openspec-schema-egm`** (Apache-2.0; 11 commits, 4 stars, no releases; badges OpenSpec v1.16.1 and "Google EGM v0.1.1"). A community OpenSpec schema named `egm`. Graph from its `schema.yaml`:

  | Artifact | Requires |
  |---|---|
  | proposal | none |
  | specs | proposal |
  | design | proposal |
  | review | specs, design |
  | tasks | review |
  | apply | tasks |

  The `review` node is a "Goldfish gauntlet" of five stages with zero-context subagents, triage into PROPOSE FIX, CONTEST, ESCALATE or DECLINE, and two consecutive clean rounds (no Blockers or Majors) before `review.md` is final. Inconsistencies noted by the reader: the README says "5-node" but draws seven; review fixes edit `specs` and `design`, an edge the graph does not model; isolation is instruction text only, since OpenSpec cannot enforce zero context; the README names harness flags (`omitClaudeMd`, `fork_turns`) specific to certain hosts.
- **Its benchmark** (one Todo PWA, three workflows: OpenSpec standard, "Google EGM standard", OpenSpec EGM): self-reported, one run, one prompt; the "Google EGM standard" arm is the author's own rig, not Google's. Not usable as evidence.
- **OpenSpec issue #2199** (opened 4 November 2026 by the same author, still open): asks for an `egm` entry in the Community Schemas table. No maintainer reply was visible on the issue page.
- **OpenSpec PR #2233** ("docs(community): publish one page for schemas and projects", opened 10 November 2026 by TabishB, four commits, open at fetch time): adds one Community page at `/docs/community` combining schema examples and project listings, adds EGM and rightcommit entries, removes three hosted-service listings, and closes #2231 and #2199. CodeRabbit flagged two failed pre-merge checks: the EGM and rightcommit entries need fuller workflow descriptions, and the hosted-service removals belong in a separate change. The PR page was truncated; a summary says one reviewer approved and called the consolidation "Clean consolidation", which this record has not verified. So the community EGM schema is on the way to a listing, not endorsed beyond that.
- **Comparisons.** No independent comparison of EGM with OpenSpec, Spec Kit or Kiro was found. The comparison pages that exist are informal or promotional.

## 10. Other uses of "elephant" and "goldfish" (not related)

- **Random walks with memory:** "goldfish walk" (remembers one step) versus "elephant walk" (remembers the whole history); Rohde et al., 2012, from a search summary, not verified against the paper.
- **Mathematical finance:** [From elephant to goldfish (and back): memory in stochastic Volterra processes](https://arxiv.org/abs/2306.02708v1), arXiv, June 2023.
- **LLM long-term memory:** [From Goldfish to Elephant: Long-Term Memory for Large Language Models via Selective Storage and Hierarchical Compression](https://www.cambridge.org/engage/coe/article-details/6976210b5cdf9e3db45ef2b2), Cambridge Open Engage preprint, 2026.
- **Continual learning:** [Elephant Neural Networks: Born to Be a Continual Learner](https://arxiv.org/abs/2310.01365v1), arXiv 2310.01365.

## 11. Source reliability, discrepancies and gaps

### 11.1 Reliability tiers

- **Primary:** the essay PDF; Google's blog; the repo (`README`, `docs/`, `agents/`, `resources/`, `TESTING.md`, `skills/egm-review/SKILL.md`, `agents/synthesizer.md`); issue #237.
- **Secondary:** Wavect (named author, repository revision `403d8881` cited), Digital Applied, The Agent Report (byline "Hermes Agent"), ByteIota (byline "ByteBot", no absolute date), the DEV post (the author sells agent-config kits, a possible interest), and two Medium stories read from local PDFs (§8.4): Towards AI (Udaykiran Estari; careful, labels its own inferences and its example as illustrative) and Level Up Coding (Nikhil Varma; promotional, contains claims and code the repo does not support).
- **Self-reported:** the `openspec-schema-egm` benchmark.

### 11.2 Discrepancies

| Item | Detail |
|---|---|
| Review length | Blog and essay: three checks. Repo: five stages. The extra two are Zoom Out stages added by the plugin |
| Reviewer count | Five stages as specified give 10 reviewer slots; the Muse run reports 9 stage reviewers and 6 brainstorm reviewers against 7 specified lenses; unexplained |
| Blog authors | One article lists four names (omitting Newth); the blog lists five |
| Essay length | PDF says 27 min read; a search snippet said 33 |
| Adoption figures | 100,000 Googlers (essay, a different tool) versus "thousands... every day" (blog, the plugin) |
| Stars | 19.8k (read) versus 14.6k (week-one article) |
| Repo attribution | One search result pointed to the Pendia fork as the project page; it is a fork |
| Re-audit rule | `egm-review`: max 1 re-audit per stage. `egm-review-loop`: 5-round cap, two clean rounds to converge. Governing rule when the loop runs as a subflow is not stated (§4.3) |
| Brainstorm lenses | Skill lens table has seven names (Contrarian/YAGNI, Cost, UX, Migration, Observability, Tech Debt, Inventive Catalyst) that do not match the seven reviewer names in Step 2 |
| Persona count | Issue #186 lists nine personas (omits `inventive_catalyst`); `plugin.json` and `docs/muse.md` list ten adapters; the repo has ten files in `agents/` |
| Plugin version | `plugin.json` says 0.1.1; an issue comment from 27 October cites 0.1.0; no release dates on `docs/releases.md` (its `v0.1.0` and `v0.1.2` are examples) |
| Phase 5 write boundary | The architecture page describes a Phase 5 write allowlist from `Target Scope & File Boundary`; `execution_instructions.md` contains no phase numbers, only "Design-Only Scope" |
| Branch URL | A fetch of `.../blob/master/...` returned content labelled branch `main` without a reported redirect; content treated as `main` |
| Windsurf status | Issue #376 open while PR #379 (the adapter) is merged; "experimental" in both, with no completed run |
| Skill count | The repo has seven packaged skills; `ask.md` proposes an eighth (`/egm-ask`, not packaged); `docs/designs/` lists `ask` as a design record |
| Reviewer count in manifests | Seven commands and eight reviewers in OpenCode and Copilot adapters (the bootstrap orchestrator and synthesizer are not "reviewers"); ten files in `agents/` |
| PR #103 label | "enhancement" appears only in a summary, not verbatim on the page |
| Review tiers over time | Towards AI: the architecture doc (dated 6 June 2026) describes four review tiers; the review skill and README now describe five (a second zoom-out after the Critic stage). Level Up Coding's "four-pass review" follows the older shape. This explains the three/four/five counts across sources |
| Drift report mechanism | Level Up Coding: parses a git diff, flags API and dependency changes before commit. `egm-drift-report` `SKILL.md`: compares design documents with current source, four drift categories, no git-diff parsing. The skill file is authoritative |
| "Fundamentally broken" | Level Up Coding attributes this conclusion to Rensin; the phrase is not in the essay as read |
| Brainstorm reviewer count | Towards AI and DEV: six goldfish. `egm-brainstorm` skill: seven reviewers (and a seven-name lens table that does not match them) |
| Command syntax | README: `/egm:` prefix on Claude Code and Antigravity. Level Up Coding: `/egm:egm-<skill>`. ByteIota: unprefixed. Not reconciled |

### 11.3 Not read

Still unread after three passes: the contents of individual test files (assertions are known only from file names and second-hand statements), `tests/conftest.py`, the two `.cjs` triage scripts and `scripts/prepare_release.py`; fifteen of the seventeen `docs/designs/` records (only `architecture`, `additional-harnesses` and `ask` were read); `.windsurf/rules`, `.windsurf/workflows`, `.cursor-plugin/agents`, `.cursor-plugin/rules` and `.gemini/styleguide.md`; the Claude adapters other than `design_critic.md`; `TESTING.md` beyond its harness table; issues #60, #145, #146, #147, #261, #262, #375 and #407 (read only as titles or references); egm.dev; the full text of PR #103, #217 and OpenSpec #2233 (pages were truncated, so those parts come from a model summary and are flagged where used); the MarkTechPost article (HTTP 403; still unread, and it is the source of the Spec Kit / Kiro / Superpowers comparison table mentioned in a search summary, which is therefore unverified); and the Google Research listing and a reader mirror of the Rensin essay (the fetch was denied by the session's permission check, not by the site; the essay itself was read from the local PDF).

Third pass (2026-11-16): `design_doc.md`, `templates.md`, `worker-return.schema.json`, `pack_plugin.py`, directory listings of `tests/`, `scripts/`, `docs/designs/` and `docs/verification/`, `skill-discovery-316.md`, the host adapter trees and manifests, the OpenCode, Cursor and Copilot guides, `AGENTS.md`, `CONTRIBUTING.md`, PRs #103, #190, #217, #379, issue #252, both releases, the `isolation` label list and OpenSpec PR #2233. The five-stage list in secondary sources partly came from the MarkTechPost breakdown via the DEV post; the repo `SKILL.md` confirms it.

Read in a second pass (2026-11-16, after the first draft of this file): all other skill files, all three remaining standards, `execution_instructions.md`, `docs/index.md`, `getting_started.md`, `codex.md`, `muse.md`, `privacy.md`, `directory.md`, `releases.md`, `AI_POLICY.md`, `.claude-plugin/plugin.json`, one Claude adapter, PR #245, and issues #105, #106, #186 and #376.

## 12. Author's observations against this repo

These are not findings from the sources. They are a pointer for a later decision and carry no recommendation.

- `tempa-spec` already has fresh-context adversarial review (`hrt-adversarial-authoring`, `hrt-align-consistency-review`) and a per-phase artifact graph. The EGM concepts with no direct counterpart in the sources read here are a **Comprehension step** (a zero-context reader paraphrases the design back before any critique) and a **hard stop when the harness cannot create a fresh subagent**.
- The sources show the isolation guarantee depends on the host (issue #237). Any reuse of the idea would need to state which instruction files leak into a "fresh" reviewer on each supported host.
- The sources report no outcome evidence, so any adoption would rest on mechanism, not on EGM's results. This mirrors the bar used in `2026-10-25-addyosmani-agent-skills-evaluation.md` §1.
- The earlier 4-agent study (`2026-07-19-adversarial-4-agent-authoring.md`) and the judge-bias study (`2026-08-03-judge-bias-collusion-adversarial-authoring.md`) cover the same-model blind-spot concern that three analysts raise against EGM.
- EGM enforces a 24,000-byte limit on each skill body in a unit test (second-hand, from `ask.md`) and says shorter skill descriptions need a repeat of the discovery check (`skill-discovery-316.md`). This repo already tracks instruction weight (`2026-07-12-instruction-density-mitigation.md`, `2026-10-21-tempa-spec-weight-and-phase-reduction.md`); EGM's own source is a data point on how another project bounds it, not on whether the bound works.

## Sources

- Dave Rensin, *Elephants, Goldfish and the New Golden Age of Software Engineering* (Medium, 2026-04-27; local copy `docs/EGM_dave_rensin.pdf`); [Google Research listing](https://research.google/pubs/elephants-goldfish-and-the-new-golden-age-of-software-engineering/)
- [Google Open Source Blog, 2026-10-22](https://opensource.googleblog.com/2026/10/introducing-elephant-goldfish-model-plugin.html)
- [google/elephant-goldfish-model](https://github.com/google/elephant-goldfish-model): [`skills/egm-review/SKILL.md`](https://github.com/google/elephant-goldfish-model/blob/main/skills/egm-review/SKILL.md), [`TESTING.md`](https://github.com/google/elephant-goldfish-model/blob/main/TESTING.md), [`docs/designs/architecture.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/designs/architecture.md), [`docs/faq.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/faq.md), [`docs/harnesses.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/harnesses.md), [`docs/claude.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/claude.md), [`resources/README.md`](https://github.com/google/elephant-goldfish-model/blob/main/resources/README.md), [`agents/`](https://github.com/google/elephant-goldfish-model/tree/main/agents), [`resources/document_standards/`](https://github.com/google/elephant-goldfish-model/tree/main/resources/document_standards), [issue #237](https://github.com/google/elephant-goldfish-model/issues/237)
- Repo skills and resources (second pass): [`skills/egm-brainstorm/SKILL.md`](https://github.com/google/elephant-goldfish-model/blob/main/skills/egm-brainstorm/SKILL.md), [`egm-draft`](https://github.com/google/elephant-goldfish-model/blob/main/skills/egm-draft/SKILL.md), [`egm-resolve`](https://github.com/google/elephant-goldfish-model/blob/main/skills/egm-resolve/SKILL.md), [`egm-review-loop`](https://github.com/google/elephant-goldfish-model/blob/main/skills/egm-review-loop/SKILL.md), [`egm-bootstrap`](https://github.com/google/elephant-goldfish-model/blob/main/skills/egm-bootstrap/SKILL.md), [`egm-drift-report`](https://github.com/google/elephant-goldfish-model/blob/main/skills/egm-drift-report/SKILL.md), [`resources/execution_instructions.md`](https://github.com/google/elephant-goldfish-model/blob/main/resources/execution_instructions.md), [`heilmeier-standard.md`](https://github.com/google/elephant-goldfish-model/blob/main/resources/document_standards/heilmeier-standard.md), [`re-implementation-standard.md`](https://github.com/google/elephant-goldfish-model/blob/main/resources/document_standards/re-implementation-standard.md)
- Repo docs and packaging: [`docs/index.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/index.md), [`getting_started.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/getting_started.md), [`codex.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/codex.md), [`muse.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/muse.md), [`privacy.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/privacy.md), [`directory.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/directory.md), [`releases.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/releases.md), [`AI_POLICY.md`](https://github.com/google/elephant-goldfish-model/blob/main/AI_POLICY.md), [`.claude-plugin/plugin.json`](https://github.com/google/elephant-goldfish-model/blob/main/.claude-plugin/plugin.json), [PR #245](https://github.com/google/elephant-goldfish-model/pull/245), [#105](https://github.com/google/elephant-goldfish-model/issues/105), [#106](https://github.com/google/elephant-goldfish-model/issues/106), [#186](https://github.com/google/elephant-goldfish-model/issues/186), [#376](https://github.com/google/elephant-goldfish-model/issues/376)
- Repo templates, packaging, hosts and process (third pass): [`design_doc.md`](https://github.com/google/elephant-goldfish-model/blob/main/skills/egm-draft/references/design_doc.md), [`templates.md`](https://github.com/google/elephant-goldfish-model/blob/main/skills/egm-bootstrap/references/templates.md), [`worker-return.schema.json`](https://github.com/google/elephant-goldfish-model/blob/main/skills/egm-bootstrap/references/worker-return.schema.json), [`scripts/pack_plugin.py`](https://github.com/google/elephant-goldfish-model/blob/main/scripts/pack_plugin.py), [`docs/verification/skill-discovery-316.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/verification/skill-discovery-316.md), [`docs/designs/additional-harnesses.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/designs/additional-harnesses.md), [`docs/designs/ask.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/designs/ask.md), [`docs/opencode.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/opencode.md), [`docs/cursor.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/cursor.md), [`docs/copilot.md`](https://github.com/google/elephant-goldfish-model/blob/main/docs/copilot.md), [`AGENTS.md`](https://github.com/google/elephant-goldfish-model/blob/main/AGENTS.md), [`CONTRIBUTING.md`](https://github.com/google/elephant-goldfish-model/blob/main/CONTRIBUTING.md), [PR #103](https://github.com/google/elephant-goldfish-model/pull/103), [#190](https://github.com/google/elephant-goldfish-model/pull/190), [#217](https://github.com/google/elephant-goldfish-model/pull/217), [#379](https://github.com/google/elephant-goldfish-model/pull/379), [issue #252](https://github.com/google/elephant-goldfish-model/issues/252), [releases](https://github.com/google/elephant-goldfish-model/releases), [OpenSpec PR #2233](https://github.com/Fission-AI/OpenSpec/pull/2233)
- Local print-outs supplied by the maintainer (Medium stories that returned HTTP 403): `docs/Googles_Elephant-Goldfish-Model_(EGM)_Plugin_Explained-Towards_AI.pdf` (Towards AI, Udaykiran Estari, 2026-10-27; web: [pub.towardsai.net](https://pub.towardsai.net/the-elephant-goldfish-model-why-the-ai-that-knows-least-reviews-best-e88cad4626a1)) and `docs/Google_EGM_ Coding_Agent_Truth_LevelUpCoding.pdf` (Level Up Coding, Nikhil Varma; web: [levelup.gitconnected.com](https://levelup.gitconnected.com/google-elephant-goldfish-model-coding-agents-9d58312063f0))
- [Pendia fork](https://github.com/Pendia/Google-Elephant-Goldfish-Model)
- [Wavect](https://wavect.io/blog/elephant-goldfish-model-design-review/), [Digital Applied](https://www.digitalapplied.com/blog/google-elephant-goldfish-agent-design-review), [The Agent Report](https://the-agent-report.com/2026/10/google-elephant-goldfish-spec-driven-development/), [ByteIota](https://byteiota.com/googles-elephant-goldfish-model-spec-before-code/), [DEV (Piekwerk)](https://dev.to/piekwerk/googles-elephant-goldfish-plugin-5-stages-of-fresh-context-review-before-your-agent-writes-code-20e0)
- [lutfi-zain/openspec-schema-egm](https://github.com/lutfi-zain/openspec-schema-egm); [OpenSpec issue #2199](https://github.com/Fission-AI/OpenSpec/issues/2199)
- Unrelated senses: [arXiv 2306.02708](https://arxiv.org/abs/2306.02708v1), [Cambridge Open Engage preprint](https://www.cambridge.org/engage/coe/article-details/6976210b5cdf9e3db45ef2b2), [arXiv 2310.01365](https://arxiv.org/abs/2310.01365v1)
