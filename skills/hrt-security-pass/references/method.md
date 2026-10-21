# Method

Read this file only after the gate in `SKILL.md` fired. Use the sections for your phase: `specs` uses 1 to 3, `design` uses 1 to 3, `apply`'s review uses 1, 2 (the "leave out" list), and 4. The reference lists sit in this folder; open a list only when section 1 matches its surface.

## 1. Pick the surfaces

Decide from what this change touches, not from the whole repo. A change can match several surfaces.

| Surface | Signals | Read |
|---|---|---|
| Web application (pages, templates, browser frontend) | HTML or templates, controllers, JS/TS UI code, cookies and sessions | `web-top10-2025.md` |
| HTTP or RPC API | route handlers, `openapi.*`, GraphQL, JSON-RPC or XML-RPC, webhooks | `api-top10-2023.md` |
| Mobile app | `AndroidManifest.xml`, `Info.plist`, `*.xcodeproj`, `pubspec.yaml`, Kotlin, Swift, React Native, Flutter | `mobile-top10-2024.md` |
| LLM feature | LLM SDK calls, prompts, embeddings, retrieval | `llm-top10-2025.md` |
| Agent with tools | tool definitions, MCP servers, skills, agent loops | `agentic-top10-2026.md` and the LLM file |
| Machine credentials | service accounts, API keys, tokens, or bots that software uses | `nhi-top10-2025.md` |
| Any code | always, as a language-level cross-check; the main list for a CLI, library, batch job, or native code | `cwe-top25-2025.md` |
| Framework hints | `__manifest__.py` (Odoo 18 and later) | `odoo.md` |

If nothing else matches (for example a pure config change), read the CWE file only. To add a surface, add one file in the same format and one row here.

## 2. Find the threats

List every place data or control crosses the boundary (entry points, stores, outbound calls). For each, ask the six STRIDE questions and keep only the threats that fit.

| Category | Question |
|---|---|
| Spoofing | Can someone pretend to be another identity? |
| Tampering | Can data or code be changed in transit or at rest? |
| Repudiation | Can an action be denied with no record of it? |
| Information disclosure | Can data reach someone who must not see it? |
| Denial of service | Can someone make this unavailable? |
| Elevation of privilege | Can someone do more than they are allowed to? |

Then walk each matched reference file once. Add a threat only when a category applies and no listed threat already covers it.

If the change handles personal data, also walk the LINDDUN categories once: linkability, identifiability, non-repudiation, detectability, disclosure, unawareness, non-compliance. Write a LINDDUN threat in the same line format below, with the LINDDUN word as its category.

Leave out: denial of service unless availability is a stated goal, threats that need unlikely preconditions, extra defence-in-depth when a primary control exists, and anything in code the change does not touch.

## 3. Write it down

**In `specs`** (before the threat list exists): use the STRIDE questions to find attack paths for the capability. Each one the change must stop becomes a normal `### Requirement` with a `#### Scenario` WHEN/THEN for the attack (a negative case). State the property that must hold, not the mechanism. No second format.

**In `design`**, in Risks / Trade-offs, one line per threat:

`[Threat T<n>: <category>, <High|Medium|Low>] → <mitigation> (<source>)`

The id (T1, T2, ...) is unique in the file. `tasks` cites it in a group's `Covers:` line.

- Severity: High = reachable by an unauthenticated or low-privilege caller, or exposes secrets, personal data, or money. Low = needs unusual preconditions or a privileged caller. Medium = the rest.
- Source: a category id from the reference you used (for example `A01:2025`, `API1:2023`), a CWE id, or the name of an OWASP Cheat Sheet. Use only ids that appear in a reference file or that you can verify. Leave the source out rather than invent one.
- If the project's `context:` names a standard it works to (for example an ASVS level or PCI DSS), also cite that standard's requirement ids, but only ones you can read in the project's own documents.
- Every threat that belongs to a capability should trace to a negative scenario in that capability's spec. If there is none, specs missed it: `design` may append the scenario to that spec file now (all planning artifacts are still drafts) and say so in one line. A change-level threat that fits no capability (a new dependency, a secret in the repository) needs no scenario: name the scanner, license check, or other command that shows it is handled in the mitigation text. Either way, `tasks` lists the threat id in a group's `Covers:` line and that group carries a task tagged `[security]`; `hrt-artifact-lint` fails a threat id no group covers.

## 4. In `apply` (code review)

`hrt-apply-code-review` runs this on the diff. Pick the surfaces from the changed files (section 1), read the matching reference files, and check the changed code against each category. Report only what is exploitable or concretely dangerous in the changed code, and never what section 2 says to leave out. There is no threat list to write: the findings go through the review's own severity rules.
