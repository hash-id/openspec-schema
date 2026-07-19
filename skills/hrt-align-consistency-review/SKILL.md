---
name: hrt-align-consistency-review
description: Cross-artifact consistency review for OpenSpec's hash schema — checks discovery.md, proposal.md, specs/**/*.md, design.md, and tasks.md are mutually consistent and faithful to the requirements, BEFORE any code is written. One cycle is an ALIGN pass (HIGH/MEDIUM/LOW severity, MECHANICAL/DECISION resolution tagging) followed by a human WALKTHROUGH; any walkthrough feedback re-enters ALIGN. Uncapped — exits only on a clean walkthrough round or explicit user sign-off. Use during the hash schema's `align` phase.
---

# hrt-align-consistency-review

Verify that every hash-schema artifact is mutually consistent and faithful to the requirements BEFORE any code is written, and that a human has actually read them — not just that an agent checked them against each other.

One cycle: **ALIGN** (this agent checks cross-artifact consistency) then **WALKTHROUGH** (the human reads every artifact chunk by chunk). Feedback from WALKTHROUGH re-enters ALIGN. Repeat until a WALKTHROUGH round raises nothing new, or the user explicitly signs off early (see "Ending the loop"). There is no cap on the number of cycles — each cycle's number is reported to the user as it starts, so length is visible, not hidden.

## ALIGN

1. Re-read all artifacts: discovery.md, proposal.md, specs/**/*.md, design.md, tasks.md. Also run `openspec validate --strict` for deterministic structural checks.
2. Build a consistency map: for each dimension below, list what you checked and what you found — BEFORE moving to classification.
   - discovery -> proposal: every Key Decision and Desired Outcome is honoured; the proposal never contradicts discovery.
   - proposal -> specs: every New/Modified Capability has a spec file; no spec covers a capability absent from the proposal.
   - proposal <-> design: design stays within proposal scope and introduces no capability the proposal omits.
   - specs <-> design: design explains how each requirement is met and contradicts none of them.
   - specs -> tasks: every requirement and scenario (including negative/edge-case scenarios) is covered by at least one task; no task is out of scope.
   - design -> tasks (when design.md exists and has a security pass): every `[Threat] → Mitigation` entry in Risks/Trade-offs has at least one corresponding negative-test task; a threat with no covering task is a HIGH finding under the existing severity rubric, same tier as "a requirement with no covering task."
   - spec structure: every requirement has at least one scenario, scenarios use exactly four hashtags (####) with WHEN/THEN, and requirements use SHALL/MUST.
   - design/tasks -> codebase: every concrete claim design.md or tasks.md makes about the existing system (a function, method, module, file, endpoint, schema, or config it says already exists or must be touched) is checked against the actual codebase, not assumed. Where a claim doesn't hold, surface the contradiction rather than silently trusting the artifact. Prefer, in order: codebase-memory-mcp (if available) > ripgrep (`rg`) > built-in grep/glob tools.
   - On cycle 2+: also fold in whatever the prior WALKTHROUGH round raised — treat each as its own item in the map, not a footnote.
3. STOP. Do not classify yet. Confirm the consistency map above is complete for all 7 dimensions (plus any carried-over walkthrough items) before proceeding.
4. Classify every finding in the map by severity:
   - HIGH: a contradiction between artifacts; a capability with no spec (or a spec with no capability); a requirement with no covering task; a structural error that breaks OpenSpec parsing; a Desired Outcome traceable to nothing; a design/tasks claim about the codebase (a referenced function, module, file, or API) that doesn't match reality.
   - MEDIUM: partial coverage; a vague or untestable requirement; a non-trivial technical choice with no design decision; tasks too coarse or mis-ordered; an edge case implied by discovery but left unscenarioed.
   - LOW: terminology drift, wording, formatting, ordering, or minor omissions.
5. Tag every classified finding MECHANICAL or DECISION:
   - MECHANICAL: exactly one correct fix, no scope or intent judgement (e.g. hashtag count, checkbox format, a kebab-case name mismatch, terminology unification, an obvious missing-scenario stub, task reordering).
   - DECISION: more than one valid resolution, or it touches scope or intent (e.g. a capability-vs-spec mismatch, a requirement-vs-task gap, a design-vs-spec contradiction, an uncovered outcome, a vague requirement needing a specific normative choice).
6. Show this cycle's findings grouped under HIGH / MEDIUM / LOW, each tagged MECHANICAL or DECISION.
7. Resolve them:
   - MECHANICAL findings: fix directly and record what changed.
   - DECISION findings (this includes every HIGH that isn't a MECHANICAL fix): do NOT edit silently, and do NOT exit the skill to report them either. Surface each to the user ONE at a time: state the tradeoff neutrally first (what conflicts, and the valid resolution options), THEN your recommended resolution (grounded in discovery.md as the source of intent) — recommendation second, not first, so the user weighs the tradeoff before seeing your answer. Get an actual resolution or an explicit, reasoned defer from the user for each one — do not move on with a HIGH unaddressed.
8. Append this cycle's ALIGN results to align.md: the findings (severity x mechanical/decision), the mechanical fixes applied, and the decisions the user made (including any explicit defer, with the user's stated reason).
9. Every HIGH issue needs one of two outcomes before ALIGN is done: fixed (mechanically or via the user's chosen resolution), or explicitly ruled out of scope by the user with a recorded reason — that counts as resolved, not deferred. A bare "let's deal with it later" is not enough; keep step 7's resolution conversation open on that item until it lands on one of these two outcomes. Only once every HIGH from this cycle's map has one of them, proceed to WALKTHROUGH.

## WALKTHROUGH

ALIGN verifies the artifacts are consistent with each other. It does not verify a human has read them — ALIGN can find nothing worth surfacing (no DECISION findings) while nobody but the agent ever looked at the content. Run WALKTHROUGH once ALIGN has no unresolved HIGH left (step 9), every cycle, including the first one, even when ALIGN found nothing at all.

Walk the user through the artifacts in build order: proposal.md -> specs/**/*.md -> design.md (if present) -> tasks.md. The chunking unit is always one whole file, no finer:

- **proposal.md**: one chunk, the whole file (there is exactly one).
- **specs/**/*.md**: one chunk per spec file — one walkthrough turn per capability's spec.md, not per requirement inside it.
- **design.md**: one chunk, the whole file (if present).
- **tasks.md**: one chunk, the whole file (there is normally exactly one tasks.md for the change).

One chunk at a time, front to back, in that build order:

1. Point the user at the specific chunk (name the file — don't just say "review the artifacts").
2. Ask what, if anything, needs fixing in that chunk — not a yes/no confirmation. An empty "nothing" answer is a valid outcome, but it must be given per chunk, not once for the whole set.
3. Record the answer in align.md's Walkthrough log verbatim, chunk by chunk, tagged with the cycle number, including "nothing" answers.

Do not infer a chunk was reviewed from silence, from the user answering a later chunk, or from the user saying "looks fine" about the whole set at once. Each chunk needs its own recorded answer.

## Ending the loop

After a WALKTHROUGH round completes (every chunk answered), decide:

- **Clean round**: every chunk's answer was "nothing." The loop ends. Proceed to apply.
- **Feedback raised**: one or more chunks raised something. Start a new cycle — take that feedback into the next ALIGN's consistency map (step 2), resolve it there (HIGH/MEDIUM/LOW, MECHANICAL/DECISION, same as any other finding), then run WALKTHROUGH again from the top of build order.
- **User signs off early**: the user may explicitly state the artifacts are ready and no further cycles are needed. This is only valid after at least one full WALKTHROUGH round has completed — it cannot substitute for the first walkthrough, only end the loop after one has actually happened. Record the sign-off (cycle number, user's statement) in align.md and stop.

Do NOT proceed to apply on any other basis — not on ALIGN alone, not on a partial walkthrough, not on silence.
