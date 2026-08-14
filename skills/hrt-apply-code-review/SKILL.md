---
name: hrt-apply-code-review
description: Code-vs-artifacts review for OpenSpec's tempa-spec schema — checks implemented code against specs/**/*.md, design.md, and tasks.md once every task is complete. A loop of up to 3 passes, each run in a fresh subagent session with no memory of the implementer, HIGH/MEDIUM/LOW severity with MECHANICAL/DECISION resolution tagging, hard-gated on passing tests and lints. Use during the tempa-spec schema's `apply` Phase 2 review.
---

# hrt-apply-code-review

Review the implemented code against the specs in a loop of at most 3 passes, stopping early as soon as a pass finds no HIGH and no MEDIUM issues. Run each pass in a fresh agent session (subagent) with no memory of the implementer or prior passes — it sees only the artifacts on disk (specs/**/*.md, design.md, tasks.md, code, test results).

## Each pass

1. Re-read specs/**/*.md, design.md, tasks.md and the code produced; run the full test suite and any linters. This is the deterministic gate: any failing test or lint error is an automatic HIGH finding, independent of the subagent's own judgement.
2. Build a contract map: for each item below, list what you checked and what you found — BEFORE moving to classification.
   - Every requirement and every #### Scenario in specs is actually implemented AND exercised by a passing test.
   - The code honours the decisions in design.md; no undocumented deviation.
   - Every task is genuinely done, not just checkbox-ticked.
   - No scope drift: nothing built beyond the specs and the proposal.
   - Code quality against the smell baseline below — independent of spec compliance, a repo-documented standard (CONTRIBUTING.md, CODING_STANDARDS.md, etc., if present) always overrides it, and each smell is a judgement call, not a hard violation:
     - Mysterious Name: a name that doesn't reveal what it does or holds -> rename it.
     - Duplicated Code: same logic shape repeated -> extract and share it.
     - Feature Envy: a function reaching into another module's data more than its own -> move it there.
     - Data Clumps: the same fields/params keep travelling together -> bundle into one type.
     - Primitive Obsession: a primitive standing in for a domain concept -> give it its own type.
     - Repeated Switches: the same conditional on the same type recurs -> replace with polymorphism or a shared map.
     - Shotgun Surgery: one logical change forces scattered edits -> gather what changes together.
     - Divergent Change: one module edited for several unrelated reasons -> split by reason.
     - Speculative Generality: abstraction or hooks added for needs the spec doesn't have -> delete it.
     - Message Chains: long `a.b().c().d()` navigation -> hide behind one method.
     - Middle Man: a module that mostly just delegates onward -> cut it, call the real target directly.
     - Refused Bequest: a subclass/implementer ignoring most of what it inherits -> drop the inheritance, use composition.
3. Weak-oracle gate: for every test the contract map above credits as covering a requirement or scenario, ask "would this test still pass if the implementation under test were replaced with a stub, an emptied body, or a default return?" If yes, the oracle is tautological — it recomputes the implementation's own logic or mirrors current behaviour without an independent expected value. Rewrite it against an independent source of truth (a literal, a worked example, the spec's stated outcome) before counting the scenario as covered. This gate is mandatory whenever step 2 credits 5 or more tests, or any test for a specifically-described behaviour, as covering the contract map — not a discretionary smell judgement call.
4. STOP. Do not classify yet. Confirm the contract map above is complete — every requirement, scenario, task, and the weak-oracle gate — before proceeding.
5. Classify every finding in the map by severity:
   - HIGH: a requirement or scenario not implemented; a missing or failing test for a scenario; behaviour that contradicts a spec or a design decision; a task ticked but not actually done; a tautological oracle caught by the weak-oracle gate for a scenario the spec treats as critical.
   - MEDIUM: partial implementation; a scenario with weak or indirect test coverage; a design decision only partly honoured; duplication or a leaky interface worth fixing; a clear instance of a smell-baseline item above; a tautological oracle caught by the weak-oracle gate elsewhere.
   - LOW: naming, comments, formatting, minor cleanups; a borderline or minor smell-baseline judgement call.
6. Tag every classified finding MECHANICAL (exactly one correct fix, anchored in an explicit spec/design statement — e.g. a rename, formatting, an assertion missing for a spec-stated exact expected value) or DECISION (more than one valid resolution, touches scope or behaviour, or fits MECHANICAL's shape but the "one correct fix" isn't anchored in explicit spec/design text — e.g. a requirement implemented differently than specified, a deliberate design deviation, an "obvious" edge-case test or missing assertion whose expected value the spec doesn't literally state). Re-running tests afterward (step 8) confirms a MECHANICAL fix didn't break anything — it doesn't confirm the fix matched spec intent, so it's not a substitute for the anchor at classification time.
7. The review session reports findings to the orchestrating session (not a file), grouped under HIGH / MEDIUM / LOW, each tagged MECHANICAL or DECISION. The orchestrating session runs the `humanizer` skill on these findings before displaying them to the user on screen.
8. The orchestrating session resolves them, staying in red-green-refactor and re-running tests after each change:
   - MECHANICAL findings: fix the code or tests directly.
   - DECISION findings: do NOT change behaviour silently. Surface each to the user ONE at a time, your recommended resolution first (grounded in specs and design.md), and apply only what the user confirms or adjusts. This surfacing MUST follow the `plain-language-writing` skill's COMMS rules.
   - Either kind: if the fix's root cause isn't obvious from the finding description, or re-running tests after a fix surfaces a new or different failure, MUST use the `diagnosing-bugs` skill before attempting another fix - don't keep changing code on guesses.

Fixes from step 8 land before the next pass starts, so the next fresh session reviews the updated code.

## Loop exit

Stop when a pass finds no HIGH and no MEDIUM issues, or after the 3rd pass. The loop MUST NOT stop while the test suite or linters are failing, regardless of the subagent's HIGH/MEDIUM/LOW classification — a failing run is always a blocking HIGH. If any HIGH issue is still unresolved when the loop ends, STOP and mark the change as a RELEASE BLOCKER: report the remaining HIGH issues on screen and tell the user NOT to archive the change until they are resolved. Remaining MEDIUM and LOW issues are shown on screen as known issues. This report and blocker message MUST follow the `plain-language-writing` skill's COMMS rules.
