---
name: hrt-apply-code-review
description: Code-vs-artifacts review for OpenSpec's hash schema — checks implemented code against specs/**/*.md, design.md, and tasks.md once every task is complete. A loop of up to 3 passes, each run in a fresh subagent session with no memory of the implementer, HIGH/MEDIUM/LOW severity with MECHANICAL/DECISION resolution tagging, hard-gated on passing tests and lints. Use during the hash schema's `apply` Phase 2 review.
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
3. STOP. Do not classify yet. Confirm the contract map above is complete — every requirement, scenario, task, and smell-baseline item checked — before proceeding.
4. Classify every finding in the map by severity:
   - HIGH: a requirement or scenario not implemented; a missing or failing test for a scenario; behaviour that contradicts a spec or a design decision; a task ticked but not actually done.
   - MEDIUM: partial implementation; a scenario with weak or indirect test coverage; a design decision only partly honoured; duplication or a leaky interface worth fixing; a clear instance of a smell-baseline item above.
   - LOW: naming, comments, formatting, minor cleanups; a borderline or minor smell-baseline judgement call.
5. Tag every classified finding MECHANICAL (exactly one correct fix — e.g. a missing assertion, an obvious edge-case test, a rename, formatting) or DECISION (more than one valid resolution, or it touches scope or behaviour — e.g. a requirement implemented differently than specified, a deliberate design deviation, a scenario whose intent is ambiguous).
6. The review session reports findings to the orchestrating session (not a file), grouped under HIGH / MEDIUM / LOW, each tagged MECHANICAL or DECISION. The orchestrating session then displays them to the user on screen.
7. The orchestrating session resolves them, staying in red-green-refactor and re-running tests after each change:
   - MECHANICAL findings: fix the code or tests directly.
   - DECISION findings: do NOT change behaviour silently. Surface each to the user ONE at a time, your recommended resolution first (grounded in specs and design.md), and apply only what the user confirms or adjusts.

Fixes from step 7 land before the next pass starts, so the next fresh session reviews the updated code.

## Loop exit

Stop when a pass finds no HIGH and no MEDIUM issues, or after the 3rd pass. The loop MUST NOT stop while the test suite or linters are failing, regardless of the subagent's HIGH/MEDIUM/LOW classification — a failing run is always a blocking HIGH. If any HIGH issue is still unresolved when the loop ends, STOP and mark the change as a RELEASE BLOCKER: report the remaining HIGH issues on screen and tell the user NOT to archive the change until they are resolved. Remaining MEDIUM and LOW issues are shown on screen as known issues.
