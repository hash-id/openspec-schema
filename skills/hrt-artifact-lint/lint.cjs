// Deterministic structural lint for a tempa-spec change's artifacts.
//
// Runs the grep/count/existence checks that a language model - especially a
// cheap one - does slowly and unreliably: hashtag counts, checkbox format,
// delta-operation headers, capability <-> spec-file correspondence,
// Covers: target existence, design.md section presence, unverified
// External Dependencies rows.
//
// It does NOT make judgement calls (is this scenario really behaviour? is
// this requirement testable?) - those stay with the review subagents.
//
// Usage: node lint.cjs <change-dir> [openspec-specs-dir]
//   <change-dir>          directory holding proposal.md, specs/, design.md, tasks.md
//   [openspec-specs-dir]  optional; openspec/specs/ for resolving existing
//                         capability names on MODIFIED capabilities
//
// Exit code: 0 if no ERROR findings, 1 if any ERROR. WARN findings never
// change the exit code. A caller that treats any non-zero exit as fatal is
// correct.
"use strict";

const fs = require("fs");
const path = require("path");

const [, , changeDir, specsDir] = process.argv;
if (!changeDir) {
  console.error("Usage: node lint.cjs <change-dir> [openspec-specs-dir]");
  process.exit(2);
}

const findings = [];
function err(file, line, msg) {
  findings.push({ level: "ERROR", file, line: line || 0, msg });
}
function warn(file, line, msg) {
  findings.push({ level: "WARN", file, line: line || 0, msg });
}

function readIf(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") return null;
    console.error(`Error: could not read '${p}' - ${e.message} (${e.code}).`);
    process.exit(2);
  }
}

function lines(text) {
  return text.split(/\r?\n/);
}

function rel(p) {
  return path.relative(changeDir, p) || path.basename(p);
}

// ---------------------------------------------------------------------------
// spec files
// ---------------------------------------------------------------------------

const KNOWN_DELTA_HEADERS = new Set([
  "ADDED Requirements",
  "MODIFIED Requirements",
  "REMOVED Requirements",
  "RENAMED Requirements",
]);

function lintSpecFile(file, text) {
  const ls = lines(text);
  const covers = [];
  let currentDelta = null;
  let inRequirement = false;
  let requirementLine = 0;
  let requirementName = "";
  let requirementHasScenario = false;
  let requirementHasNormative = false;
  let requirementBodyBeforeScenario = [];
  let currentSection = null; // ADDED/MODIFIED/REMOVED/RENAMED block text accumulator
  let sectionBuf = [];

  function closeRequirement(atLine) {
    if (!inRequirement) return;
    if (!requirementHasScenario) {
      err(file, requirementLine, `requirement "${requirementName}" has no #### Scenario`);
    }
    if (!requirementHasNormative) {
      warn(
        file,
        requirementLine,
        `requirement "${requirementName}" text has no SHALL/MUST - normative requirements should avoid should/may`
      );
    }
    inRequirement = false;
  }

  for (let i = 0; i < ls.length; i++) {
    const raw = ls[i];
    const n = i + 1;

    // delta-operation headers (## ...)
    const h2 = raw.match(/^##\s+(.*?)\s*$/);
    if (h2) {
      closeRequirement(n);
      const title = h2[1];
      currentDelta = title;
      if (!KNOWN_DELTA_HEADERS.has(title)) {
        err(
          file,
          n,
          `unknown delta header "## ${title}" - expected one of: ${[...KNOWN_DELTA_HEADERS].join(", ")}`
        );
      }
      continue;
    }

    // wrong-hashtag Requirement / Scenario
    const anyReq = raw.match(/^(#{1,6})\s*Requirement:\s*(.*)$/);
    const anyScn = raw.match(/^(#{1,6})\s*Scenario:\s*(.*)$/);
    const bulletScn = raw.match(/^\s*[-*]\s*Scenario:\s*/i);
    const bulletReq = raw.match(/^\s*[-*]\s*Requirement:\s*/i);

    if (bulletScn) {
      err(file, n, "scenario written as a bullet - MUST be a #### header (exactly 4 hashtags)");
      continue;
    }
    if (bulletReq) {
      err(file, n, "requirement written as a bullet - MUST be a ### header (exactly 3 hashtags)");
      continue;
    }

    if (anyReq) {
      closeRequirement(n);
      if (anyReq[1].length !== 3) {
        err(
          file,
          n,
          `requirement header has ${anyReq[1].length} hashtags, MUST have exactly 3 (### Requirement:)`
        );
      }
      inRequirement = true;
      requirementLine = n;
      requirementName = anyReq[2].trim() || "(unnamed)";
      requirementHasScenario = false;
      requirementHasNormative = false;
      requirementBodyBeforeScenario = [];
      if (currentDelta === "REMOVED Requirements") {
        // handled below via block scan
      }
      continue;
    }

    if (anyScn) {
      if (anyScn[1].length !== 4) {
        err(
          file,
          n,
          `scenario header has ${anyScn[1].length} hashtags, MUST have exactly 4 (#### Scenario:) - 3 hashtags or a bullet fails silently downstream`
        );
      }
      if (inRequirement) requirementHasScenario = true;
      else err(file, n, "#### Scenario with no preceding ### Requirement");
      continue;
    }

    if (inRequirement && !requirementHasScenario) {
      requirementBodyBeforeScenario.push(raw);
      if (/\b(SHALL|MUST)\b/.test(raw)) requirementHasNormative = true;
    }

    const cov = raw.match(/Covers:\s*(.+?)\s*$/);
    if (cov) covers.push({ name: cov[1].trim(), line: n });
  }
  closeRequirement(ls.length + 1);

  // REMOVED / RENAMED block requirements
  lintRemovedRenamed(file, text);

  // WHEN/THEN presence per scenario block
  lintScenarioWhenThen(file, text);

  return { covers };
}

function scenarioBlocks(text) {
  const ls = lines(text);
  const blocks = [];
  let cur = null;
  for (let i = 0; i < ls.length; i++) {
    const m = ls[i].match(/^#{1,6}\s*Scenario:\s*(.*)$/);
    if (m) {
      if (cur) blocks.push(cur);
      cur = { name: m[1].trim() || "(unnamed)", startLine: i + 1, body: [] };
      continue;
    }
    if (cur) {
      if (/^#{1,3}\s/.test(ls[i])) {
        blocks.push(cur);
        cur = null;
      } else {
        cur.body.push(ls[i]);
      }
    }
  }
  if (cur) blocks.push(cur);
  return blocks;
}

function lintScenarioWhenThen(file, text) {
  for (const b of scenarioBlocks(text)) {
    const body = b.body.join("\n");
    if (!/\bWHEN\b/.test(body)) {
      err(file, b.startLine, `scenario "${b.name}" has no WHEN clause`);
    }
    if (!/\bTHEN\b/.test(body)) {
      err(file, b.startLine, `scenario "${b.name}" has no THEN clause`);
    }
  }
}

function lintRemovedRenamed(file, text) {
  const ls = lines(text);
  let mode = null;
  let blockStart = 0;
  let buf = [];
  function flush(atLine) {
    if (!mode || buf.length === 0) return;
    const body = buf.join("\n");
    if (mode === "REMOVED") {
      if (!/\*\*Reason\*\*/.test(body))
        err(file, blockStart, "REMOVED requirement missing **Reason**");
      if (!/\*\*Migration\*\*/.test(body))
        err(file, blockStart, "REMOVED requirement missing **Migration**");
    }
    if (mode === "RENAMED") {
      if (!/FROM:/.test(body) || !/TO:/.test(body))
        err(file, blockStart, "RENAMED requirement missing FROM:/TO:");
    }
    buf = [];
  }
  for (let i = 0; i < ls.length; i++) {
    const h2 = ls[i].match(/^##\s+(.*?)\s*$/);
    if (h2) {
      flush(i + 1);
      if (h2[1] === "REMOVED Requirements") mode = "REMOVED";
      else if (h2[1] === "RENAMED Requirements") mode = "RENAMED";
      else mode = null;
      continue;
    }
    if (!mode) continue;
    const req = ls[i].match(/^#{1,6}\s*Requirement:/);
    if (req) {
      flush(i + 1);
      blockStart = i + 1;
    }
    buf.push(ls[i]);
  }
  flush(ls.length + 1);
}

// ---------------------------------------------------------------------------
// proposal.md
// ---------------------------------------------------------------------------

const PROPOSAL_SECTIONS = ["Why", "What Changes", "Capabilities", "External Dependencies", "Impact"];
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function parseProposal(file, text) {
  const ls = lines(text);
  const present = new Set();
  for (const l of ls) {
    const m = l.match(/^##\s+(.*?)\s*$/);
    if (m) present.add(m[1].trim());
  }
  for (const s of PROPOSAL_SECTIONS) {
    if (!present.has(s)) err(file, 0, `proposal.md missing "## ${s}" section`);
  }

  // capability names under ### New Capabilities / ### Modified Capabilities
  const caps = { new: [], modified: [] };
  let bucket = null;
  for (let i = 0; i < ls.length; i++) {
    const h3 = ls[i].match(/^###\s+(.*?)\s*$/);
    if (h3) {
      const t = h3[1].trim().toLowerCase();
      if (t === "new capabilities") bucket = "new";
      else if (t === "modified capabilities") bucket = "modified";
      else bucket = null;
      continue;
    }
    if (ls[i].match(/^##\s+/)) bucket = null;
    if (!bucket) continue;
    const item = ls[i].match(/^\s*[-*]\s*`([^`]+)`/);
    if (item) {
      const name = item[1].trim();
      if (name.startsWith("<") || name.includes("existing-name")) continue; // template placeholder
      caps[bucket].push({ name, line: i + 1 });
      if (!KEBAB.test(name)) {
        err(file, i + 1, `capability "${name}" is not kebab-case (a-z, 0-9, single hyphens)`);
      }
    }
  }

  // External Dependencies: any row with Verified? = no
  let inTable = false;
  for (let i = 0; i < ls.length; i++) {
    if (/^##\s+External Dependencies/i.test(ls[i])) inTable = "section";
    else if (inTable && /^##\s+/.test(ls[i])) inTable = false;
    if (inTable === "section" && /^\|.*\|/.test(ls[i])) {
      const cells = ls[i].split("|").map((c) => c.trim());
      const last = cells[cells.length - 2] || "";
      if (/^-+$/.test(last) || /verified\??/i.test(last) || last === "") continue;
      if (/placeholder|<.*>/.test(ls[i])) continue;
      if (/^no$/i.test(last)) {
        err(
          file,
          i + 1,
          "External Dependencies row is not verified (Verified? = no) - resolve with the research skill before finalizing"
        );
      }
    }
  }

  return caps;
}

// ---------------------------------------------------------------------------
// design.md
// ---------------------------------------------------------------------------

const DESIGN_SECTIONS = [
  "Context",
  "Goals / Non-Goals",
  "Decisions",
  "Shape / Seams",
  "Risks / Trade-offs",
  "Migration Plan",
  "Open Questions",
];

function lintDesign(file, text, specCoversNames) {
  const ls = lines(text);
  const present = new Set();
  for (const l of ls) {
    const m = l.match(/^##\s+(.*?)\s*$/);
    if (m) present.add(m[1].trim());
  }
  for (const s of DESIGN_SECTIONS) {
    if (!present.has(s)) {
      err(file, 0, `design.md missing "## ${s}" section - it is mandatory; a non-applicable section gets a one-line "N/A - <reason>", never removal`);
    }
  }

  // section bodies
  const body = sectionBodies(ls);

  const seams = body["Shape / Seams"] || "";
  const codeless = /no new code surface/i.test(seams);
  if (!codeless && seams.trim()) {
    const coversInDesign = [...seams.matchAll(/Covers:\s*(.+)/g)].map((m) => m[1].trim());
    for (const c of coversInDesign) {
      const hit = specCoversNames.some(
        (s) => s.toLowerCase() === c.toLowerCase() || s.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(s.toLowerCase())
      );
      if (!hit) {
        err(file, 0, `Shape / Seams "Covers: ${c}" names no requirement or scenario found in specs/**`);
      }
    }
    if (coversInDesign.length === 0 && /\(.*\):/.test(seams)) {
      warn(file, 0, "Shape / Seams lists seam signatures but no `Covers:` target on any of them");
    }
  }

  const risks = body["Risks / Trade-offs"] || "";
  if (risks.trim() && !/N\/A/i.test(risks)) {
    const arrowLines = risks.split(/\r?\n/).filter((l) => /\S/.test(l) && !/^#/.test(l) && !/^\s*<!--/.test(l));
    const hasArrow = arrowLines.some((l) => /(→|->)/.test(l));
    if (arrowLines.length && !hasArrow) {
      warn(file, 0, 'Risks / Trade-offs entries should follow "[Risk] → Mitigation" (no "→" found)');
    }
  }
}

function sectionBodies(ls) {
  const out = {};
  let cur = null;
  for (const l of ls) {
    const m = l.match(/^##\s+(.*?)\s*$/);
    if (m) {
      cur = m[1].trim();
      out[cur] = "";
      continue;
    }
    if (cur != null) out[cur] += l + "\n";
  }
  return out;
}

// ---------------------------------------------------------------------------
// tasks.md
// ---------------------------------------------------------------------------

function lintTasks(file, text) {
  const ls = lines(text);
  let currentHeading = null;
  let headingLine = 0;
  let headingHasCheckbox = false;
  const archiveRe = /openspec archive|archive the change|sync (the )?specs|move .*delta spec/i;

  function closeHeading() {
    if (currentHeading && !headingHasCheckbox) {
      warn(file, headingLine, `task group "${currentHeading}" has no "- [ ]" checkbox tasks`);
    }
  }

  for (let i = 0; i < ls.length; i++) {
    const n = i + 1;
    const h2 = ls[i].match(/^##\s+(.*?)\s*$/);
    if (h2) {
      closeHeading();
      currentHeading = h2[1].trim();
      headingLine = n;
      headingHasCheckbox = false;
      continue;
    }
    if (archiveRe.test(ls[i])) {
      err(file, n, "tasks.md MUST NOT include an archive/spec-sync task - that happens after apply, gated on human review");
    }
    const cb = ls[i].match(/^\s*[-*]\s*\[([ xX])\]\s*(.*)$/);
    if (cb) {
      headingHasCheckbox = true;
      if (!/^\d+\.\d+\s/.test(cb[2])) {
        warn(file, n, 'checkbox task should start with "X.Y " numbering for apply-phase tracking');
      }
      continue;
    }
    // a bullet that looks like a task but is not a checkbox
    const looseBullet = ls[i].match(/^\s*[-*]\s+(?!\[)\S/);
    if (looseBullet && currentHeading) {
      warn(file, n, 'bullet under a task heading is not a "- [ ]" checkbox - it will not be tracked');
    }
  }
  closeHeading();
}

// ---------------------------------------------------------------------------
// driver
// ---------------------------------------------------------------------------

if (!fs.existsSync(changeDir) || !fs.statSync(changeDir).isDirectory()) {
  console.error(`Error: change dir '${changeDir}' does not exist or is not a directory.`);
  process.exit(2);
}

const specCoversNames = [];

// specs
const specsRoot = path.join(changeDir, "specs");
const specFiles = [];
if (fs.existsSync(specsRoot)) {
  for (const dirent of fs.readdirSync(specsRoot, { withFileTypes: true })) {
    if (dirent.isDirectory()) {
      const sp = path.join(specsRoot, dirent.name, "spec.md");
      if (fs.existsSync(sp)) specFiles.push({ cap: dirent.name, path: sp });
      else err(rel(path.join(specsRoot, dirent.name)), 0, `specs/${dirent.name}/ has no spec.md`);
    }
  }
}

for (const sf of specFiles) {
  const text = readIf(sf.path);
  if (text == null) continue;
  if (!KEBAB.test(sf.cap)) {
    err(rel(sf.path), 0, `capability directory "${sf.cap}" is not kebab-case`);
  }
  const { covers } = lintSpecFile(rel(sf.path), text);
  // collect requirement + scenario names for design Covers: resolution
  for (const l of lines(text)) {
    const r = l.match(/^#{3,4}\s*(Requirement|Scenario):\s*(.+)$/);
    if (r) specCoversNames.push(r[2].trim());
  }
}

// proposal
const proposalText = readIf(path.join(changeDir, "proposal.md"));
let caps = { new: [], modified: [] };
if (proposalText == null) {
  err("proposal.md", 0, "proposal.md not found in change dir");
} else {
  caps = parseProposal("proposal.md", proposalText);
}

// proposal <-> spec-file correspondence
const specCapNames = new Set(specFiles.map((s) => s.cap));
const proposalCapNames = new Set([...caps.new, ...caps.modified].map((c) => c.name));
for (const c of caps.new) {
  if (!specCapNames.has(c.name)) {
    err("proposal.md", c.line, `New Capability "${c.name}" has no specs/${c.name}/spec.md`);
  }
}
for (const sf of specFiles) {
  if (!proposalCapNames.has(sf.cap)) {
    err(rel(sf.path), 0, `spec file for "${sf.cap}" has no matching capability in proposal.md Capabilities`);
  }
}

// design
const designText = readIf(path.join(changeDir, "design.md"));
if (designText == null) {
  err("design.md", 0, "design.md not found - it is mandatory for every change");
} else {
  lintDesign("design.md", designText, specCoversNames);
}

// tasks
const tasksText = readIf(path.join(changeDir, "tasks.md"));
if (tasksText == null) {
  err("tasks.md", 0, "tasks.md not found in change dir");
} else {
  lintTasks("tasks.md", tasksText);
}

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------

findings.sort((a, b) => {
  if (a.file !== b.file) return a.file < b.file ? -1 : 1;
  return a.line - b.line;
});

const errCount = findings.filter((f) => f.level === "ERROR").length;
const warnCount = findings.length - errCount;

for (const f of findings) {
  const loc = f.line ? `${f.file}:${f.line}` : f.file;
  console.log(`${f.level} ${loc}  ${f.msg}`);
}

if (findings.length === 0) {
  console.log("OK - no structural findings");
} else {
  console.log(`\n${errCount} error(s), ${warnCount} warning(s)`);
}

process.exit(errCount > 0 ? 1 : 0);
