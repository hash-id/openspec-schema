# tempa-spec

<p align="center">
  <strong>tempa-spec</strong> — a custom <a href="https://github.com/Fission-AI/OpenSpec">OpenSpec</a> schema for teams who don't take an agent's word that a phase is done.
</p>

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg">
  <img alt="Schema version" src="https://img.shields.io/badge/schema-v15-blue.svg">
  <img alt="Requires" src="https://img.shields.io/badge/requires-OpenSpec_%2B_git_%2B_Node.js-lightgrey.svg">
</p>

---

## About `tempa-spec`

*Tempa* — Indonesian for forging: heating, hammering, folding, repeated until the metal holds. A blade forged this way develops *pamor*, a pattern that only appears when the process was done right — it cannot be shortcut. This schema treats specs the same way.

The default OpenSpec pipeline (`proposal -> specs -> design -> tasks -> apply`) takes the agent's self-report at face value: it produces an artifact, checks a box, moves on. `tempa-spec` doesn't. It adds a capped interview before anything gets proposed, a human-gated consistency pass before implementation starts, and a strict TDD-plus-review discipline before a task counts as done — three places where the default schema just trusts and `tempa-spec` makes the agent show its work.

```
proposal -> { specs, design } -> tasks -> align -> apply (TDD + review)
```

---

## Pipeline

| Phase              | Produces                 | What it does                                                                                                         |
| ------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `proposal`         | `proposal.md`            | A short interview (4 questions a round, 4 rounds at most), then why + what + affected capabilities. Checked by the lint and your read-and-confirm. |
| `specs`            | `specs/**/*.md`          | Testable WHEN/THEN scenarios, one file per capability. Adversarially reviewed.                                       |
| `design`           | `design.md`              | How to implement — decisions, seams, trade-offs, migration. Adversarially reviewed.                                  |
| `tasks`            | `tasks.md`               | Checkbox groups, each naming the scenarios it delivers (`Covers:`); the lint checks every scenario and threat is covered. |
| **`align`** ✨     | `align.md`               | Automated checks + a human walkthrough led by specs and design, until a round is clean or the human signs off. Runs before `apply`. |
| `apply`            | code (tracks `tasks.md`) | Strict TDD, one task at a time, then a separate spec-vs-code review (up to 3 passes, findings to screen).            |

✨ = no equivalent in the default OpenSpec schema.

## Install (local, into the current repo)

Installs `tempa-spec` into `./openspec/schemas/tempa-spec`, provisions the skills its instructions point to (one `npx skills add` for this repo's `skills/` — both the local `hrt-*` skills and the vendored external ones), and sets it as the repo's default schema (`openspec/config.yaml`):

```bash
curl -fsSL https://raw.githubusercontent.com/hash-id/openspec-schema/master/scripts/install-schema.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/hash-id/openspec-schema/master/scripts/install-schema.ps1 | iex
```

Defaults to the latest git tag (stable release). Pass a tag/ref to pin a specific version:

```bash
curl -fsSL https://raw.githubusercontent.com/hash-id/openspec-schema/master/scripts/install-schema.sh | bash -s -- 2026.7.6
```

```powershell
$s = irm https://raw.githubusercontent.com/hash-id/openspec-schema/master/scripts/install-schema.ps1; & ([scriptblock]::Create($s)) 2026.7.6
```

Local only (no global/user dir). Re-run to update.

## Use

```bash
openspec new change <name>          # uses tempa-spec as default
openspec instructions proposal --change <name>
openspec instructions align   --change <name>
openspec instructions apply   --change <name>
```

**Security.** `specs` and `design` run a short plan-time security pass (`hrt-security-pass`) only when a change touches a trust boundary, using the OWASP Top 10 list that matches what the change touches (web, API, mobile, LLM, agent, machine identities) plus the MITRE CWE Top 25. `apply` reuses the same lists on the changed code. Changes to money, stock, quantity, limits, or multi-step state flows also get a list of business-flow abuse questions (`business-flow.md`). `apply` runs whatever security commands your repo already has (scripts, pre-commit, CI, scanner configs), scoped to the diff. Adding or upgrading a third-party package also fires the pass, with questions on dependency confusion, typosquatting, install scripts, and the lockfile diff (OWASP CICD-SEC-3). `apply`'s review also runs a bundled floor guard over the diff, which flags new suppression comments (`# nosec`, `@ts-ignore`, ...), added skips, deleted tests, fewer assertions, and stubs, so a check is never silenced to get to green without you deciding. `tempa-spec` installs no scanner, but it requires one: [opengrep](https://github.com/opengrep/opengrep). Whenever a change touches Python or JavaScript/TypeScript files (or Odoo XML), the review runs a small set of rules of our own over the diff (Python, JavaScript/TypeScript, and Odoo). If the `opengrep` command is missing or disabled, the review does not finish: the change stays a release blocker until it is installed. There is no skip and no waiver, in dark mode too. Install it yourself; the installer does not. If you have no other scanner, two language-agnostic, permissively licensed starting points are [gitleaks](https://github.com/gitleaks/gitleaks) (secrets) and [osv-scanner](https://github.com/google/osv-scanner) (vulnerable dependencies); add a SAST tool for your language on top.

**Installing opengrep.** Releases are on the [releases page](https://github.com/opengrep/opengrep/releases) and are signed with Cosign; prefer a pinned version over `latest`. The project's own quick installs are `curl -fsSL https://raw.githubusercontent.com/opengrep/opengrep/main/install.sh | bash` (Linux, macOS) and `irm https://raw.githubusercontent.com/opengrep/opengrep/main/install.ps1 | iex` (Windows PowerShell, with `-Version` to pin). They run a script from the network, so read it first if your policy asks for that. The bundled rules passed their tests on versions 1.11.1 and 1.32.0. The rules are local files and the scan fetches nothing.

## Layout

```
openspec/schemas/tempa-spec/schema.yaml   workflow definition (artifacts, deps, apply)
openspec/schemas/tempa-spec/templates/    artifact templates
skills/hrt-*                        local skills referenced from schema.yaml
skills/vendor/                      external skills vendored in (grilling, tdd, ...) + vendor-lock.json
scripts/merge-config.cjs            installer's config.yaml merger
scripts/vendor-skills.cjs           refreshes skills/vendor/ from upstream (--check / --apply)
scripts/install-schema.sh           local installer (no params, bash)
scripts/install-schema.ps1          local installer (no params, PowerShell)
```

Editing the schema itself (not just using it)? See [AGENTS.md](AGENTS.md).
