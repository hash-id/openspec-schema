# AGENTS.md

Guide for coding agents working in this repo.

See [README.md](README.md) for what this repo is and the file layout. Nothing here runs as an app — it's consumed by the OpenSpec CLI in downstream repos.

## Editing schema.yaml

Everything lives in `artifacts[]` (`id`, `generates`, `template`, `instruction`, `requires`) plus a top-level `apply` block. Each `instruction` is a prompt an agent runs at that phase, so treat wording changes as prompt engineering, not prose cleanup.

`requires` is the dependency graph that gates phase order — keep it accurate. If an instruction references a template section, update `templates/<id>.md` to match.

## Templates

Markdown skeletons, not filled-in examples. Keep placeholders as HTML comments, e.g. `<!-- Task description -->`.

## Installer

No flags, on purpose (see README). Don't add any unless asked.

It clones `master` into a temp dir, copies only `schema.yaml` and `templates/*`, then rewrites the `schema:` line in `./openspec/config.yaml`. It never `cp -r`s the whole clone — keep it that way. Test it in a scratch dir, since it writes to `./openspec/` relative to wherever it's run.

## Validating changes

No test suite here. Check by hand: valid YAML, `requires` graph with no cycles or missing ids, every `template:` file actually present. If the schema is installed in an OpenSpec-managed repo, `openspec validate --strict` there is the real test of whether an instruction change broke anything downstream.
