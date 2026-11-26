const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const OWNER = 'ngoc';
const WORKSPACE = 'personal';
const DEFAULT_CATEGORIES = ['Học tập', 'Dự án', 'Cá nhân'];
const TASK_FIELDS = `
  SELECT t.id, t.title, t.description, COALESCE(c.name, 'Cá nhân') AS category,
         t.priority, t.status, t.due_date AS dueDate, COALESCE(t.due_time, '') AS dueTime,
         t.created_at AS createdAt, t.updated_at AS updatedAt, t.completed_at AS completedAt
  FROM tasks AS t
  LEFT JOIN categories AS c ON c.workspace_id = t.workspace_id AND c.id = t.category_id
  WHERE t.workspace_id = ? AND t.deleted_at IS NULL
`;

function openStore(filename, legacyFile, seedTasks) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

  const categoryId = db.prepare('SELECT id FROM categories WHERE workspace_id = ? AND slug = ?');
  const insertCategory = db.prepare('INSERT INTO categories (id, workspace_id, name, slug) VALUES (?, ?, ?, ?)');
  const listCategories = db.prepare('SELECT name FROM categories WHERE workspace_id = ? ORDER BY sort_order, rowid');
  const insertTask = db.prepare(`
    INSERT INTO tasks (id, workspace_id, created_by, category_id, title, description,
                       priority, status, due_date, due_time, created_at, updated_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateTask = db.prepare(`
    UPDATE tasks SET category_id = ?, title = ?, description = ?, priority = ?, status = ?,
      due_date = ?, due_time = ?, updated_at = ?, completed_at = ?
    WHERE workspace_id = ? AND id = ? AND deleted_at IS NULL
  `);
  const softDeleteTask = db.prepare('UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE workspace_id = ? AND id = ? AND deleted_at IS NULL');
  const allTasks = db.prepare(TASK_FIELDS + ' ORDER BY t.due_time IS NULL, t.due_time, t.id');
  const tasksByDate = db.prepare(TASK_FIELDS + ' AND t.due_date = ? ORDER BY t.due_time IS NULL, t.due_time, t.id');
  const taskById = db.prepare(TASK_FIELDS + ' AND t.id = ?');

  function transaction(work) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = work();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  function getOrCreateCategory(name) {
    const slug = name.normalize('NFC').toLocaleLowerCase('vi');
    const existing = categoryId.get(WORKSPACE, slug);
    if (existing) return existing.id;
    const id = randomUUID();
    insertCategory.run(id, WORKSPACE, name, slug);
    return id;
  }

  function insert(task) {
    insertTask.run(task.id, WORKSPACE, OWNER, getOrCreateCategory(task.category), task.title,
      task.description, task.priority, task.status, task.dueDate, task.dueTime || null,
      task.createdAt, task.updatedAt, task.completedAt);
    return taskById.get(WORKSPACE, task.id);
  }

  transaction(() => {
    if (db.prepare('SELECT 1 FROM schema_migrations WHERE version = 1').get()) return;
    db.prepare('INSERT OR IGNORE INTO users (id, display_name) VALUES (?, ?)').run(OWNER, 'Ngọc');
    db.prepare('INSERT OR IGNORE INTO workspaces (id, owner_id, name, slug) VALUES (?, ?, ?, ?)')
      .run(WORKSPACE, OWNER, 'Khén Nọc', WORKSPACE);
    DEFAULT_CATEGORIES.forEach(getOrCreateCategory);
    const tasks = fs.existsSync(legacyFile) ? JSON.parse(fs.readFileSync(legacyFile, 'utf8')) : seedTasks();
    for (const task of tasks) {
      insert({
        ...task,
        category: task.category?.trim() || 'Cá nhân',
        completedAt: task.status === 'done' ? (task.completedAt || task.updatedAt) : null
      });
    }
    db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(1, 'Khởi tạo dữ liệu Todo');
  });

  return {
    list: date => date ? tasksByDate.all(WORKSPACE, date) : allTasks.all(WORKSPACE),
    find: id => taskById.get(WORKSPACE, id),
    categories: () => listCategories.all(WORKSPACE).map(category => category.name),
    addCategory: name => transaction(() => {
      if (categoryId.get(WORKSPACE, name.normalize('NFC').toLocaleLowerCase('vi'))) return false;
      getOrCreateCategory(name);
      return true;
    }),
    create: task => transaction(() => insert(task)),
    update: task => transaction(() => {
      updateTask.run(getOrCreateCategory(task.category), task.title, task.description, task.priority,
        task.status, task.dueDate, task.dueTime || null, task.updatedAt, task.completedAt, WORKSPACE, task.id);
      return taskById.get(WORKSPACE, task.id);
    }),
    remove: (id, timestamp) => softDeleteTask.run(timestamp, timestamp, WORKSPACE, id)
  };
}

module.exports = { openStore };
