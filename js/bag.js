// 背包系统 - bag.js

let isBackpackOpen = false;
let backpackItems = {}; // { itemName: { count, color } }

// 初始化背包系统
function initBackpack() {
    createBackpackUI();
    setupBackpackEvents();
}

// 创建背包UI
function createBackpackUI() {
    const backpackScreen = document.createElement('div');
    backpackScreen.id = 'backpack-screen';
    backpackScreen.className = 'screen hidden';
    backpackScreen.innerHTML = `
        <div class="backpack-container">
            <div class="backpack-header">
                <h2>背包</h2>
                <button id="close-backpack" class="close-btn">×</button>
            </div>
            <div class="backpack-content">
                <div class="backpack-left">
                    <div class="backpack-grid-container">
                        <div class="backpack-grid" id="backpack-grid">
                            ${Array.from({length: 20}, (_, i) => `
                                <div class="backpack-slot" data-slot="${i}">
                                    <div class="slot-empty">空</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="backpack-relics">
                        <div class="relics-label">战利品</div>
                        <div class="relics-row" id="items-row">
                            <span class="relics-empty">暂无物品</span>
                        </div>
                    </div>
                </div>
                <div class="item-details" id="detail-panel">
                    <div class="item-preview">
                        <h3 class="preview-name">背包详情</h3>
                    </div>
                    <div class="item-description" id="detail-text">
                        <p>点击遗物或战利品查看详情</p>
                        <p>格子数量：20</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(backpackScreen);
}

// 设置背包事件
function setupBackpackEvents() {
    const backpackScreen = document.getElementById('backpack-screen');
    const closeBtn = document.getElementById('close-backpack');

    // B键切换背包
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'b') {
            if (backpackScreen.classList.contains('active')) {
                closeBackpack();
            } else {
                openBackpack();
            }
        }
    });

    // 关闭背包
    closeBtn.addEventListener('click', closeBackpack);
}

// 打开背包
function openBackpack() {
    const backpackScreen = document.getElementById('backpack-screen');
    const gameContainer = document.getElementById('game-container');

    backpackScreen.classList.remove('hidden');
    backpackScreen.classList.add('active');
    gameContainer.classList.add('paused');

    isBackpackOpen = true;

    refreshRelicDisplay();
    refreshItemDisplay();
    selectSlot(-1);
    resetDetailPanel();
}

// 关闭背包
function closeBackpack() {
    const backpackScreen = document.getElementById('backpack-screen');
    const gameContainer = document.getElementById('game-container');

    backpackScreen.classList.remove('active');
    backpackScreen.classList.add('hidden');
    gameContainer.classList.remove('paused');

    isBackpackOpen = false;
}

// 选中格子
function selectSlot(index) {
    const slots = document.querySelectorAll('.backpack-slot');
    slots.forEach(s => s.classList.remove('selected'));

    if (index >= 0 && index < slots.length) {
        slots[index].classList.add('selected');
    }
}

// ========== 遗物展示（格子区） ==========

function refreshRelicDisplay() {
    const slots = document.querySelectorAll('.backpack-slot');
    // 全部清空
    slots.forEach(s => {
        s.innerHTML = '<div class="slot-empty">空</div>';
        delete s.dataset.relicId;
        s.onclick = null;
    });

    // 填充遗物
    selectedRelics.forEach((rid, i) => {
        if (i >= slots.length) return;
        const relic = getRelicById(rid);
        if (!relic) return;

        const slot = slots[i];
        slot.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center;">
                <div class="relic-slot-icon">${relic.name.charAt(0)}</div>
                <span class="item-name" style="font-size:11px; color:#FFD700;">${relic.name}</span>
            </div>
        `;
        slot.dataset.relicId = rid;

        slot.addEventListener('click', () => {
            document.querySelectorAll('.backpack-relic-slot').forEach(r => r.classList.remove('selected'));
            selectSlot(i);
            showRelicDetail(relic);
        });
    });
}

// ========== 战利品展示（底部栏） ==========

function refreshItemDisplay() {
    const row = document.getElementById('items-row');
    if (!row) return;
    row.innerHTML = '';

    const itemNames = Object.keys(backpackItems);
    if (itemNames.length === 0) {
        row.innerHTML = '<span class="relics-empty">暂无物品</span>';
        return;
    }

    itemNames.forEach(name => {
        const data = backpackItems[name];
        const slot = document.createElement('div');
        slot.className = 'backpack-relic-slot';
        slot.innerHTML = `
            <div style="width:16px; height:16px; background:${data.color}; transform:rotate(45deg); box-shadow:0 0 6px ${data.color}; flex-shrink:0;"></div>
            <span class="relic-slot-name">${name} x${data.count}</span>
        `;
        slot.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.backpack-slot').forEach(s => s.classList.remove('selected'));
            document.querySelectorAll('.backpack-relic-slot').forEach(r => r.classList.remove('selected'));
            slot.classList.add('selected');
            showItemDetail(name, data);
        });
        row.appendChild(slot);
    });
}

// ========== 详情面板 ==========

function showRelicDetail(relic) {
    const nameEl = document.querySelector('#detail-panel .preview-name');
    const descEl = document.getElementById('detail-text');
    nameEl.textContent = relic.name;
    descEl.innerHTML = `
        <p class="relic-detail-effect">${relic.desc}</p>
        <div class="relic-detail-story">${relic.story}</div>
    `;
}

function showItemDetail(name, data) {
    const nameEl = document.querySelector('#detail-panel .preview-name');
    const descEl = document.getElementById('detail-text');
    nameEl.textContent = name;
    descEl.innerHTML = `
        <p style="font-size:16px; color:#fff;">数量：${data.count}</p>
        <p style="font-size:14px; color:#95a5a6;">击杀怪物的战利品，可用于后续合成或兑换。</p>
    `;
}

function resetDetailPanel() {
    const nameEl = document.querySelector('#detail-panel .preview-name');
    const descEl = document.getElementById('detail-text');
    nameEl.textContent = '背包详情';
    descEl.innerHTML = '<p>点击遗物或战利品查看详情</p><p>格子数量：20</p>';
}

// ========== 拾取逻辑 ==========

function addItemToBackpack(itemName, color = '#FFD700') {
    if (backpackItems[itemName]) {
        backpackItems[itemName].count++;
    } else {
        backpackItems[itemName] = { count: 1, color };
    }
    return true;
}

// 清空背包（游戏重开时调用）
function clearBackpackItems() {
    backpackItems = {};
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', function () {
    initBackpack();
});
