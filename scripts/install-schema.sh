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

DEST="$(pwd)/openspec/schemas/${SCHEMA_NAME}"
CONFIG="$(pwd)/openspec/config.yaml"

case "$REPO" in
  http*|git@*) URL="$REPO" ;;
  *) URL="https://github.com/${REPO}.git" ;;
esac

if [ -z "$REF" ]; then
  REF="$(git ls-remote --tags --sort='-v:refname' "$URL" 2>/dev/null | head -1 | sed 's|.*refs/tags/||')"
  if [ -z "$REF" ]; then
    echo "Error: no tags found on ${URL} and no ref given" >&2
    exit 1
  fi
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Fetching '${SCHEMA_NAME}' from ${URL} (ref ${REF})..."
if ! git clone --depth 1 --branch "$REF" "$URL" "$TMP/repo" 2>/dev/null; then
  echo "Error: failed to clone ${URL} at ref ${REF}" >&2
  echo "       (private repo? use an SSH url or a token: https://github.com/settings/tokens)" >&2
  exit 1
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
npx --yes skills@latest add mattpocock/skills --skill grill-me grilling tdd --agent '*' -y < /dev/null || {
  echo "Error: failed to install grill-me/grilling/tdd from mattpocock/skills" >&2
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

mkdir -p "$(dirname "$CONFIG")"
if [ -f "$CONFIG" ]; then
  grep -vE '^schema:' "$CONFIG" > "${CONFIG}.tmp" || true
else
  : > "${CONFIG}.tmp"
fi
printf 'schema: %s\n' "$SCHEMA_NAME" >> "${CONFIG}.tmp"
mv "${CONFIG}.tmp" "$CONFIG"

echo "Installed '${SCHEMA_NAME}' -> ${DEST}"
echo "Installed skills -> .agents/skills/ (grill-me, grilling, tdd, stride-analysis-patterns, threat-mitigation-mapping, security-requirement-extraction, hrt-align-consistency-review, hrt-apply-code-review, hrt-adversarial-authoring)"
echo "Set default schema -> ${SCHEMA_NAME} (${CONFIG})"
echo "Use it:  openspec new change <name>"
