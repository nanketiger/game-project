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

// 支持物品叠加的拾取逻辑
function addItemToBackpack(itemName, color = '#FFD700') {
    const slots = document.querySelectorAll('.backpack-slot');
    let firstEmptySlot = null;

    // 1. 第一轮遍历：先查找是否已经有同名物品
    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        
        // 如果发现同名物品，直接叠加数量！
        if (slot.dataset.item === itemName) {
            // 获取当前数量，如果没有记录则默认为 1
            let count = parseInt(slot.dataset.count || 1);
            count++;
            slot.dataset.count = count; // 更新数据
            
            // 更新 UI，在名字后面加上数量 (比如 x2, x3)
            const nameSpan = slot.querySelector('.item-name');
            if (nameSpan) {
                nameSpan.textContent = `${itemName} x${count}`;
            }
            
            // 顺便给个被拾取堆叠时的放大闪烁反馈（可选）
            slot.style.transform = 'scale(1.1)';
            setTimeout(() => slot.style.transform = '', 150);
            
            return true; // 叠加成功，拾取结束
        }
        
        // 顺便记录一下遇到的第一个空格子，供下面第 2 步使用
        if (!firstEmptySlot && slot.querySelector('.slot-empty')) {
            firstEmptySlot = slot;
        }
    }

    // 2. 如果背包里没有同名物品，且有空格子，则占个新位置
    if (firstEmptySlot) {
        firstEmptySlot.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center;">
                <div style="width:16px; height:16px; background:${color}; transform:rotate(45deg); box-shadow:0 0 10px ${color}; margin-bottom:8px;"></div>
                <!-- 加上 class="item-name" 方便上面叠加时去修改文字 -->
                <span class="item-name" style="font-size:12px; color:#fff;">${itemName} x1</span>
            </div>
        `;
        // 给格子打上标记：存了什么物品、存了几个
        firstEmptySlot.dataset.item = itemName;
        firstEmptySlot.dataset.count = 1; 
        
        return true; // 占位成功
    }
    
    console.log("背包满了！");
    return false; // 既没有同名物品，也没有空位，拾取失败
}