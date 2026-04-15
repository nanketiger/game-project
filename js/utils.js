// 键盘状态
const keys = {};

// 射击冷却
let lastShootTime = 0;
const shootCooldown = 1000;

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

// 射击函数（工具）
function shoot() {
    const currentTime = Date.now();
    if (currentTime - lastShootTime < shootCooldown) return;
    lastShootTime = currentTime;

    const b = document.createElement('div');
    b.className = 'bullet';
    b.style.left = x + 15 + 'px';
    b.style.bottom = groundHeight + y + 25 + 'px';
    document.body.appendChild(b);

    const bulletSpeed = 8 * faceDir;
    function move() {
        if (!b.parentNode) return;
        let l = parseFloat(b.style.left);
        l += bulletSpeed;
        b.style.left = l + 'px';

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

        if (l < 0 || l > innerWidth) b.remove();
        else requestAnimationFrame(move);
    }
    move();
}

// J键射击
document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'j') shoot();
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
    updateHealthDisplay();
    
    // 创建游戏元素
    createPlatforms();
    createMonster();
    
    // 开始游戏循环
    loop();
}