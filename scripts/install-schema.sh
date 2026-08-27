#!/usr/bin/env bash
set -euo pipefail

REPO="hash-id/openspec-schema"
SCHEMA_NAME="tempa-spec"
SCHEMA_PATH="openspec/schemas/${SCHEMA_NAME}"
REF="${1:-}"

command -v git >/dev/null 2>&1 || {
  echo "Error: git is required." >&2
  exit 1
}
command -v npx >/dev/null 2>&1 || {
  echo "Error: npx (Node.js) is required." >&2
  exit 1
}
command -v npm >/dev/null 2>&1 || {
  echo "Error: npm (Node.js) is required." >&2
  exit 1
}
command -v node >/dev/null 2>&1 || {
  echo "Error: node (Node.js) is required." >&2
  exit 1
}

DEST="$(pwd)/openspec/schemas/${SCHEMA_NAME}"
CONFIG="$(pwd)/openspec/config.yaml"

case "$REPO" in
  http*|git@*) URL="$REPO" ;;
  *) URL="https://github.com/${REPO}.git" ;;
esac

if [ -z "$REF" ]; then
  REF="$(git ls-remote --tags --sort='-v:refname' "$URL" 2>/dev/null | grep -v '\^{}$' | head -1 | sed 's|.*refs/tags/||')"
  if [ -z "$REF" ]; then
    echo "Error: no tags found on ${URL} and no ref given" >&2
    exit 1
  fi
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Fetching '${SCHEMA_NAME}' from ${URL} (ref ${REF})..."
if ! git clone --depth 1 --branch "$REF" "$URL" "$TMP/repo" 2>/dev/null; then
  echo "Branch/tag clone failed, trying '${REF}' as a commit SHA..."
  mkdir -p "$TMP/repo"
  if ! git -C "$TMP/repo" init -q \
    || ! git -C "$TMP/repo" remote add origin "$URL" \
    || ! git -C "$TMP/repo" fetch --depth 1 origin "$REF" 2>/dev/null \
    || ! git -C "$TMP/repo" checkout -q FETCH_HEAD; then
    echo "Error: failed to fetch ${URL} at ref ${REF} (tried as branch/tag and as commit SHA)" >&2
    echo "       (private repo? use an SSH url or a token: https://github.com/settings/tokens)" >&2
    exit 1
  fi
fi

SRC="$TMP/repo/${SCHEMA_PATH}"
if [ ! -f "$SRC/schema.yaml" ]; then
  echo "Error: schema.yaml not found at '${SCHEMA_PATH}' in the repo" >&2
  exit 1
fi

rm -rf "$DEST"
mkdir -p "$DEST/templates"
cp "$SRC/schema.yaml" "$DEST/schema.yaml"
shopt -s nullglob
for f in "$SRC"/templates/*; do
  [ -f "$f" ] && cp "$f" "$DEST/templates/"
done
shopt -u nullglob

echo "Installing skills..."
npx --yes skills@latest add mattpocock/skills --skill grilling tdd diagnosing-bugs research --agent '*' -y < /dev/null || {
  echo "Error: failed to install grilling/tdd/diagnosing-bugs/research from mattpocock/skills" >&2
  exit 1
}
npx --yes skills@latest add wshobson/agents --skill stride-analysis-patterns threat-mitigation-mapping security-requirement-extraction --agent '*' -y < /dev/null || {
  echo "Error: failed to install security skills from wshobson/agents" >&2
  exit 1
}
npx --yes skills@latest add "${REPO}/skills" --agent '*' -y < /dev/null || {
  echo "Error: failed to install hrt-* skills from ${REPO}/skills" >&2
  exit 1
}
npx --yes skills@latest add blader/humanizer --skill humanizer --agent '*' -y < /dev/null || {
  echo "Error: failed to install humanizer from blader/humanizer" >&2
  exit 1
}

mkdir -p "$(dirname "$CONFIG")"
echo "Writing schema + tooling context to ${CONFIG}..."
(cd "$TMP" && npm install --no-save --silent yaml < /dev/null) || {
  echo "Error: failed to install the 'yaml' npm package for config merging" >&2
  exit 1
}
cp "$TMP/repo/scripts/merge-config.cjs" "$TMP/merge-config.cjs"
CONTEXT_MARKER="# tempa-spec: tooling preference"
CONTEXT_TEXT="MUST use codegraph and ripgrep (\`rg\`) together for all codebase exploration, in every phase of this schema. Use codebase-memory-mcp or built-in grep/glob only if both are unavailable."
node "$TMP/merge-config.cjs" "$CONFIG" "$SCHEMA_NAME" "$CONTEXT_MARKER" "$CONTEXT_TEXT" || {
  echo "Error: failed to write ${CONFIG}" >&2
  exit 1
}

echo "Installed '${SCHEMA_NAME}' -> ${DEST}"
echo "Installed skills -> .agents/skills/ (grilling, tdd, diagnosing-bugs, research, stride-analysis-patterns, threat-mitigation-mapping, security-requirement-extraction, hrt-align-consistency-review, hrt-apply-code-review, hrt-adversarial-authoring, plain-language-writing, hrt-change-size-gate, hrt-backlog-reconcile, hrt-dark-mode-opt-in, hrt-dark-mode-decision-gate, humanizer)"
echo "Set default schema -> ${SCHEMA_NAME} (${CONFIG})"
echo "Use it:  openspec new change <name>"
