# Disaster Recovery & Backup Design

**Date:** 2026-03-07
**Status:** Approved

---

## Problem

The Clairio codebase lives only on Charles's local Mac. A laptop failure, accidental deletion, or corrupted file system would mean total loss of the MVP.

---

## Solution: Two-Layer Backup (Option C)

Two independent, fully automatic backups. Zero manual effort after setup.

| Layer | Tool | What's backed up | When |
|---|---|---|---|
| Primary | GitHub | Every committed change, full history | On login + daily 9am |
| Secondary | Dropbox zip | All code including uncommitted work | On login + daily 9am |

Both triggered by a single macOS LaunchAgent.

---

## Layer 1: GitHub Auto-Push

- Runs `git push origin main` silently in the background
- Pushes any commits not yet on GitHub
- Does **not** auto-commit — only pushes existing commits
- Requires GitHub authentication to be set up (via macOS Keychain — see GitHub push setup)

**Recovery:** Browse `github.com/charleskeatts/samadhi`, download any file or the full zip

---

## Layer 2: Dropbox Zip Snapshot

- Dropbox is installed at `~/Library/CloudStorage/Dropbox`
- Script zips `/Users/charleskeatts/Projects/samadhi` to `~/Library/CloudStorage/Dropbox/Clairio Backups/clairio-YYYY-MM-DD.zip`
- **Excluded from zip:** `node_modules/`, `.next/`, `.env*` (secrets never leave the Mac)
- Estimated size: ~3–8 MB per snapshot
- Auto-deletes zips older than 14 days
- Creates `Clairio Backups/` folder automatically on first run

**Recovery:** Open Dropbox on any device, download the latest zip, `unzip`, run `npm install`

---

## Files Created

| File | Purpose |
|---|---|
| `~/scripts/clairio-backup.sh` | Shell script: zip to Dropbox + git push |
| `~/Library/LaunchAgents/com.clairio.backup.plist` | macOS LaunchAgent: runs on login + daily 9am |

---

## Activation (Two Terminal Commands)

After files are created, Charles runs:
```bash
chmod +x ~/scripts/clairio-backup.sh
launchctl load ~/Library/LaunchAgents/com.clairio.backup.plist
```

That's it — runs forever automatically.

---

## Disaster Recovery Playbook

| Scenario | Recovery |
|---|---|
| Accidentally deleted a file | Unzip latest Dropbox backup |
| Lost a specific commit | GitHub → browse history → download |
| Whole laptop dies | Download latest Dropbox zip → `unzip` → `npm install` → back in 5 min |
| Dropbox account lost | GitHub has all committed code |
| GitHub down | Dropbox zip has full snapshot |

---

## What's NOT backed up

- `node_modules/` — intentionally excluded (regenerated with `npm install`)
- `.env.local` — intentionally excluded (secrets; stored in 1Password or similar)
- `.next/` — intentionally excluded (regenerated with `npm run build`)
