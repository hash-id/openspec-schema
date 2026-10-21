## Why

<!-- The problem or opportunity, and the outcome that means this change succeeded, in 1-3 sentences. Why now? -->

## What Changes

<!-- Describe what will change. Be specific about new capabilities, modifications, or removals. Put the reason for each scope decision beside its bullet. -->

## Capabilities

### New Capabilities
<!-- Capabilities being introduced. Replace <name> with kebab-case identifier (e.g., user-auth, data-export, api-rate-limiting). Each creates specs/<name>/spec.md -->
- `<name>`: <brief description of what this capability covers>

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->
- `<existing-name>`: <what requirement is changing>

## External Dependencies

<!-- Every claim this proposal's feasibility rests on about a system outside this codebase: a third-party API's capability, a library's documented limit, a standard's requirement. One row per claim. "Verified?" is "yes" only with a primary-source citation (link or doc reference) or a completed `research` skill run. Write "none" below the table if the change is fully internal. -->

| Claim | External system | Primary source | Verified? |
| --- | --- | --- | --- |
| <claim the change depends on> | <API / library / standard> | <url or doc reference> | <yes / no> |

## Impact

<!-- Affected code, APIs, dependencies, systems -->

<!-- Optional sections below: delete the heading and its comment when empty. -->

## Assumptions & Open Questions

<!-- Product-level assumptions and unanswered scope questions only, at most 5 bullets. Technical unknowns go to design.md's Open Questions. -->

## Out of Scope

<!-- Slices deferred by the change-size rule (one line each, with why), and a rejected scope alternative only where someone would otherwise re-open it. Rejected technical alternatives go to design.md's Decisions. -->
