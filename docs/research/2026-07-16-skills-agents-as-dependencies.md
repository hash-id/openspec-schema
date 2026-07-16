# Research: skills/agents-as-dependencies pattern (`intent-driven-dev/openspec-schemas`)

**Date:** 2026-07-16
**Scope:** investigate `intent-driven-dev/openspec-schemas` (and sibling `intent-driven-dev/intent-driven-template`) for a pattern of declaring skills/agents as dependencies referenced from config, rather than inlining instruction text in `schema.yaml` as `hash` currently does. Triggered by user observing this pattern used with opencode (grill-me, gherkin-authoring, adversarial-authoring skills; adversarial-authoring using 2 subagents). Also scoped: whether tooling like `codebase-mcp`/`ripgrep` should become hard preconditions.
**Status:** research only, nothing applied. Discussion pending — this doc is input to that discussion, not a decision record.

## Contents

1. [Premise check — what's actually true](#1-premise-check--what-is-actually-true)
2. [grill-me — sourced externally via lockfile](#2-grill-me--sourced-externally-via-lockfile)
3. [adversarial-authoring — 2 subagents, confirmed](#3-adversarial-authoring--2-subagents-confirmed)
4. [opencode's native skill/subagent mechanism](#4-opencodes-native-skillsubagent-mechanism)
5. [Tooling-as-precondition — no blocker precedent found](#5-tooling-as-precondition--no-blocker-precedent-found)
6. [Claude Code native equivalent, and why it doesn't fully transfer here](#6-claude-code-native-equivalent-and-why-it-doesnt-fully-transfer-here)
7. [Sources (24)](#7-sources-24)
8. [Synthesis](#8-synthesis)
9. [Candidates for `hash` — action needed](#9-candidates-for-hash--action-needed)

---

## 1. Premise check — what is actually true

- `intent-driven-dev/openspec-schemas` = schema-packaging repo only (`schema.yaml` + templates). It does **not** contain the grill-me / gherkin-authoring / adversarial-authoring skill files. Those live in the sibling repo `intent-driven-dev/intent-driven-template` (the consumer-facing project template that bundles domain skills + the `intent-driven` schema).
- `openspec-schemas`'s `openspec/config.yaml` has a `rules:` map keyed by artifact id, values are **plain-English directives**, e.g.:
  ```yaml
  rules:
    proposal:
      - Must use grill-me skill
    design:
      - Must use c4-diagrams skill
    spec:
      - Must use gherkin-authoring skill
  ```
  This is the "reference by dependency" the user observed — but it is a natural-language rule string, not a structured `depends_on: [skill-id]` field with resolution logic. The calling agent is expected to interpret the rule and separately resolve "X skill" via its own skill-discovery mechanism.
- **`schema.yaml` itself still inlines full instruction text** for each artifact in both repos (confirmed by reading `openspec/schemas/intent-driven/schema.yaml` in full) — structurally identical in kind to `hash/schema.yaml`'s inlined instructions. The dependency reference lives in `config.yaml`'s `rules:`, layered *on top of* an otherwise-inlined `schema.yaml`, not a replacement for inlining.
- Tooling-as-blocker premise (ripgrep, codebase-mcp): **not found anywhere in either repo.** See §5.

## 2. grill-me — sourced externally via lockfile

`.agents/skills/grill-me/SKILL.md` in `intent-driven-template`, near-identical in spirit/wording to `hash`'s `discovery` artifact instruction. Not this project's own invention — sourced from **`mattpocock/skills`** (~74.5k GitHub stars) via a `skills-lock.json` lockfile:

```json
{
  "version": 1,
  "skills": {
    "grill-me": {
      "source": "mattpocock/skills",
      "sourceType": "github",
      "skillPath": "skills/productivity/grill-me/SKILL.md",
      "computedHash": "784f0dbb7403b0f00324bce9a112f715342777a0daee7bbb7385f9c6f0a170ea"
    }
  }
}
```

This is a genuine package-manager-style pattern: source repo + path + content hash, pinned and verifiable. Clearest real-world evidence found of "skill as external dependency with lockfile."

`gherkin-authoring` (`.agents/skills/gherkin-authoring/SKILL.md`) is a general-purpose Gherkin/Cucumber authoring skill (not OpenSpec-specific), structured body with frontmatter, workflow steps, syntax reference table, worked example.

## 3. adversarial-authoring — 2 subagents, confirmed

- `.opencode/skills/adversarial-authoring/SKILL.md` — orchestrating skill. Frontmatter: `compatibility: Requires opencode subagents named adversarial-author and adversarial-reviewer`. Explicit hard dependency on two named subagents existing in the environment; fails gracefully if not ("state that adversarial authoring could not be completed and ask whether to proceed with primary-agent authoring only").
- `.opencode/agent/adversarial-author.md` — `mode: subagent`, `model: opencode/big-pickle`, `permission: {edit: allow, bash: deny}`. Produces a draft only, no hidden reasoning, fixed output format (`## Draft` / `## Author Notes`).
- `.opencode/agent/adversarial-reviewer.md` — `mode: subagent`, `model: openai/gpt-5.5` — **deliberately a different model family from the author**, genuine cross-model adversarial review, not just fresh-context same-model. Fixed output format (`## Review Summary` / `## Required Changes` / `## Suggested Improvements` / `## Risks and Open Questions`).
- Skill also mandates writing a `*.council.md` audit-trail file alongside every artifact (Author Summary / Reviewer Challenges / Resolutions / Remaining Risks) — a documented, reusable "council notes" convention.

## 4. opencode's native skill/subagent mechanism

opencode has first-class, documented Skills and Subagents systems (confirmed via opencode.ai/docs):

- **Skill discovery**: walks up from cwd to git worktree root, project then global — `.opencode/skills/<name>/SKILL.md`, `.claude/skills/<name>/SKILL.md`, `.agents/skills/<name>/SKILL.md` (project), plus `~/.config/opencode/skills/`, `~/.claude/skills/`, `~/.agents/skills/` (global). opencode **natively reads Claude Code's `.claude/skills/` directory format** — cross-tool compatibility built in.
- **SKILL.md frontmatter**: `name` (required, kebab-case, must match dir name), `description` (required), optional `license`, `compatibility`, `metadata`.
- **Triggering**: agents call a native `skill` tool, e.g. `skill({ name: "grill-me" })`; name+description surfaced in the skill tool's own description for model selection.
- **Subagents**: markdown files under `.opencode/agent/` (or JSON in `opencode.json`), frontmatter `mode` (`primary`/`subagent`/`all`), `model`, `permission` (per-tool allow/ask/deny), `description`, `temperature`, `steps`. Auto-invoked by description-matching, or manually via `@subagent-name`.
- **Plugins**: `opencode.json` supports `"plugin": ["name@git+https://..."]` (confirmed in `intent-driven-template/opencode.json`, referencing `superpowers@git+https://github.com/obra/superpowers.git`), though official docs frame plugins primarily as npm-based hook subscribers, not a skill-sourcing mechanism per se.
- **The external-repo-with-lockfile sourcing pattern is NOT part of opencode's own docs** — separate ecosystem convention. Found a dedicated tool: `vercel-labs/skills` (`npx skills add <owner/repo>`, installs into `.claude/skills/`, `.cursor/skills/`, etc., own `skills-lock.json` pinning commit + content hash), plus registry `skills.sh` listing opencode as a supported target.

**Conclusion:** the individual skill (grill-me, gherkin-authoring) is a portable, tool-agnostic file format; the "install as versioned dependency" layer is a third-party convention (vercel-labs/skills and similar), not something opencode or Claude Code ship natively.

## 5. Tooling-as-precondition — no blocker precedent found

Searched both repos for `ripgrep`, `codebase-mcp`, general "required tool" language. **Found nothing.** The only hard precondition found anywhere in this repo family is in `openspec-schemas/AGENT_INSTALL.md`: an `openspec --version` check (≥1.0.0) — agent must stop and tell the user to install/upgrade if not met. Where MCP tooling *is* referenced (a since-archived "Linear MCP" schema variant, later replaced by a skill), the documented pattern is explicit **graceful degradation, not a hard blocker**: "Prefer Linear MCP tools when available... if Linear MCP is unavailable, updates are skipped silently and OpenSpec continues."

So the premise that this repo family treats codebase-mcp/ripgrep as hard preconditions does not hold up — no evidence found, and the one MCP dependency that does exist points the other way (soft/graceful).

## 6. Claude Code native equivalent, and why it doesn't fully transfer here

Claude Code has a direct native analog: Skills (`.claude/skills/<name>/SKILL.md`) and subagents-as-files (`.claude/agents/*.md`, `name`/`description`/`tools`/`model` frontmatter), bundleable into an installable plugin. Mechanically, `hash/schema.yaml` could say "invoke the grill-me skill" instead of inlining the interview prompt, *if* the consumer resolving that instruction is Claude Code itself.

**The catch:** `schema.yaml` here is consumed by the **OpenSpec CLI**, a third tool that reads `instruction:` as an opaque string handed to whichever agent is currently running (Claude Code, Codex, opencode). Cross-checked against the actual `Fission-AI/OpenSpec` repo tree (which does contain its own `.agents/skills/release-openspec/SKILL.md`): OpenSpec CLI has **no native mechanism today** for `schema.yaml`'s `instruction:` field to reference an external skill/subagent by id and have that resolve into an actual invocation. The CLI's own skill-generation machinery (`openspec init`/`openspec update` writing tool-specific command files) is one-directional (CLI → installs slash-commands into agent dirs), not a dependency resolver for schema instruction text.

So "reference a dependency" from inside `instruction:` would currently only work as **prose that happens to name a skill the calling agent might have independently installed** — exactly the `openspec-schemas` `rules:` pattern ("Must use grill-me skill"): a convention, not an enforced binding. Not resolvable/enforceable by the OpenSpec CLI itself; silently does nothing for any agent without a same-named skill installed. A weaker guarantee than the current fully-inlined, self-contained instructions.

One partial exception: the `apply` phase's Phase 2 REVIEW subagent-spawning is *orchestrated by the Claude session itself*, not the OpenSpec CLI — the CLI doesn't need to resolve anything there, the calling agent just decides to spawn a subagent when it reads the instruction. That part is more portable to a "subagents-as-files" formalization than the skill-reference idea is.

## 7. Sources (24)

| # | URL | Relevance | Verification |
|---|---|---|---|
| 1 | https://github.com/intent-driven-dev/openspec-schemas | Primary target — schema packaging, `config.yaml` rules pattern | Verified via `gh api` tree + raw fetch |
| 2 | https://github.com/intent-driven-dev/intent-driven-template | Where grill-me/gherkin-authoring/adversarial-authoring live; skills-lock.json; opencode.json | Verified via `gh api` tree + raw fetch of every file quoted |
| 3 | raw.githubusercontent.com/intent-driven-dev/intent-driven-template/main/.agents/skills/grill-me/SKILL.md | Full grill-me skill text | Verified, fetched directly |
| 4 | raw.githubusercontent.com/intent-driven-dev/intent-driven-template/main/.agents/skills/gherkin-authoring/SKILL.md | Full gherkin-authoring skill text | Verified, fetched directly |
| 5 | raw.githubusercontent.com/intent-driven-dev/intent-driven-template/main/.opencode/skills/adversarial-authoring/SKILL.md | Full adversarial-authoring skill, confirms 2-subagent orchestration | Verified, fetched directly |
| 6 | raw.githubusercontent.com/intent-driven-dev/intent-driven-template/main/.opencode/agent/adversarial-author.md | Author subagent def | Verified, fetched directly |
| 7 | raw.githubusercontent.com/intent-driven-dev/intent-driven-template/main/.opencode/agent/adversarial-reviewer.md | Reviewer subagent, different model family | Verified, fetched directly |
| 8 | raw.githubusercontent.com/intent-driven-dev/intent-driven-template/main/skills-lock.json | External skill dependency + content-hash lockfile | Verified, fetched directly |
| 9 | raw.githubusercontent.com/intent-driven-dev/intent-driven-template/main/openspec/config.yaml | `rules: { proposal: [Must use grill-me skill] }` pattern | Verified, fetched directly |
| 10 | raw.githubusercontent.com/intent-driven-dev/openspec-schemas/main/AGENT_INSTALL.md | Only hard precondition found (openspec CLI version check) | Verified, fetched directly |
| 11 | https://github.com/mattpocock/skills | Source repo for grill-me, ~74.5k stars | Search-result-derived |
| 12 | https://github.com/vercel-labs/skills | Competing "skill package manager" CLI, own lockfile format, opencode support | Search-result-derived |
| 13 | https://www.skills.sh/agent/opencode | Registry confirming opencode as supported skill-install target | Search-result-derived |
| 14 | https://opencode.ai/docs/agents/ | Official opencode agent/subagent docs | Fetched, primary source |
| 15 | https://opencode.ai/docs/skills/ | Official opencode skills docs — discovery paths, frontmatter | Fetched, primary source |
| 16 | https://opencode.ai/docs/plugins/ | Official opencode plugin docs | Fetched, primary source |
| 17 | https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills | Anthropic's Agent Skills announcement | Search-result-derived |
| 18 | https://code.claude.com/docs/en/skills | Official Claude Code Skills docs | Search-result-derived |
| 19 | https://github.com/anthropics/skills | Anthropic's public Agent Skills repo | Search-result-derived |
| 20 | https://code.claude.com/docs/en/sub-agents | Official Claude Code subagents docs | Search-result-derived, consistent across sources |
| 21 | simonwillison.net/2025/Oct/16/claude-skills/ | "Claude Skills are awesome, maybe a bigger deal than MCP" | Search-result-derived, URL located not refetched |
| 22 | news.ycombinator.com/item?id=45619537 | HN thread on Willison's Claude Skills post | Verified — title tag via curl |
| 23 | news.ycombinator.com/item?id=48289950 | HN: "Claude Code as a Daily Driver: Claude.md, Skills, Subagents, Plugins, and MCPs" | Verified — title tag via curl |
| 24 | https://claude.com/blog/skills-explained | Anthropic's Skills-vs-Subagents-vs-MCP-vs-Projects comparison | Fetched, primary; does NOT discuss dependency-referencing vs inlining |
| 25 | https://cursor.com/docs/rules | Cursor's `.cursor/rules/*.mdc` reusable-context system | Fetched, primary source |
| 26 | agenticoding.ai — "Reviewing Code" lesson 9 | Names "review in fresh context, separate from where code was written" explicitly | Search-result-derived |
| 27 | arxiv.org/abs/2411.00053 (ACC-Collab) | Academic name for actor-critic multi-agent LLM collaboration | Search-result-derived |
| 28 | Fission-AI/OpenSpec repo (deepwiki + `gh api` tree) | Confirms OpenSpec CLI's own skill-generation is one-directional; no dependency resolution for `instruction:` | deepwiki cross-checked against `gh api` tree (real `.agents/skills/release-openspec/SKILL.md`) |

**Not independently verifiable / excluded:** a second HN URL (id=45948490, "You don't need MCP. You need Claude Skills") returned an empty/non-parseable page on direct fetch — excluded, not confirmed. Reddit (r/ClaudeAI, r/LocalLLaMA, r/ChatGPTCoding): WebFetch to reddit.com blocked in the research environment, WebSearch returned no indexable results across several query variations — no verified Reddit URLs found. Flagged as a gap, not fabricated.

## 8. Synthesis

**(a) Genuinely emerging, but at different maturity levels per tool.** SKILL.md as a *file format* has real cross-tool traction — Anthropic open-sourced it, opencode natively reads Claude Code's `.claude/skills/` path, adoption signals reported in Codex, Cursor, Gemini CLI, Antigravity, Windsurf. That's genuine format convergence. What's *not* uniformly converged: the "reference by dependency from a higher-level config" layer. opencode's native `skill` tool call is a runtime lookup by name (dependency-by-id, natively supported); the `skills-lock.json` + external-repo-with-content-hash pattern is a **separate, third-party package-manager convention** layered on top, not shipped by either platform.

**(b) Not opencode-exclusive, but opencode's skill tool + subagent frontmatter make "reference, don't inline" cheaper there than most.** Claude Code has an equivalent-in-kind mechanism today (Skills + subagents-as-files, bundleable into plugins) — real, present-day, not hypothetical.

**(c) The adversarial author/reviewer-as-two-subagents pattern is real, with an adjacent academic name** (actor-critic multi-agent LLM collaboration, e.g. ACC-Collab) and a named practical principle ("review in fresh context to avoid self-defense/confirmation bias" — agenticoding.ai). No evidence of one widely-agreed *product* name for "adversarial-authoring packaged as a skill with exactly two named subagents" — appears to be `intent-driven-template`'s specific packaging choice, built on genuinely-named underlying research patterns rather than reuse of an established product term.

**On tooling-as-precondition:** the clear pattern across these repos is graceful degradation for MCP tooling (skip silently if unavailable) vs. hard blocking only for the core CLI itself (version check, stop-and-tell-user). No evidence either repo hard-blocks on ripgrep or a codebase-mcp server.

## 9. Candidates for `hash` — action needed

Not applied. Ordered by how much they survived scrutiny.

| # | Candidate | Constraint found | Status |
|---|---|---|---|
| 1 | Formalize `apply` Phase 2's fresh-subagent review loop as `.claude/agents/*.md` files, referenced by id from the orchestrating session (not from `schema.yaml`/OpenSpec CLI) | Portable — decision to spawn subagent is made by the Claude session reading the instruction, not by the CLI. No CLI-side resolution needed. | **Open — strongest signal, most portable** |
| 2 | Reference mattpocock/skills (grill-me, tdd, code-review) as declared dependencies instead of inlined text in `discovery`/`apply` instructions | OpenSpec CLI cannot resolve or enforce a skill-by-id reference inside `instruction:` today — would only work as prose hoping the calling agent has a same-named skill already installed. Weaker guarantee than current inlined text. | Open, but constrained — likely stays inlined, or dual-documented (inline + note "equivalent to mattpocock/skills grill-me if installed") |
| 3 | gherkin-authoring / adversarial-authoring as declared deps for `specs`/`align` | Same CLI-resolution constraint as #2 | Open, same constraint as #2 |
| 4 | ripgrep / codebase-mcp as hard precondition | No precedent found anywhere researched for hard-blocking on optional tooling; graceful-degrade is the consistent pattern | Leaning: setup guidance only, not a blocker |

See conversation for in-depth discussion building on this table.
