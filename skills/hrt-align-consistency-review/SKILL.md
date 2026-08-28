---
name: hrt-align-consistency-review
description: Cross-artifact consistency review for OpenSpec's tempa-spec schema — checks discovery.md, proposal.md, specs/**/*.md, design.md, and tasks.md are mutually consistent and faithful to the requirements, BEFORE any code is written. One cycle is an ALIGN pass (deterministic structure via `hrt-artifact-lint`, then HIGH/MEDIUM/LOW severity with MECHANICAL/DECISION tagging), a fresh-context VERIFY pass (skipped when ALIGN and the lint were both clean), then a human WALKTHROUGH; walkthrough feedback re-enters ALIGN. Exits on a clean walkthrough round or user sign-off; after 3 cycles it asks whether to keep going. Use during the tempa-spec schema's `align` phase.
---

# hrt-align-consistency-review

Verify that every tempa-spec artifact is mutually consistent and faithful to the requirements BEFORE any code is written, and that a human has actually read them — not just that an agent checked them against each other.

One cycle: **ALIGN** (this agent checks cross-artifact consistency) then **VERIFY** (a fresh-context subagent re-checks ALIGN's own map and fixes — skipped only when this cycle's ALIGN raised no HIGH or MEDIUM and the lint was clean) then **WALKTHROUGH** (the human is shown the full artifact list and asked once whether anything needs to change). Feedback from WALKTHROUGH re-enters ALIGN. Repeat until a WALKTHROUGH round raises nothing new, or the user signs off early (see "Ending the loop"). Each cycle's number is reported as it starts. After the third cycle that doesn't end the loop, ask the user whether to continue or sign off — do not stop on your own.

## ALIGN

1. Re-read all artifacts: discovery.md, proposal.md, specs/**/*.md, design.md, tasks.md. Run `openspec validate --strict` and the `hrt-artifact-lint` skill — fix every lint ERROR directly, record each as a MECHANICAL finding, and note whether the lint ran clean (VERIFY's skip condition depends on it). `design.md` is mandatory — its absence is a HIGH finding.
2. Build a consistency map: for each dimension below, list what you checked and what you found — BEFORE moving to classification.
   - discovery -> proposal: every Key Decision and Desired Outcome is honoured; the proposal never contradicts discovery. LLM judgment only.
   - proposal -> specs: every New/Modified Capability has a spec file; no spec covers a capability absent from the proposal. The lint in step 1 already checked the existence half (capability name -> `specs/<name>/spec.md`) - here, judge only whether the spec's content actually matches the capability the proposal described.
   - proposal <-> design: design stays within proposal scope and introduces no capability the proposal omits. LLM judgment only.
   - specs <-> design: design explains how each requirement is met and contradicts none of them. LLM judgment only.
   - specs -> tasks: every requirement and scenario (including negative/edge-case scenarios) is covered by at least one task; no task is out of scope. Grep tasks.md for a reference to each requirement/scenario first - zero mentions is a fact; judge adequacy of coverage only after that.
   - design -> tasks (when design.md has a security pass): every `[Threat] → Mitigation` entry in Risks/Trade-offs has at least one corresponding negative-test task. Grep tasks.md for each `[Threat] →` entry first - zero mentions is a HIGH finding, same as an uncovered requirement.
   - specs <-> seams: every `#### Scenario` in `specs/**` has a seam in `design.md`'s Shape / Seams section its tests could attach to. The lint in step 1 already checked that each seam's `Covers:` target names a real requirement/scenario - here, judge only the forward direction (does each scenario have a seam its tests could attach to) and whether the attachment actually fits. Skip only when `design.md`'s Shape / Seams section is the one-line "no new code surface" note (pure config/data change).
   - spec structure: the lint in step 1 covers this fully (scenario/requirement hashtag counts, WHEN/THEN presence, one-scenario-per-requirement, SHALL/MUST). Nothing to add here unless the lint could not run - then check it by hand.
   - design/tasks -> codebase: every concrete claim design.md or tasks.md makes about the existing system (a function, method, module, file, endpoint, schema, or config it says already exists or must be touched) is checked against the actual codebase, not assumed. MUST use a tool (codegraph > codebase-memory-mcp > ripgrep) for existence; judge only whether the artifact's characterization of that code is accurate.
   - On cycle 2+: also fold in whatever the prior WALKTHROUGH round raised — treat each as its own item in the map, not a footnote.
3. Rule for all dimensions above: mechanize only the existence/reference/structural half (does X exist, is X referenced, is the format right), never the semantic half (does X actually fulfill the intent). A keyword match is not a substitute for that judgment.
4. STOP. Do not classify yet. Confirm the consistency map above is complete for all 8 dimensions (plus any carried-over walkthrough items) before proceeding.
5. Classify every finding in the map by severity:
   - HIGH: a contradiction between artifacts; a capability with no spec (or a spec with no capability); a requirement with no covering task; a structural error that breaks OpenSpec parsing; a Desired Outcome traceable to nothing; a design/tasks claim about the codebase (a referenced function, module, file, or API) that doesn't match reality.
   - MEDIUM: partial coverage; a vague or untestable requirement; a non-trivial technical choice with no design decision; tasks too coarse or mis-ordered; an edge case implied by discovery but left unscenarioed; a scenario with no seam it could attach to, or a seam naming a "Covers:" target that isn't in the specs.
   - LOW: terminology drift, wording, formatting, ordering, or minor omissions.
6. Tag every classified finding MECHANICAL or DECISION:
   - MECHANICAL: exactly one correct fix, no scope or intent judgement, AND a deterministic anchor — a grep/regex/count you can re-run to confirm before fixing (e.g. hashtag count, checkbox format, a kebab-case name mismatch, task reordering). "Obviously mechanical" isn't enough without that re-runnable check — a finding that fits the shape but has no anchor (e.g. "terminology unification" — deciding two terms mean the same thing; an "obvious" missing-scenario call) is DECISION instead.
   - DECISION: more than one valid resolution, it touches scope or intent, or it fits MECHANICAL's shape but has no anchor (e.g. a capability-vs-spec mismatch, a requirement-vs-task gap, a design-vs-spec contradiction, an uncovered outcome, a vague requirement needing a specific normative choice — plus the unanchored cases above).
7. Show this cycle's findings grouped under HIGH / MEDIUM / LOW, each tagged MECHANICAL or DECISION. Run the `humanizer` skill on this output before showing it — findings read by the user should state the problem plainly, not in chained-justification prose.
8. Resolve them:
   - MECHANICAL findings: fix directly and record what changed.
   - DECISION findings (this includes every HIGH that isn't a MECHANICAL fix): do NOT edit silently, and do NOT exit the skill to report them either. Surface each to the user ONE at a time: state the tradeoff neutrally first (what conflicts, and the valid resolution options), THEN your recommended resolution (grounded in discovery.md as the source of intent) — recommendation second, not first, so the user weighs the tradeoff before seeing your answer. This surfacing MUST follow the `plain-language-writing` skill's COMMS rules. Get an actual resolution or an explicit, reasoned defer from the user for each one — do not move on with a HIGH unaddressed.
9. Append this cycle's ALIGN results to align.md: the findings (severity x mechanical/decision), the mechanical fixes applied, and the decisions the user made (including any explicit defer, with the user's stated reason). Give every recorded decision and resolved HIGH a source pointer — document and section (e.g. "discovery.md > Key Decisions"); `apply` reads align.md first and follows these to the exact passage. This prose MUST follow the `plain-language-writing` skill's ARTIFACT rules.
10. Every HIGH issue needs one of two outcomes before ALIGN is done: fixed (mechanically or via the user's chosen resolution), or explicitly ruled out of scope by the user with a recorded reason — that counts as resolved, not deferred. A bare "let's deal with it later" is not enough; keep step 8's resolution conversation open on that item until it lands on one of these two outcomes. Only once every HIGH from this cycle's map has one of them, proceed to VERIFY.

## VERIFY

ALIGN classifies its own findings and applies its own MECHANICAL fixes with nothing independent checking that work. VERIFY closes that gap with one fresh-context re-check.

**Skip condition.** If this cycle's ALIGN raised no HIGH and no MEDIUM AND the lint was clean, skip VERIFY (nothing for a fresh context to re-check) and record the skip in align.md. Any HIGH, MEDIUM, or lint ERROR means VERIFY runs.

1. Spawn a subagent with no memory of the ALIGN pass above: it receives only the artifacts as they now stand (post-fix) and this skill's ALIGN step 2 checklist. It does NOT receive the consistency map, findings, or resolutions ALIGN produced.
2. It re-derives its own consistency map against the same 8 dimensions (plus carried-over walkthrough items, if any) and reports back: any HIGH it finds that ALIGN's map missed, and any MECHANICAL fix ALIGN applied that it can verify is actually correct (fix matches what the artifact now needs) vs. still wrong or incomplete.
3. If VERIFY finds nothing new: proceed to WALKTHROUGH.
4. If VERIFY finds a HIGH ALIGN missed, or a MECHANICAL fix that didn't actually resolve the finding: fold it into this cycle's map (append to align.md same as any ALIGN finding), resolve it via ALIGN step 8's rules (MECHANICAL fixed directly, DECISION surfaced to the user), then proceed to WALKTHROUGH — do not re-run VERIFY again within the same cycle; a second miss is caught by the next cycle's VERIFY if WALKTHROUGH reopens one.
5. If a subagent cannot be spawned in the current environment: state that VERIFY could not run and ask the user whether to proceed to WALKTHROUGH without it. Do not silently skip this step.

## WALKTHROUGH

ALIGN and VERIFY verify the artifacts are consistent with each other. Neither verifies a human has read them — both can find nothing worth surfacing while nobody but an agent ever looked at the content. Run WALKTHROUGH once VERIFY is done, every cycle, including the first one, even when ALIGN and VERIFY found nothing at all.

One round, one question:

1. List every artifact in build order — proposal.md, specs/**/*.md (one line per capability), design.md, tasks.md — so the user sees exactly what exists to read before answering.
2. Ask a single generic question covering the whole list: whether there's anything across these files the user wants changed — not a yes/no confirmation. An empty "nothing" answer is a valid outcome. This question MUST follow the `plain-language-writing` skill's COMMS rules.
3. Record the round in align.md's Walkthrough log: the file list shown, tagged with the cycle number, and the user's answer verbatim (including a "nothing" answer).

Do not infer the round was completed from silence, or from the user answering some other question in the conversation. The round needs its own recorded answer covering the full file list.

## Ending the loop

After a WALKTHROUGH round completes (the round's question answered), decide:

- **Clean round**: the answer was "nothing." The loop ends. Proceed to apply.
- **Feedback raised**: the answer raised something. Start a new cycle — take that feedback into the next ALIGN's consistency map (step 2), resolve it there (HIGH/MEDIUM/LOW, MECHANICAL/DECISION, same as any other finding), then run WALKTHROUGH again with a fresh round.
- **User signs off early**: the user may explicitly state the artifacts are ready and no further cycles are needed. This is only valid after at least one full WALKTHROUGH round has completed — it cannot substitute for the first walkthrough, only end the loop after one has actually happened. Record the sign-off (cycle number, user's statement) in align.md and stop.
- **Three cycles reached**: after the third cycle completes without the loop ending, ask the user whether to continue or sign off (a WALKTHROUGH sign-off is still valid here). Record their answer. This is a checkpoint, not a cap — the loop continues if they want it to.

Do NOT proceed to apply on any other basis — not on ALIGN alone, not on a partial walkthrough, not on silence.
