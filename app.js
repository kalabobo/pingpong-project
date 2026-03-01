const ERROR_LIBRARY = {
  技术动作质量: [
    '正手起下旋：拍面过立、摩擦不足导致下网',
    '反手拧拉上旋：引拍过大、击球点靠后导致出界',
    '反手被上旋顶住：重心后仰、借力不足导致回球浅高',
    '正手冲高球：发力顺序断裂，击球点偏后导致打飞',
    '中台拉冲转换：步法跟不上，手上强拉导致失控'
  ],
  发球与接发球: [
    '发球下旋不转：触球薄厚不稳，被对手直接抢冲',
    '发球落点单一：连续同点被预判，第三板被动',
    '接发短下旋：挑打意图过强，拍面控制不足导致冒高',
    '接发急长上旋：判断旋转滞后，反手封挡出界',
    '接发侧旋：站位固定，线路选择错误导致送机会球'
  ],
  战术决策: [
    '领先时强行一板致命：风险收益比失衡',
    '落后时盲目提速：未建立落点优势先强攻失误',
    '连续压反手后未变线：被对手节奏适应后反制',
    '对方中远台退守时仍发力硬冲：未改用落点与弧线',
    '关键分保守搓摆：主动权丢失导致被先上手'
  ],
  身体与时机: [
    '启动慢半拍：对来球长度判断延迟，击球点过晚',
    '侧向步法不到位：上手时身体与来球夹角不匹配',
    '连续对拉后体能下降：核心稳定不足导致动作变形',
    '击球点过高/过低：未在最佳击球窗口完成动作',
    '重心转移不完整：手先于脚，导致控球质量下降'
  ]
};

const STORAGE_KEY = 'pingpong-error-records-v1';
const API_BASE = 'http://127.0.0.1:8787';

const form = document.getElementById('record-form');
const matchTimeInput = document.getElementById('match-time');
const categorySelect = document.getElementById('category');
const detailSelect = document.getElementById('detail');
const phaseSelect = document.getElementById('phase');
const noteInput = document.getElementById('note');
const recordList = document.getElementById('record-list');
const statsContainer = document.getElementById('stats');
const clearBtn = document.getElementById('clear-btn');
const modeHint = document.getElementById('mode-hint');

let records = [];
let onlineMode = false;

init();

async function init() {
  setDefaultTime();
  fillCategoryOptions();
  refreshDetailOptions();
  onlineMode = await checkServer();
  modeHint.textContent = onlineMode ? '当前模式：云端数据库（SQLite）' : '当前模式：本地浏览器存储';
  records = onlineMode ? await fetchRecords() : loadLocalRecords();
  render();
}

function setDefaultTime() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  matchTimeInput.value = local;
}

function fillCategoryOptions() {
  categorySelect.innerHTML = '';
  Object.keys(ERROR_LIBRARY).forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

function refreshDetailOptions() {
  const details = ERROR_LIBRARY[categorySelect.value] || [];
  detailSelect.innerHTML = '';
  details.forEach((detail) => {
    const option = document.createElement('option');
    option.value = detail;
    option.textContent = detail;
    detailSelect.appendChild(option);
  });
}

categorySelect.addEventListener('change', refreshDetailOptions);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const record = {
    matchTime: matchTimeInput.value,
    category: categorySelect.value,
    detail: detailSelect.value,
    phase: phaseSelect.value,
    note: noteInput.value.trim()
  };

  if (onlineMode) {
    await fetch(`${API_BASE}/api/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    records = await fetchRecords();
  } else {
    record.id = Date.now().toString();
    records.unshift(record);
    saveLocalRecords();
  }

  render();
  noteInput.value = '';
  setDefaultTime();
});

clearBtn.addEventListener('click', async () => {
  if (!window.confirm('确认清空所有记录吗？')) return;

  if (onlineMode) {
    await fetch(`${API_BASE}/api/records`, { method: 'DELETE' });
    records = [];
  } else {
    records = [];
    saveLocalRecords();
  }
  render();
});

async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function fetchRecords() {
  const response = await fetch(`${API_BASE}/api/records`);
  const data = await response.json();
  return data.records || [];
}

function loadLocalRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function render() {
  renderRecords();
  renderStats();
}

function renderRecords() {
  if (!records.length) {
    recordList.innerHTML = '<li class="empty">暂无记录，先添加一条吧。</li>';
    return;
  }

  recordList.innerHTML = records
    .map((record) => {
      const timeText = formatDateTime(record.matchTime);
      const noteHtml = record.note ? `<div class="meta">备注：${escapeHtml(record.note)}</div>` : '';
      return `<li class="record-item"><div><strong>${escapeHtml(record.detail)}</strong></div><div class="meta">${escapeHtml(
        record.category
      )} ｜ ${escapeHtml(record.phase)} ｜ ${timeText}</div>${noteHtml}</li>`;
    })
    .join('');
}

function renderStats() {
  if (!records.length) {
    statsContainer.innerHTML = '<div class="empty">暂无数据分析。</div>';
    return;
  }
  const total = records.length;
  const byCategory = countBy(records, 'category');
  const byDetail = countBy(records, 'detail');
  const topCategory = maxEntry(byCategory);
  const topDetail = maxEntry(byDetail);

  statsContainer.innerHTML = `
    <div class="stat-item">总失误记录数<strong>${total}</strong></div>
    <div class="stat-item">最高频失误大类<strong>${escapeHtml(topCategory[0])}（${topCategory[1]}次）</strong></div>
    <div class="stat-item">最高频细分失误<strong>${escapeHtml(topDetail[0])}（${topDetail[1]}次）</strong></div>
  `;
}

function countBy(items, key) {
  return items.reduce((map, item) => {
    const value = item[key] || '未分类';
    map[value] = (map[value] || 0) + 1;
    return map;
  }, {});
}

function maxEntry(map) {
  return Object.entries(map).sort((a, b) => b[1] - a[1])[0] || ['暂无', 0];
}

function formatDateTime(value) {
  if (!value) return '未知时间';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
