#!/usr/bin/env bash
# setup_cron.sh — Install the daily decision review cron job.
#
# The cron job runs at 08:00 every morning and:
#   1. Flags decisions that have hit their 30-day review date (status → REVIEW DUE)
#   2. Appends a timestamped report to decision_review.log
#
# Usage:
#   chmod +x setup_cron.sh
#   ./setup_cron.sh
#
# To remove the cron job later:
#   crontab -e   →  delete the line containing review_checker.py

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECKER="$SCRIPT_DIR/review_checker.py"
LOG_FILE="$SCRIPT_DIR/decision_review.log"
PYTHON="$(command -v python3 || command -v python)"

if [[ -z "$PYTHON" ]]; then
    echo "Error: python3 not found on PATH."
    exit 1
fi

CRON_LINE="0 8 * * * $PYTHON $CHECKER >> $LOG_FILE 2>&1"
CRON_MARKER="review_checker.py"

# Load current crontab (suppress error if none exists yet)
CURRENT_CRON="$(crontab -l 2>/dev/null || true)"

if echo "$CURRENT_CRON" | grep -qF "$CRON_MARKER"; then
    echo "Cron job already installed:"
    echo "$CURRENT_CRON" | grep "$CRON_MARKER"
    exit 0
fi

# Append the new job and install
(echo "$CURRENT_CRON"; echo "$CRON_LINE") | crontab -

echo "Cron job installed successfully."
echo "  Schedule : every day at 08:00"
echo "  Command  : $PYTHON $CHECKER"
echo "  Log file : $LOG_FILE"
echo ""
echo "Run 'crontab -l' to verify, or 'crontab -e' to edit."
