# openspec-schema

Custom [OpenSpec](https://github.com/Fission-AI/OpenSpec) workflow schemas by @hash-id.

## `hash` schema

Spec-Driven Development workflow:

- `discovery` interview phase before `proposal`.
- `align` reviews all artifacts for consistency (a loop of up to 3 passes) before `apply`.
- `apply` runs as strict TDD (red-green-refactor, one task at a time), then reviews the implemented code against the specs in the same phase (a loop of up to 3 passes), printing findings to screen.

```
discovery -> proposal -> { specs, design } -> tasks -> align -> apply (TDD + review)
```

Other schemas in this repo: `spec-driven` (the OpenSpec default).

## Install (local, into the current repo)

Installs `hash` into `./openspec/schemas/hash` and sets it as the repo's default schema (`openspec/config.yaml`):

```bash
curl -fsSL https://raw.githubusercontent.com/hash-id/openspec-schema/master/scripts/install-schema.sh | bash
```

Or from a clone:

```bash
./scripts/install-schema.sh
```

No parameters. Local only (no global/user dir). Re-run to update.

## Use

```bash
openspec new change <name>          # uses hash as default
openspec instructions discovery --change <name>
openspec instructions align   --change <name>
openspec instructions apply   --change <name>
```

## Layout

```
openspec/schemas/hash/schema.yaml   workflow definition (artifacts, deps, apply)
openspec/schemas/hash/templates/    artifact templates
scripts/install-schema.sh           local installer (no params)
```

Requires: the OpenSpec CLI (`@fission-ai/openspec`) and `git`.
