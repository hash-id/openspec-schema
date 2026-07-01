#!/usr/bin/env bash
set -euo pipefail

REPO="hash-id/openspec-schema"
BRANCH="master"
SCHEMA_NAME="hash"
SCHEMA_PATH="openspec/schemas/${SCHEMA_NAME}"

command -v git >/dev/null 2>&1 || {
  echo "Error: git is required." >&2
  exit 1
}

DEST="$(pwd)/openspec/schemas/${SCHEMA_NAME}"
CONFIG="$(pwd)/openspec/config.yaml"

case "$REPO" in
  http*|git@*) URL="$REPO" ;;
  *) URL="https://github.com/${REPO}.git" ;;
esac

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Fetching '${SCHEMA_NAME}' from ${URL} (branch ${BRANCH})..."
if ! git clone --depth 1 --branch "$BRANCH" "$URL" "$TMP/repo" 2>/dev/null; then
  echo "Error: failed to clone ${URL} at branch ${BRANCH}" >&2
  echo "       (private repo? use an SSH url or a token: https://github.com/settings/tokens)" >&2
  exit 1
fi

SRC="$TMP/repo/${SCHEMA_PATH}"
if [ ! -f "$SRC/schema.yaml" ]; then
  echo "Error: schema.yaml not found at '${SCHEMA_PATH}' in the repo" >&2
  exit 1
fi

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -R "$SRC" "$DEST"

mkdir -p "$(dirname "$CONFIG")"
if [ -f "$CONFIG" ]; then
  grep -vE '^[[:space:]]*schema:' "$CONFIG" > "${CONFIG}.tmp" || true
else
  : > "${CONFIG}.tmp"
fi
printf 'schema: %s\n' "$SCHEMA_NAME" >> "${CONFIG}.tmp"
mv "${CONFIG}.tmp" "$CONFIG"

echo "Installed '${SCHEMA_NAME}' -> ${DEST}"
echo "Set default schema -> ${SCHEMA_NAME} (${CONFIG})"
echo "Use it:  openspec new change <name>"
