# OWASP Mobile Top 10 (2024 edition)

For Android, iOS, and cross-platform mobile apps. Walk each line once.

- M1 Improper Credential Usage: hardcoded or insecurely stored credentials, keys, or tokens?
- M2 Inadequate Supply Chain Security: are SDKs, libraries, and the build and signing chain trusted?
- M3 Insecure Authentication/Authorization: checks done only on the client; weak session or biometric flows?
- M4 Insufficient Input/Output Validation: is data from users, intents, deep links, files, and the network validated and sanitized (SQL injection, command injection, XSS)?
- M5 Insecure Communication: is TLS enforced and are certificates validated?
- M6 Inadequate Privacy Controls: is personally identifiable information (names, addresses, payment, health, and similar) collected, shared, or logged beyond need?
- M7 Insufficient Binary Protection: does the binary hold secrets (API keys, hardcoded crypto secrets) or valuable logic, and are tampering and reverse-engineering defences proportionate?
- M8 Security Misconfiguration: exported components, debug flags, permissive manifest or backup settings?
- M9 Insecure Data Storage: sensitive data in plain storage, caches, logs, backups, or the clipboard?
- M10 Insufficient Cryptography: weak algorithms, homemade crypto, poor key management?

For a full verification baseline see the OWASP MASVS (project level, not per change): https://mas.owasp.org/MASVS/ . If the project's `context:` names a MASVS target, cite its control IDs.

Source: https://github.com/owasp/www-project-mobile-top-10 (`2023-risks/`, titles from each page's front matter; published as the 2024 edition at https://owasp.org/www-project-mobile-top-10/). The repository states no licence file; OWASP site content defaults to Creative Commons Attribution-ShareAlike 4.0 unless otherwise specified. Titles are quoted from the source; the questions are written for this skill, checked against each risk's own page.
