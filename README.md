# openspec-schema

<p align="center">
  <strong>tempa-spec</strong> — a custom <a href="https://github.com/Fission-AI/OpenSpec">OpenSpec</a> schema for teams who don't take an agent's word that a phase is done.
</p>

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg">
  <img alt="Schema version" src="https://img.shields.io/badge/schema-v8-blue.svg">
  <img alt="Requires" src="https://img.shields.io/badge/requires-OpenSpec_%2B_git_%2B_Node.js-lightgrey.svg">
</p>

---

## About `tempa-spec`

*Tempa* — Indonesian for forging: heating, hammering, folding, repeated until the metal holds. A blade forged this way develops *pamor*, a pattern that only appears when the process was done right — it cannot be shortcut. This schema treats specs the same way.

The default OpenSpec pipeline (`proposal -> specs -> design -> tasks -> apply`) takes the agent's self-report at face value: it produces an artifact, checks a box, moves on. `tempa-spec` doesn't. It adds a relentless interview before anything gets proposed, a human-gated consistency pass before implementation starts, and a strict TDD-plus-review discipline before a task counts as done — three places where the default schema just trusts and `tempa-spec` makes the agent show its work.

```
discovery -> proposal -> { specs, design } -> tasks -> align -> apply (TDD + review)
```

---

## Pipeline

| Phase              | Produces                 | What it does                                                                                                         |
| ------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **`discovery`** ✨ | `discovery.md`           | Relentless interview before any proposal exists — reasoning log of decisions, rejected alternatives, open questions. |
| `proposal`         | `proposal.md`            | Why + what + affected capabilities. Adversarially reviewed.                                                          |
| `specs`            | `specs/**/*.md`          | Testable WHEN/THEN scenarios, one file per capability. Adversarially reviewed.                                       |
| `design`           | `design.md`              | How to implement — decisions, trade-offs, migration. Created only when warranted.                                    |
| `tasks`            | `tasks.md`               | Checkbox list traced back to spec scenarios and design risks.                                                        |
| **`align`** ✨     | `align.md`               | Automated checks + human walkthrough, uncapped, until a round is clean or the human signs off. Runs before `apply`.  |
| `apply`            | code (tracks `tasks.md`) | Strict TDD, one task at a time, then a separate spec-vs-code review (up to 3 passes, findings to screen).            |

✨ = no equivalent in the default OpenSpec schema.

## Install (local, into the current repo)

Installs `tempa-spec` into `./openspec/schemas/tempa-spec`, provisions the skills its instructions point to (via `npx skills add`), and sets it as the repo's default schema (`openspec/config.yaml`):

```bash
curl -fsSL https://raw.githubusercontent.com/hash-id/openspec-schema/master/scripts/install-schema.sh | bash
```

Or from a clone:

```bash
./scripts/install-schema.sh
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/hash-id/openspec-schema/master/scripts/install-schema.ps1 | iex
```

Or from a clone:

```powershell
./scripts/install-schema.ps1
```

No parameters. Local only (no global/user dir). Re-run to update.

## Use

```bash
openspec new change <name>          # uses tempa-spec as default
openspec instructions discovery --change <name>
openspec instructions align   --change <name>
openspec instructions apply   --change <name>
```

## Layout

```
openspec/schemas/tempa-spec/schema.yaml   workflow definition (artifacts, deps, apply)
openspec/schemas/tempa-spec/templates/    artifact templates
skills/                             local hrt-* skills referenced from schema.yaml
scripts/install-schema.sh           local installer (no params, bash)
scripts/install-schema.ps1          local installer (no params, PowerShell)
```

Editing the schema itself (not just using it)? See [AGENTS.md](AGENTS.md).
