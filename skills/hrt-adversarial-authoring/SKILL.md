---
name: hrt-adversarial-authoring
description: Author-then-adversarial-review authoring pass for a single OpenSpec artifact — a subagent drafts the artifact, a second subagent reviews it in a fresh context with no visibility into the author's reasoning, findings are resolved before the artifact is finalized. Parameterized by which artifact is being authored (proposal or specs). Use during the hash schema's `proposal` and `specs` phases.
---

# hrt-adversarial-authoring

Cross-context adversarial authoring: one subagent drafts, a second subagent — with no memory of the first subagent's reasoning, only the inputs it was given — challenges the draft before it's accepted. Same isolation principle as `hrt-apply-code-review`'s fresh-session review ("no memory of the implementer"), applied one phase earlier, at authoring time instead of after the fact.

This skill is shared by two callers. The calling instruction MUST state which artifact is being authored — that choice fixes the draft content, the review checklist, and the resolution target below. Nothing else about the process changes between callers.

## Parameters (set by the caller)

- **`artifact`**: `proposal` or `specs`.
- **`content_sections`**: the sections the draft subagent must produce.
  - `proposal`: Why, What Changes, Capabilities (New/Modified), Impact.
  - `specs`: one spec file per capability listed in the proposal's Capabilities section — `### Requirement` blocks with `#### Scenario` WHEN/THEN content, per the `specs` phase's format rules.
- **`grounding_inputs`**: the artifacts the draft subagent may read.
  - `proposal`: discovery.md, existing specs in `openspec/specs/` (for capability naming).
  - `specs`: discovery.md, proposal.md.

## Process

1. **Draft.** Spawn a subagent with only `grounding_inputs` and `content_sections` for the given `artifact`. It produces a draft only — no self-review, no hedging placeholders. Output format: `## Draft` (the artifact content) followed by `## Author Notes` (open questions or assumptions the author flagged while writing).
2. **Review.** Spawn a second subagent in a fresh context: it receives the draft and the same `grounding_inputs` the author had, but NOT the author's reasoning or notes beyond `## Author Notes` itself. It challenges the draft against the grounding inputs — does every claim trace back to something in discovery.md/proposal.md? Is anything asserted that the grounding inputs don't support? Is scope creeping beyond what was asked? For `specs`, additionally: is every requirement testable, is every scenario genuinely WHEN/THEN behavior and not an implementation detail? Output format: `## Review Summary`, `## Required Changes` (findings that must be addressed before the artifact is finalized), `## Suggested Improvements` (optional, non-blocking), `## Risks and Open Questions`.
3. **Resolve.** The orchestrating session shows `Required Changes` to the user, one at a time if there's more than one — same resolution discipline as `hrt-align-consistency-review`'s DECISION findings: recommended resolution first, apply only what the user confirms or adjusts. `Suggested Improvements` and `Risks and Open Questions` are surfaced but don't block.
4. **Finalize.** Once `Required Changes` are resolved, write the artifact from the (possibly adjusted) draft using the phase's template.

## Fallback

If a subagent cannot be spawned in the current environment, state that adversarial authoring could not be completed and ask the user whether to proceed with single-pass authoring instead. Do not silently skip the review step.
