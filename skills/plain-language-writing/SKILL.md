---
name: plain-language-writing
description: "Two writing rule sets for readers who may not read English fluently: COMMS for live agent-to-user text (interview questions, confirmations, blockers), ARTIFACT for persistent artifact prose (discovery.md, proposal.md, specs, design.md). A caller states which set applies. Evidence backing is in docs/research/2026-08-07-plain-language-non-native-readers.md."
---

# plain-language-writing

Two independent rule sets. A caller states which one applies — COMMS for text read once, live, in the moment; ARTIFACT for prose in a persistent file that gets re-read and reviewed. Don't cross-apply them; they're tuned for different reading conditions.

These rules operationalize standards with credible backing (ISO 24495-1, Kimble's plain-language work, EARS, INCOSE's Guide for Writing Requirements) but aren't each individually proven — treat them as the best currently-evidenced approach, not a guaranteed fix. See the research doc above for what's well-supported (the pronoun rule, COMMS #4 / ARTIFACT #3) versus reasonable-but-unproven. COMMS #5 (structure) has no empirical backing at all — an earlier version of it (A5) was dropped from the research for lack of evidence; it's kept here only as a stylistic default, not a proven rule.

## COMMS — live agent-to-user text

Interview questions, confirmation/recap prompts, status updates, walkthrough questions, blocker/pause/stop messages.

1. **Sentence length.** Roughly 20 words or fewer. Split anything longer.
2. **One clause per sentence.** No "and/but/which" joining two distinct ideas.
3. **No idioms, metaphors, or humor.** Say it literally (not "let's dive in," "heads up," "ballpark").
4. **No ambiguous pronoun.** When a sentence introduces two things of similar weight, don't refer back with "it/this/that" — name the one you mean. Doesn't require eliminating every pronoun, only where more than one referent is plausible.
5. **Causal/multi-step explanations use labeled structure, not a dense paragraph.** When explaining a root cause or a multi-step process (why something failed, what happens as a result), break it into short ALL-CAPS section labels plus numbered steps or IF/THEN for branching logic. Doesn't apply to short interview questions or one-line status updates — those stay as plain sentences; forcing structure onto them reads as stilted.

   Shape to follow:

   ```
   PROBLEM.
   <one or more sentences naming what's wrong>

   WHY THIS HAPPENS.
   <mechanism, as numbered steps if there's a sequence>
   1. ...
   2. ...

   THE ROOT CAUSE.
   IF <condition> THEN <result>.
   IF <other condition> THEN <other result>.

   CONCLUSION.
   <one sentence confirming or correcting the user's read>

   NEXT STEP.
   <what happens next, or what's still open>
   ```

## ARTIFACT — persistent artifact prose

Free-running prose in discovery.md, proposal.md, specs/\*.md, design.md, tasks.md, align.md. Never overrides the structural formats those artifacts already mandate (`### Requirement` / `#### Scenario` blocks, WHEN/THEN, checkbox syntax, delta-operation headers, SHALL/MUST usage).

1. **No vague or escape-clause words.** Avoid "adequate," "reasonable," "as appropriate," "where possible," "etc." State a measurable criterion or an explicit list instead.
2. **One obligation or decision per sentence.** Don't join two requirements or decisions with "and/or."
3. **No ambiguous pronoun.** Same condition as COMMS #4.
4. **Normative keywords stay in requirement blocks.** SHALL/MUST/SHOULD in ALL CAPS only inside an actual `### Requirement` statement — never capitalized in narrative prose (discovery.md, design.md rationale).
5. **One term per concept.** Reuse the same name across discovery.md, proposal.md, specs/\*.md, design.md, and tasks.md — don't drift between synonyms (e.g. "user" / "actor" / "consumer").
