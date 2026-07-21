---
name: hrt-align-consistency-review
description: Cross-artifact consistency review for OpenSpec's hash schema — checks discovery.md, proposal.md, specs/**/*.md, design.md, and tasks.md are mutually consistent and faithful to the requirements, BEFORE any code is written. One cycle is an ALIGN pass (HIGH/MEDIUM/LOW severity, MECHANICAL/DECISION resolution tagging), a fresh-context VERIFY pass that re-checks ALIGN's own findings and fixes, then a human WALKTHROUGH — one generic question per round covering the full artifact list; any walkthrough feedback re-enters ALIGN. Uncapped — exits only on a clean walkthrough round or explicit user sign-off. Use during the hash schema's `align` phase.
---

# hrt-align-consistency-review

Verify that every hash-schema artifact is mutually consistent and faithful to the requirements BEFORE any code is written, and that a human has actually read them — not just that an agent checked them against each other.

One cycle: **ALIGN** (this agent checks cross-artifact consistency) then **VERIFY** (a fresh-context subagent re-checks ALIGN's own map and fixes, catching what one session's blind spots might miss) then **WALKTHROUGH** (the human is shown the full artifact list and asked once whether anything needs to change). Feedback from WALKTHROUGH re-enters ALIGN. Repeat until a WALKTHROUGH round raises nothing new, or the user explicitly signs off early (see "Ending the loop"). There is no cap on the number of cycles — each cycle's number is reported to the user as it starts, so length is visible, not hidden.

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
9. Every HIGH issue needs one of two outcomes before ALIGN is done: fixed (mechanically or via the user's chosen resolution), or explicitly ruled out of scope by the user with a recorded reason — that counts as resolved, not deferred. A bare "let's deal with it later" is not enough; keep step 7's resolution conversation open on that item until it lands on one of these two outcomes. Only once every HIGH from this cycle's map has one of them, proceed to VERIFY.

## VERIFY

Steps 1-9 run in the orchestrating session, which classifies its own findings and applies its own MECHANICAL fixes — nothing independent checks that work before it reaches the user. Close that gap with one fresh-context pass, not a second dual-lens review: adversarial authoring (used by `proposal`/`specs`/`design`) earns its two independent lenses because there's no ground truth yet to check a new draft against; ALIGN already has one — the artifacts checking each other — so a single independent re-check is enough.

1. Spawn a subagent with no memory of the ALIGN pass above: it receives only the artifacts as they now stand (post-fix) and this skill's ALIGN step 2 checklist. It does NOT receive the consistency map, findings, or resolutions step 1-8 produced.
2. It re-derives its own consistency map against the same 7 dimensions (plus carried-over walkthrough items, if any) and reports back: any HIGH it finds that ALIGN's map missed, and any MECHANICAL fix ALIGN applied that it can verify is actually correct (fix matches what the artifact now needs) vs. still wrong or incomplete.
3. If VERIFY finds nothing new: proceed to WALKTHROUGH.
4. If VERIFY finds a HIGH ALIGN missed, or a MECHANICAL fix that didn't actually resolve the finding: fold it into this cycle's map (append to align.md same as any ALIGN finding), resolve it via step 7's rules (MECHANICAL fixed directly, DECISION surfaced to the user), then proceed to WALKTHROUGH — do not re-run VERIFY again within the same cycle; a second miss is caught by the next cycle's VERIFY if WALKTHROUGH reopens one.
5. If a subagent cannot be spawned in the current environment: state that VERIFY could not run and ask the user whether to proceed to WALKTHROUGH without it. Do not silently skip this step.

## WALKTHROUGH

ALIGN and VERIFY verify the artifacts are consistent with each other. Neither verifies a human has read them — both can find nothing worth surfacing while nobody but an agent ever looked at the content. Run WALKTHROUGH once VERIFY is done, every cycle, including the first one, even when ALIGN and VERIFY found nothing at all.

One round, one question:

1. List every artifact in build order — proposal.md, specs/**/*.md (one line per capability), design.md (if present), tasks.md — so the user sees exactly what exists to read before answering.
2. Ask a single generic question covering the whole list: whether there's anything across these files the user wants changed — not a yes/no confirmation. An empty "nothing" answer is a valid outcome.
3. Record the round in align.md's Walkthrough log: the file list shown, tagged with the cycle number, and the user's answer verbatim (including a "nothing" answer).

Do not infer the round was completed from silence, or from the user answering some other question in the conversation. The round needs its own recorded answer covering the full file list.

## Ending the loop

After a WALKTHROUGH round completes (the round's question answered), decide:

- **Clean round**: the answer was "nothing." The loop ends. Proceed to apply.
- **Feedback raised**: the answer raised something. Start a new cycle — take that feedback into the next ALIGN's consistency map (step 2), resolve it there (HIGH/MEDIUM/LOW, MECHANICAL/DECISION, same as any other finding), then run WALKTHROUGH again with a fresh round.
- **User signs off early**: the user may explicitly state the artifacts are ready and no further cycles are needed. This is only valid after at least one full WALKTHROUGH round has completed — it cannot substitute for the first walkthrough, only end the loop after one has actually happened. Record the sign-off (cycle number, user's statement) in align.md and stop.

Do NOT proceed to apply on any other basis — not on ALIGN alone, not on a partial walkthrough, not on silence.
