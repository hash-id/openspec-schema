# OWASP Top 10 for Agentic Applications 2026

For agents that plan, call tools, hold memory, or talk to other agents (tool definitions, MCP servers, skills, agent loops). Walk each line once. Also read `llm-top10-2025.md`.

- ASI01 Agent Goal Hijack: can content the agent reads redirect its goal?
- ASI02 Tool Misuse and Exploitation: can the agent be steered into misusing a legitimate tool?
- ASI03 Identity and Privilege Abuse: are the agent's credentials scoped, short-lived, and not inherited too broadly?
- ASI04 Agentic Supply Chain Vulnerabilities: are tools, plugins, MCP servers, and prompts loaded at runtime trusted and pinned?
- ASI05 Unexpected Code Execution: can the agent run generated code outside a sandbox?
- ASI06 Memory and Context Poisoning: can stored memory or shared context be written by untrusted input?
- ASI07 Insecure Inter-Agent Communication: are messages between agents authenticated and validated?
- ASI08 Cascading Failures: can one agent's fault or bad output spread to others?
- ASI09 Human-Agent Trust Exploitation: can the agent mislead the person who approves its actions?
- ASI10 Rogue Agents: can an agent drift from its purpose, and can it be stopped?

Source: OWASP GenAI Security Project, published 9 December 2025: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/ . The official page does not list the titles in its text. The titles above are as reported consistently by secondary summaries; the wording of ASI03, ASI04, and ASI08 varies slightly between them, so treat the IDs as the stable part and check the official PDF before quoting a title in a formal document. The questions are written for this skill. Licence stated on the source site: Creative Commons Attribution-ShareAlike 4.0, unless otherwise specified.
