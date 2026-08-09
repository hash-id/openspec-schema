# Vertical Slicing, `to-tickets`, and the `tasks` Artifact

**Status:** Researched and independently verified. Recommendation ready to implement.
**Question:** Should Matt Pocock's [`to-tickets` skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/to-tickets/SKILL.md) — the vertical-slicing task-breakdown technique Dexter Horthy's essay names Pocock as co-originating — be adopted for this repo's `tasks` artifact in `openspec/schemas/tempa-spec/schema.yaml`?
**Answer:** Don't point to the skill directly. Adapt two of its ideas into the existing `tasks` instruction, applied at the `##` heading level (not the checkbox level).

---

## TL;DR

| | |
|---|---|
| **Is `to-tickets` real vertical slicing, or just adjacent?** | The real thing — Horthy names Pocock directly as co-originating the framing |
| **Can we point to it as a skill (like `discovery`→`grilling`)?** | No — `disable-model-invocation: true`, and its ticket size doesn't match our checkbox size |
| **Verdict** | Import 2 ideas as prose, applied to `##` headings (a *heading* = a vertical slice; a *checkbox* stays a TDD cycle) |
| **Bonus finding** | The schema's own current example ("1. Setup" → "2. Core Implementation") is a textbook horizontal slice — needs rewriting either way |

---

## 1. What `to-tickets` actually does

Source: [`to-tickets` SKILL.md](https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/to-tickets/SKILL.md), verified verbatim via direct fetch.

Five-step algorithm:

1. **Gather context** from the conversation or a referenced spec.
2. **Explore the codebase** (optional) for vocabulary/ADRs, and look for **prefactoring**: *"Make the change easy, then make the easy change."*
3. **Draft vertical slices**, per the skill's own rules (verified verbatim):
   > "Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests) — vertical, NOT a horizontal slice of one layer
   > A completed slice is demoable or verifiable on its own
   > Each slice is sized to fit in a single fresh context window"

   Each ticket declares **blocking edges** — the other tickets it depends on. A **wide-refactor exception** exists for mechanical, blast-radius changes (renaming something with thousands of call sites): abandon verticality, use expand → migrate → contract instead.
4. **Quiz the user** — mandatory human checkpoint before publishing, iterating on granularity and dependencies.
5. **Publish** — one file or tracker issue per ticket.

Sizing floor, explicit in the skill: *"if the entire change fits within one context window, use `/implement` directly rather than `/to-tickets`."* This is reserved for work too big for one shot.

**`disable-model-invocation: true`** is set in the frontmatter — same dead-end pattern this repo already solved once for `grill-me` (see `CLAUDE.md`). An agent can never reach `to-tickets` implicitly; any schema instruction using it would have to name it directly.

**Companion article** ([aihero.dev/skills-to-tickets](https://www.aihero.dev/skills-to-tickets), verified verbatim via direct fetch): cites a real, named failure case — *"One team ran a 26-ticket stack sliced by layer... and got roughly twenty agent runs per closed ticket, about three quarters of them rework. Their own post-mortem traced every failure class back to the horizontal slicing."* Diagnostic test: *"what can I demo when this is done? A ticket with no answer is a horizontal slice."*

## 2. Is this the real technique, or an adjacent one wearing the name?

The real thing. Horthy's essay names Pocock directly:

> "Next we love doing what I call 'vertical slices' - Matt Pocock and I had a chat about vertical slices or 'tracer bullets' on a live stream back in January 2026"

**But there's a layering subtlety that matters a lot for the recommendation.** Pocock's own skill set uses "vertical slice" at *two different altitudes*:

- **`to-tickets`**: a vertical slice = one ticket, spanning every layer, sized to a context window.
- **`tdd` skill**: a vertical slice = one **red-green cycle** inside a single ticket's implementation. Quote: *"Work in vertical slices instead — one test → one implementation → repeat, each test a tracer bullet."*

So Pocock doesn't use one flat definition — verticality recurses: a ticket is a vertical slice of the *feature*, a TDD cycle is a vertical slice of the *ticket*. Two different skills, two different planning altitudes. This is the key that resolves the compatibility question below.

## 3. Where it doesn't fit as-is

Four real friction points against pointing straight at `to-tickets` as a skill:

1. **Output-format mismatch**: `to-tickets` publishes one file/issue per ticket via a tracker setup skill; this schema's `tasks` artifact is a single `tasks.md` file mechanically parsed by `apply` for checkboxes.
2. **`disable-model-invocation: true`** blocks implicit use, as above.
3. **Mandatory quiz step**: `to-tickets` has a hard human checkpoint mid-drafting; this schema's equivalent gate is `align`, which runs *after* `tasks` is drafted, not during — importing the quiz step would add a second, differently-timed checkpoint.
4. **Granularity, initially thought to be a harder blocker than it is** — see below.

### The granularity question — corrected after verification

The first draft of this research claimed `apply`'s Phase 1 pins "one checkbox = one full TDD red-green-refactor cycle," and used that as the main reason `to-tickets`' bigger ticket-sized unit can't be imported wholesale. **An independent audit checked the actual schema text and found this overstated.** The real wording (`apply` Phase 1) is:

> "For each pending checkbox task, follow the skill's loop, then tick the checkbox to [x] and move to the next task."

This runs the TDD process *per checkbox* — it doesn't cap a checkbox at exactly one cycle. The `tdd` skill it points to is explicitly iterative ("one test → one implementation → **repeat**"). A checkbox like "implement data export function" can legitimately take several small red-green cycles without breaking anything currently written.

So the granularity mismatch doesn't block anything — but it doesn't disappear either, it **relocates**. `tasks.md` already has two structural levels: `##` headings and `- [ ]` checkboxes underneath them. That maps directly onto Pocock's own two-altitude split from §2: heading = ticket-level verticality (`to-tickets`), checkbox = cycle-level verticality (`tdd`). Once you see it this way, the fix is obvious: apply the demoability test **to headings**, leave checkboxes exactly as they are. No change to `apply` needed at all.

## 4. A bonus finding: the schema already has a horizontal-slicing example

While verifying the above, an independent check of `schema.yaml`'s own worked example under the `tasks` instruction found this:

```
## 1. Setup
- [ ] 1.1 Create new module structure
- [ ] 1.2 Add dependencies to package.json

## 2. Core Implementation
- [ ] 2.1 Implement data export function
- [ ] 2.2 Add CSV formatting utilities
```

By Horthy's own definition of horizontal slicing (*"doing things in stack-order: 1. Database Migrations 2. Service Layer 3. API 4. Frontend"*), "Setup" → "Core Implementation" is the same genre of split — procedural staging, not "what can you demo when this heading is done." Setup alone produces nothing demoable. This is a live instance of the exact problem this research is diagnosing, sitting inside the instruction under review — so the fix below rewrites it, not just adds a rule alongside it.

## 5. Alternatives considered (for completeness)

| Approach | What it actually is | Verdict |
|---|---|---|
| Tracer bullets (Hunt & Thomas) | Origin concept: a thin, kept (not throwaway) slice through every layer, used to validate architecture | Same idea as `to-tickets`, less formalized |
| Shape Up "Integrate one slice" | Pick the core/demoable slice first, avoid "everything half-done" | Product-planning cousin, not a task-sizing method |
| Walking skeleton | One-time bootstrap: thinnest deployable/testable path, done once at project start | Different use case (project bootstrap, not recurring task breakdown) |
| Vertical Slice **Architecture** (Bogard) | Where code *lives* in the repo (feature-scoped modules) | Different axis entirely — codebase organization, not task planning. Complementary, not competing. |
| Anthropic "2026 Agentic Coding Trends" | Discusses "task decomposition" | At a strategic/multi-agent-orchestration level, not operational ticket-sizing — doesn't change this analysis |

None of these beat `to-tickets`' own diagnostic test for this schema's specific need. No controlled study was found proving vertical slicing outperforms horizontal at the outcome level — the evidence is one well-documented case study (§1, now verified) plus indirect support from context-rot research (agent quality measurably drops past ~100K tokens, which argues for small units generally, not specifically vertical ones).

## 6. Proposed change to `schema.yaml`

Two edits to the `tasks` artifact's `instruction` block.

**File:** `openspec/schemas/tempa-spec/schema.yaml`, `tasks` artifact instruction (currently lines 144–172)

### Edit A — add the verticality test and sharpen dependency ordering, in Guidelines

**Before** (lines 150–154):
```
Guidelines:
- Group related tasks under ## numbered headings
- Each task MUST be a checkbox: `- [ ] X.Y Task description`
- Tasks should be small enough to complete in one session
- Order tasks by dependency (what must be done first?)
```

**After:**
```
Guidelines:
- Group related tasks under ## numbered headings
- Each heading MUST group tasks that together produce one demoable or verifiable slice - ask what can you demo or verify when everything under this heading is done? A heading with no answer is a horizontal slice (e.g. grouped by architectural layer instead of by behavior) - regroup around behavior instead
- Each task MUST be a checkbox: `- [ ] X.Y Task description`
- Tasks should be small enough to complete in one session
- Order tasks by dependency (what must be done first?)
- Note blocking relationships explicitly where non-obvious (e.g. "blocked by 1.2")
```

Six bullets, one rule-unit each. The verticality test and its failure-mode check stay together in one bullet (rule + how-to-verify-it-yourself is one coherent instruction, splitting it further would strand the test from the thing it's testing) — everything else split to one bullet apiece, including separating dependency-ordering from the blocking-notation convention, which were previously bundled. Applies `to-tickets`' demoability test at the heading level only — checkbox-level granularity (and `apply`'s TDD loop underneath it) is untouched, per §3's resolution.

### Edit B — rewrite the example so it's no longer self-contradicting

**Before** (lines 158–169):
```
Example:
​```
## 1. Setup

- [ ] 1.1 Create new module structure
- [ ] 1.2 Add dependencies to package.json

## 2. Core Implementation

- [ ] 2.1 Implement data export function
- [ ] 2.2 Add CSV formatting utilities
​```
```

**After:**
```
Example:
​```
## 1. Export CSV for a single table

- [ ] 1.1 Create export module and CSV formatting utility
- [ ] 1.2 Wire export command to a single hardcoded table

## 2. Export CSV with filters applied

- [ ] 2.1 Add filter parameter parsing
- [ ] 2.2 Apply filters before formatting output
​```
```

Each heading now names something demoable (a working export, then a working filtered export) instead of an architectural stage (setup, then core implementation) — consistent with Edit A's new rule.

**Rejected:** pointing directly at `to-tickets` as a skill (per §3, output-format and checkpoint-timing mismatches), and importing its mandatory quiz step or tracker-publishing mechanics (this schema's `align` phase already serves as the equivalent-but-differently-timed checkpoint).

---

## Sources

**Primary**
1. [`to-tickets` SKILL.md](https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/to-tickets/SKILL.md) — fetched verbatim, re-verified
2. [aihero.dev — Skills to Tickets](https://www.aihero.dev/skills-to-tickets) — fetched verbatim via direct `curl`, re-verified (statistic confirmed accurate)
3. [Why Software Factories Fail (wsff.md)](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md) — fetched verbatim
4. [`to-spec` SKILL.md](https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/to-spec/SKILL.md) — fetched verbatim
5. [`implement` SKILL.md](https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/implement/SKILL.md) — fetched verbatim
6. [`tdd` SKILL.md](https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/tdd/SKILL.md) — fetched verbatim
7. [`wayfinder` SKILL.md](https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/wayfinder/SKILL.md) — fetched verbatim
8. [`improve-codebase-architecture` SKILL.md](https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/improve-codebase-architecture/SKILL.md) — fetched verbatim
9. [mattpocock/skills engineering README.md](https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/README.md) — fetched verbatim

**Broader landscape**
10. [Basecamp Shape Up, ch. 11 — "Integrate one slice"](https://basecamp.com/shapeup/3.2-chapter-11#integrate-one-slice)
11. [aihero.dev — Tracer Bullets: Keeping AI Slop Under Control](https://www.aihero.dev/tracer-bullets)
12. [Jeremy D. Miller — The Codebase Is the Prompt](https://jeremydmiller.com/2026/06/04/the-codebase-is-the-prompt-wolverine-vertical-slices-and-ai-assisted-development/)
13. [Sean Weldon — Full Walkthrough: Workflow for AI Coding – Matt Pocock](https://www.sean-weldon.com/blog/2026-04-27-workflow-for-ai-coding-matt-pocock)
14. Tracer bullets origin (search synthesis): [artima.com](https://www.artima.com/articles/tracer-bullets-and-prototypes), [builtin.com](https://builtin.com/software-engineering-perspectives/what-are-tracer-bullets), [barbarianmeetscoding.com](https://www.barbarianmeetscoding.com/notes/books/pragmatic-programmer/tracer-bullets/)
15. Walking skeleton (search synthesis): [mattblodgett.com](https://www.mattblodgett.com/2020/09/start-with-walking-skeleton.html), [O'Reilly 97 Things](https://www.oreilly.com/library/view/97-things-every/9780596800611/ch60.html), [codurance.com](https://www.codurance.com/publications/2015/08/26/my-first-walking-skeleton)
16. Vertical Slice Architecture (search synthesis): [milanjovanovic.tech](https://milanjovanovic.tech/blog/vertical-slice-architecture), [architecture-weekly.com](https://www.architecture-weekly.com/p/my-thoughts-on-vertical-slices-cqrs)
17. Feature-Driven Development (search synthesis): [Wikipedia](https://en.wikipedia.org/wiki/Feature-driven_development), [agilemodeling.com](https://agilemodeling.com/essays/fdd.htm)
18. Context rot / task-sizing evidence: [redis.io/blog/context-rot](https://redis.io/blog/context-rot/), [alphaXiv paper](https://www.alphaxiv.org/abs/2606.29718v1)
19. AI-agent task decomposition landscape: [apxml.com](https://apxml.com/courses/agentic-llm-memory-architectures/chapter-4-complex-planning-tool-integration/task-decomposition-strategies), [sourcegraph.com/blog/agentic-coding](https://sourcegraph.com/blog/agentic-coding)
20. Anthropic, "2026 Agentic Coding Trends Report" — resources.anthropic.com (found during verification pass, discusses task decomposition at a strategic/orchestration level, not operational sizing)

**Repo files referenced** (context only): `openspec/schemas/tempa-spec/schema.yaml`, `CLAUDE.md`

---

## Verification notes

An independent agent audited this report after the first draft: re-fetched `to-tickets` SKILL.md and the aihero.dev article directly (not through summarization), and re-read `schema.yaml`'s `apply` block directly.

- **Confirmed accurate**: every primary-source quote, including the "20 runs/75% rework" statistic that the first draft had flagged as unverified — now confirmed verbatim from a direct fetch.
- **Corrected**: the "one checkbox = one TDD cycle" claim (§3) was an overstatement of the actual schema text. This in turn resolved what the first draft had left as an open either/or question — the fix (§3, §6 Edit A) applies verticality at the heading level and leaves checkbox-level TDD granularity untouched, rather than picking one size for the whole `tasks.md` structure.
- **Found during verification, not the original pass**: the schema's own worked example is itself a horizontal slice by its own new rule (§4) — folded into Edit B rather than left as a separate observation.
- **Checked, no change needed**: searched specifically for Anthropic/OpenAI/Vercel material on task decomposition; found one Anthropic source (added to sources above) but at a different level of concern than this report addresses, so it doesn't change the recommendation.
