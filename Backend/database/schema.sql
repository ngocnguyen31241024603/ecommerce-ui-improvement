-- Khén Nọc — SQLite schema
-- Requires SQLite with foreign key support. FTS5 is available in standard modern builds.
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version       INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  applied_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  display_name  TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 80),
  email         TEXT COLLATE NOCASE UNIQUE,
  avatar_url    TEXT,
  timezone      TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at    TEXT
);

CREATE TABLE IF NOT EXISTS workspaces (
  id            TEXT PRIMARY KEY,
  owner_id      TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name          TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100),
  slug          TEXT NOT NULL COLLATE NOCASE UNIQUE,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at    TEXT
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TRIGGER IF NOT EXISTS trg_workspace_owner_member
AFTER INSERT ON workspaces
FOR EACH ROW
BEGIN
  INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
END;

CREATE TABLE IF NOT EXISTS categories (
  id            TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 60),
  slug          TEXT NOT NULL COLLATE NOCASE,
  color         TEXT NOT NULL DEFAULT '#8BCFEA' CHECK (color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  archived_at   TEXT,
  UNIQUE (workspace_id, slug),
  UNIQUE (workspace_id, id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id     TEXT,
  created_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  assigned_to     TEXT REFERENCES users(id) ON DELETE SET NULL,
  title           TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  description     TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 10000),
  status          TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done', 'cancelled')),
  priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date        TEXT NOT NULL CHECK (due_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  due_time        TEXT CHECK (due_time IS NULL OR due_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  timezone        TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  estimate_minutes INTEGER CHECK (estimate_minutes IS NULL OR estimate_minutes BETWEEN 1 AND 100000),
  completed_at    TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at      TEXT,
  CHECK (due_time IS NULL OR substr(due_time, 1, 2) BETWEEN '00' AND '23'),
  FOREIGN KEY (workspace_id, category_id) REFERENCES categories(workspace_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS labels (
  id            TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL COLLATE NOCASE CHECK (length(trim(name)) BETWEEN 1 AND 40),
  color         TEXT NOT NULL DEFAULT '#75BDE0' CHECK (color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  UNIQUE (workspace_id, name)
);

CREATE TABLE IF NOT EXISTS task_labels (
  task_id       TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id      TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  added_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (task_id, label_id)
);

CREATE TABLE IF NOT EXISTS task_comments (
  id            TEXT PRIMARY KEY,
  task_id       TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  body          TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 5000),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at    TEXT
);

CREATE TABLE IF NOT EXISTS task_reminders (
  id            TEXT PRIMARY KEY,
  task_id       TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  remind_at     TEXT NOT NULL,
  channel       TEXT NOT NULL DEFAULT 'in-app' CHECK (channel IN ('in-app', 'email', 'push')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed', 'failed')),
  sent_at       TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (task_id, user_id, remind_at, channel)
);

CREATE TABLE IF NOT EXISTS recurrence_rules (
  id            TEXT PRIMARY KEY,
  task_id       TEXT NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
  rrule         TEXT NOT NULL CHECK (length(trim(rrule)) <= 500),
  timezone      TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  starts_at     TEXT NOT NULL,
  ends_at       TEXT,
  next_run_at   TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS task_events (
  id            TEXT PRIMARY KEY,
  task_id       TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_type    TEXT NOT NULL CHECK (event_type IN ('created', 'updated', 'status-changed', 'assigned', 'commented', 'deleted', 'restored')),
  field_name    TEXT,
  old_value     TEXT,
  new_value     TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Query paths used by the app: workspace/day agenda, status board, priority queue,
-- assignment inbox, reminders and audit history.
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_due ON tasks(workspace_id, due_date, due_time) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_status ON tasks(workspace_id, status, due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_priority ON tasks(workspace_id, priority, due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_due ON tasks(assigned_to, due_date, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id, due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_task_labels_label ON task_labels(label_id, task_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_created ON task_comments(task_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reminders_due ON task_reminders(status, remind_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_events_task_created ON task_events(task_id, created_at DESC);

-- Keep updated_at consistent even when changes bypass the HTTP API.
CREATE TRIGGER IF NOT EXISTS trg_tasks_updated_at
AFTER UPDATE ON tasks
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE tasks SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_categories_updated_at
AFTER UPDATE ON categories
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE categories SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_task_created_event
AFTER INSERT ON tasks
FOR EACH ROW
BEGIN
  INSERT INTO task_events (id, task_id, actor_id, event_type, new_value)
  VALUES (lower(hex(randomblob(16))), NEW.id, NEW.created_by, 'created', NEW.title);
END;

CREATE TRIGGER IF NOT EXISTS trg_task_status_event
AFTER UPDATE OF status ON tasks
FOR EACH ROW WHEN OLD.status <> NEW.status
BEGIN
  INSERT INTO task_events (id, task_id, actor_id, event_type, field_name, old_value, new_value)
  VALUES (lower(hex(randomblob(16))), NEW.id, NEW.assigned_to, 'status-changed', 'status', OLD.status, NEW.status);
END;

-- Full-text search index. Keep in sync with tasks and exclude soft-deleted rows.
CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(
  title, description,
  content='tasks', content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS trg_tasks_fts_insert
AFTER INSERT ON tasks
FOR EACH ROW WHEN NEW.deleted_at IS NULL
BEGIN
  INSERT INTO tasks_fts (rowid, title, description) VALUES (NEW.rowid, NEW.title, NEW.description);
END;

CREATE TRIGGER IF NOT EXISTS trg_tasks_fts_delete
AFTER DELETE ON tasks
FOR EACH ROW
BEGIN
  INSERT INTO tasks_fts (tasks_fts, rowid, title, description) VALUES ('delete', OLD.rowid, OLD.title, OLD.description);
END;

CREATE TRIGGER IF NOT EXISTS trg_tasks_fts_update
AFTER UPDATE OF title, description, deleted_at ON tasks
FOR EACH ROW
BEGIN
  INSERT INTO tasks_fts (tasks_fts, rowid, title, description) VALUES ('delete', OLD.rowid, OLD.title, OLD.description);
  INSERT INTO tasks_fts (rowid, title, description)
  SELECT NEW.rowid, NEW.title, NEW.description WHERE NEW.deleted_at IS NULL;
END;

-- Example search query:
-- SELECT tasks.* FROM tasks JOIN tasks_fts ON tasks_fts.rowid = tasks.rowid
-- WHERE tasks.workspace_id = :workspace_id AND tasks.deleted_at IS NULL
--   AND tasks_fts MATCH :query ORDER BY rank;
