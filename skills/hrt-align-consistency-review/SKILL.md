---
name: hrt-align-consistency-review
description: Cross-artifact consistency review for OpenSpec's hash schema — checks discovery.md, proposal.md, specs/**/*.md, design.md, and tasks.md are mutually consistent and faithful to the requirements, BEFORE any code is written. A loop of up to 3 passes with HIGH/MEDIUM/LOW severity and MECHANICAL/DECISION resolution tagging. Use during the hash schema's `align` phase.
---

# hrt-align-consistency-review

Verify that every hash-schema artifact is mutually consistent and faithful to the requirements BEFORE any code is written. Run as a loop of at most 3 passes, stopping early as soon as a pass finds no HIGH and no MEDIUM issues.

## Each pass

1. Re-read all artifacts: discovery.md, proposal.md, specs/**/*.md, design.md, tasks.md. Also run `openspec validate --strict` for deterministic structural checks.
2. Build a consistency map: for each dimension below, list what you checked and what you found — BEFORE moving to classification.
   - discovery -> proposal: every Key Decision and Desired Outcome is honoured; the proposal never contradicts discovery.
   - proposal -> specs: every New/Modified Capability has a spec file; no spec covers a capability absent from the proposal.
   - proposal <-> design: design stays within proposal scope and introduces no capability the proposal omits.
   - specs <-> design: design explains how each requirement is met and contradicts none of them.
   - specs -> tasks: every requirement and scenario is covered by at least one task; no task is out of scope.
   - spec structure: every requirement has at least one scenario, scenarios use exactly four hashtags (####) with WHEN/THEN, and requirements use SHALL/MUST.
   - design/tasks -> codebase: every concrete claim design.md or tasks.md makes about the existing system (a function, method, module, file, endpoint, schema, or config it says already exists or must be touched) is checked against the actual codebase, not assumed. Where a claim doesn't hold, surface the contradiction rather than silently trusting the artifact. Prefer, in order: codebase-memory-mcp (if available) > ripgrep (`rg`) > built-in grep/glob tools.
3. STOP. Do not classify yet. Confirm the consistency map above is complete for all 7 dimensions before proceeding.
4. Classify every finding in the map by severity:
   - HIGH: a contradiction between artifacts; a capability with no spec (or a spec with no capability); a requirement with no covering task; a structural error that breaks OpenSpec parsing; a Desired Outcome traceable to nothing; a design/tasks claim about the codebase (a referenced function, module, file, or API) that doesn't match reality.
   - MEDIUM: partial coverage; a vague or untestable requirement; a non-trivial technical choice with no design decision; tasks too coarse or mis-ordered; an edge case implied by discovery but left unscenarioed.
   - LOW: terminology drift, wording, formatting, ordering, or minor omissions.
5. Tag every classified finding MECHANICAL or DECISION:
   - MECHANICAL: exactly one correct fix, no scope or intent judgement (e.g. hashtag count, checkbox format, a kebab-case name mismatch, terminology unification, an obvious missing-scenario stub, task reordering).
   - DECISION: more than one valid resolution, or it touches scope or intent (e.g. a capability-vs-spec mismatch, a requirement-vs-task gap, a design-vs-spec contradiction, an uncovered outcome, a vague requirement needing a specific normative choice).
6. Show this pass's findings grouped under HIGH / MEDIUM / LOW, each tagged MECHANICAL or DECISION.
7. Resolve them:
   - MECHANICAL findings: fix directly and record what changed.
   - DECISION findings: do NOT edit silently. Surface them to the user ONE at a time, your recommended resolution first (grounded in discovery.md as the source of intent), and apply only what the user confirms or adjusts.
8. Append this pass to align.md: the findings (severity x mechanical/decision), the mechanical fixes applied, and the decisions the user made.

## Loop exit

Stop when a pass finds no HIGH and no MEDIUM issues, or after the 3rd pass. If any HIGH issue remains unresolved when the loop ends (e.g. the user deferred a decision), STOP — do NOT proceed to apply — and report the remaining HIGH issues to the user. Remaining MEDIUM and LOW issues are logged in align.md as known issues and do not block.
