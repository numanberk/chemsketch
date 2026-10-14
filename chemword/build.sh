#!/bin/sh
# Rebuilds index.html (the single self-contained page) from src/.
cd "$(dirname "$0")" || exit 1
{ cat src/w-head.html; printf '\n<script>\n'; cat src/core.js; printf '\n'; cat src/w-app.js; printf '\n'; cat src/w-cd.js; printf '\n</script>\n'; } > index.html
