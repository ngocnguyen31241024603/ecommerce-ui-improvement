const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const today = new Date();
const localDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dateISO = localDate(today);
const STATIC_MODE = location.hostname.endsWith('github.io');
const STORAGE_KEY = 'khen-noc:tasks:v1';
const CATEGORY_KEY = 'khen-noc:categories:v1';
const DEFAULT_CATEGORIES = ['Học tập', 'Dự án', 'Cá nhân'];
const state = { tasks: [], view: 'today', category: null, categories: [...DEFAULT_CATEGORIES], query: '', suggestions: [], activeSuggestion: 0 };
let pendingDeleteTask = null;
const statusNames = { todo: 'Cần làm', 'in-progress': 'Đang làm', done: 'Hoàn thành' };
const priorityNames = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const normalizeSearch = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi');

function formatDate(date) { return new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(date); }
function displayDate(dateValue) {
  if (!dateValue) return '';
  if (dateValue === dateISO) return 'Hôm nay';
  const date = new Date(`${dateValue}T00:00:00`);
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
}
function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2500);
}
async function api(url, options = {}) {
  if (STATIC_MODE) return staticApi(url, options);
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Có lỗi xảy ra, thử lại nhé.');
  return body;
}
function readStoredTasks() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  const now = new Date();
  const starterTasks = [
    { title: 'Thực hành HTML có sử dụng Animation', description: 'Tạo trang HTML sinh động với keyframes, transition và hiệu ứng chuyển động.', category: 'Học tập', priority: 'high', status: 'done', dueTime: '08:30' },
    { title: 'Cài đặt Node.js', description: 'Cài Node.js và kiểm tra phiên bản bằng terminal.', category: 'Học tập', priority: 'medium', status: 'done', dueTime: '09:30' },
    { title: 'Cài đặt để mở trang localhost:8080', description: 'Khởi chạy web server local và kiểm tra trang trên trình duyệt.', category: 'Học tập', priority: 'high', status: 'in-progress', dueTime: '10:30' },
    { title: 'Thực hành làm Todo App', description: 'Xây dựng ứng dụng quản lý task với giao diện hiện đại và thao tác CRUD.', category: 'Dự án', priority: 'high', status: 'todo', dueTime: '13:30' }
  ];
  const tasks = starterTasks.map((task, index) => ({ ...task, id: `sample-${index + 1}`, dueDate: dateISO, createdAt: new Date(now.getTime() - (starterTasks.length - index) * 3600000).toISOString(), updatedAt: now.toISOString(), completedAt: task.status === 'done' ? now.toISOString() : null }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  return tasks;
}
function staticApi(url, options = {}) {
  const route = new URL(url, location.href);
  const method = (options.method || 'GET').toUpperCase();
  if (route.pathname === '/api/health' && method === 'GET') return Promise.resolve({ ok: true, storage: 'browser-localStorage' });
  if (route.pathname === '/api/categories') {
    const stored = JSON.parse(localStorage.getItem(CATEGORY_KEY) || 'null') || DEFAULT_CATEGORIES;
    if (method === 'GET') return Promise.resolve(stored);
    if (method === 'POST') {
      const name = JSON.parse(options.body || '{}').name?.trim();
      if (!name || name.length > 60) return Promise.reject(new Error('Tên danh mục chưa hợp lệ.'));
      if (stored.some(item => item.toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'))) {
        return Promise.reject(new Error('Danh mục đã tồn tại.'));
      }
      localStorage.setItem(CATEGORY_KEY, JSON.stringify([...stored, name]));
      return Promise.resolve({ name });
    }
  }
  if (route.pathname === '/api/tasks' && method === 'GET') {
    let tasks = readStoredTasks();
    const date = route.searchParams.get('date');
    if (date) tasks = tasks.filter(task => task.dueDate === date);
    return Promise.resolve(tasks.sort((a, b) => (a.dueTime || '').localeCompare(b.dueTime || '')));
  }
  if (route.pathname === '/api/tasks' && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    if (!body.title?.trim() || !body.dueDate || !['todo', 'in-progress', 'done'].includes(body.status) || !['low', 'medium', 'high'].includes(body.priority)) return Promise.reject(new Error('Thông tin task chưa hợp lệ.'));
    const now = new Date().toISOString();
    const task = { ...body, id: crypto.randomUUID(), title: body.title.trim(), description: String(body.description || '').trim(), createdAt: now, updatedAt: now, completedAt: body.status === 'done' ? now : null };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...readStoredTasks(), task]));
    return Promise.resolve(task);
  }
  const match = route.pathname.match(/^\/api\/tasks\/([\w-]+)$/);
  if (match) {
    const tasks = readStoredTasks();
    const index = tasks.findIndex(task => task.id === match[1]);
    if (index < 0) return Promise.reject(new Error('Không tìm thấy task.'));
    if (method === 'PATCH') {
      const body = JSON.parse(options.body || '{}');
      const current = tasks[index];
      const now = new Date().toISOString();
      const task = { ...current, ...body, id: current.id, updatedAt: now };
      task.completedAt = task.status === 'done' ? (current.completedAt || now) : null;
      tasks[index] = task;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return Promise.resolve(task);
    }
    if (method === 'DELETE') {
      const [deleted] = tasks.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return Promise.resolve(deleted);
    }
  }
  return Promise.reject(new Error('API không tồn tại.'));
}
async function loadTasks() {
  try {
    [state.tasks, state.categories] = await Promise.all([api('/api/tasks'), api('/api/categories')]);
    for (const task of state.tasks) if (task.category && !state.categories.includes(task.category)) state.categories.push(task.category);
    $('#connection-label').textContent = STATIC_MODE ? 'Lưu trên trình duyệt' : 'Đã kết nối · lưu tự động';
    $('#connection-label').style.color = '#73d9aa';
    $('#storage-type').textContent = STATIC_MODE ? 'Bộ nhớ trình duyệt' : 'SQLite';
    $('#storage-detail').textContent = STATIC_MODE ? 'Lưu trên trình duyệt này' : 'Lưu tự động vào SQLite';
  } catch (error) {
    $('#connection-label').textContent = 'Không kết nối được';
    showToast(error.message);
  }
  render();
}
function visibleTasks() {
  let tasks = state.view === 'today' ? state.tasks.filter(task => task.dueDate === dateISO) : state.tasks;
  if (state.category) tasks = tasks.filter(task => task.category === state.category);
  const status = $('#status-filter').value;
  const priority = $('#priority-filter').value;
  if (status !== 'all') tasks = tasks.filter(task => task.status === status);
  if (priority !== 'all') tasks = tasks.filter(task => task.priority === priority);
  if (state.query.trim()) {
    const query = normalizeSearch(state.query.trim());
    tasks = tasks.filter(task => normalizeSearch(`${task.title} ${task.description} ${task.category}`).includes(query));
  }
  return [...tasks].sort((a, b) => (a.dueTime || '99:99').localeCompare(b.dueTime || '99:99'));
}
function renderTask(task, index) {
  const done = task.status === 'done';
  const catClass = task.category === 'Dự án' ? 'cat-project' : task.category === 'Cá nhân' ? 'cat-personal' : '';
  const taskDate = task.dueDate === dateISO ? '' : `<span class="task-status">${escapeHTML(displayDate(task.dueDate))}</span>`;
  return `<article class="task-row ${done ? 'is-done' : ''}" style="animation-delay:${Math.min(index * 35, 250)}ms" data-id="${escapeHTML(task.id)}">
    <button class="task-check" data-action="toggle" aria-label="${done ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}">✓</button>
    <div class="task-main"><div class="task-title-line"><span class="task-title" data-action="edit">${escapeHTML(task.title)}</span></div><div class="task-description">${escapeHTML(task.description || 'Chưa có mô tả')}</div><div class="task-meta"><span class="task-category ${catClass}">${escapeHTML(task.category || 'Cá nhân')}</span><span class="task-status status-${task.status}">${statusNames[task.status]}</span>${taskDate}</div></div>
    <div class="task-side"><span class="task-time">${escapeHTML(task.dueTime || '—')}</span><span class="priority-badge priority-${task.priority}">${task.priority === 'high' ? '↗' : task.priority === 'low' ? '↘' : '●'} ${priorityNames[task.priority]}</span><span class="task-actions"><button data-action="edit" title="Sửa task">✎</button><button data-action="delete" title="Xóa task">×</button></span></div>
  </article>`;
}
function renderCategories() {
  const counts = Object.fromEntries(state.categories.map(category => [category, state.tasks.filter(task => task.category === category).length]));
  $('#category-list').innerHTML = state.categories.map(category => `<button class="category-link" data-category="${escapeHTML(category)}"><i class="cat-dot"></i>${escapeHTML(category)}<small>${counts[category] || 0}</small></button>`).join('');
  $$('.category-link').forEach(button => button.classList.toggle('selected', state.category === button.dataset.category));
}
function renderChart() {
  const monday = new Date(today);
  monday.setDate(today.getDate() - (today.getDay() + 6) % 7);
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return localDate(date);
  });
  const counts = new Map(dates.map(date => [date, 0]));
  for (const task of state.tasks) {
    if (task.status !== 'done') continue;
    const timestamp = task.completedAt || task.updatedAt;
    if (!timestamp) continue;
    const date = localDate(new Date(timestamp));
    if (counts.has(date)) counts.set(date, counts.get(date) + 1);
  }
  const values = dates.map(date => counts.get(date));
  const largest = Math.max(1, ...values);
  $('#week-total').textContent = values.reduce((total, count) => total + count, 0);
  $('#chart-bars').innerHTML = values.map((value, index) => `<i class="chart-bar ${dates[index] === dateISO ? 'today' : ''}" style="--height:${value / largest * 100}%" title="${value} công việc"></i>`).join('');
  $('#chart-bars').parentElement.setAttribute('aria-label',
    `Công việc hoàn thành từ thứ Hai đến Chủ nhật theo thứ tự ${values.join(', ')}`);
}
function makeSuggestions(value) {
  const query = normalizeSearch(value.trim());
  const matches = [];
  const add = (item) => { if (!matches.some(existing => normalizeSearch(existing.query) === normalizeSearch(item.query))) matches.push(item); };
  const rankedTasks = state.tasks.map(task => {
    const title = normalizeSearch(task.title);
    const description = normalizeSearch(task.description);
    const category = normalizeSearch(task.category);
    const words = title.split(/[^a-z0-9]+/).filter(Boolean);
    const score = !query ? 0 : title.startsWith(query) ? 0 : words.some(word => word.startsWith(query)) ? 1 : title.includes(query) ? 2 : `${description} ${category}`.includes(query) ? 3 : -1;
    return { task, score };
  }).filter(item => item.score >= 0).sort((a, b) => a.score - b.score || (a.task.dueTime || '').localeCompare(b.task.dueTime || ''));
  rankedTasks.slice(0, 6).forEach(({ task }) => add({ query: task.title, label: task.title, detail: `Task · ${task.category}`, icon: '☷' }));
  if (query) {
    const terms = new Map();
    state.tasks.forEach(task => `${task.title} ${task.category} ${task.description}`.split(/[^\p{L}\p{N}]+/u).filter(Boolean).forEach(term => {
      if (normalizeSearch(term).startsWith(query) && normalizeSearch(term) !== query) terms.set(normalizeSearch(term), term);
    }));
    [...terms.values()].slice(0, 5).forEach(term => add({ query: term, label: term, detail: 'Từ khóa gợi ý', icon: '⌕' }));
    if (!matches.length) add({ query: value.trim(), label: `Tìm “${value.trim()}”`, detail: 'Tìm trong tất cả task', icon: '⌕' });
  }
  return matches.slice(0, 7);
}
function renderSuggestions() {
  const input = $('#search-input').value;
  state.suggestions = makeSuggestions(input);
  state.activeSuggestion = Math.min(state.activeSuggestion, Math.max(0, state.suggestions.length - 1));
  $('#suggestion-heading').textContent = input.trim() ? 'KẾT QUẢ GỢI Ý' : 'GỢI Ý CHO BẠN';
  $('#search-suggestions').innerHTML = state.suggestions.length ? state.suggestions.map((item, index) => `<button type="button" class="search-suggestion ${index === state.activeSuggestion ? 'is-active' : ''}" role="option" aria-selected="${index === state.activeSuggestion}" data-index="${index}"><span class="suggestion-icon">${item.icon}</span><span class="suggestion-copy"><strong>${escapeHTML(item.label)}</strong><small>${escapeHTML(item.detail)}</small></span><span class="suggestion-enter">↵</span></button>`).join('') : '<div class="suggestion-empty">Không có gợi ý phù hợp. Nhấn Enter để tìm nguyên cụm từ.</div>';
}
function openSearch() {
  $('#search-dialog').showModal();
  $('#search-input').value = state.query;
  state.activeSuggestion = 0;
  renderSuggestions();
  setTimeout(() => $('#search-input').focus(), 30);
}
function applySearch(query) {
  state.query = query.trim();
  state.view = 'all';
  state.category = null;
  $('#status-filter').value = 'all';
  $('#priority-filter').value = 'all';
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === 'all'));
  $('#page-crumb').textContent = state.query ? 'Kết quả tìm kiếm' : 'Tất cả task';
  $('#stats-page').classList.add('hidden');
  $('#dashboard-stats').classList.add('hidden');
  $('#content-grid').classList.remove('hidden');
  $('#search-dialog').close();
  $('#search-launch-label').textContent = state.query ? `Kết quả: ${state.query}` : 'Tìm kiếm task...';
  render();
}
function render() {
  const todayTasks = state.tasks.filter(task => task.dueDate === dateISO);
  const total = todayTasks.length;
  const done = todayTasks.filter(task => task.status === 'done').length;
  const progress = todayTasks.filter(task => task.status === 'in-progress').length;
  const high = todayTasks.filter(task => task.priority === 'high' && task.status !== 'done').length;
  const percent = total ? Math.round(done / total * 100) : 0;
  $('#stat-total').textContent = String(total).padStart(2, '0');
  $('#stat-done').innerHTML = `${String(done).padStart(2, '0')}<span class="stat-unit">/ ${String(total).padStart(2, '0')}</span>`;
  $('#stat-progress').textContent = String(progress).padStart(2, '0');
  $('#stat-priority').textContent = String(high).padStart(2, '0');
  $('#nav-today-count').textContent = total;
  $('#progress-copy').textContent = `${percent}% tiến độ`;
  $('#progress-fill').style.width = `${percent}%`;
  $('#stats-date').textContent = formatDate(today);
  const statusCounts = [
    ['Cần làm', todayTasks.filter(task => task.status === 'todo').length],
    ['Đang làm', todayTasks.filter(task => task.status === 'in-progress').length],
    ['Hoàn thành', done]
  ];
  $('#status-breakdown').innerHTML = statusCounts.map(([name, count]) => `<div class="breakdown-row"><span>${name}</span><div class="breakdown-track"><i style="width:${total ? count / total * 100 : 0}%"></i></div><strong>${count}</strong></div>`).join('');
  const categoryCounts = state.categories.map(name => [name, todayTasks.filter(task => task.category === name).length]).filter(([, count]) => count > 0);
  $('#category-breakdown').innerHTML = categoryCounts.length ? categoryCounts.map(([name, count]) => `<div class="breakdown-row"><span>${escapeHTML(name)}</span><div class="breakdown-track"><i style="width:${total ? count / total * 100 : 0}%"></i></div><strong>${count}</strong></div>`).join('') : '<span class="task-status">Chưa có dữ liệu danh mục.</span>';
  const tasks = visibleTasks();
  $('#task-list').innerHTML = tasks.map(renderTask).join('');
  $('#task-list').classList.toggle('hidden', !tasks.length);
  $('#empty-state').classList.toggle('hidden', !!tasks.length);
  $('#heading-count').textContent = String(tasks.length).padStart(2, '0');
  $('#day-total').textContent = `${tasks.length} TASK${tasks.length === 1 ? '' : 'S'}`;
  $('#today-label').textContent = state.view === 'today' ? 'HÔM NAY' : state.category ? state.category.toLocaleUpperCase('vi') : 'TẤT CẢ TASK';
  $('#task-heading').innerHTML = `${state.view === 'today' && !state.category ? 'Checklist hôm nay' : escapeHTML(state.category || (state.view === 'all' ? 'Tất cả công việc' : 'Checklist hôm nay'))} <span class="heading-count" id="heading-count">${String(tasks.length).padStart(2, '0')}</span>`;
  renderCategories();
  renderChart();
}
function openDialog(task = null) {
  const form = $('#task-form'); form.reset();
  $('#task-id').value = task?.id || '';
  $('#dialog-title').textContent = task ? 'Chỉnh sửa task' : 'Tạo task mới';
  $('#task-title').value = task?.title || '';
  $('#task-description').value = task?.description || '';
  $('#task-date').value = task?.dueDate || dateISO;
  $('#task-time').value = task?.dueTime || '';
  $('#task-status').value = task?.status || 'todo';
  const category = $('#task-category');
  category.replaceChildren(...state.categories.map(name => new Option(name, name)));
  category.value = task?.category || 'Học tập';
  const priority = task?.priority || 'medium';
  $(`input[name="priority"][value="${priority}"]`).checked = true;
  $('#task-dialog').showModal();
  setTimeout(() => $('#task-title').focus(), 50);
}
function closeDialog() { $('#task-dialog').close(); }
async function saveTask(event) {
  event.preventDefault();
  const id = $('#task-id').value;
  const payload = { title: $('#task-title').value.trim(), description: $('#task-description').value.trim(), category: $('#task-category').value, status: $('#task-status').value, dueDate: $('#task-date').value, dueTime: $('#task-time').value, priority: $('input[name="priority"]:checked').value };
  try {
    await api(id ? `/api/tasks/${id}` : '/api/tasks', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    closeDialog(); await loadTasks(); showToast(id ? 'Task đã được cập nhật.' : 'Đã thêm task mới.');
  } catch (error) { showToast(error.message); }
}
async function toggleTask(task) {
  const payload = { status: task.status === 'done' ? 'todo' : 'done' };
  try { await api(`/api/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify(payload) }); await loadTasks(); }
  catch (error) { showToast(error.message); }
}
async function deleteTask(task) {
  try { await api(`/api/tasks/${task.id}`, { method: 'DELETE' }); await loadTasks(); showToast('Đã xóa task.'); }
  catch (error) { showToast(error.message); }
}
function requestDelete(task) {
  pendingDeleteTask = task;
  $('#confirm-task-name').textContent = `“${task.title}”`;
  $('#confirm-dialog').showModal();
}
function closeCategoryDialog() { $('#category-dialog').close(); }
async function saveCategory(event) {
  event.preventDefault();
  const name = $('#category-name').value.trim();
  if (!name) return;
  try {
    await api('/api/categories', { method: 'POST', body: JSON.stringify({ name }) });
    closeCategoryDialog();
    $('#category-form').reset();
    await loadTasks();
    showToast('Đã thêm danh mục.');
  } catch (error) {
    showToast(error.message);
  }
}

$('#top-date').textContent = formatDate(today);
$('#today-label').textContent = 'HÔM NAY';
const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(today).toLocaleUpperCase('vi');
$('.eyebrow').innerHTML = `<span class="sparkle">✳</span> ${escapeHTML(weekday)}`;
const hour = today.getHours();
$('#greeting').innerHTML = `${hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'}, Ngọc<span class="title-period">.</span>`;
$('#new-task').addEventListener('click', () => openDialog());
$('#dialog-close').addEventListener('click', closeDialog);
$('#cancel-dialog').addEventListener('click', closeDialog);
$('#task-form').addEventListener('submit', saveTask);
$('#task-dialog').addEventListener('click', event => { if (event.target === $('#task-dialog')) closeDialog(); });
$('#search-input').addEventListener('input', () => { state.activeSuggestion = 0; renderSuggestions(); });
$('#search-trigger').addEventListener('click', openSearch);
$('#command-button').addEventListener('click', openSearch);
$('#search-clear').addEventListener('click', () => { $('#search-input').value = ''; state.activeSuggestion = 0; renderSuggestions(); $('#search-input').focus(); });
$('#search-suggestions').addEventListener('click', event => {
  const button = event.target.closest('[data-index]');
  if (button) applySearch(state.suggestions[Number(button.dataset.index)].query);
});
$('#search-dialog').addEventListener('click', event => { if (event.target === $('#search-dialog')) $('#search-dialog').close(); });
$('#status-filter').addEventListener('change', render);
$('#priority-filter').addEventListener('change', render);
$('#clear-filters').addEventListener('click', () => { $('#status-filter').value = 'all'; $('#priority-filter').value = 'all'; state.query = ''; state.category = null; $('#search-launch-label').textContent = 'Tìm kiếm task...'; render(); });
$('#task-list').addEventListener('click', event => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const row = button.closest('.task-row'); const task = state.tasks.find(item => item.id === row?.dataset.id); if (!task) return;
  if (button.dataset.action === 'toggle') toggleTask(task);
  if (button.dataset.action === 'edit') openDialog(task);
  if (button.dataset.action === 'delete') requestDelete(task);
});
$('#category-list').addEventListener('click', event => {
  const button = event.target.closest('[data-category]'); if (!button) return;
  state.category = state.category === button.dataset.category ? null : button.dataset.category;
  state.view = 'all'; $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === 'all'));
  $('#stats-page').classList.add('hidden'); $('#dashboard-stats').classList.add('hidden'); $('#content-grid').classList.remove('hidden');
  $('#page-crumb').textContent = state.category || 'Tất cả task'; render();
});
$$('.nav-item').forEach(button => button.addEventListener('click', () => {
  state.view = button.dataset.view; state.category = null;
  $$('.nav-item').forEach(item => item.classList.toggle('active', item === button));
  const names = { today: 'Checklist', all: 'Tất cả task', stats: 'Thống kê' };
  $('#page-crumb').textContent = names[state.view];
  const isStats = state.view === 'stats';
  $('#stats-page').classList.toggle('hidden', !isStats);
  $('#dashboard-stats').classList.toggle('hidden', !isStats);
  $('#content-grid').classList.toggle('hidden', isStats);
  if (isStats) window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
}));
$('#add-category').addEventListener('click', () => { $('#category-dialog').showModal(); setTimeout(() => $('#category-name').focus(), 30); });
$('#category-form').addEventListener('submit', saveCategory);
$('#category-close').addEventListener('click', closeCategoryDialog);
$('#category-cancel').addEventListener('click', closeCategoryDialog);
$('#confirm-close').addEventListener('click', () => { pendingDeleteTask = null; $('#confirm-dialog').close(); });
$('#confirm-cancel').addEventListener('click', () => { pendingDeleteTask = null; $('#confirm-dialog').close(); });
$('#confirm-delete').addEventListener('click', async () => {
  if (!pendingDeleteTask) return;
  const task = pendingDeleteTask; pendingDeleteTask = null; $('#confirm-dialog').close(); await deleteTask(task);
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if (!$('#search-dialog').open) openSearch(); }
  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { event.preventDefault(); if (!$('#search-dialog').open) openSearch(); }
  if ($('#search-dialog').open && state.suggestions.length) {
    if (event.key === 'ArrowDown') { event.preventDefault(); state.activeSuggestion = (state.activeSuggestion + 1) % state.suggestions.length; renderSuggestions(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); state.activeSuggestion = (state.activeSuggestion - 1 + state.suggestions.length) % state.suggestions.length; renderSuggestions(); }
    if (event.key === 'Enter') { event.preventDefault(); applySearch(state.suggestions[state.activeSuggestion]?.query || $('#search-input').value); }
  } else if ($('#search-dialog').open && event.key === 'Enter' && $('#search-input').value.trim()) { event.preventDefault(); applySearch($('#search-input').value); }
  if (event.key.toLowerCase() === 'n' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !$('#task-dialog').open) openDialog();
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); } }), { threshold: .12 });
  $$('.reveal').forEach(element => observer.observe(element));
} else $$('.reveal').forEach(element => element.classList.add('in-view'));
loadTasks();
