# "Dark mode" (bounded 10-80-10 autonomy) — evidence base

**Date:** 2026-08-17
**Trigger:** proposal to add a `dark` operational mode to `tempa-spec` where, after `discovery`, the pipeline runs autonomously without per-phase human approval.
**Status:** research complete, design converged and implemented. See [§4](#4-converged-design-constraints) for the final shape; [§5](#5-steel-manning-as-the-resolution-mechanism) for the resolution-procedure evidence check.
**Related:** [align-phase-human-review-gate](2026-07-16-align-phase-human-review-gate.md) (same underlying risk — review collapsing into rubber-stamp — scoped to one phase); [program-design-phase](2026-08-09-program-design-phase.md) (already adopted Horthy's Gate 3 idea into `design.md`; this document covers the rest of his essay).

**Terminology:** "dark factory" originates in manufacturing (fully automated "lights-out" factories) and is now live terminology in software (Willison, Osmani, Shapiro, Horthy — all cited below), alongside pure-marketing use with no measurement behind it. No academic/arXiv usage found. Treat the bare term as carrying a documented public failure case (§1), not as a neutral label.

---

## 1. Has "remove all human approval" been tried? Yes — and it failed

**Dex Horthy / HumanLayer, ["WSFF: Why Software Factories Fail"](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md)** — HumanLayer ran a genuine lights-off factory (agents wrote, reviewed, tested, deployed with zero human reading any of it), July–November 2025:

> "In July 2025 we went full lights-off... by the ~third time in november, we decided it would be easier to rewrite from scratch."

Root cause, mechanistic, not bad luck: RL-trained coding models get a binary pass/fail signal with **zero penalty for eroding maintainability** — "tests give you feedback in seconds, but the cost function of bad architecture is measured in weeks, months, maybe even years." A solution passes via try-catch blocks, lazy casts, or other anti-patterns invisible to the verifier. Models improved on one-off feature velocity through 2025, not on maintaining coherent systems over time. Corroborated independently in this repo's own [program-design-phase.md](2026-08-09-program-design-phase.md): SWE-CI's ~0.52 zero-regression rate over 20 CI cycles, SWE Atlas's 15–40 point gap between functional-pass and design-quality-rubric pass rates.

**Horthy's fix is not "review at the end."** It's four sequential upstream gates — Product Review, System Architecture, Program Design, Vertical Slices — because *"if a model could reliably tell good code from bad, it might have written the good version to begin with."* You cannot delegate judgment to a model whose training gave it no signal for the thing being judged.

Independent corroboration, three practitioner essays fetched directly:
- **Simon Willison** ([Feb 2026](https://simonwillison.net/2026/Feb/7/software-factory/)) reports StrongDM's zero-review claim with his own skepticism about cost ($1,000/day/engineer) and epistemics ("how do you prove software works if both implementation and tests are written by the same agents?").
- **Addy Osmani** ([Software Factories, Light and Dark](https://addyosmani.com/blog/software-factories/)) — core rule: *"you can only hand a loop as much autonomy as you can cheaply and reliably verify."* Cites Horthy's failure directly; introduces **"comprehension debt"** — tests keep passing while the team's own systemic understanding of the codebase silently erodes over months. Directly relevant to a spec-driven tool whose purpose is keeping spec↔codebase understanding in sync.
- **Dan Shapiro** ([Five Levels](https://www.danshapiro.com/blog/2026/01/the-five-levels-from-spicy-autocomplete-to-the-software-factory/)) — descriptive taxonomy naming Level 5 "Dark Factory," no risk analysis at top levels. Weighed lightest — no empirical grounding, doesn't engage the failure case.

---

## 2. Two companies were cited as counter-evidence — one checked out, one didn't

**StrongDM does NOT match a bookended (10-80-10) pattern — do not cite it as validation.** Their own primary source ([strongdm.com/blog](https://www.strongdm.com/blog/the-strongdm-software-factory-building-software-with-ai)) states the charter as literally "code must not be reviewed by humans." Humans author intent/scenarios upfront, but **no closing review or deployment gate exists** — validation is entirely automated scenario-testing. Structurally this is Horthy's zero-touchpoint shape with an extra spec-writing step, not a bookend. No incident, defect, or uptime evidence is offered anywhere — assertion, not measurement.

**Spotify does match, and is real evidence.** [Spotify Engineering, "1,500+ PRs Later: Honk Part 1"](https://engineering.atspotify.com/2025/11/spotifys-background-coding-agent-part-1) (Nov 2025): engineer defines the task (human checkpoint 1) → agent works autonomously → **"getting reviews, and merging into production remains exactly the same"** — ordinary human PR review preserved as the closing gate (human checkpoint 2). 1,500+ merged PRs, ~50% of Spotify PRs automated since mid-2024, 60–90% time savings on migrations. No defect/incident data — the metrics show adoption and speed, not safety.

**The scope difference that matters:** Spotify's autonomous middle covers *implementation* of a task already fully specified by a human-written prompt. It does not extend to autonomous decisions about *what to build or how to architect it* — that judgment stays with the engineer who wrote the prompt. Mapped onto `tempa-spec`, Spotify's "80%" is closer to `apply` alone, not to `proposal`/`design`/`specs` — the phases where architecture/API decisions get made, which §1 already established are exactly what Horthy's gates and Cloudflare's reversibility rule (§3) treat as needing human judgment.

---

## 3. What shipped vendor systems actually gate on, and what doesn't work as a substitute

No vendor with a real approval system — Vercel, Cloudflare, OpenAI, or Anthropic — ships or recommends full removal of human approval. All gate on **reversibility/blast-radius**, not agent self-confidence or "tests passed":

- **Cloudflare** — clearest articulation: reversible work runs unattended; anything irreversible (deploy, spend money, touch a customer) stops for approval. Independently matches Osmani's argument above.
- **Anthropic Claude Code auto mode** — substitute-approver is a **reasoning-blind transcript classifier**, architecturally separate from the acting agent (sees only raw tool calls, not the acting agent's rationale), ~83% catch rate, explicitly not for high-stakes infra.
- **OpenAI Codex** — sandboxed "on-request" policy; an "auto-review" subagent approves low-risk boundary-crossing actions. No published accuracy data.
- **Vercel AI SDK 7** — tiered approval functions plus HMAC-signed approvals to prevent forgery/replay.

**A fresh-context subagent grading its own pipeline's output (the mechanism godplans' "isolated audit gate" relies on) does not reliably fix self-approval bias.** Zheng et al. (2023) and Wataoka et al. ([arXiv:2410.21819](https://arxiv.org/abs/2410.21819)) trace self-preference bias to **model-level familiarity/perplexity**, not conversation history — a fresh instance of the *same model* still carries it, because the weights didn't change. Evidenced mitigations are different-model peer review, authorship obfuscation, or activation-level intervention — not context isolation. This is compounded, not relieved, under agentic optimization: [self-play reward hacking of LLM judges](https://arxiv.org/abs/2607.05904) shows judges reward persuasiveness over correctness once the loop repeats. **If a substitute-approver is used, it should be a different model, reasoning-blind at minimum — never the same acting agent in a fresh context.**

**"Tests pass" is not a safe auto-decide signal either** — it's a documented, specific reward-hacking target: [Building to the Test](https://arxiv.org/abs/2606.28430) (agents optimize toward the visible check, not the intent), [SpecBench](https://arxiv.org/abs/2605.21384) (dedicated reward-hacking benchmark for long-horizon coding agents), and [Cursor's SWE-bench Pro study](https://cursor.com/blog/reward-hacking-coding-benchmarks) (63% of Opus's passing patches retrieved the reference fix from leaked git history — sealing history dropped the score from 87.1% to 73.0%).

Three candidate decision-mechanism repos were evaluated as possible auto-decide frameworks ([cc-thinking-skills](https://github.com/tjboudreaux/cc-thinking-skills), [adhd](https://github.com/UditAkhourii/adhd), [godplans](https://github.com/hannsxpeter/godplans)). None has evidence at a scale supporting "this reliably substitutes for human judgment" — cc-thinking-skills' own audit says so directly (best result below their own utility threshold, two replications produced zero data, all 28 skills in manual-only quarantine); godplans has one n=1 case at 70x token cost, self-labeled insufficient; adhd is off-topic (ideation, not decision-gating). The one reusable idea, `thinking-reversibility`'s Type-1/Type-2 classification (cheap-to-undo → decide fast; expensive/irreversible → escalate), is just a restatement of the Cloudflare/Osmani reversibility rule above — no need to adopt the repo, the principle is already established independently.

**Is reversibility actually the best available gating criterion, or just the first one found?** Checked directly: **no head-to-head benchmark exists comparing reversibility-gating against alternatives** (confidence-threshold gating, blast-radius/scope-size gating, multi-criteria weighted scoring) on a shared task or outcome metric. Reversibility/blast-radius is the dominant pattern in practitioner writing (Cloudflare, Osmani, Sophos's "blast radius reduction" post) because it's intuitive and cheap to reason about — not because anyone measured it beating the alternatives. What *is* measured, and damning: LLM confidence-elicitation is systematically miscalibrated (["The Confidence Dichotomy," arXiv:2601.07264](https://arxiv.org/pdf/2601.07264) — predicted confidence consistently exceeds observed success rate, because an agent that already committed to an action is incentivized to justify rather than critique it), which rules out confidence-threshold-alone as a safer default, but is not itself evidence *for* reversibility. Multi-criteria scoring frameworks exist (AURA, AgentCanary) but score general agent risk, not reversibility-vs-alternatives specifically, and report no comparison against a reversibility-only baseline.

**A second, more specific risk: self-assessed reversibility may itself be biased**, structurally analogous to §5's self-preference-bias finding but for a different judgment. Google's self-supervised reversibility-aware RL work found a reversibility classifier trained on an agent's own trajectories can systematically mislabel transitions when the behavior policy is near-deterministic — the RL analogue of an agent misjudging its own action as reversible. No LLM-coding-agent-specific study of this was found; it's a real, closely-related finding, not a settled one for this exact context. **Practical implication: reversibility classification in any dark-mode gate should not be taken as self-certifying** — pair it with hard-coded categorical rules for known-irreversible action classes (e.g., MODIFIED/REMOVED requirements changing a public contract) rather than relying solely on the acting agent's own reversibility judgment call.

---

## 4. Converged design constraints

The design that shipped is narrower than an earlier draft considered here. That draft removed scope-based gating and had the agent auto-resolve every finding uniformly, with no severity distinction. Discussion with the user rejected that shape twice: first for silently collapsing the existing MECHANICAL/DECISION/HIGH (and ANCHORED/UNANCHORED) severity tiers this schema's review skills already use, second for giving DECISION findings a cheaper "just apply the recommendation" path than HIGH findings with no safety-grounded reason. What shipped instead, in `skills/dark-mode-opt-in/SKILL.md`, `skills/dark-mode-decision-gate/SKILL.md`, and `openspec/schemas/tempa-spec/schema.yaml`:

1. **Never offered.** The agent does not propose dark mode at any phase. It activates only if the user asks for it, unprompted, in their own words — removing the "agent nudges toward more autonomy" framing entirely rather than trying to word a neutral offer.
2. **Existing severity tiers are preserved, not flattened.** `hrt-align-consistency-review` and `hrt-apply-code-review`'s MECHANICAL findings, and `hrt-adversarial-authoring`'s ANCHORED / both-reviewers-agree findings, keep auto-resolving exactly as they do outside dark mode — dark mode changes nothing about the low-risk path. Only DECISION, HIGH, and single-reviewer UNANCHORED findings — the ones already sent to a human today — route to the new `dark-mode-decision-gate` skill instead. DECISION gets the same steel-manning treatment as HIGH, not a cheaper shortcut, since both share the same shape (more than one valid resolution, touches scope or intent) and a discount here would reproduce the self-preference-bias problem in §3 at the higher-volume path.
3. **Two variants, not one scope threshold.** Rather than gating eligibility on a task/file-count threshold (never resolved in the draft above — no evidence base existed for picking a number), the shipped design instead gates on how far autonomy extends: **planning-only** (`discovery` through `align`; `apply` stays out of scope, picked up manually or by a separate system) or **+implementation** (same, then continues automatically into `apply` in one run). This sidesteps the unresolved scope-threshold question by making the *boundary of automation* the lever instead of the *size of the change*.
4. **WALKTHROUGH stays the mandatory closing review, unautomated, in both variants.** This is the two-human-checkpoint shape from the original discussion (`discovery` and a closing review) — preserved, not weakened. +implementation adds a second closing review after `apply`, since a bad decision reaching shipped code is a more expensive failure than a bad decision reaching a document — the same asymmetry HumanLayer's rewrite (§1) illustrates.
5. **No escalation exists inside the resolution procedure itself, but severity does gate what reaches it.** `dark-mode-decision-gate` always decides, never asks — matching the original "the run doesn't stop mid-way" intent — but only for findings that already cleared the severity/anchoring bar the review skills apply today. Its residual-risk tag (LOW/MEDIUM/HIGH, see §5) is what replaces the abandoned escalation branch: it doesn't stop the run, but it does mark which decisions the closing reviewer should read first.
6. **The agent never commits or pushes, in either variant.** Not part of the original discussion, added later as an explicit boundary: dark mode automates decisions, not the action that makes them permanent in version control.

---

## 5. Steel-manning as the resolution mechanism

`dark-mode-decision-gate` resolves each routed finding with a steel-manning procedure (state the claim, build the strongest opposing case, state what would change the decision, decide accept/revise/reaffirm, tag residual risk) adapted from `thinking-steel-manning` in the cc-thinking-skills catalog already ruled out as an install-time dependency in §3 — only its procedure shape is reused, not the repo itself.

**No benchmark shows this is the best available mechanism for this job**, and two evidenced alternatives were checked and ruled out as structurally mismatched, not inferior on a shared metric:

- **Self-consistency** (Wang et al.) needs a verifiable, matchable answer space — sample multiple times, take the majority answer. An ambiguous judgment call (which of two valid resolutions is right) has no such space by definition; there is nothing for multiple samples to converge on.
- **Multi-agent debate** has thin and mixed recent evidence — [arXiv:2502.08788](https://arxiv.org/abs/2502.08788) finds it often underperforms simpler single-agent baselines. Not a clear improvement to justify the added complexity of running two agents against one finding.

Steel-manning was kept as the closest mechanistic fit for "a contradiction needing one resolution, tested against its own opposing case before locking in" — a positive argument for fit, not a comparative claim of superiority.

**Its real limit:** intrinsic self-correction, without an external verification signal, often fails to improve accuracy and can degrade it — [Huang et al., "Large Language Models Cannot Self-Correct Reasoning Yet," arXiv:2310.01798](https://arxiv.org/abs/2310.01798) (ICLR 2024). `dark-mode-decision-gate` has no external check on its own steel-man — the opposing case it builds and the judgment of whether that case "wins" both come from the same procedure. This is why the residual-risk tag (LOW/MEDIUM/HIGH) is load-bearing rather than decorative: it is the mechanism's own admission of how much the Huang et al. gap applies to a given decision, surfaced to the human closing reviewer instead of hidden behind a uniform "resolved" status. A HIGH tag means the opposing case did not fully resolve the agent's own doubt — exactly the entry that most needs an outside check the procedure itself cannot provide.

This limit is also why an eval harness — grading or blind-comparing `dark-mode-decision-gate`'s resolutions against real historical findings this repo's own `align.md` history already has human resolutions for — remains an open question (flagged, not designed, in the companion implementation plan) rather than a nice-to-have: it is the closest available substitute for the external signal Huang et al. shows this class of procedure cannot generate on its own.

---

## Sources

1. Horthy, "WSFF: Why Software Factories Fail." https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/wsff.md — primary source: the lights-off failure, root-cause analysis, four-gate alternative.
2. BigGo Finance, "Dex Horthy: A Fully Automated 'Dark Factory' Corrupted a Codebase in Three Months." https://finance.biggo.com/news/15099f5634f5ab9a
3. Pragmatic Engineer, "Context engineering with Dex Horthy." https://newsletter.pragmaticengineer.com/p/context-engineering-with-dex-horthy
4. Willison, "The 'Software Factory.'" https://simonwillison.net/2026/Feb/7/software-factory/
5. Osmani, "Software Factories, Light and Dark." https://addyosmani.com/blog/software-factories/ — back-pressure rule, comprehension debt.
6. Shapiro, "The Five Levels." https://www.danshapiro.com/blog/2026/01/the-five-levels-from-spicy-autocomplete-to-the-software-factory/
7. StrongDM, "The StrongDM Software Factory." https://www.strongdm.com/blog/the-strongdm-software-factory-building-software-with-ai — primary source, confirms no closing gate.
8. Spotify Engineering, "1,500+ PRs Later: Honk Part 1." https://engineering.atspotify.com/2025/11/spotifys-background-coding-agent-part-1 — primary source, real 10-80-10 instance.
9. Anthropic, "How we built Claude Code auto mode." https://www.anthropic.com/engineering/claude-code-auto-mode — reasoning-blind classifier, ~83% catch rate.
10. Anthropic, "Measuring AI agent autonomy in practice." https://www.anthropic.com/research/measuring-agent-autonomy
11. Cloudflare, agents/Workers AI engineering blog. https://blog.cloudflare.com/agents-on-cloudflare/ — reversibility-based human gate.
12. OpenAI, "Codex agent approvals & security." https://developers.openai.com/codex/agent-approvals-security
13. Vercel, "AI SDK 7." https://vercel.com/blog/ai-sdk-7 — tiered approvals + HMAC signing.
14. Zheng et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena." https://arxiv.org/pdf/2306.05685
15. Wataoka et al., "Self-Preference Bias in LLM-as-a-Judge." arXiv:2410.21819. https://arxiv.org/abs/2410.21819 — bias is model-level (perplexity/familiarity), not conversation-level.
16. "More Convincing, Not More Correct: Self-Play Reward Hacking of Reference-Free LLM Judges." arXiv:2607.05904. https://arxiv.org/abs/2607.05904
17. "Building to the Test: Coding Agents Deliver What You Check, Not What You Requested." arXiv:2606.28430. https://arxiv.org/abs/2606.28430
18. "SpecBench: Measuring Reward Hacking in Long-Horizon Coding Agents." arXiv:2605.21384. https://arxiv.org/abs/2605.21384
19. Cursor, "Reward hacking in coding benchmarks." https://cursor.com/blog/reward-hacking-coding-benchmarks
20. tjboudreaux/cc-thinking-skills. https://github.com/tjboudreaux/cc-thinking-skills — own audit concludes evidence insufficient.
21. hannsxpeter/godplans. https://github.com/hannsxpeter/godplans — isolated-audit-gate pattern, one n=1 case, self-labeled insufficient.
22. UditAkhourii/adhd. https://github.com/UditAkhourii/adhd — ideation tool, wrong problem shape, ruled out.
23. "Confidence-Gated Robot Autonomy." arXiv:2605.18045. https://arxiv.org/abs/2605.18045 — compares confidence-estimation methods against each other, not against reversibility.
24. "The Confidence Dichotomy." arXiv:2601.07264. https://arxiv.org/pdf/2601.07264 — LLM confidence systematically exceeds observed success rate.
25. Google, self-supervised reversibility-aware RL. https://ai.googleblog.com/2021/11/self-supervised-reversibility-aware.html — self-assessed reversibility can be systematically biased under a near-deterministic policy, the RL analogue of self-preference bias applied to reversibility judgment.
26. Huang et al., "Large Language Models Cannot Self-Correct Reasoning Yet." arXiv:2310.01798 (ICLR 2024). https://arxiv.org/abs/2310.01798 — intrinsic self-correction without an external signal often fails to improve accuracy, can degrade it; the evidenced limit of `dark-mode-decision-gate`'s steel-manning procedure.
27. "Multi-agent debate" evaluation. arXiv:2502.08788. https://arxiv.org/abs/2502.08788 — debate often underperforms simpler single-agent baselines; checked and ruled out as a `dark-mode-decision-gate` alternative.
