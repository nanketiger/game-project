// 键盘状态
const keys = {};

// 射击冷却
let lastShootTime = 0;
const shootCooldown = 500;

// 角色伤害冷却
let lastDamageTime = 0;
const damageCooldown = 1000;

// 面向方向
let faceDir = 1;

// 键盘监听
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

// 射击函数（工具）- 支持不同方向
function shoot(direction = 'horizontal') {
    const currentTime = Date.now();
    if (currentTime - lastShootTime < shootCooldown) return;
    lastShootTime = currentTime;

    const b = document.createElement('div');
    b.className = 'bullet';
    b.style.left = x + 15 + 'px';
    b.style.bottom = groundHeight + y + 25 + 'px';
    document.body.appendChild(b);

    // 根据方向设置子弹速度
    let bulletSpeedX = 0;
    let bulletSpeedY = 0;
    
    switch(direction) {
        case 'up':
            bulletSpeedY = 8; // 向上射击
            break;
        case 'up-right':
            bulletSpeedX = 8; // 向右上角射击
            bulletSpeedY = 8;
            break;
        case 'up-left':
            bulletSpeedX = -8; // 向左上角射击
            bulletSpeedY = 8;
            break;
        case 'down':
            bulletSpeedY = -8; // 向下射击
            break;
        case 'down-right':
            bulletSpeedX = 8; // 向右下角射击
            bulletSpeedY = -8;
            break;
        case 'down-left':
            bulletSpeedX = -8; // 向左下角射击
            bulletSpeedY = -8;
            break;
        default: // 水平射击
            bulletSpeedX = 8 * faceDir;
            break;
    }

    function move() {
        if (!b.parentNode) return;
        let l = parseFloat(b.style.left);
        let t = parseFloat(b.style.bottom);
        
        l += bulletSpeedX;
        t += bulletSpeedY;
        
        b.style.left = l + 'px';
        b.style.bottom = t + 'px';

        // 击中怪物检测
        if (monster && monsterHealth > 0 && monster.parentNode) {
            const bulletRect = b.getBoundingClientRect();
            const monsterRect = monster.getBoundingClientRect();
            if (
                bulletRect.left < monsterRect.right &&
                bulletRect.right > monsterRect.left &&
                bulletRect.top < monsterRect.bottom &&
                bulletRect.bottom > monsterRect.top
            ) {
                monsterHealth--;
                b.remove();
                if (monsterHealth <= 0) {
                    monster.remove();
                    monster = null;
                    createPortal();
                }
                return;
            }
        }

        // 边界检测（水平和垂直）
        if (l < 0 || l > innerWidth || t > innerHeight) b.remove();
        else requestAnimationFrame(move);
    }
    move();
}

// 射击控制 - 支持按键组合
document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    
    if (key === 'j') {
        // 检测按键组合
        if (keys.w && keys.a) {
            // W + A + J: 向左上角射击
            shoot('up-left');
        } else if (keys.w && keys.d) {
            // W + D + J: 向右上角射击
            shoot('up-right');
        } else if (keys.w) {
            // W + J: 向上射击
            shoot('up');
        } else if (keys.s && keys.a) {
            // S + A + J: 向左下角射击
            shoot('down-left');
        } else if (keys.s && keys.d) {
            // S + D + J: 向右下角射击
            shoot('down-right');
        } else if (keys.s) {
            // S + J: 向下射击
            shoot('down');
        } else {
            // 单独J键: 水平射击
            shoot('horizontal');
        }
    }
});

// 更新血量显示
function updateHealthDisplay() {
    const healthElement = document.getElementById('health');
    healthElement.textContent = `血量: ${playerHealth}`;
}

// 开始界面控制
function initStartScreen() {
    const startBtn = document.getElementById('start-btn');
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    
    startBtn.addEventListener('click', startGame);
    
    // 添加键盘支持（按空格或回车开始游戏）
    document.addEventListener('keydown', (e) => {
        if ((e.key === ' ' || e.key === 'Enter') && startScreen.classList.contains('active')) {
            startGame();
        }
    });
}

function startGame() {
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    
    // 切换屏幕显示
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    gameContainer.classList.add('active');
    
    // 初始化游戏
    initGame();
}

function initGame() {
    // 重置游戏状态
    playerHealth = maxHealth;
    currentLevel = 1; // 重置关卡数为1
    
    updateHealthDisplay();
    
    // 创建游戏元素
    createPlatforms();
    createMonster();
    
    // 开始游戏循环
    loop();
}