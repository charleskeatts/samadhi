#!/usr/bin/env python3
"""
Decision Logger — log decisions to decisions.csv with automatic 30-day review dates.

Usage:
    Interactive mode:
        python log_decision.py

    Inline mode (all flags):
        python log_decision.py \
            --decision "Switch to PostgreSQL" \
            --reasoning "Better support for complex queries" \
            --outcome "Query times under 50ms for 99th percentile"

    List all decisions:
        python log_decision.py --list

    List only REVIEW DUE decisions:
        python log_decision.py --list --due
"""

import argparse
import csv
import os
import sys
from datetime import date, timedelta

CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "decisions.csv")
FIELDNAMES = ["date", "decision", "reasoning", "expected_outcome", "review_date", "status"]


def load_decisions():
    if not os.path.exists(CSV_PATH):
        return []
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def save_decisions(rows):
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)


def append_decision(decision: str, reasoning: str, expected_outcome: str):
    today = date.today()
    review_date = today + timedelta(days=30)
    row = {
        "date": today.isoformat(),
        "decision": decision.strip(),
        "reasoning": reasoning.strip(),
        "expected_outcome": expected_outcome.strip(),
        "review_date": review_date.isoformat(),
        "status": "PENDING",
    }

    file_exists = os.path.exists(CSV_PATH)
    with open(CSV_PATH, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        if not file_exists or os.path.getsize(CSV_PATH) == 0:
            writer.writeheader()
        writer.writerow(row)

    return row


def prompt(label: str, required: bool = True) -> str:
    while True:
        value = input(f"{label}: ").strip()
        if value:
            return value
        if not required:
            return ""
        print("  (this field is required — please enter a value)")


def interactive_mode():
    print("\n--- New Decision Entry ---")
    decision = prompt("Decision")
    reasoning = prompt("Reasoning")
    expected_outcome = prompt("Expected outcome")
    row = append_decision(decision, reasoning, expected_outcome)
    print(f"\nLogged successfully.")
    print(f"  Date:          {row['date']}")
    print(f"  Review due:    {row['review_date']}")
    print(f"  Status:        {row['status']}")


def list_decisions(due_only: bool = False):
    rows = load_decisions()
    if not rows:
        print("No decisions logged yet.")
        return

    today = date.today()
    filtered = []
    for r in rows:
        if due_only and r.get("status") != "REVIEW DUE":
            continue
        filtered.append(r)

    if not filtered:
        print("No matching decisions found.")
        return

    col_widths = {
        "date": 10,
        "review_date": 11,
        "status": 10,
        "decision": 35,
    }
    header = (
        f"{'Date':<{col_widths['date']}}  "
        f"{'Review Due':<{col_widths['review_date']}}  "
        f"{'Status':<{col_widths['status']}}  "
        f"Decision"
    )
    print(header)
    print("-" * (len(header) + 10))

    for r in filtered:
        status = r.get("status", "PENDING")
        marker = " <<< REVIEW DUE" if status == "REVIEW DUE" else ""
        decision_preview = r["decision"]
        if len(decision_preview) > col_widths["decision"]:
            decision_preview = decision_preview[: col_widths["decision"] - 1] + "…"
        print(
            f"{r['date']:<{col_widths['date']}}  "
            f"{r['review_date']:<{col_widths['review_date']}}  "
            f"{status:<{col_widths['status']}}  "
            f"{decision_preview}{marker}"
        )


def main():
    parser = argparse.ArgumentParser(
        description="Log a decision to decisions.csv with a 30-day review date."
    )
    parser.add_argument("--decision", help="Short description of the decision made")
    parser.add_argument("--reasoning", help="Why this decision was made")
    parser.add_argument("--outcome", help="Expected outcome")
    parser.add_argument("--list", action="store_true", help="List all logged decisions")
    parser.add_argument(
        "--due", action="store_true", help="With --list: show only REVIEW DUE decisions"
    )
    args = parser.parse_args()

    if args.list:
        list_decisions(due_only=args.due)
        return

    if args.decision and args.reasoning and args.outcome:
        row = append_decision(args.decision, args.reasoning, args.outcome)
        print(f"Logged: {row['decision']!r} — review due {row['review_date']}")
        return

    if any([args.decision, args.reasoning, args.outcome]):
        print("Error: --decision, --reasoning, and --outcome must all be provided together.")
        sys.exit(1)

    interactive_mode()


if __name__ == "__main__":
    main()
