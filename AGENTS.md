# AGENTS.md

Guide for coding agents working in this repo.

See [README.md](README.md) for what this repo is and the file layout. Nothing here runs as an app — it's consumed by the OpenSpec CLI in downstream repos.

## Editing schema.yaml

Everything lives in `artifacts[]` (`id`, `generates`, `template`, `instruction`, `requires`) plus a top-level `apply` block. Each `instruction` is a prompt an agent runs at that phase, so treat wording changes as prompt engineering, not prose cleanup.

`requires` is the dependency graph that gates phase order — keep it accurate. If an instruction references a template section, update `templates/<id>.md` to match.

Several instructions are thin pointers to skills instead of inlined prompt text — `discovery`→`grill-me`, `align`→`hrt-align-consistency-review`, `apply` Phase 1→`tdd`, `apply` Phase 2→`hrt-apply-code-review`, `proposal`/`specs`→`hrt-adversarial-authoring`, plus conditional pointers from `design`/`specs` to the security skills (`stride-analysis-patterns`, `threat-mitigation-mapping`, `security-requirement-extraction`). The three `hrt-*` skills are this repo's own, at `skills/<name>/SKILL.md`, self-contained and independent of any one schema. The rest are external (`mattpocock/skills`, `wshobson/agents`), provisioned by the installer — see `docs/research/2026-07-16-skills-as-dependencies-plan.md` for why each was inlined, split, or referenced externally.

`grill-me` itself is a thin pointer *inside* `mattpocock/skills`, not just in our schema — its `SKILL.md` just says "run a `/grilling` session," and `grilling` is a separate skill in that same repo (`skills/productivity/grilling/`). The installer must fetch both (`--skill grill-me grilling tdd`) or discovery breaks at runtime with `/grilling` unresolved. If a future `npx skills add` call references any other thin-pointer skill, check its `SKILL.md` for a same-repo target it delegates to before assuming the one name is enough.

## Skills

Local skills live at `skills/<name>/SKILL.md` (repo root, not under `openspec/schemas/hash/`) so other schemas here (`spec-driven`) can reuse them. Frontmatter is just `name` + `description` (the format `vercel-labs/skills` and Claude Code both expect) — no repo-specific extensions.

## Templates

Markdown skeletons, not filled-in examples. Keep placeholders as HTML comments, e.g. `<!-- Task description -->`.

## Installer

No flags, on purpose (see README). Don't add any unless asked.

It clones `master` into a temp dir, copies only `schema.yaml` and `templates/*`, then provisions skills via `npx skills add` (external: `mattpocock/skills`, `wshobson/agents`; local: this repo's own `skills/`), then rewrites the `schema:` line in `./openspec/config.yaml`. It never `cp -r`s the whole clone for the schema.yaml/templates step — keep it that way; the `npx skills add` calls do their own independent clone and aren't part of that invariant. A failed skill install stops the installer (same as a failed schema clone) — skills aren't optional for a schema whose instructions point at them. Test it in a scratch dir, since it writes to `./openspec/` (and `.agents/skills/`) relative to wherever it's run.

Two copies, kept in lockstep: `install-schema.sh` (bash) and `install-schema.ps1` (PowerShell). Same steps, same order, same messages, no flags on either. Any change to one — new skill, new step, new error message — must be mirrored in the other.

## Validating changes

No test suite here. Check by hand: valid YAML, `requires` graph with no cycles or missing ids, every `template:` file actually present. If the schema is installed in an OpenSpec-managed repo, `openspec validate --strict` there is the real test of whether an instruction change broke anything downstream.
