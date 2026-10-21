<!-- design.md is mandatory for every change. A section that does not apply gets a one-line "N/A - <reason>", not removal. -->

## Context

<!-- Current state and constraints the approach needs. Reference proposal.md - Why for motivation; do not restate it. -->

## Goals / Non-Goals

**Goals:**
<!-- What this design aims to achieve -->

**Non-Goals:**
<!-- Design-level boundaries only; do not restate the proposal's scope -->

## Decisions

<!-- Key technical decisions and rationale. This is the sole home for rejected technical alternatives - list them per decision. -->

## Shape / Seams

<!-- Required when the change introduces callable code. One entry per seam:
     - `signatureOfPublicBoundary(args): ReturnType` — where apply's tests attach
       Covers: <spec requirement or scenario name>
     Prefer existing boundaries; note why any new seam is new.
     For pure config/data/infra changes, replace this section body with: "no new code surface". -->

## Risks / Trade-offs

<!-- Known risks and trade-offs. Format: [Risk] → Mitigation.
     Security (per the `hrt-security-pass` skill): one line per threat, `[Threat T<n>: <category>, <High|Medium|Low>] → Mitigation (<source>)`,
     with a unique id that tasks.md cites in a group's `Covers:` line,
     or the single line `Security pass: skipped - <reason>` when no trust boundary is touched. -->

## Migration Plan

<!-- Steps to deploy, rollback strategy (if applicable) -->

## Open Questions

<!-- Outstanding decisions or unknowns to resolve -->
