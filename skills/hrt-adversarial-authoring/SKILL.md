---
name: hrt-adversarial-authoring
description: Author-then-adversarial-review authoring pass for a single OpenSpec artifact — a subagent drafts the artifact, two further subagents review it in fresh, isolated contexts with no visibility into the author's reasoning (a Destructive Critic for content/logic, a Structural Auditor for format/traceability), findings are resolved before the artifact is finalized. Parameterized by which artifact is being authored (proposal, specs, or design). Use during the hash schema's `proposal`, `specs`, and `design` phases.
---

# hrt-adversarial-authoring

Cross-context adversarial authoring: one subagent drafts, two further subagents — each with no memory of the author's reasoning, only the inputs they were given — challenge the draft from two orthogonal angles before it's accepted.

This skill is shared by three callers. The calling instruction MUST state which artifact is being authored — that choice fixes the draft content, both review checklists, and the resolution target below. Nothing else about the process changes between callers.

## Parameters (set by the caller)

- **`artifact`**: `proposal`, `specs`, or `design`.
- **`content_sections`**: the sections the draft subagent must produce.
  - `proposal`: Why, What Changes, Capabilities (New/Modified), Impact.
  - `specs`: one spec file per capability listed in the proposal's Capabilities section — `### Requirement` blocks with `#### Scenario` WHEN/THEN content, per the `specs` phase's format rules.
  - `design`: Context, Goals/Non-Goals, Decisions, Risks/Trade-offs, Migration Plan, Open Questions, per the `design` phase's format rules.
- **`grounding_inputs`**: the artifacts the draft subagent may read.
  - `proposal`: discovery.md, existing specs in `openspec/specs/` (for capability naming).
  - `specs`: discovery.md, proposal.md.
  - `design`: discovery.md, proposal.md, specs/**/*.md.

## Process

1. **Draft.** Spawn a subagent with only `grounding_inputs` and `content_sections` for the given `artifact`. It produces a draft only — no self-review, no hedging placeholders. Output format: `## Draft` (the artifact content) followed by `## Author Notes` (open questions or assumptions the author flagged while writing).
2. **Review — two subagents, two orthogonal lenses, neither sees the other's output or the Author Notes.** Each is spawned in its own fresh context: it receives the draft and the same `grounding_inputs` the author had, but NOT the author's reasoning or notes beyond `## Author Notes` itself. Stay in your lane — each reviewer flags only what its own lens below covers; don't duplicate the other's findings.
   - **Destructive Critic** (content and logic, checklist depends on `artifact`):
     - `proposal`/`specs`: does every claim trace back to something in discovery.md/proposal.md? Is anything asserted that the grounding inputs don't support? Is scope creeping beyond what was asked? Assume the author is overconfident — do not validate, look for what's missing or wrong.
     - `design`: this is a decision-quality review, not a traceability review — a Decision isn't right or wrong relative to a source document, it's right or wrong relative to whether the reasoning holds up. For each entry in Decisions, was a reasonable alternative dismissed without justification? For each entry in Risks/Trade-offs, is the stated mitigation actually sufficient, and is a plausible failure mode missing entirely? For that last question, run a premortem: assume this fails in production, work backwards to why.
   - **Structural Auditor** (format and traceability, checklist depends on `artifact`):
     - `proposal`/`specs`: is every requirement testable? Is every `#### Scenario` genuinely WHEN/THEN behavior and not an implementation detail? Does structure match the phase's format rules (hashtag counts, SHALL/MUST usage, one spec file per capability)?
     - `design`: does every section the template requires exist? Migration Plan is conditional — an empty/N/A Migration Plan is only a finding if the change actually has deployment or rollback steps that got left out, not merely because the section is empty. Does each Decision reference the alternatives-considered rationale the template asks for? Does every Risk/Trade-off follow the `[Risk] → Mitigation` format?
   - Each reviewer's output format: `## Review Summary`, `## Required Changes` (findings that must be addressed before the artifact is finalized), `## Suggested Improvements` (optional, non-blocking), `## Risks and Open Questions`.
3. **Resolve.** The orchestrating session merges both reviewers' `Required Changes` (dedupe only findings pointing at the same location — same section/requirement/scenario — with the same complaint; keep both if the location matches but the complaint differs, and do not adjudicate between reviewers by LLM judgment) and shows them to the user, one at a time, recommended resolution first, apply only what the user confirms or adjusts. For `design`, default more findings to the user than you would for `proposal`/`specs` — LLM judgment on decision quality is measurably less reliable than on traceability/structure checks, so when in doubt, surface it rather than treat it as settled. `Suggested Improvements` and `Risks and Open Questions` from both reviewers are surfaced but don't block.
4. **Finalize.** Once `Required Changes` are resolved, write the artifact from the (possibly adjusted) draft using the phase's template.

## Fallback

If a subagent cannot be spawned in the current environment, state that adversarial authoring could not be completed and ask the user whether to proceed with single-pass authoring instead. Do not silently skip either review step.
