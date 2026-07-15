// 键盘状态
const keys = {};

// 射击冷却
let lastShootTime = 0;
let shootCooldown = 500;

// 角色伤害冷却
let lastDamageTime = 0;
let damageCooldown = 1000;

// 人物缩放倍率（统一全局控制尺寸和碰撞、子弹位置，默认为1.5）
let playerScale = 1.5;

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

    // 延迟200毫秒再射出子弹配合射击动画
    setTimeout(() => {
        // 先检查一下容器还在不在激活状态，防止切页面时射子弹
        if (!document.getElementById('game-container').classList.contains('active')) return;

        const b = document.createElement('div');
    b.className = 'bullet';
    
    // 子弹发射位置随 playerScale 动态计算（解决修改尺寸后错位问题）
    // 基础中心 x 轴约在人物正中 (x + 15)，再加上面朝方向的枪管偏移 (faceDir * 35 * playerScale)
    b.style.left = (x + 15 + faceDir * 35 * playerScale) + 'px';
    // 垂直高度底盘加上 (35 * playerScale) 使得刚好从手的位置出枪
    b.style.bottom = (groundHeight + y + 45 * playerScale) + 'px';
    
    document.body.appendChild(b);

    // 根据方向设置子弹速度
    let bulletSpeedX = 0;
    let bulletSpeedY = 0;
    
    switch(direction) {
        case 'up':
            bulletSpeedY = 5;
            break;
        case 'up-right':
            bulletSpeedX = 5;
            bulletSpeedY = 5;
            break;
        case 'up-left':
            bulletSpeedX = -5;
            bulletSpeedY = 5;
            break;
        case 'down':
            bulletSpeedY = -5;
            break;
        case 'down-right':
            bulletSpeedX = 5;
            bulletSpeedY = -5;
            break;
        case 'down-left':
            bulletSpeedX = -5;
            bulletSpeedY = -5;
            break;
        default:
            bulletSpeedX = 5 * faceDir;
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
        for (let i = monsters.length - 1; i >= 0; i--) {
            let m = monsters[i];
            const bulletRect = b.getBoundingClientRect();
            const monsterRect = m.element.getBoundingClientRect();
            
            if (
                bulletRect.left < monsterRect.right &&
                bulletRect.right > monsterRect.left &&
                bulletRect.top < monsterRect.bottom &&
                bulletRect.bottom > monsterRect.top
            ) {
                // 子弹命中
                b.remove(); 
                
                // 【新增】计算击退方向：如果子弹有水平速度，按子弹方向；如果是垂直射击，按玩家面朝方向
                let knockbackDir = bulletSpeedX !== 0 ? Math.sign(bulletSpeedX) : faceDir;
                
                // 【修改】传入伤害值和击退方向
                if (m.takeDamage(bulletDamage, knockbackDir)) {
                    monsters.splice(i, 1); // 怪物死亡，从数组中移除
                    
                    // 当数组清空（怪物全灭）且传送门没出现时，弹出遗物选择
                    if (monsters.length === 0 && !portal && !isRelicSelecting) {
                        showRelicSelection();
                    }
                }
                return; // 子弹穿透取消，打中就消失
            }
        }

        // 边界检测（水平和垂直）
        if (l < 0 || l > innerWidth || t > innerHeight) b.remove();
        else requestAnimationFrame(move);
    }
    move();

    // 双射管：额外发射一颗子弹
    if (selectedRelics.includes(7)) {
        const b2 = document.createElement('div');
        b2.className = 'bullet';
        // 第二发子弹随 playerScale 动态计算位置（高度略高）
        b2.style.left = (x + 15 + faceDir * 35 * playerScale) + 'px';
        b2.style.bottom = (groundHeight + y + 35 * playerScale) + 'px';
        document.body.appendChild(b2);

        const sx = bulletSpeedX;
        const sy = bulletSpeedY;
        function move2() {
            if (!b2.parentNode) return;
            let l = parseFloat(b2.style.left);
            let t = parseFloat(b2.style.bottom);
            l += sx;
            t += sy;
            b2.style.left = l + 'px';
            b2.style.bottom = t + 'px';

            for (let i = monsters.length - 1; i >= 0; i--) {
                let m = monsters[i];
                const bulletRect = b2.getBoundingClientRect();
                const monsterRect = m.element.getBoundingClientRect();
                if (
                    bulletRect.left < monsterRect.right &&
                    bulletRect.right > monsterRect.left &&
                    bulletRect.top < monsterRect.bottom &&
                    bulletRect.bottom > monsterRect.top
                ) {
                    b2.remove();
                    let knockbackDir = sx !== 0 ? Math.sign(sx) : faceDir;
                    if (m.takeDamage(bulletDamage, knockbackDir)) {
                        monsters.splice(i, 1);
                        if (monsters.length === 0 && !portal && !isRelicSelecting) {
                            showRelicSelection();
                        }
                    }
                    return;
                }
            }
            if (l < 0 || l > innerWidth || t > innerHeight) b2.remove();
            else requestAnimationFrame(move2);
        }
        move2();
    }
    }, 200); // 延迟结束
}

// 射击控制 - 支持按键组合
document.addEventListener('keydown', e => {
    // 已经死亡或者在暂停/胜利界面不允许射击
    if (typeof isDead !== 'undefined' && isDead) return;
    if (document.getElementById('victory-screen').classList.contains('active')) return;

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

    // 首次用户交互时启动音乐（主界面即开始播放）
    const bgm = document.getElementById('bgm');
    function tryPlayBgm() {
        if (bgm && bgm.paused) bgm.play().catch(() => {});
    }
    document.addEventListener('click', tryPlayBgm, { once: true });
    document.addEventListener('keydown', tryPlayBgm, { once: true });
}

function startGame() {
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');

    // 启动背景音乐
    const bgm = document.getElementById('bgm');
    if (bgm && bgm.paused) bgm.play().catch(() => {});

    // 切换屏幕显示
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    gameContainer.classList.add('active');
    
    // 初始化游戏
    initGame();
}

function initGame() {
    // 取消旧的动画循环（防止重复启动导致加速）
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }

    // 重置游戏状态
    // 不覆盖 playerHealth，保持 main.js 声明的初始值
    currentLevel = 0;

    updateHealthDisplay();

    // 统一使用 refreshMap() 来初始化地图和生成第一波怪物
    refreshMap();

    // 开始游戏循环
    loop();
}