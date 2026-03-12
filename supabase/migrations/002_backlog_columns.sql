-- 002_backlog_columns.sql
-- Adds category and blocker_score to feature_requests for Revenue Priority backlog view

ALTER TABLE feature_requests
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS blocker_score INTEGER NOT NULL DEFAULT 3
    CHECK (blocker_score BETWEEN 1 AND 5);
