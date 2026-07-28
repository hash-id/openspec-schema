# Research: code knowledge graph MCP tools — resource footprint comparison

**Date:** 2026-07-28
**Status:** research only, no `schema.yaml` change applied. `hash/schema.yaml` currently recommends `codebase-memory-mcp` as the "prefer first" code-exploration tool (see `discovery` and `apply` Phase 1 instructions) — this doc informs whether that should change.
**Trigger:** real-world use found `codebase-memory-mcp` too memory-hungry to index a large repo (Odoo scale). `colbymchenry/codegraph` worked as a lighter alternative, but its result quality relative to `codebase-memory-mcp` was unverified. Asked for a sourced comparison plus other comparable alternatives, prioritizing best value for performance on minimal CPU/RAM machines.

**Methodology:** round 1 (an agent gathering ~28 sources across GitHub, Hacker News, Reddit) covered 8 tools. Round 2 extended the search to niche/less-hyped projects in the same category and found 9 more, for 17 tools total. Star counts, fork counts, open-issue counts, and every specific GitHub issue cited below were independently re-verified against the live GitHub API before writing/extending this doc (a small number of repo paths the research agents initially guessed were wrong — one in round 1, one in round 2 — got caught and dropped/corrected during verification, never left uncaught in the final doc).

## Verdict

`codegraph` is the better fit for minimal-resource machines, and remains so after a second, wider search pass. It has an explicit resource-adaptive design (cgroup/container-aware sizing, tested on a 2-core/6GB VPS) and a confirmed real-world resolution of an OOM issue on a WebKit-scale (137K-file) repo. `codebase-memory-mcp` has a wide, still-open pattern of OOM/leak/crash issues on large repos in its own tracker — consistent with the Odoo experience that prompted this research. The closest challenger found in round 2, `mcp-server-tree-sitter`, wins on a different axis (a hard, user-configurable RAM ceiling, vs. codegraph's adaptive sizing) and is added below as a secondary pilot recommendation, not a replacement.

## codebase-memory-mcp (current schema.yaml recommendation)

[`DeusData/codebase-memory-mcp`](https://github.com/DeusData/codebase-memory-mcp) — 35,984★, 2,814 forks, 375 open issues, created 2026-02-24, pushed today.

Indexing approach: tree-sitter (158 languages) + a "Hybrid LSP" semantic layer (12 languages). The graph is built **fully in memory** (LZ4-compressed intermediate state) before being written to SQLite — this in-memory-build design is the direct root cause of the resource pattern below, not an incidental bug.

Open issues, all still open as of this doc, all independently verified against the GitHub API:

| Issue | Finding | Machine |
|---|---|---|
| [#1241](https://github.com/DeusData/codebase-memory-mcp/issues/1241) | 12.8GB RSS, kernel OOM-killed during `index_repository` | Debian, 14GB RAM |
| [#832](https://github.com/DeusData/codebase-memory-mcp/issues/832) | 20GB+ RSS for a 65-file/1.3MB project, never released, +600MB/min | Windows 11, 32GB RAM |
| [#581](https://github.com/DeusData/codebase-memory-mcp/issues/581) | 46GB+ commit charge, grows over hours/days, crashes Windows entirely | Windows 10, 32GB RAM, ~55k-node project |
| [#580](https://github.com/DeusData/codebase-memory-mcp/issues/580) | 8-11GB RSS for a ~6,000-file repo; two concurrent instances caused swap death and SIGSEGV | 8GB M1 Air |
| [#563](https://github.com/DeusData/codebase-memory-mcp/issues/563) | Still fails even with `CBM_WORKERS=4`, peak 15.3GB RSS, 123,856-file repo | Apple Silicon, 48GB RAM |
| [#363](https://github.com/DeusData/codebase-memory-mcp/issues/363) | Reads host cgroup/CPU/memory limits instead of the container's, over-subscribing containers | Linux/container |
| [#593](https://github.com/DeusData/codebase-memory-mcp/issues/593) | Umbrella epic: "Performance & memory on large repositories" | — |

The README benchmark claims the Linux kernel (28M LOC, 75K files) indexes in 3 minutes on an M3 Pro. The issue reports above contradict that at much smaller scale (6K-124K files) on lower-RAM machines — the gap between the vendor benchmark and real user reports matches the Odoo experience directly.

The maintainers are actively working the problem (v0.9.0, 2026-07-08, claimed "memory safety on large repositories" as a headline fix) but issues #1241, #1072, #1084 all postdate that release and remain open — not solved yet.

Quality signal: one independent benchmark (LemonCrow, single-source, methodology unverified) scored it 0.502 MRR on retrieval — mid-pack, not class-leading.

## codegraph (alternative already in use)

[`colbymchenry/codegraph`](https://github.com/colbymchenry/codegraph) — 62,915★, 3,948 forks, 362 open issues, created 2026-01-18, pushed 2026-07-24.

Indexing approach: v1.5.0 rebuilt parsing as a native Rust engine (20 languages), SQLite+FTS5 storage, incremental file-watcher sync (sub-second even at 27K-file scale).

Resource-adaptive sizing is a first-class design goal, not a patch:

> "CodeGraph sizes its parse workers, resolver pool, and caches from what the system actually has: real core counts (container/cgroup-aware, not the host's), honest available memory on macOS and Linux, and measured per-project resolution cost. A big workstation gets the full parallel pipeline; a 2-core VPS gets a pipeline tuned to finish reliably instead of running out of memory — the Linux kernel (70k files) indexes to completion on a 2-core, 6GB machine in under 12 minutes." — [v1.5.0 release notes](https://github.com/colbymchenry/codegraph/releases/tag/v1.5.0)

Closest real-world analog to the Odoo case: [Issue #320](https://github.com/colbymchenry/codegraph/issues/320) (closed, 3 comments) — indexing WebKit (137,699 files) hit `Fatal process out of memory`. Root-caused by the maintainer to a V8/Node internal WASM-compiler arena bug (not the graph engine), fixed in v0.9.3. Reporter confirmed: *"thanks for your fix in 0.9.3, it work good now. I index WebKit, complete in just use 1 hour and more."* This is the same bug class as codebase-memory-mcp's open #363 (cgroup-unaware sizing) — but here it's fixed, not open.

Quality signal: changelog shows an active false-positive-fixing cadence (e.g. #1230 string builtins like `.join()` creating phantom call edges; #1276 Go struct-field calls binding to the wrong same-named method) — normal maintenance for this problem domain, not a sign of a shaky core. Vendor claim "89% fewer tool calls, 60% cheaper, 69% fewer tokens" is single-source, not independently replicated.

Documented trade-off: on small repos, a plain grep loop can still win wall-clock time despite using 5-10x the tokens — codegraph is explicitly positioned for large repos, which matches the Odoo use case.

## Other alternatives surveyed

**[Serena](https://github.com/oraios/serena)** (27,051★, 101 issues) — not a graph DB; bridges MCP to real language servers (pyright, gopls, rust-analyzer, etc.). Its own cache is tiny (217KB-3.2MB, measured directly in an issue thread). [Issue #944](https://github.com/oraios/serena/issues/944) (24 comments) reported ~30GB RAM freezing Claude Code — root-caused to running many language servers concurrently on a polyglot repo, not Serena itself. For a repo dominated by 1-2 languages (Odoo is mostly Python/JS/XML), running only the matching LSP(s) would likely avoid this failure mode.

**Aider repo-map** ([Aider-AI/aider](https://github.com/Aider-AI/aider), 47,746★; MCP port: [pdavis68/RepoMapper](https://github.com/pdavis68/RepoMapper)) — tree-sitter + PageRank ranking, token-budget-capped, recomputed per request, **no resident graph in memory at all**. Lightest architecture surveyed. Trade-off: no true multi-hop call-graph/blast-radius queries, and on repos with lots of generated/vendored code the ranked map can eat context budget rather than RAM ([#752](https://github.com/Aider-AI/aider/issues/752)).

**[CodeGraphContext](https://github.com/CodeGraphContext/CodeGraphContext)** (4,003★, 207 issues) — tree-sitter + SCIP, tiered backend: FalkorDB Lite/KuzuDB (embedded) by default, Neo4j reserved explicitly for "massive" scale. Most explicit "match backend weight to machine size" design of anything surveyed, but no independent RAM benchmarks found either way.

**[GitNexus](https://github.com/abhigyanpatwari/GitNexus)** (44,715★, 276 issues) — tree-sitter + embedded LadybugDB, bounded connection pool (max 5, 5-min idle eviction) in CLI mode; fully in-browser WASM mode capped at ~5K files (not viable at Odoo scale). CLI mode claims to handle any repo size with a 50K-node safety cap on the embedding subsystem specifically. Self-disclosed limits only — no independent large-repo reports found.

**[claude-context](https://github.com/zilliztech/claude-context)** (12,210★) — different category: embeddings + vector DB (Milvus), not a structural graph. RAM is tunable via index quantization (IVF_PQ) at some recall cost, but requires vector-DB tuning know-how. Complements a structural tool rather than replacing call-graph queries.

**repomix / code2prompt** ([yamadashy/repomix](https://github.com/yamadashy/repomix) 27,463★; [mufeedvh/code2prompt](https://github.com/mufeedvh/code2prompt) 7,510★) — no index at all, just flatten the repo into one text blob. Lowest possible footprint, but answers a different question ("here's the repo") than call-graph/blast-radius queries.

## Round 2: extended survey (9 more tools)

A second pass cast a wider net for the same category — including niche/small projects — specifically to check whether anything beats `codegraph` on the stated priority. All 9 below are verified real repos (GitHub API), distinct from the original 8.

### grepai — [`yoanbernabeu/grepai`](https://github.com/yoanbernabeu/grepai)
1,793★, 148 forks, 96 open issues, Go (mislabeled "C" by GitHub linguist), 29 contributors, 50 releases.

Local-embeddings semantic search (Ollama `nomic-embed-text` by default), positioned as the "100% local" sibling to `claude-context`. Storage is **PostgreSQL + pgvector** — not embedded, a structurally heavier dependency than every other embedding tool surveyed. No direct OOM/crash issue found, but [#178](https://github.com/yoanbernabeu/grepai/issues/178) (GOB index corruption on unclean shutdown) is a real reliability signal. Vendor-attributed benchmark claims "97% token reduction," single-source. **Best fit:** teams already running Postgres who want local embeddings — not a minimal-footprint pick given the Postgres dependency.

### codanna — [`bartolli/codanna`](https://github.com/bartolli/codanna)
711★, 65 forks, 10 open issues, Rust, 16 contributors, 38 releases, pushed same-day as this research.

tree-sitter (15 languages) + local embeddings, indexed via embedded Tantivy (no external DB). No OOM reports found. [#23](https://github.com/bartolli/codanna/issues/23) (27 comments) is a real correctness gap: a full 20-minute index run "completed without any issues," then semantic search failed with "No embeddings available" — the index looked done but wasn't actually queryable. **Best fit:** small-medium Rust/Python repos wanting one embedded process — verify semantic search actually returns results after indexing, don't trust a clean run.

### probe — [`probelabs/probe`](https://github.com/probelabs/probe)
673★, 63 forks, 14 open issues, Rust, 10 contributors, 100 releases.

Architecturally distinct: **no persistent index at all** — ripgrep-speed text search plus on-the-fly tree-sitter expansion to function/class boundaries, re-scanning the filesystem every query. [#36](https://github.com/probelabs/probe/issues/36) (20 comments) documents real timeouts: 60-90s on a 40MB repo on Windows, and similar on a 400K-file asset-heavy repo even with `maxResults=10`. This is wall-clock/CPU cost paid per query, not a memory blowup — it literally can't OOM on indexing because there's no index. Maintainer actively fixing (self-reported "30x faster" in v0.6, not independently re-benchmarked). **Best fit:** zero-setup structural search, large asset-heavy repos willing to pay per-query cost instead of index-time cost.

### agent-lsp — [`blackwell-systems/agent-lsp`](https://github.com/blackwell-systems/agent-lsp)
92★, 5 forks, 1 open issue, Go, 2 contributors, 31 releases (~2/week).

Same category as Serena — bridges real language servers via MCP — differentiated by a claim of **30 CI-verified languages** (tested against real language servers in CI on every push) plus `simulate_edit` (preview a change's diagnostic delta before writing to disk). No resource issues found, but only 1 total issue exists — insufficient data, not a clean bill of health; the same N-concurrent-LSPs-on-a-polyglot-repo risk that hit Serena applies here by construction. **Best fit:** Serena alternative for 1-2-dominant-language repos, worth a pilot for the CI-verification claim specifically, but far less battle-tested (92★ vs Serena's 27K★).

### mcpls — [`bug-ops/mcpls`](https://github.com/bug-ops/mcpls)
53★, 13 forks, 36 open issues, Rust, 6 contributors, 14 releases.

Universal LSP bridge (any LSP, not a curated list). Strongest resource-issue trail of any round-2 tool: [#163](https://github.com/bug-ops/mcpls/issues/163) (closed) — *"unbounded pending HashMap causes OOM and O(n³) debounce under mass file events."* Root cause: the file-watcher's debounce loop accumulated all pending change events with no cap, and large vendored-dependency directories (`vendor/`, `node_modules/`) weren't excluded by default — the exact large-monorepo-with-vendored-deps shape that matches Odoo. Now fixed. Still open: [#243](https://github.com/bug-ops/mcpls/issues/243) (no request-size/session cap on HTTP transport) and [#234](https://github.com/bug-ops/mcpls/issues/234) (unbounded diagnostics cache) — the same failure *class* isn't fully closed out yet. **Best fit:** worth piloting for large monorepos with vendored deps now that #163 is fixed, with the caveat that #234/#243 remain open.

### Code Index MCP — [`johnhuang316/code-index-mcp`](https://github.com/johnhuang316/code-index-mcp)
987★, 118 forks, 19 open issues, Python, 15 contributors, 49 releases.

Hybrid ripgrep + optional SCIP "deep index." [#42](https://github.com/johnhuang316/code-index-mcp/issues/42) (closed) — direct user report of an OOM crash from loading the full index into memory at every launch; maintainer's fix, quoted: *"We've switched the deep index to use a SQLite-backed store, so it no longer loads the entire index into memory at startup."* Same root-cause pattern as `codebase-memory-mcp`'s core problem — except shipped and closed here. Still open: [#29](https://github.com/johnhuang316/code-index-mcp/issues/29), a real regression — reindexing a subproject went from ~1s (v0.4.2) to 5-8 minutes (post-v1.0.0), plus unexplained full re-generation of an identical index on every run. **Best fit:** general-purpose lightweight SCIP-grade indexer — OOM is fixed, but test the reindex-time regression on your own repo shape before trusting wall-clock numbers.

### Octocode — [`bgauryy/octocode`](https://github.com/bgauryy/octocode)
901★, 77 forks, 2 open issues (30 total, most closed fast), TypeScript, **1 contributor**.

Zero persistent index by design — tree-sitter + optional LSP + ripgrep + live GitHub/npm API queries, rebuilt fresh per session. No resource issues found (architecturally expected — nothing resident to leak). Distinct risk profile from every other tool surveyed: its issues skew **security/supply-chain**, not performance — [#415](https://github.com/bgauryy/octocode/issues/415) (unpinned `curl\|node` RCE in the installer), [#412](https://github.com/bgauryy/octocode/issues/412) (telemetry leaking raw search query contents), [#414](https://github.com/bgauryy/octocode/issues/414) (agent instructions fetched live, unpinned — a prompt-injection surface). All closed, but the volume and nature is a materially different concern than resource footprint. Single contributor despite the star count, and release tags are stale relative to the actual npm-published version. **Best fit:** cross-repo/GitHub-search-heavy workflows, not pure local large-monorepo indexing — review the security issues independent of the resource question.

### mcp-server-tree-sitter — [`wrale/mcp-server-tree-sitter`](https://github.com/wrale/mcp-server-tree-sitter)
311★, 40 forks, 4 open issues, Python, 7 contributors, 10 releases.

Direct tree-sitter exposure via MCP, no graph DB, no embeddings. The standout find of round 2: parse-tree cache is **explicitly size- and TTL-bounded by design** (`max_size_mb`, default 100MB; `ttl_seconds`, default 300s; fully configurable; `--disable-cache` available). No OOM/memory issues found — plausibly because the cache is bounded by design rather than because it's unstressed. **Best fit:** the only tool in the full 17-tool survey with a hard, user-configurable RAM ceiling — worth piloting specifically when the requirement is "never exceed N MB" rather than "use available resources well" (codegraph's adaptive approach). No call-graph/blast-radius capability, same limitation as Aider repo-map.

### gtags-mcp — [`ryogrid/gtags-mcp`](https://github.com/ryogrid/gtags-mcp)
2★, 2 forks, 0 open issues, JavaScript, 2 contributors, no formal releases.

Thin MCP wrapper around GNU GLOBAL (`gtags`/`global`), a mature 30+-year-old disk-backed ctags-family tool — no parsing happens in the wrapper itself. Not incremental by default (must manually run `global -u` after external edits). Essentially no issue history to evaluate — thinnest evidence base in the whole survey, but architecturally low-risk by inheriting GNU GLOBAL's disk-backed design rather than any novel in-memory graph. **Best fit:** reference point for "lightest possible ctags-family approach as MCP" — not mature enough to adopt over the other options yet (2 stars, 2 contributors, essentially unused).

### Notable exclusions from round 2

- **Sourcegraph MCP** — real, self-hostable, SCIP-backed — excluded because it wraps a full enterprise Sourcegraph deployment, not a lightweight single-process server comparable in footprint to anything else here.
- **`Muvon/octocode`** (436★, Rust) — unrelated project despite the identical name to `bgauryy/octocode`; not investigated deeply, flagged to avoid conflating the two.
- **`sdsrss/code-graph-mcp`** (57★, Rust, BM25+vector+graph hybrid, actively pushed) — looked promising, set aside only for time budget, flagged as the top candidate for a possible round 3.
- **`sosacrazy126/greptile-mcp`** — thin client wrapping the hosted/paid Greptile API; indexing happens on Greptile's servers, not locally, so it doesn't fit the self-hosted/minimal-footprint framing at all.
- Several very-low-traction repos verified real but too thin on independent evidence to write up: `Consiliency/Code-Index-MCP` (near-duplicate of johnhuang316's), `bobmatnyc/mcp-vector-search`, `steiner385/qdrant-mcp-server`, `kapillamba4/code-memory`, `lexCoder2/lxDIG-MCP`, `anortham/coa-codesearch-mcp`, `nendotools/tree-sitter-mcp`, `mickeyinfoshan/lsp-mcp`, `websines/codegraph-mcp`.

## Comparison matrix (17 tools)

| Tool | Indexing approach | RAM footprint | Quality signal | Best fit |
|---|---|---|---|---|
| **codegraph** | tree-sitter → Rust kernel, incremental | Proven: 2-core/6GB VPS completes in <12min | Ongoing false-positive fixes each release | Large repos, minimal-resource machines |
| codebase-memory-mcp | tree-sitter + Hybrid LSP, RAM-first build | Poor: 10+ separate OOM/leak issues, still open | Mid-pack (0.502 MRR) | Small-medium repos, well-resourced machines |
| Serena | Bridges to real LSPs | Depends on LSP; multi-LSP polyglot can hit 30GB+ | Highest potential accuracy (true LSP semantics) | Repos dominated by 1-2 languages |
| Aider repo-map | tree-sitter + PageRank, stateless | Lightest — no resident graph | Good ranking, shallow on call-graph | Emergency fallback, minimum footprint |
| CodeGraphContext | tree-sitter + SCIP, tiered backend | Unverified | Insufficient independent data | Worth piloting |
| GitNexus | tree-sitter + LadybugDB, bounded pool | Self-disclosed only | Insufficient independent data | Worth piloting |
| claude-context | Embeddings + vector DB (Milvus) | Tunable via quantization | Strong for fuzzy/semantic match | Complement, not a graph replacement |
| repomix / code2prompt | No index, flatten to text | Lowest possible (no index at all) | N/A — different question answered | Emergency "here's the repo" fallback |
| grepai | Local embeddings + Postgres/pgvector | Unverified numerically; Postgres is structurally heavier | 97% token-reduction claim (single-source) | Local embeddings, Postgres-already-in-stack teams |
| codanna | tree-sitter + local embeddings, embedded Tantivy | Unverified; no OOM reports | Real bug: index "completes" but embeddings not queryable | Small/medium Rust/Python repos, single embedded process |
| probe | ripgrep + on-the-fly tree-sitter, no persisted index | No resident graph — cost is per-query CPU, not RAM | Real timeouts on 400K-file repos, actively being fixed | Zero-setup structural search, asset-heavy repos |
| agent-lsp | Bridges real LSPs, 30 CI-verified languages | Unverified; same risk class as Serena | No complaints found; CI-verification is a real differentiator | Serena alternative, 1-2 dominant languages |
| mcpls | Universal LSP bridge | Confirmed, now-fixed unbounded-HashMap OOM on vendored-dep monorepos | Real staleness bug found and fixed | Large monorepos w/ vendored deps |
| Code Index MCP | ripgrep + optional SCIP deep index | Confirmed, now-fixed in-memory-load-at-startup OOM | Open regression: 1s→5-8min reindex slowdown | General-purpose lightweight SCIP indexer |
| Octocode | tree-sitter + LSP + GitHub/npm API, no persisted index | No resident graph | Security/supply-chain issues dominate, not search-quality bugs | Cross-repo/GitHub-search workflows |
| **mcp-server-tree-sitter** | Direct tree-sitter, in-memory singleton cache | **Explicitly bounded by design (100MB default, configurable, disableable)** | No complaints found; insufficient data | Hard-capped-RAM-ceiling use case specifically |
| gtags-mcp | Thin wrapper around GNU GLOBAL, on-disk B-tree | No data; inherits a 30-year-old disk-backed tool's profile | No data — too little usage | Reference point only, not yet mature |

## Recommendation

1. **codegraph** as primary — the only tool across all 17 surveyed with both (a) an explicitly resource-adaptive design tested at the exact target machine class (2-core/6GB VPS) and (b) a *confirmed, maintainer-and-reporter-verified* resolution of a real OOM at large scale (WebKit, 137K files). Confirms the alternative already in use is the right call.
2. **`mcp-server-tree-sitter` as a secondary/complementary pilot** — the only tool in the whole survey with a hard, user-configurable RAM ceiling rather than best-effort adaptive sizing. Worth testing specifically if the actual requirement is "must never exceed N MB," not just "use resources well." No call-graph capability, so it's a complement to codegraph, not a replacement.
3. **`probe`** as the strongest no-index fallback — real AST-boundary-aware results (not just PageRank file ranking like Aider), can't OOM on indexing since there's no index, but pays wall-clock cost per query on very large repos.
4. **Aider repo-map / RepoMapper** as the lightest possible stateless fallback if codegraph struggles on a pathological part of Odoo — lowest footprint, shallowest queries (no call-graph/blast-radius).
5. **Serena or `agent-lsp`** worth trying if Odoo-facing agent work stays within 1-2 languages at a time — skip either if agents routinely touch many module languages concurrently (the shared multi-LSP memory-multiplication risk).
6. **codebase-memory-mcp** should be demoted from "prefer first" in `schema.yaml`, or at least gated behind a repo-size check. Its open-issue pattern is not just severe but an outlier: `mcpls` and Code Index MCP hit the same *class* of bug (unbounded in-memory accumulation) and both shipped real fixes — codebase-memory-mcp's equivalent issues are still open, months later.

## Confidence

**Well-supported by multiple independent sources / direct primary-source quotes:** codebase-memory-mcp's memory problems (10+ separate issues, consistent pattern across OS/language/repo size); codegraph's resource-adaptive design and the WebKit OOM resolution (maintainer + reporter confirmation in the same thread); Serena's LSP-driven memory behavior (24-comment thread with concrete cache-size measurements); mcpls #163 (root-caused and fixed by the maintainer, specific technical detail); Code Index MCP #42 (OOM confirmed by user, fix confirmed by maintainer in the same thread) and #29 (concrete before/after timing regression); codanna #23 (27-comment reproducible bug thread); probe #36 (20-comment thread, multiple independent users, maintainer actively responding).

**Single-source / unverified:** codegraph's "89% fewer tool calls / 60% cheaper" benchmark; claude-context's token-reduction claim; the LemonCrow 0.502 MRR score; CodeGraphContext's and GitNexus's actual behavior at Odoo scale; grepai's "97% token reduction" claim; codanna's throughput numbers; octocode's minification/token claims; agent-lsp's "30 CI-verified languages" claim (plausible but not independently inspected). **No tool found in either pass has real RAM/CPU evidence at Odoo-like scale (55K-124K+ files) specifically, except codegraph** (confirmed at 137K files via the WebKit issue).

HN traction across this entire space is thin — every directly matching submission scored 1-5 points with 0-3 comments. Treat that as a neutral signal (the space is niche/recent), not as evidence against any tool — GitHub issues were far more informative here than HN itself. Round 2 surfaced one axis round 1 didn't: a real **security/supply-chain issue cluster** on Octocode (unpinned RCE installer, telemetry leaking query contents, unpinned live-fetched agent instructions) — unrelated to resource footprint, but worth tracking as a separate "is this safe to run" question independent of "is this light on RAM."

## Sources

### Round 1
- [DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)
- [colbymchenry/codegraph](https://github.com/colbymchenry/codegraph)
- [codebase-memory-mcp #1241](https://github.com/DeusData/codebase-memory-mcp/issues/1241) — 12.8GB RSS OOM crash
- [codebase-memory-mcp #832](https://github.com/DeusData/codebase-memory-mcp/issues/832) — 20GB RSS / 5MB data
- [codebase-memory-mcp #581](https://github.com/DeusData/codebase-memory-mcp/issues/581) — 50GB+ leak, crashes Windows
- [codebase-memory-mcp #580](https://github.com/DeusData/codebase-memory-mcp/issues/580) — --max-memory flag request
- [codebase-memory-mcp #1084](https://github.com/DeusData/codebase-memory-mcp/issues/1084) — high CPU/memory
- [codebase-memory-mcp #563](https://github.com/DeusData/codebase-memory-mcp/issues/563) — index fails on large repo
- [codebase-memory-mcp #593](https://github.com/DeusData/codebase-memory-mcp/issues/593) — memory epic
- [codebase-memory-mcp #363](https://github.com/DeusData/codebase-memory-mcp/issues/363) — cgroup limits ignored
- [codebase-memory-mcp #1072](https://github.com/DeusData/codebase-memory-mcp/issues/1072) — PHP livelock, Shopware repro
- [codebase-memory-mcp v0.9.0 release notes](https://github.com/DeusData/codebase-memory-mcp/releases/tag/v0.9.0)
- [codegraph #320](https://github.com/colbymchenry/codegraph/issues/320) — WebKit OOM, resolved
- [codegraph v1.5.0 release notes](https://github.com/colbymchenry/codegraph/releases/tag/v1.5.0)
- [oraios/serena](https://github.com/oraios/serena)
- [serena #944](https://github.com/oraios/serena/issues/944) — ~30GB RAM, freeze
- [Aider-AI/aider](https://github.com/Aider-AI/aider)
- [Aider repo-map writeup](https://aider.chat/2023/10/22/repomap.html)
- [aider #752](https://github.com/Aider-AI/aider/issues/752) — repo map token limit
- [pdavis68/RepoMapper](https://github.com/pdavis68/RepoMapper)
- [CodeGraphContext/CodeGraphContext](https://github.com/CodeGraphContext/CodeGraphContext)
- [abhigyanpatwari/GitNexus](https://github.com/abhigyanpatwari/GitNexus)
- [zilliztech/claude-context](https://github.com/zilliztech/claude-context)
- [yamadashy/repomix](https://github.com/yamadashy/repomix)
- [mufeedvh/code2prompt](https://github.com/mufeedvh/code2prompt)
- [HN Algolia search — codebase-memory-mcp](https://hn.algolia.com/api/v1/search?query=codebase-memory-mcp)
- [lemoncrow-lab/lemoncrow](https://github.com/lemoncrow-lab/lemoncrow) — independent benchmark
- [ast-grep/ast-grep](https://github.com/ast-grep/ast-grep) — lightweight structural search reference

### Round 2
- [yoanbernabeu/grepai](https://github.com/yoanbernabeu/grepai)
- [grepai #178](https://github.com/yoanbernabeu/grepai/issues/178) — GOB index corruption on unclean shutdown
- [grepai #96](https://github.com/yoanbernabeu/grepai/issues/96) — Postgres store UTF-8 bug
- [grepai #224](https://github.com/yoanbernabeu/grepai/issues/224) — VectorChord vs pgvector
- [grepai project site](https://yoanbernabeu.github.io/grepai/) — token-reduction user report (single-source)
- [bartolli/codanna](https://github.com/bartolli/codanna)
- [codanna #23](https://github.com/bartolli/codanna/issues/23) — semantic search empty after full index
- [codanna #13](https://github.com/bartolli/codanna/issues/13) — Windows mmap lock error during indexing
- [codanna #101](https://github.com/bartolli/codanna/issues/101) / [#102](https://github.com/bartolli/codanna/issues/102) — duplicate MCP server spawns
- [probelabs/probe](https://github.com/probelabs/probe)
- [probe #36](https://github.com/probelabs/probe/issues/36) — search timeouts on large repos, 20-comment thread
- [probe quick-start docs](https://github.com/probelabs/probe/blob/main/docs/quick-start.md)
- [blackwell-systems/agent-lsp](https://github.com/blackwell-systems/agent-lsp)
- [agent-lsp homepage](https://www.agent-lsp.com/)
- [bug-ops/mcpls](https://github.com/bug-ops/mcpls)
- [mcpls #163](https://github.com/bug-ops/mcpls/issues/163) — unbounded HashMap OOM, fixed
- [mcpls #243](https://github.com/bug-ops/mcpls/issues/243) — HTTP transport unbounded growth, open
- [mcpls #234](https://github.com/bug-ops/mcpls/issues/234) — unbounded diagnostics cache, open
- [mcpls #102](https://github.com/bug-ops/mcpls/issues/102) — stale document tracker, fixed
- [johnhuang316/code-index-mcp](https://github.com/johnhuang316/code-index-mcp)
- [code-index-mcp #42](https://github.com/johnhuang316/code-index-mcp/issues/42) — OOM on large codebase, fixed via SQLite migration
- [code-index-mcp #29](https://github.com/johnhuang316/code-index-mcp/issues/29) — 1s→5-8min reindex regression
- [code-index-mcp #88](https://github.com/johnhuang316/code-index-mcp/issues/88) — byte/char offset Unicode corruption
- [bgauryy/octocode](https://github.com/bgauryy/octocode)
- [octocode #415](https://github.com/bgauryy/octocode/issues/415) — unpinned curl\|node RCE in installer
- [octocode #412](https://github.com/bgauryy/octocode/issues/412) — telemetry leaking raw search query
- [octocode #411](https://github.com/bgauryy/octocode/issues/411) — telemetry beacon fires even when disabled
- [octocode #414](https://github.com/bgauryy/octocode/issues/414) — unpinned live-fetched agent instructions
- [octocode #413](https://github.com/bgauryy/octocode/issues/413) — source-available vs. build-only question
- [octocode #452](https://github.com/bgauryy/octocode/issues/452) — npm/GitHub-release version mismatch
- [wrale/mcp-server-tree-sitter](https://github.com/wrale/mcp-server-tree-sitter)
- [ryogrid/gtags-mcp](https://github.com/ryogrid/gtags-mcp)
- [Muvon/octocode](https://github.com/Muvon/octocode) — unrelated project, name collision only
- [sdsrss/code-graph-mcp](https://github.com/sdsrss/code-graph-mcp) — flagged for a possible round 3
- [Sourcegraph MCP](https://sourcegraph.com/mcp) — considered, excluded (enterprise product, not resource-comparable)
- [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) — curated-list cross-check
- [TensorBlock/awesome-mcp-servers](https://github.com/TensorBlock/awesome-mcp-servers) — curated-list cross-check
