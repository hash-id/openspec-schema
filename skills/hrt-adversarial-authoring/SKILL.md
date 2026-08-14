---
name: hrt-adversarial-authoring
description: Author-then-adversarial-review authoring pass for a single OpenSpec artifact — a subagent drafts the artifact, two further subagents review it in fresh, isolated contexts with no visibility into the author's reasoning (a Destructive Critic for content/logic, a Structural Auditor for format/traceability), findings are resolved before the artifact is finalized. Parameterized by which artifact is being authored (proposal, specs, or design). Use during the tempa-spec schema's `proposal`, `specs`, and `design` phases.
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

1. **Draft.** Spawn a subagent with only `grounding_inputs` and `content_sections` for the given `artifact`. It produces a draft only — no self-review, no hedging placeholders. Prose MUST follow the `plain-language-writing` skill's ARTIFACT rules while writing, not as a pass applied afterward. Before finalizing, self-check against the Structural Auditor's format checklist below and fix violations directly — content/scope/tradeoffs stay the reviewers' job, and this doesn't replace the Auditor's pass. Output format: `## Draft` (the artifact content) followed by `## Author Notes` (open questions or assumptions the author flagged while writing). `## Author Notes` MUST use the `humanizer` skill before returning it — this is read directly by the orchestrating session/user, and chained em-dash justifications or padded hedging make it harder to follow than the reasoning actually is.
2. **Review — two subagents, two orthogonal lenses, neither sees the other's output or the Author Notes.** Each is spawned in its own fresh context: it receives the draft and the same `grounding_inputs` the author had, but NOT the author's reasoning or notes beyond `## Author Notes` itself. Stay in your lane — each reviewer flags only what its own lens below covers; don't duplicate the other's findings.

   If the environment allows choosing a model per subagent, run at least one reviewer on a different model family than the Author — this reduces self-preference bias more than fresh context alone. Not required if unavailable.
   - **Destructive Critic** (content and logic, checklist depends on `artifact`):
     - `proposal`/`specs`: does every claim trace back to something in discovery.md/proposal.md? Is anything asserted that the grounding inputs don't support? Is scope creeping beyond what was asked? Assume the author is overconfident — do not validate, look for what's missing or wrong.
     - `design`: this is a decision-quality review, not a traceability review — a Decision isn't right or wrong relative to a source document, it's right or wrong relative to whether the reasoning holds up. For each entry in Decisions, was a reasonable alternative dismissed without justification? For each entry in Risks/Trade-offs, is the stated mitigation actually sufficient, and is a plausible failure mode missing entirely? For that last question, run a premortem: assume this fails in production, work backwards to why.
   - **Structural Auditor** (format and traceability, checklist depends on `artifact`). Assume gaps exist until checked — finding nothing should be rare, not the default. Tag each finding ANCHORED (a concrete grep/regex/count backs the claim) or UNANCHORED (the call rests on interpreting intent, not the string itself) — format-shaped doesn't mean anchored:
     - `proposal`/`specs`: is every requirement testable (ANCHORED: measurable verb/unit/condition present)? Is every `#### Scenario` genuinely WHEN/THEN behavior, not an implementation detail (always UNANCHORED)? Does structure match the phase's format rules — hashtag counts, SHALL/MUST usage, one spec file per capability (ANCHORED)?
     - `design`: does every template section exist (ANCHORED)? Is an empty/N/A Migration Plan actually missing real deployment/rollback steps (UNANCHORED)? Does each Decision reference alternatives-considered rationale (ANCHORED: field present or not)? Does every Risk/Trade-off follow `[Risk] → Mitigation` (ANCHORED)?
   - Each reviewer's output format: `## Review Summary`, `## Required Changes` (each tagged ANCHORED with its grep/count, or UNANCHORED), `## Suggested Improvements` (optional, non-blocking), `## Risks and Open Questions`. All four sections MUST use the `humanizer` skill before returning them — same reasoning as the Author Notes rule above.
3. **Resolve.** The orchestrating session merges both reviewers' `Required Changes` (dedupe only same location + same complaint; keep both if the complaint differs; never adjudicate between reviewers by LLM judgment). Classify each merged finding:
   - **Auto-resolve** (fix directly, no user prompt) if either holds: (a) ANCHORED — re-run the grep/count yourself to confirm before fixing; (b) both reviewers independently raised the same finding (true duplicate) — two independent lenses agreeing substitutes for a single reviewer's self-declared "this is safe." Record what changed.
   - **Surface to the user** everything else, one at a time, recommended resolution first, apply only what they confirm or adjust. An UNANCHORED finding from only one reviewer never auto-resolves, no matter how mechanical it looks. This surfacing MUST follow the `plain-language-writing` skill's COMMS rules.
   - For `design`, keep the existing bias: default more to the user than `proposal`/`specs`, even ANCHORED ones bordering on scope — decision-quality judgment is measurably less reliable than traceability/structure checks.
   `Suggested Improvements` and `Risks and Open Questions` are surfaced but don't block.
4. **Finalize.** Once `Required Changes` are resolved, write the artifact from the (possibly adjusted) draft using the phase's template.

## Fallback

If a subagent cannot be spawned in the current environment, state that adversarial authoring could not be completed and ask the user whether to proceed with single-pass authoring instead. Do not silently skip either review step.
