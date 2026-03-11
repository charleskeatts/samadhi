#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "Session start hook running..."

# No dependencies yet — this hook is ready to grow with the project.
# Add package installs here as the project evolves, e.g.:
#   npm install
#   pip install -r requirements.txt

echo "Environment ready."
