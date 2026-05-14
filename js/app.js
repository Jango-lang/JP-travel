/**
 * 日本旅行计划管理 - 主逻辑
 */

// ========================================
// 数据管理
// ========================================

const STORAGE_KEY = 'jp-travel-data';

const defaultData = {
    settings: {
        startDate: ''
    },
    itinerary: [],
    luggage: [
        {
            id: 'cat-1', name: '衣物', items: [
                { id: 'item-1', name: '内衣', quantity: 7, checked: false },
                { id: 'item-2', name: '袜子', quantity: 7, checked: false },
                { id: 'item-3', name: 'T恤', quantity: 7, checked: false },
                { id: 'item-4', name: '长裤/裙子', quantity: 7, checked: false },
                { id: 'item-5', name: '外套/夹克', quantity: 7, checked: false },
                { id: 'item-6', name: '睡衣', quantity: 1, checked: false }
            ]
        },
        {
            id: 'cat-2', name: '洗漱用品', items: [
                { id: 'item-7', name: '牙刷', quantity: 1, checked: false },
                { id: 'item-8', name: '牙膏', quantity: 1, checked: false },
                { id: 'item-9', name: '洗发水', quantity: 1, checked: false },
                { id: 'item-10', name: '护肤品', quantity: 1, checked: false }
            ]
        },
        {
            id: 'cat-3', name: '电子设备', items: [
                { id: 'item-11', name: '手机', quantity: 1, checked: false },
                { id: 'item-12', name: '充电宝', quantity: 1, checked: false },
                { id: 'item-13', name: '充电器', quantity: 1, checked: false },
                { id: 'item-14', name: '转换插头', quantity: 1, checked: false }
            ]
        },
        {
            id: 'cat-4', name: '证件', items: [
                { id: 'item-15', name: '护照', quantity: 1, checked: false },
                { id: 'item-16', name: '签证', quantity: 1, checked: false },
                { id: 'item-17', name: '身份证', quantity: 1, checked: false },
                { id: 'item-18', name: '机票行程单', quantity: 1, checked: false },
                { id: 'item-19', name: '酒店预订确认', quantity: 1, checked: false }
            ]
        },
        {
            id: 'cat-5', name: '药品', items: [
                { id: 'item-20', name: '感冒药', quantity: 1, checked: false },
                { id: 'item-21', name: '肠胃药', quantity: 1, checked: false },
                { id: 'item-22', name: '创可贴', quantity: 1, checked: false }
            ]
        },
        {
            id: 'cat-6', name: '杂物', items: [
                { id: 'item-23', name: '雨伞', quantity: 1, checked: false },
                { id: 'item-24', name: '墨镜', quantity: 1, checked: false },
                { id: 'item-25', name: '口罩', quantity: 5, checked: false },
                { id: 'item-26', name: '现金/日元', quantity: 1, checked: false }
            ]
        }
    ],
    places: [],
    hotels: [],
    notes: [
        { id: 'note-1', title: '签证准备', content: '' },
        { id: 'note-2', title: '货币兑换', content: '' },
        { id: 'note-3', title: '保险', content: '' },
        { id: 'note-4', title: '天气查询', content: '' },
        { id: 'note-5', title: '其他', content: '' }
    ]
};

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('数据解析失败', e);
            return { ...defaultData };
        }
    }
    return { ...defaultData };
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // 防抖自动同步到云端
    autoSyncToCloud();
}

// 防抖定时器
let autoSyncTimer = null;
const AUTO_SYNC_DELAY = 2000; // 2秒防抖

function autoSyncToCloud() {
    // 没有连接云端则跳过
    if (!GistSync.getToken() || !GistSync.getGistId()) return;

    // 清除之前的定时器
    if (autoSyncTimer) {
        clearTimeout(autoSyncTimer);
    }

    // 设置新的定时器
    autoSyncTimer = setTimeout(async () => {
        try {
            await GistSync.sync(appData);
            console.log('自动同步成功');
        } catch (error) {
            console.error('自动同步失败:', error.message);
        }
    }, AUTO_SYNC_DELAY);
}

let appData = loadData();

// ========================================
// 工具函数
// ========================================

function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function getWeekday(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.querySelector('.toast-message').textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => {
        toast.className = 'toast';
    }, 2500);
}

// ========================================
// Tab 导航
// ========================================

function initTabs() {
    const desktopTabs = document.querySelectorAll('.nav-tab');
    const mobileTabs = document.querySelectorAll('.mobile-nav-tab');
    const contents = document.querySelectorAll('.tab-content');

    const LAST_TAB_KEY = 'jp_travel_last_tab';

    function switchTab(tabId) {
        desktopTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        mobileTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        contents.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });
        // 记忆当前 tab
        localStorage.setItem(LAST_TAB_KEY, tabId);
    }

    desktopTabs.forEach(tab => {
        if (tab.dataset.tab == 'home') {
            tab.addEventListener('dblclick', () => {
                location.reload();
            });
        }
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    mobileTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // 恢复上次访问的 tab
    const lastTab = localStorage.getItem(LAST_TAB_KEY);
    // const validTabs = ['home', 'itinerary', 'luggage', 'notes', 'budget'];
    if (lastTab) {
        switchTab(lastTab);
    } else {
        switchTab('home');
    }

    // 双击首页 tab 刷新
    let lastHomeClick = 0;
    const homeTabSelectors = '[data-tab="home"]';
    document.querySelectorAll(homeTabSelectors).forEach(tab => {
        tab.addEventListener('click', () => {
            const now = Date.now();
            if (now - lastHomeClick < 400) {
                location.reload();
            }
            lastHomeClick = now;
        });
    });
}

// ========================================
// 模态框
// ========================================

function openModal(title, bodyContent, onConfirm, showFooter = true) {
    const overlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');
    const confirmBtn = document.getElementById('modalConfirm');

    modalTitle.textContent = title;
    modalBody.innerHTML = bodyContent;
    modalFooter.style.display = showFooter ? 'flex' : 'none';

    if (onConfirm) {
        confirmBtn.onclick = onConfirm;
    }

    overlay.classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function initModal() {
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });
}

// ========================================
// 出行倒计时
// ========================================

function updateCountdown() {
    const banner = document.getElementById('countdownBanner');
    const value = document.getElementById('countdownValue');

    if (!appData.settings.startDate) {
        banner.style.display = 'none';
        return;
    }

    banner.style.display = 'flex';
    const start = new Date(appData.settings.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    const diff = Math.ceil((start - today) / (1000 * 60 * 60 * 24));

    if (diff < 0) {
        value.textContent = '旅行中 🎉';
    } else if (diff === 0) {
        value.textContent = '今天出发！';
    } else {
        value.textContent = diff + ' 天';
    }
}

// ========================================
// 行程概览
// ========================================

function renderItinerary() {
    const container = document.getElementById('itineraryTimeline');

    if (appData.itinerary.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                <h3>暂无行程安排</h3>
                <p>点击右上角「添加日程」开始规划你的旅行</p>
            </div>
        `;
        return;
    }

    container.innerHTML = appData.itinerary.map((day, index) => `
        <div class="day-card" data-day-id="${day.id}">
            <div class="day-header">
                <div class="day-info">
                    <h3>Day ${index + 1} · ${formatDate(day.date)} ${getWeekday(day.date)}</h3>
                    <div class="day-location">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        ${day.location || '待定'}
                    </div>
                </div>
                <div class="day-actions">
                    <button class="btn-secondary btn-sm" onclick="toggleDayContent('${day.id}')">展开</button>
                    <button class="btn-secondary btn-sm" onclick="editDay('${day.id}')">编辑</button>
                    <button class="btn-danger btn-sm" onclick="deleteDay('${day.id}')">删除</button>
                </div>
            </div>
            <div class="day-content" id="day-content-${day.id}">
                <div class="day-theme">
                    <label>当日备注</label>
                    <textarea placeholder="记录当天的特别安排或注意事项..." 
                              onchange="updateDayNote('${day.id}', this.value)">${day.note || ''}</textarea>
                </div>
                <div class="activities-list">
                    ${(day.activities || []).map((act, actIndex) => `
                        <div class="activity-item">
                            <span class="activity-time">${act.time || ''}</span>
                            <span class="activity-text">${act.text}</span>
                            <button class="item-delete" onclick="deleteActivity('${day.id}', ${actIndex})">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    `).join('')}
                    <div class="add-item-row">
                        <input type="text" placeholder="时间 (如 09:00)" class="activity-time-input" style="max-width: 100px;">
                        <input type="text" placeholder="添加活动..." class="activity-text-input" style="flex: 1;">
                        <button class="btn-primary btn-sm" onclick="addActivity('${day.id}')">添加</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleDayContent(dayId) {
    const content = document.getElementById('day-content-' + dayId);
    const btn = content.closest('.day-card').querySelector('.day-actions button:first-child');
    content.classList.toggle('expanded');
    btn.textContent = content.classList.contains('expanded') ? '收起' : '展开';
}

function addDay() {
    const body = `
        <div class="form-group">
            <label>出发日期 *</label>
            <input type="date" id="dayDate" required>
        </div>
        <div class="form-group">
            <label>城市/区域</label>
            <input type="text" id="dayLocation" placeholder="如：东京、大阪">
        </div>
    `;
    openModal('添加日程', body, () => {
        const date = document.getElementById('dayDate').value;
        const location = document.getElementById('dayLocation').value;

        if (!date) {
            showToast('请选择日期', 'error');
            return;
        }

        appData.itinerary.push({
            id: generateId(),
            date,
            location,
            note: '',
            activities: []
        });

        appData.itinerary.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (!appData.settings.startDate) {
            appData.settings.startDate = date;
        }

        saveData(appData);
        renderItinerary();
        updateCountdown();
        closeModal();
        showToast('已添加日程');
    });
}

function editDay(dayId) {
    const day = appData.itinerary.find(d => d.id === dayId);
    if (!day) return;

    const body = `
        <div class="form-group">
            <label>出发日期 *</label>
            <input type="date" id="dayDate" value="${day.date}" required>
        </div>
        <div class="form-group">
            <label>城市/区域</label>
            <input type="text" id="dayLocation" value="${day.location || ''}" placeholder="如：东京、大阪">
        </div>
    `;
    openModal('编辑日程', body, () => {
        const date = document.getElementById('dayDate').value;
        const location = document.getElementById('dayLocation').value;

        if (!date) {
            showToast('请选择日期', 'error');
            return;
        }

        day.date = date;
        day.location = location;
        appData.itinerary.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (appData.settings.startDate === day.date) {
            appData.settings.startDate = appData.itinerary[0]?.date || '';
        }

        saveData(appData);
        renderItinerary();
        updateCountdown();
        closeModal();
        showToast('已更新日程');
    });
}

function deleteDay(dayId) {
    if (!confirm('确定要删除这一天吗？')) return;
    appData.itinerary = appData.itinerary.filter(d => d.id !== dayId);
    appData.settings.startDate = appData.itinerary[0]?.date || '';
    saveData(appData);
    renderItinerary();
    updateCountdown();
    showToast('已删除日程');
}

function updateDayNote(dayId, note) {
    const day = appData.itinerary.find(d => d.id === dayId);
    if (day) {
        day.note = note;
        saveData(appData);
    }
}

function addActivity(dayId) {
    const day = appData.itinerary.find(d => d.id === dayId);
    if (!day) return;

    const card = document.querySelector(`[data-day-id="${dayId}"]`);
    const timeInput = card.querySelector('.activity-time-input');
    const textInput = card.querySelector('.activity-text-input');
    const time = timeInput.value;
    const text = textInput.value;

    if (!text) {
        showToast('请输入活动内容', 'error');
        return;
    }

    day.activities.push({ time, text });
    saveData(appData);
    renderItinerary();
    toggleDayContent(dayId);
    showToast('已添加活动');
}

function deleteActivity(dayId, actIndex) {
    const day = appData.itinerary.find(d => d.id === dayId);
    if (day) {
        day.activities.splice(actIndex, 1);
        saveData(appData);
        renderItinerary();
        toggleDayContent(dayId);
    }
}

// ========================================
// 行李清单
// ========================================

function renderLuggage() {
    const container = document.getElementById('luggageContainer');

    container.innerHTML = appData.luggage.map(cat => {
        const checked = cat.items.filter(i => i.checked).length;
        const total = cat.items.length;
        const progress = total > 0 ? Math.round(checked / total * 100) : 0;

        return `
            <div class="luggage-category" data-cat-id="${cat.id}">
                <div class="category-header">
                    <div>
                        <h3 class="category-title">${cat.name}</h3>
                        <span class="category-progress">${checked}/${total} 已打包 (${progress}%)</span>
                    </div>
                    <div class="category-actions">
                        <button class="btn-secondary btn-sm" onclick="addLuggageItem('${cat.id}')">添加物品</button>
                        <button class="btn-danger btn-sm" onclick="deleteCategory('${cat.id}')">删除</button>
                    </div>
                </div>
                <div class="luggage-items">
                    ${cat.items.map(item => `
                        <div class="luggage-item ${item.checked ? 'checked' : ''}" data-item-id="${item.id}">
                            <input type="checkbox" ${item.checked ? 'checked' : ''} 
                                   onchange="toggleLuggageItem('${cat.id}', '${item.id}')">
                            <span class="item-name">${item.name}</span>
                            <span class="item-quantity">×${item.quantity}</span>
                            <button class="item-delete" onclick="deleteLuggageItem('${cat.id}', '${item.id}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function addCategory() {
    const body = `
        <div class="form-group">
            <label>分类名称</label>
            <input type="text" id="catName" placeholder="如：电子产品、衣物">
        </div>
    `;
    openModal('添加分类', body, () => {
        const name = document.getElementById('catName').value.trim();
        if (!name) {
            showToast('请输入分类名称', 'error');
            return;
        }
        appData.luggage.push({
            id: generateId(),
            name,
            items: []
        });
        saveData(appData);
        renderLuggage();
        closeModal();
        showToast('已添加分类');
    });
}

function deleteCategory(catId) {
    if (!confirm('确定要删除这个分类吗？')) return;
    appData.luggage = appData.luggage.filter(c => c.id !== catId);
    saveData(appData);
    renderLuggage();
    showToast('已删除分类');
}

function addLuggageItem(catId) {
    const cat = appData.luggage.find(c => c.id === catId);
    if (!cat) return;

    const body = `
        <div class="form-group">
            <label>物品名称</label>
            <input type="text" id="itemName" placeholder="如：T恤、充电器">
        </div>
        <div class="form-group">
            <label>数量</label>
            <input type="number" id="itemQty" value="1" min="1">
        </div>
    `;
    openModal('添加物品', body, () => {
        const name = document.getElementById('itemName').value.trim();
        const qty = parseInt(document.getElementById('itemQty').value) || 1;

        if (!name) {
            showToast('请输入物品名称', 'error');
            return;
        }

        cat.items.push({
            id: generateId(),
            name,
            quantity: qty,
            checked: false
        });
        saveData(appData);
        renderLuggage();
        closeModal();
        showToast('已添加物品');
    });
}

function toggleLuggageItem(catId, itemId) {
    const cat = appData.luggage.find(c => c.id === catId);
    if (!cat) return;

    const item = cat.items.find(i => i.id === itemId);
    if (item) {
        item.checked = !item.checked;
        saveData(appData);
        renderLuggage();
    }
}

function deleteLuggageItem(catId, itemId) {
    const cat = appData.luggage.find(c => c.id === catId);
    if (!cat) return;

    cat.items = cat.items.filter(i => i.id !== itemId);
    saveData(appData);
    renderLuggage();
    showToast('已删除物品');
}

function resetLuggage() {
    if (!confirm('确定要重置所有行李勾选状态吗？')) return;
    appData.luggage.forEach(cat => {
        cat.items.forEach(item => {
            item.checked = false;
        });
    });
    saveData(appData);
    renderLuggage();
    showToast('已重置清单');
}

// ========================================
// 目的地
// ========================================

let currentFilter = 'all';

function renderPlaces() {
    const container = document.getElementById('placesGrid');

    let places = appData.places;
    if (currentFilter !== 'all') {
        places = places.filter(p => p.type === currentFilter);
    }

    if (places.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <h3>暂无目的地</h3>
                <p>点击右上角「添加地点」记录想去的地方</p>
            </div>
        `;
        return;
    }

    container.innerHTML = places.map(place => `
        <div class="place-card" data-place-id="${place.id}">
            <div class="place-image">
                ${place.image ? `<img src="${place.image}" alt="${place.name}">` : `
                    <div class="placeholder-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                `}
            </div>
            <div class="place-content">
                <div class="place-header">
                    <h3 class="place-name">${place.name}</h3>
                    <span class="place-type ${place.type}">${getTypeLabel(place.type)}</span>
                </div>
                <div class="place-address">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    ${place.address || '暂无地址'}
                </div>
                ${place.rating ? `
                    <div class="place-rating">
                        ${renderStars(place.rating)}
                        <span>${place.rating}.0</span>
                    </div>
                ` : ''}
                ${place.note ? `<p class="place-note">${place.note}</p>` : ''}
                ${place.visited ? `
                    <div class="place-visited">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        已去过
                    </div>
                ` : ''}
                <div class="place-actions">
                    <button class="btn-secondary btn-sm" onclick="toggleVisited('${place.id}')">
                        ${place.visited ? '取消标记' : '标记去过'}
                    </button>
                    <button class="btn-secondary btn-sm" onclick="editPlace('${place.id}')">编辑</button>
                    <button class="btn-danger btn-sm" onclick="deletePlace('${place.id}')">删除</button>
                </div>
            </div>
        </div>
    `).join('');
}

function getTypeLabel(type) {
    const labels = {
        attraction: '景点',
        restaurant: '餐厅',
        shopping: '购物'
    };
    return labels[type] || type;
}

function renderStars(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
        stars += `<span class="star">${i < rating ? '★' : '☆'}</span>`;
    }
    return stars;
}

function initFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderPlaces();
        });
    });
}

function addPlace() {
    const body = `
        <div class="form-group">
            <label>名称 *</label>
            <input type="text" id="placeName" placeholder="地点名称">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>类型</label>
                <select id="placeType">
                    <option value="attraction">景点</option>
                    <option value="restaurant">餐厅</option>
                    <option value="shopping">购物</option>
                </select>
            </div>
            <div class="form-group">
                <label>评分 (1-5)</label>
                <input type="number" id="placeRating" min="1" max="5" placeholder="如：4">
            </div>
        </div>
        <div class="form-group">
            <label>地址</label>
            <input type="text" id="placeAddress" placeholder="详细地址">
        </div>
        <div class="form-group">
            <label>图片 URL</label>
            <input type="text" id="placeImage" placeholder="https://...">
        </div>
        <div class="form-group">
            <label>备注</label>
            <textarea id="placeNote" placeholder="推荐理由、营业时间等..."></textarea>
        </div>
    `;
    openModal('添加地点', body, () => {
        const name = document.getElementById('placeName').value.trim();
        if (!name) {
            showToast('请输入地点名称', 'error');
            return;
        }

        appData.places.push({
            id: generateId(),
            name,
            type: document.getElementById('placeType').value,
            rating: parseInt(document.getElementById('placeRating').value) || 0,
            address: document.getElementById('placeAddress').value.trim(),
            image: document.getElementById('placeImage').value.trim(),
            note: document.getElementById('placeNote').value.trim(),
            visited: false
        });

        saveData(appData);
        renderPlaces();
        closeModal();
        showToast('已添加地点');
    });
}

function editPlace(placeId) {
    const place = appData.places.find(p => p.id === placeId);
    if (!place) return;

    const body = `
        <div class="form-group">
            <label>名称 *</label>
            <input type="text" id="placeName" value="${place.name}">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>类型</label>
                <select id="placeType">
                    <option value="attraction" ${place.type === 'attraction' ? 'selected' : ''}>景点</option>
                    <option value="restaurant" ${place.type === 'restaurant' ? 'selected' : ''}>餐厅</option>
                    <option value="shopping" ${place.type === 'shopping' ? 'selected' : ''}>购物</option>
                </select>
            </div>
            <div class="form-group">
                <label>评分 (1-5)</label>
                <input type="number" id="placeRating" min="1" max="5" value="${place.rating}">
            </div>
        </div>
        <div class="form-group">
            <label>地址</label>
            <input type="text" id="placeAddress" value="${place.address || ''}">
        </div>
        <div class="form-group">
            <label>图片 URL</label>
            <input type="text" id="placeImage" value="${place.image || ''}">
        </div>
        <div class="form-group">
            <label>备注</label>
            <textarea id="placeNote">${place.note || ''}</textarea>
        </div>
    `;
    openModal('编辑地点', body, () => {
        const name = document.getElementById('placeName').value.trim();
        if (!name) {
            showToast('请输入地点名称', 'error');
            return;
        }

        place.name = name;
        place.type = document.getElementById('placeType').value;
        place.rating = parseInt(document.getElementById('placeRating').value) || 0;
        place.address = document.getElementById('placeAddress').value.trim();
        place.image = document.getElementById('placeImage').value.trim();
        place.note = document.getElementById('placeNote').value.trim();

        saveData(appData);
        renderPlaces();
        closeModal();
        showToast('已更新地点');
    });
}

function deletePlace(placeId) {
    if (!confirm('确定要删除这个地点吗？')) return;
    appData.places = appData.places.filter(p => p.id !== placeId);
    saveData(appData);
    renderPlaces();
    showToast('已删除地点');
}

function toggleVisited(placeId) {
    const place = appData.places.find(p => p.id === placeId);
    if (place) {
        place.visited = !place.visited;
        saveData(appData);
        renderPlaces();
        showToast(place.visited ? '已标记为去过' : '已取消标记');
    }
}

// ========================================
// 酒店
// ========================================

function renderHotels() {
    const container = document.getElementById('hotelsList');

    if (appData.hotels.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/><path d="m9 16 .348-.24c1.465-1.013 3.84-1.013 5.304 0L15 16"/><path d="M8 7h.01"/><path d="M16 7h.01"/><path d="M12 7h.01"/><path d="M12 11h.01"/><path d="M16 11h.01"/><path d="M8 11h.01"/></svg>
                <h3>暂无酒店</h3>
                <p>点击右上角「添加酒店」记录你的住宿</p>
            </div>
        `;
        return;
    }

    container.innerHTML = appData.hotels.map((hotel, index) => `
        <div class="hotel-card" data-hotel-id="${hotel.id}">
            <div class="hotel-image">
                ${hotel.image ? `<img src="${hotel.image}" alt="${hotel.name}">` : `
                    <div class="placeholder-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/></svg>
                    </div>
                `}
            </div>
            <div class="hotel-info">
                <div class="hotel-night">第 ${index + 1} 晚</div>
                <h3 class="hotel-name">${hotel.name}</h3>
                <div class="hotel-dates">
                    <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        入住: ${formatDate(hotel.checkin)} ~ 退房: ${formatDate(hotel.checkout)}
                    </span>
                </div>
                ${hotel.address ? `
                    <div class="hotel-address">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        ${hotel.address}
                    </div>
                ` : ''}
                ${hotel.transport ? `<p class="hotel-transport">🚇 ${hotel.transport}</p>` : ''}
                ${hotel.contact ? `<p class="hotel-contact">📞 ${hotel.contact}</p>` : ''}
                ${hotel.note ? `<p class="hotel-note">💰 ${hotel.note}</p>` : ''}
                <div class="hotel-actions">
                    <button class="btn-secondary btn-sm" onclick="editHotel('${hotel.id}')">编辑</button>
                    <button class="btn-danger btn-sm" onclick="deleteHotel('${hotel.id}')">删除</button>
                </div>
            </div>
        </div>
    `).join('');
}

function addHotel() {
    const body = `
        <div class="form-group">
            <label>酒店名称 *</label>
            <input type="text" id="hotelName" placeholder="酒店名称">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>入住日期</label>
                <input type="date" id="hotelCheckin">
            </div>
            <div class="form-group">
                <label>退房日期</label>
                <input type="date" id="hotelCheckout">
            </div>
        </div>
        <div class="form-group">
            <label>地址</label>
            <input type="text" id="hotelAddress" placeholder="酒店地址">
        </div>
        <div class="form-group">
            <label>交通提示</label>
            <input type="text" id="hotelTransport" placeholder="如：JR新宿站步行5分钟">
        </div>
        <div class="form-group">
            <label>联系方式</label>
            <input type="text" id="hotelContact" placeholder="电话或其他联系方式">
        </div>
        <div class="form-group">
            <label>预订备注</label>
            <textarea id="hotelNote" placeholder="房价、预订号、特殊要求等..."></textarea>
        </div>
        <div class="form-group">
            <label>图片 URL</label>
            <input type="text" id="hotelImage" placeholder="https://...">
        </div>
    `;
    openModal('添加酒店', body, () => {
        const name = document.getElementById('hotelName').value.trim();
        if (!name) {
            showToast('请输入酒店名称', 'error');
            return;
        }

        appData.hotels.push({
            id: generateId(),
            name,
            checkin: document.getElementById('hotelCheckin').value,
            checkout: document.getElementById('hotelCheckout').value,
            address: document.getElementById('hotelAddress').value.trim(),
            transport: document.getElementById('hotelTransport').value.trim(),
            contact: document.getElementById('hotelContact').value.trim(),
            note: document.getElementById('hotelNote').value.trim(),
            image: document.getElementById('hotelImage').value.trim()
        });

        saveData(appData);
        renderHotels();
        closeModal();
        showToast('已添加酒店');
    });
}

function editHotel(hotelId) {
    const hotel = appData.hotels.find(h => h.id === hotelId);
    if (!hotel) return;

    const body = `
        <div class="form-group">
            <label>酒店名称 *</label>
            <input type="text" id="hotelName" value="${hotel.name}">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>入住日期</label>
                <input type="date" id="hotelCheckin" value="${hotel.checkin}">
            </div>
            <div class="form-group">
                <label>退房日期</label>
                <input type="date" id="hotelCheckout" value="${hotel.checkout}">
            </div>
        </div>
        <div class="form-group">
            <label>地址</label>
            <input type="text" id="hotelAddress" value="${hotel.address || ''}">
        </div>
        <div class="form-group">
            <label>交通提示</label>
            <input type="text" id="hotelTransport" value="${hotel.transport || ''}">
        </div>
        <div class="form-group">
            <label>联系方式</label>
            <input type="text" id="hotelContact" value="${hotel.contact || ''}">
        </div>
        <div class="form-group">
            <label>预订备注</label>
            <textarea id="hotelNote">${hotel.note || ''}</textarea>
        </div>
        <div class="form-group">
            <label>图片 URL</label>
            <input type="text" id="hotelImage" value="${hotel.image || ''}">
        </div>
    `;
    openModal('编辑酒店', body, () => {
        const name = document.getElementById('hotelName').value.trim();
        if (!name) {
            showToast('请输入酒店名称', 'error');
            return;
        }

        hotel.name = name;
        hotel.checkin = document.getElementById('hotelCheckin').value;
        hotel.checkout = document.getElementById('hotelCheckout').value;
        hotel.address = document.getElementById('hotelAddress').value.trim();
        hotel.transport = document.getElementById('hotelTransport').value.trim();
        hotel.contact = document.getElementById('hotelContact').value.trim();
        hotel.note = document.getElementById('hotelNote').value.trim();
        hotel.image = document.getElementById('hotelImage').value.trim();

        saveData(appData);
        renderHotels();
        closeModal();
        showToast('已更新酒店');
    });
}

function deleteHotel(hotelId) {
    if (!confirm('确定要删除这家酒店吗？')) return;
    appData.hotels = appData.hotels.filter(h => h.id !== hotelId);
    saveData(appData);
    renderHotels();
    showToast('已删除酒店');
}

// ========================================
// 备注
// ========================================

function renderNotes() {
    const container = document.getElementById('notesContainer');

    if (appData.notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
                <h3>暂无备注</h3>
                <p>点击右上角「添加分类」创建新的备注分类</p>
            </div>
        `;
        return;
    }

    container.innerHTML = appData.notes.map(note => `
        <div class="note-category" data-note-id="${note.id}">
            <div class="note-header">
                <h3 class="note-title">${note.title}</h3>
                <div class="category-actions">
                    <button class="btn-secondary btn-sm" onclick="editNoteTitle('${note.id}')">重命名</button>
                    <button class="btn-danger btn-sm" onclick="deleteNote('${note.id}')">删除</button>
                </div>
            </div>
            <textarea class="note-textarea" 
                      placeholder="在这里记录你的备注..."
                      onchange="updateNoteContent('${note.id}', this.value)">${note.content}</textarea>
        </div>
    `).join('');
}

function addNote() {
    const body = `
        <div class="form-group">
            <label>分类名称</label>
            <input type="text" id="noteTitle" placeholder="如：签证准备、货币兑换">
        </div>
    `;
    openModal('添加备注分类', body, () => {
        const title = document.getElementById('noteTitle').value.trim();
        if (!title) {
            showToast('请输入分类名称', 'error');
            return;
        }
        appData.notes.push({
            id: generateId(),
            title,
            content: ''
        });
        saveData(appData);
        renderNotes();
        closeModal();
        showToast('已添加备注分类');
    });
}

function editNoteTitle(noteId) {
    const note = appData.notes.find(n => n.id === noteId);
    if (!note) return;

    const body = `
        <div class="form-group">
            <label>分类名称</label>
            <input type="text" id="noteTitle" value="${note.title}">
        </div>
    `;
    openModal('重命名分类', body, () => {
        const title = document.getElementById('noteTitle').value.trim();
        if (!title) {
            showToast('请输入分类名称', 'error');
            return;
        }
        note.title = title;
        saveData(appData);
        renderNotes();
        closeModal();
        showToast('已重命名');
    });
}

function deleteNote(noteId) {
    if (!confirm('确定要删除这个备注分类吗？')) return;
    appData.notes = appData.notes.filter(n => n.id !== noteId);
    saveData(appData);
    renderNotes();
    showToast('已删除备注');
}

function updateNoteContent(noteId, content) {
    const note = appData.notes.find(n => n.id === noteId);
    if (note) {
        note.content = content;
        saveData(appData);
    }
}

// ========================================
// GitHub Gist 同步
// ========================================

function openSettingsPanel() {
    const overlay = document.getElementById('settingsOverlay');
    const statusEl = document.getElementById('syncStatus');
    const tokenInput = document.getElementById('githubToken');
    const connectBtn = document.getElementById('connectGistBtn');
    const syncBtn = document.getElementById('syncNowBtn');
    const infoEl = document.getElementById('settingsInfo');
    const gistIdDisplay = document.getElementById('gistIdDisplay');

    if (GistSync.isConfigured()) {
        statusEl.classList.add('connected');
        statusEl.querySelector('span').textContent = '已连接';
        tokenInput.value = GistSync.getToken();
        tokenInput.type = 'text';
        connectBtn.textContent = '更新 Token';
        syncBtn.disabled = false;
        infoEl.style.display = 'block';
        gistIdDisplay.textContent = GistSync.getGistId();
    } else {
        statusEl.classList.remove('connected');
        statusEl.querySelector('span').textContent = '未连接';
        tokenInput.value = '';
        tokenInput.type = 'password';
        connectBtn.textContent = '连接';
        syncBtn.disabled = true;
        infoEl.style.display = 'none';
    }

    overlay.classList.add('active');
}

function closeSettingsPanel() {
    document.getElementById('settingsOverlay').classList.remove('active');
}

async function connectGist() {
    const tokenInput = document.getElementById('githubToken');
    const token = tokenInput.value.trim();

    if (!token) {
        showToast('请输入 Token', 'error');
        return;
    }

    const connectBtn = document.getElementById('connectGistBtn');
    connectBtn.disabled = true;
    connectBtn.textContent = '验证中...';

    try {
        // 验证 token
        await GistSync.validateToken(token);
        GistSync.setToken(token);

        // 如果是首次连接（没有保存的 Gist ID），搜索已存在的 Gist
        if (!GistSync.getGistId()) {
            // 先搜索用户已有的 Gist，看是否已有共享的 jp-travel-data.json
            const existingGistId = await GistSync.findExistingGist();
            if (existingGistId) {
                // 找到已存在的 Gist，直接使用它
                GistSync.setGistId(existingGistId);
                showToast('已连接到已有数据，正在加载...', 'success');
                // 首次连接成功且有云端数据，立即加载到本地
                const loaded = await loadFromGistForInitialSync();
                if (loaded) {
                    openSettingsPanel(); // 刷新 UI
                    return;
                }
            } else {
                // 没有找到，创建一个新的 Gist
                const result = await GistSync.createGist(appData);
                if (!result.id) {
                    throw new Error(result.error || '创建 Gist 失败');
                }
                showToast('新建同步空间成功', 'success');
            }
        } else {
            showToast('连接成功', 'success');
        }

        openSettingsPanel(); // 刷新 UI

    } catch (error) {
        showToast(error.message || '连接失败', 'error');
    } finally {
        connectBtn.disabled = false;
        connectBtn.textContent = GistSync.getGistId() ? '更新 Token' : '连接';
    }
}

async function syncNow() {
    const syncBtn = document.getElementById('syncNowBtn');
    syncBtn.disabled = true;
    syncBtn.textContent = '同步中...';

    try {
        const result = await GistSync.sync(appData);
        if (result.success) {
            showToast('同步成功', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showToast(error.message || '同步失败', 'error');
    } finally {
        syncBtn.disabled = false;
        syncBtn.textContent = '立即同步';
    }
}

async function loadFromGist() {
    try {
        const result = await GistSync.load();
        if (result.success) {
            appData = result.data;
            saveData(appData);
            initApp();
            showToast('从云端恢复数据成功', 'success');
            return true;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showToast('加载云端数据失败: ' + error.message, 'error');
        return false;
    }
}

// 首次连接后加载云端数据（不调用 initApp，避免重复）
async function loadFromGistForInitialSync() {
    try {
        const result = await GistSync.load();
        if (result.success) {
            appData = result.data;
            saveData(appData);
            // 只刷新各模块的 UI，不重新初始化
            renderItinerary();
            renderLuggage();
            renderPlaces();
            renderHotels();
            renderNotes();
            updateCountdown();
            showToast('从云端恢复数据成功', 'success');
            return true;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showToast('加载云端数据失败: ' + error.message, 'error');
        return false;
    }
}

function disconnectGist() {
    if (!confirm('确定要断开云同步吗？本地数据不会丢失。')) return;
    GistSync.clearConfig();
    closeSettingsPanel();
    showToast('已断开连接');
}

function initSettingsPanel() {
    document.getElementById('settingsClose').addEventListener('click', closeSettingsPanel);
    document.getElementById('settingsOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeSettingsPanel();
    });
    document.getElementById('connectGistBtn').addEventListener('click', connectGist);
    document.getElementById('syncNowBtn').addEventListener('click', syncNow);
    document.getElementById('disconnectBtn').addEventListener('click', disconnectGist);
    document.getElementById('openSettingsBtn').addEventListener('click', openSettingsPanel);
    document.getElementById('openSettingsBtnDesktop').addEventListener('click', openSettingsPanel);
}

// 自动从 Gist 加载数据（如果已配置）
let isLoadingFromGist = false;

async function autoLoadFromGist() {
    if (GistSync.isConfigured() && !isLoadingFromGist) {
        isLoadingFromGist = true;
        try {
            const result = await GistSync.load();
            if (result.success) {
                appData = result.data;
                saveData(appData);
                initApp();
                showToast('从云端恢复数据成功', 'success');
                return true;
            }
        } catch (error) {
            // 静默失败，不影响正常加载
        } finally {
            isLoadingFromGist = false;
        }
    }
    return false;
}

// ========================================
// 导入/导出
// ========================================

function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jp-travel-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据已导出', 'success');
}

function importData() {
    document.getElementById('importFile').click();
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            if (confirm('导入将覆盖现有数据，确定继续吗？')) {
                appData = imported;
                saveData(appData);
                initApp();
                showToast('数据导入成功', 'success');
            }
        } catch (err) {
            showToast('文件格式错误', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// ========================================
// 初始化
// ========================================

async function initApp() {
    // 尝试从 Gist 加载数据
    await autoLoadFromGist();
    appData = loadData();
    renderItinerary();
    renderLuggage();
    renderPlaces();
    renderHotels();
    renderNotes();
    updateCountdown();
}

function initEventListeners() {
    document.getElementById('addDayBtn').addEventListener('click', addDay);
    document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
    document.getElementById('resetLuggageBtn').addEventListener('click', resetLuggage);
    document.getElementById('addPlaceBtn').addEventListener('click', addPlace);
    document.getElementById('addHotelBtn').addEventListener('click', addHotel);
    document.getElementById('addNoteBtn').addEventListener('click', addNote);
    // 桌面端导入/导出
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', importData);
    document.getElementById('importFile').addEventListener('change', handleImport);
    // 移动端导入/导出
    document.getElementById('mobileExportBtn').addEventListener('click', exportData);
    document.getElementById('mobileImportBtn').addEventListener('click', () => {
        document.getElementById('mobileImportFile').click();
    });
    document.getElementById('mobileImportFile').addEventListener('change', handleImport);
}

// 下拉刷新
// ========================================
let pullStartY = 0;
let pullCurrentY = 0;
let isPulling = false;
let isRefreshing = false;

function isAnyModalOpen() {
    const modalOverlay = document.getElementById('modalOverlay');
    const settingsOverlay = document.getElementById('settingsOverlay');
    return modalOverlay?.classList.contains('active') || settingsOverlay?.classList.contains('active');
}

function initPullToRefresh() {
    const pullEl = document.getElementById('pullToRefresh');
    if (!pullEl) return;

    document.addEventListener('touchstart', (e) => {
        if (isRefreshing) return;
        if (isAnyModalOpen()) return;
        if (window.scrollY === 0) {
            pullStartY = e.touches[0].pageY;
            isPulling = true;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isPulling || isRefreshing) return;
        if (isAnyModalOpen()) {
            isPulling = false;
            return;
        }
        pullCurrentY = e.touches[0].pageY;
        const pullDistance = Math.max(0, pullCurrentY - pullStartY);

        if (pullDistance > 0) {
            e.preventDefault();
            const progress = Math.min(pullDistance / 100, 1);
            pullEl.style.transform = 'translateY(0)';
            pullEl.style.height = `${Math.min(pullDistance, 140) * 0.5}px`;
            pullEl.style.opacity = '1';

            const icon = pullEl.querySelector('.refresh-icon');
            const text = pullEl.querySelector('.refresh-text');
            if (progress >= 1) {
                icon.style.transform = 'rotate(180deg)';
                text.textContent = '释放刷新';
            } else {
                icon.style.transform = `rotate(${progress * 180}deg)`;
                text.textContent = '下拉刷新';
            }
        }
    }, { passive: false });

    document.addEventListener('touchend', () => {
        if (!isPulling) return;
        isPulling = false;

        const pullDistance = pullCurrentY - pullStartY;
        if (pullDistance > 80 && !isRefreshing && !isAnyModalOpen()) {
            triggerRefresh();
        } else {
            resetPull();
        }
        pullStartY = 0;
        pullCurrentY = 0;
    });
}

function triggerRefresh() {
    const pullEl = document.getElementById('pullToRefresh');
    const icon = pullEl.querySelector('.refresh-icon');
    const text = pullEl.querySelector('.refresh-text');
    isRefreshing = true;

    icon.classList.add('spinning');
    text.textContent = '刷新中...';

    setTimeout(() => {
        location.reload();
    }, 500);
}

function resetPull() {
    const pullEl = document.getElementById('pullToRefresh');
    pullEl.style.transition = 'height 0.3s ease, opacity 0.3s ease, transform 0.3s ease';
    pullEl.style.height = '0px';
    pullEl.style.opacity = '0';
    pullEl.style.transform = 'translateY(-100%)';
    setTimeout(() => {
        pullEl.style.transition = '';
        pullEl.style.height = '';
        pullEl.style.opacity = '';
        pullEl.style.transform = '';
    }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initModal();
    initFilterTabs();
    initSettingsPanel();
    initEventListeners();
    initPullToRefresh();
    initApp();
});
