# OWASP Top 10 CI/CD Security Risks (dependency entry only)

For a change that adds or upgrades a third-party package. Only the entry that an application diff can show is kept; the other nine are about how the CI pipeline itself is configured. Walk each line once.

- CICD-SEC-3 Dependency Chain Abuse:
  - Is the version pinned, and do the lockfile, the declared package manager, and CI agree on it?
  - Was the lockfile diff read, including the packages it pulls in indirectly?
  - Does a new package run install scripts, and do those scripts see secrets?
  - Are a new package's name, maintainer, release age, and source plausible? Check for a name one typo away from a known package, a public package shadowing an internal name, and a recently changed owner.
  - Is each upgrade on its own, with its changelog read?
  - *apply only:* were findings from the repository's own audit command sorted by whether the vulnerable code is reachable, with no forced fix applied?

Source: https://owasp.org/www-project-top-10-ci-cd-security-risks/ and the entry page https://owasp.github.io/www-project-top-10-ci-cd-security-risks/CICD-SEC-03-Dependency-Chain-Abuse . The page states no version label; the repository was created in July 2022 and this entry has not changed since August 2022. The title is quoted from the source; the questions are written for this skill. Integrity of pulled artifacts (checksums, signatures) is left to A08 in `web-top10-2025.md`. Licence: Creative Commons Attribution-ShareAlike 4.0 (repository `OWASP/www-project-top-10-ci-cd-security-risks`, `LICENSE`).
