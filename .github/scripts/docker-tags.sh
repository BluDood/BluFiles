#!/bin/bash
set -euo pipefail

IMAGE="ghcr.io/bludood/files"
REF_NAME="$1"
SHA="$2"

VERSION="${REF_NAME#v}"

TAGS="$IMAGE:latest,$IMAGE:$SHA"

if [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  MAJOR="${VERSION%%.*}"
  MINOR="${VERSION%.*}"
  TAGS="$TAGS,$IMAGE:$VERSION"
  TAGS="$TAGS,$IMAGE:$MINOR"
  TAGS="$TAGS,$IMAGE:$MAJOR"
else
  TAGS="$TAGS,$IMAGE:$VERSION"
fi

echo "tags=$TAGS" >> "$GITHUB_OUTPUT"
