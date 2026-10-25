# Business flow abuse (OWASP Web Security Testing Guide v4.2, section 4.10)

For a change that handles money, stock, quantity, balance, limits, approvals, or any multi-step flow with a state (draft, confirmed, paid, shipped). Technical checks (injection, access control) can all pass while the flow is still abusable. Walk each line once. Add a threat only when a line applies and no listed threat covers it. Cite the section number (for example `WSTG 4.10.5`) as the threat's source.

- 4.10.1 Test Business Logic Data Validation: does the server check every value against the business rule (negative, zero, over a limit, wrong type, rounding), not only the form? Does a price, total, or discount come from the server's own data, never from the request?
- 4.10.2 Test Ability to Forge Requests: can a caller send a field, or call a step, that the screen never offers (a status, an owner, a hidden total, a skipped approval)?
- 4.10.3 Test Integrity Checks: can data be changed after it was approved or posted, or by someone who does not own it, and is each change recorded?
- 4.10.4 Test for Process Timing: can the order or timing of calls be abused (confirm before verify, refund before payment, cancel after shipping, an expired window, a replay of an earlier request)?
- 4.10.5 Test Number of Times a Function Can Be Used Limits: can an action meant to happen once (coupon, approval, redemption, payout) happen twice, or at the same moment from two requests? Are the check and the update one atomic step (a transaction, a lock, or a unique constraint)?
- 4.10.6 Testing for the Circumvention of Work Flows: can a step be skipped by calling a later endpoint or method directly, or by writing the state field itself?
- 4.10.7 Test Defenses Against Application Misuse: does repeated misuse (many failed attempts, bulk calls) leave a trace and run into a limit?

Also ask which rule must always hold, and whether the change can break it: totals equal the sum of their lines (conservation), at most one active record per key (uniqueness), a counter or sequence never goes down (monotonic), two states never hold at once (exclusivity). A rule worth stating becomes a requirement with a negative scenario.

Left out of this file: 4.10.8 and 4.10.9 (file uploads; CWE-434 is in `cwe-top25-2025.md`).

Source: https://wstg.owasp.org/v4.2/4-Web_Application_Security_Testing/10-Business_Logic_Testing/ (read on 2026-10-25). The page carries "© 2026, OWASP Foundation Inc. All rights reserved" and no open licence, so only the section titles are quoted; the questions are written for this skill.
