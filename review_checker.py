#!/usr/bin/env python3
"""
Decision Review Checker — run daily via cron.

Scans decisions.csv and flags any decision whose review_date is today or in the past
(and whose status is not already REVIEWED) by setting status = "REVIEW DUE".

Prints a summary to stdout so cron can mail it or redirect it to a log file.

Cron example (runs at 08:00 every day):
    0 8 * * * /usr/bin/python3 /path/to/samadhi/review_checker.py >> /var/log/decision_review.log 2>&1
"""

import csv
import os
import sys
from datetime import date

CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "decisions.csv")
FIELDNAMES = ["date", "decision", "reasoning", "expected_outcome", "review_date", "status"]


def load_rows():
    if not os.path.exists(CSV_PATH):
        print(f"[review_checker] decisions.csv not found at {CSV_PATH}")
        sys.exit(0)
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def save_rows(rows):
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)


def check_reviews():
    today = date.today()
    rows = load_rows()

    newly_flagged = []
    already_due = []

    for row in rows:
        status = row.get("status", "PENDING").strip().upper()

        # Skip decisions already reviewed
        if status == "REVIEWED":
            continue

        try:
            review_date = date.fromisoformat(row["review_date"].strip())
        except (ValueError, KeyError):
            print(f"[review_checker] WARNING: invalid review_date for decision: {row.get('decision', '?')!r}")
            continue

        if review_date <= today:
            if status != "REVIEW DUE":
                row["status"] = "REVIEW DUE"
                newly_flagged.append(row)
            else:
                already_due.append(row)

    if newly_flagged:
        save_rows(rows)

    return newly_flagged, already_due


def print_report(newly_flagged, already_due):
    today = date.today()
    print(f"[{today}] Decision Review Check")
    print("=" * 50)

    if not newly_flagged and not already_due:
        print("No decisions are due for review today.")
        return

    if newly_flagged:
        print(f"\nNewly flagged as REVIEW DUE ({len(newly_flagged)}):")
        for row in newly_flagged:
            print(f"  - [{row['review_date']}] {row['decision']}")
            print(f"    Reasoning:        {row['reasoning']}")
            print(f"    Expected outcome: {row['expected_outcome']}")

    if already_due:
        print(f"\nStill awaiting review ({len(already_due)}):")
        for row in already_due:
            print(f"  - [{row['review_date']}] {row['decision']}")

    total = len(newly_flagged) + len(already_due)
    print(f"\nTotal decisions needing review: {total}")
    print("Run `python log_decision.py --list --due` to see all pending reviews.")


def main():
    newly_flagged, already_due = check_reviews()
    print_report(newly_flagged, already_due)

    # Exit with code 1 if there are any due reviews so cron/scripts can act on it
    if newly_flagged or already_due:
        sys.exit(1)


if __name__ == "__main__":
    main()
