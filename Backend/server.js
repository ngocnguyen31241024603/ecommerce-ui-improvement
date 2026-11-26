const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { openStore } = require('./database/store');

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = process.env.TODO_DB_PATH || path.join(DATA_DIR, 'todo.sqlite');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
function seedTasks() {
  const today = localDate();
  const base = [
    { title: 'Thực hành HTML có sử dụng Animation', description: 'Tạo trang HTML sinh động với keyframes, transition và hiệu ứng chuyển động.', category: 'Học tập', priority: 'high', status: 'done', dueTime: '08:30' },
    { title: 'Cài đặt Node.js', description: 'Cài Node.js và kiểm tra phiên bản bằng terminal.', category: 'Học tập', priority: 'medium', status: 'done', dueTime: '09:30' },
    { title: 'Cài đặt để mở trang localhost:8080', description: 'Khởi chạy web server local và kiểm tra trang trên trình duyệt.', category: 'Học tập', priority: 'high', status: 'in-progress', dueTime: '10:30' },
    { title: 'Thực hành làm Todo App', description: 'Xây dựng ứng dụng quản lý task với giao diện hiện đại và thao tác CRUD.', category: 'Dự án', priority: 'high', status: 'todo', dueTime: '13:30' }
  ];
  return base.map((task, index) => ({ id: randomUUID(), ...task, dueDate: today, createdAt: new Date(Date.now() - (base.length - index) * 3600000).toISOString(), updatedAt: new Date().toISOString() }));
}
function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type.includes('json') ? JSON.stringify(body) : body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('JSON không hợp lệ')); } });
    req.on('error', reject);
  });
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validTask(input) {
  return input && typeof input.title === 'string' && input.title.trim() && input.title.trim().length <= 200 &&
    ['todo', 'in-progress', 'done'].includes(input.status) &&
    ['low', 'medium', 'high'].includes(input.priority) &&
    validDate(input.dueDate) &&
    (!input.dueTime || (typeof input.dueTime === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(input.dueTime))) &&
    (input.category == null || (typeof input.category === 'string' && input.category.trim().length <= 60)) &&
    (input.description == null || (typeof input.description === 'string' && input.description.trim().length <= 10000));
}

function taskFields(input) {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || '',
    category: input.category?.trim() || 'Cá nhân',
    priority: input.priority,
    status: input.status,
    dueDate: input.dueDate,
    dueTime: input.dueTime || ''
  };
}

const store = openStore(DB_FILE, path.join(DATA_DIR, 'tasks.json'), seedTasks);
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    try {
      if (url.pathname === '/api/health' && req.method === 'GET') return send(res, 200, { ok: true, storage: 'sqlite' });
      if (url.pathname === '/api/categories' && req.method === 'GET') return send(res, 200, store.categories());
      if (url.pathname === '/api/categories' && req.method === 'POST') {
        const body = await readBody(req);
        const name = typeof body?.name === 'string' ? body.name.trim() : '';
        if (!name || name.length > 60) return send(res, 400, { error: 'Tên danh mục chưa hợp lệ.' });
        if (!store.addCategory(name)) return send(res, 409, { error: 'Danh mục đã tồn tại.' });
        return send(res, 201, { name });
      }
      if (url.pathname === '/api/tasks' && req.method === 'GET') {
        return send(res, 200, store.list(url.searchParams.get('date')));
      }
      if (url.pathname === '/api/tasks' && req.method === 'POST') {
        const body = await readBody(req);
        if (!validTask(body)) return send(res, 400, { error: 'Thông tin task chưa hợp lệ.' });
        const now = new Date().toISOString();
        return send(res, 201, store.create({
          id: randomUUID(), ...taskFields(body), createdAt: now, updatedAt: now,
          completedAt: body.status === 'done' ? now : null
        }));
      }
      const match = url.pathname.match(/^\/api\/tasks\/([\w-]+)$/);
      if (match) {
        const body = req.method === 'PATCH' ? await readBody(req) : {};
        const current = store.find(match[1]);
        if (!current) return send(res, 404, { error: 'Không tìm thấy task.' });
        if (req.method === 'PATCH') {
          const next = { ...current, ...body };
          if (!validTask(next)) return send(res, 400, { error: 'Thông tin task chưa hợp lệ.' });
          const now = new Date().toISOString();
          return send(res, 200, store.update({
            id: current.id, ...taskFields(next), updatedAt: now,
            completedAt: next.status === 'done' ? (current.completedAt || now) : null
          }));
        }
        if (req.method === 'DELETE') {
          store.remove(current.id, new Date().toISOString());
          return send(res, 200, current);
        }
      }
      return send(res, 404, { error: 'API không tồn tại.' });
    } catch (error) { return send(res, 400, { error: error.message || 'Không thể xử lý yêu cầu.' }); }
  }

  let requested = 'index.html';
  try {
    if (url.pathname !== '/') requested = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  } catch {
    return send(res, 400, 'Đường dẫn chưa hợp lệ.', 'text/plain; charset=utf-8');
  }
  const file = path.resolve(PUBLIC_DIR, requested);
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
  fs.readFile(file, (error, contents) => {
    if (error) return send(res, 404, 'Không tìm thấy trang.', 'text/plain; charset=utf-8');
    send(res, 200, contents, MIME[path.extname(file)] || 'application/octet-stream');
  });
});

server.listen(PORT, '127.0.0.1', () => console.log(`Todo App đang chạy tại http://localhost:${PORT}`));
