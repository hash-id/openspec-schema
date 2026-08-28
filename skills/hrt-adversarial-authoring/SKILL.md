---
name: hrt-adversarial-authoring
description: Author-then-adversarial-review authoring pass for a single OpenSpec artifact — a subagent drafts it, `hrt-artifact-lint` clears the deterministic structure checks, then two subagents review it concurrently in fresh isolated contexts (a Destructive Critic for content/logic, a Structural Auditor for the structural judgement calls a linter cannot make), findings resolved before finalizing. Parameterized by artifact (proposal, specs, or design). Use during the tempa-spec schema's `proposal`, `specs`, and `design` phases.
---

# hrt-adversarial-authoring

Cross-context adversarial authoring: one subagent drafts, two further subagents — each with no memory of the author's reasoning, only the inputs they were given — challenge the draft from two orthogonal angles before it's accepted.

This skill is shared by three callers. The calling instruction MUST state which artifact is being authored — that choice fixes the draft content, both review checklists, and the resolution target below. Nothing else about the process changes between callers.

## Parameters (set by the caller)

- **`artifact`**: `proposal`, `specs`, or `design`.
- **`content_sections`**: the sections the draft subagent must produce.
  - `proposal`: Why, What Changes, Capabilities (New/Modified), External Dependencies, Impact.
  - `specs`: one spec file per capability listed in the proposal's Capabilities section — `### Requirement` blocks with `#### Scenario` WHEN/THEN content, per the `specs` phase's format rules.
  - `design`: Context, Goals/Non-Goals, Decisions, Shape / Seams (when the change adds callable code), Risks/Trade-offs, Migration Plan, Open Questions, per the `design` phase's format rules.
- **`grounding_inputs`**: the artifacts the draft subagent may read.
  - `proposal`: discovery.md, existing specs in `openspec/specs/` (for capability naming).
  - `specs`: discovery.md, proposal.md.
  - `design`: discovery.md, proposal.md, specs/**/*.md.

## Process

1. **Draft.** Spawn a subagent with only `grounding_inputs` and `content_sections` for the given `artifact`. It produces a draft only — no self-review, no hedging placeholders. Prose MUST follow the `plain-language-writing` skill's ARTIFACT rules while writing, not as a pass applied afterward. Output format: `## Draft` (the artifact content) followed by `## Author Notes` (open questions or assumptions the author flagged while writing).
2. **Lint.** The orchestrating session runs the `hrt-artifact-lint` skill and fixes every ERROR directly (deterministic, one correct fix each), so the reviewers spend no attention on grep/count structure. WARN lines go to the reviewers as context.
3. **Review — two subagents, two orthogonal lenses, spawned concurrently, neither sees the other's output or the Author Notes.** Each gets the post-lint draft and the same `grounding_inputs` the author had, but NOT the author's reasoning beyond `## Author Notes`. Stay in your lane; don't duplicate the other's findings or re-report anything the lint covers.

   If the environment allows choosing a model per subagent, run at least one reviewer on a different model family than the Author — this reduces self-preference bias more than fresh context alone. Not required if unavailable.
   - **Destructive Critic** (content and logic, checklist depends on `artifact`). Each finding names one concrete fact that would overturn it if true — a finding with none is not ready to report.
     - `proposal`/`specs`: does every claim trace back to something in discovery.md/proposal.md? Is anything asserted that the grounding inputs don't support? Is scope creeping beyond what was asked? Assume the author is overconfident — do not validate, look for what's missing or wrong. For `proposal`: every external-system claim feasibility depends on needs a verified, sourced row in the External Dependencies table — an unverified or missing row is a finding.
     - `design`: this is a decision-quality review, not a traceability review — a Decision isn't right or wrong relative to a source document, it's right or wrong relative to whether the reasoning holds up. For each entry in Decisions, was a reasonable alternative dismissed without justification? For each entry in Risks/Trade-offs, is the stated mitigation actually sufficient, and is a plausible failure mode missing entirely? For that last question, run a premortem: assume this fails in production, work backwards to why. For each seam in Shape / Seams: is this the right boundary to test at, or did the design overlook a better-established one? Would testing here couple tests to an implementation detail?
   - **Structural Auditor** (the structural judgement calls the linter cannot make — it does NOT re-check hashtag counts, checkbox format, section presence, or `Covers:` existence; the lint in step 2 owns those). Assume gaps exist until checked — finding nothing should be rare. Every Auditor finding here is UNANCHORED (it rests on interpreting intent):
     - `proposal`/`specs`: is every requirement genuinely testable — a measurable verb, unit, or condition, not just present but meaningful? Is every `#### Scenario` genuinely WHEN/THEN behavior, not an implementation detail dressed as one? Is a MODIFIED requirement carrying its full updated content, or has detail been dropped?
     - `design`: is an empty or N/A Migration Plan genuinely non-applicable, or is it hiding real deployment/rollback steps? Does each Decision's alternatives-considered rationale actually reason, or is it a placeholder? Is a "no new code surface" skip-line genuinely codeless? Does each seam signature describe a real boundary, or an invented one?
   - Each reviewer's output format: `## Review Summary`, `## Required Changes` (each tagged ANCHORED with its grep/count, or UNANCHORED — Auditor findings are all UNANCHORED), `## Suggested Improvements` (optional, non-blocking), `## Risks and Open Questions`.
4. **Resolve.** The orchestrating session merges both reviewers' `Required Changes` (dedupe only same location + same complaint; never adjudicate between reviewers by LLM judgment), then runs the `humanizer` skill once over everything shown to the user (merged findings, Author Notes, both reviewers' non-blocking sections) — one pass, not per-section. Classify each merged finding:
   - **Auto-resolve** (fix directly, no user prompt) if either holds: (a) ANCHORED — re-run the grep/count yourself to confirm before fixing; (b) both reviewers independently raised the same finding (true duplicate) — two independent lenses agreeing substitutes for a single reviewer's self-declared "this is safe." Record what changed.
   - **Surface to the user** everything else, one at a time, recommended resolution first, apply only what they confirm or adjust. An UNANCHORED finding from only one reviewer never auto-resolves, no matter how mechanical it looks. This surfacing MUST follow the `plain-language-writing` skill's COMMS rules.
   - For `design`, keep the existing bias: default more to the user than `proposal`/`specs`, even ANCHORED ones bordering on scope — decision-quality judgment is measurably less reliable than the lint's deterministic checks. The Destructive Critic's seam-boundary-quality check is UNANCHORED and surfaces to the user.
   `Suggested Improvements` and `Risks and Open Questions` are surfaced but don't block.
5. **Finalize.** Once `Required Changes` are resolved, write the artifact from the (possibly adjusted) draft using the phase's template.

If `dark.md` exists, the caller applies the `hrt-dark-mode-routing` skill to any finding that would otherwise surface to the user in step 4.

## Fallback

If a subagent cannot be spawned, state that adversarial authoring could not be completed and ask the user whether to proceed with single-pass authoring. Do not silently skip a review step. If `hrt-artifact-lint` cannot run, its checks fall back to the Structural Auditor by hand — say so, do not skip them.
