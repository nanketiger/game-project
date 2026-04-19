// 背包系统 - bag.js

let isBackpackOpen = false; // 背包是否打开

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
                <div class="backpack-grid-container">
                    <div class="backpack-grid">
                        ${Array.from({length: 20}, (_, i) => `
                            <div class="backpack-slot" data-index="${i}">
                                <div class="slot-empty">空</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="item-details">
                    <div class="item-preview">
                        <h3 class="preview-name">背包详情</h3>
                    </div>
                    <div class="item-description">
                        <p>这是一个空的背包界面</p>
                        <p>格子数量：20</p>
                        <p>点击左侧格子可以选中</p>
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
    const slots = document.querySelectorAll('.backpack-slot');
    
    // B键打开背包
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'b' && !backpackScreen.classList.contains('active')) {
            openBackpack();
        }
    });
    
    // 关闭背包
    closeBtn.addEventListener('click', closeBackpack);
    
    // 格子点击事件
    slots.forEach(slot => {
        slot.addEventListener('click', () => {
            const index = parseInt(slot.dataset.index);
            selectSlot(index);
        });
    });
}

// 打开背包
function openBackpack() {
    const backpackScreen = document.getElementById('backpack-screen');
    const gameContainer = document.getElementById('game-container');
    
    backpackScreen.classList.remove('hidden');
    backpackScreen.classList.add('active');
    gameContainer.classList.add('paused');
    
    isBackpackOpen = true;
    
    // 重置选中状态
    selectSlot(-1);
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

// 选择格子
function selectSlot(index) {
    const slots = document.querySelectorAll('.backpack-slot');
    
    // 移除之前的选中状态
    slots.forEach(slot => slot.classList.remove('selected'));
    
    if (index >= 0) {
        // 选中格子
        slots[index].classList.add('selected');
    }
}

// 初始化背包系统
document.addEventListener('DOMContentLoaded', function() {
    initBackpack();
});