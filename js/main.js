// ========== 全局变量 ==========
const player = document.getElementById('player');
const groundHeight = 100;

let x = 200;
let y = 0;
const speed = 3.5;
const jumpPower = 20;
let vy = 0;
const gravity = 0.5;
let isOnGround = false;

// 血量
let playerHealth = 100;
const maxHealth = 100;

// 子弹伤害
let bulletDamage = 100;

// 平台
let platforms = [];

// 怪物
let monsters = [];

// 掉落物管理
let drops = [];

// 关卡系统
const MAX_LEVEL = 10;
let currentLevel = 1;

// 传送门
let portal = null;
let portalX = 0;
let portalY = 0;

// ========== 工具函数 ==========

// 创建平台
function addPlatform(x, y, w, h) {
    const el = document.createElement('div');
    el.className = 'platform';
    el.style.left = x + 'px';
    el.style.bottom = y + 'px';
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    document.getElementById('game-container').appendChild(el);
    platforms.push({ x, y, w, h, element: el });
}

function createPortal() {
    portal = document.createElement('div');
    portal.className = 'portal';
    portalX = (window.innerWidth - 80) / 2;
    portalY = groundHeight + 100;
    portal.style.left = portalX + 'px';
    portal.style.bottom = portalY + 'px';

    for (let i = 0; i < 20; i++) {
        let particle = document.createElement('div');
        particle.className = 'portal-particle';
        let angle = Math.random() * Math.PI * 2;
        let radius = 60 + Math.random() * 60;
        let startX = Math.cos(angle) * radius + 'px';
        let startY = Math.sin(angle) * radius + 'px';
        particle.style.setProperty('--startX', startX);
        particle.style.setProperty('--startY', startY);
        let duration = 0.8 + Math.random() * 1.5;
        let delay = Math.random() * 2;
        particle.style.animation = `suckIn ${duration}s ease-in ${delay}s infinite`;
        portal.appendChild(particle);
    }

    document.body.appendChild(portal);
}

// 生成掉落物
function spawnDrop(x, y) {
    const drop = document.createElement('div');
    drop.className = 'drop-item';
    drop.style.left = (x + 20) + 'px';
    drop.style.bottom = (y + 10) + 'px';
    document.getElementById('game-container').appendChild(drop);
    drops.push({
        element: drop,
        x: x + 20,
        y: y + 10
    });
}

// ========== 清场 ==========
function clearPlatforms() {
    document.querySelectorAll('.platform').forEach(plat => plat.remove());
    platforms = [];
}

function clearMap() {
    clearPlatforms();
    if (portal) { portal.remove(); portal = null; }
    monsters.forEach(m => m.element.remove());
    monsters = [];
    drops.forEach(d => d.element.remove());
    drops = [];
}

// ========== 10个房间生成函数 ==========

// 第1关：入门关 — 平坦地面，2只怪物
function generateRoom1() {
    let positions = [200, window.innerWidth - 260];
    for (let px of positions) {
        monsters.push(new Monster(px, groundHeight, currentLevel));
    }
}

// 第2关：低矮平台 — 2个低平台，3只怪物
function generateRoom2() {
    const W = window.innerWidth;
    addPlatform(100, 150, 120, 20);
    addPlatform(W - 220, 150, 120, 20);
    monsters.push(new Monster(80, groundHeight, currentLevel));
    monsters.push(new Monster(W / 2 - 30, 170, currentLevel));
    monsters.push(new Monster(W - 140, groundHeight, currentLevel));
}

// 第3关：阶梯平台 — 3个不同高度平台，4只怪物
function generateRoom3() {
    const W = window.innerWidth;
    addPlatform(50, 130, 100, 20);
    addPlatform(W / 2 - 60, 180, 120, 20);
    addPlatform(W - 150, 230, 100, 20);
    monsters.push(new Monster(60, groundHeight, currentLevel));
    monsters.push(new Monster(W / 2 - 20, 200, currentLevel));
    monsters.push(new Monster(W / 2 + 30, 250, currentLevel));
    monsters.push(new Monster(W - 100, groundHeight, currentLevel));
}

// 第4关：多层平台 — 两侧低中间高，5只怪物
function generateRoom4() {
    const W = window.innerWidth;
    addPlatform(W / 2 - 180, 140, 100, 20);
    addPlatform(W / 2 - 60, 200, 120, 20);
    addPlatform(W / 2 + 60, 140, 100, 20);
    addPlatform(W / 2 - 60, 260, 120, 20);
    monsters.push(new Monster(80, groundHeight, currentLevel));
    monsters.push(new Monster(W / 2 - 30, 160, currentLevel));
    monsters.push(new Monster(W / 2, 220, currentLevel));
    monsters.push(new Monster(W / 2 - 30, 280, currentLevel));
    monsters.push(new Monster(W - 140, groundHeight, currentLevel));
}

// 第5关：裂谷 — 中间断开需跳跃，6只怪物
function generateRoom5() {
    const W = window.innerWidth;
    addPlatform(80, 130, 150, 20);
    addPlatform(W - 230, 130, 150, 20);
    addPlatform(W / 2 - 50, 190, 100, 20);
    monsters.push(new Monster(100, 150, currentLevel));
    monsters.push(new Monster(200, groundHeight, currentLevel));
    monsters.push(new Monster(W / 2 - 20, 210, currentLevel));
    monsters.push(new Monster(W / 2 + 20, groundHeight, currentLevel));
    monsters.push(new Monster(W - 200, 150, currentLevel));
    monsters.push(new Monster(W - 100, groundHeight, currentLevel));
}

// 第6关：双层结构 — 上下两层平台，6只怪物
function generateRoom6() {
    const W = window.innerWidth;
    addPlatform(50, 120, 200, 20);
    addPlatform(W - 250, 120, 200, 20);
    addPlatform(100, 200, 150, 20);
    addPlatform(W / 2 - 75, 200, 150, 20);
    addPlatform(W - 250, 200, 150, 20);
    monsters.push(new Monster(80, 140, currentLevel));
    monsters.push(new Monster(W / 2 - 30, 220, currentLevel));
    monsters.push(new Monster(W / 2 + 30, groundHeight, currentLevel));
    monsters.push(new Monster(W - 200, 220, currentLevel));
    monsters.push(new Monster(W - 80, 140, currentLevel));
    monsters.push(new Monster(W / 2 - 40, groundHeight, currentLevel));
}

// 第7关：浮空岛群 — 多个分散小平台，7只怪物
function generateRoom7() {
    const W = window.innerWidth;
    addPlatform(60, 100, 80, 20);
    addPlatform(200, 160, 80, 20);
    addPlatform(360, 120, 80, 20);
    addPlatform(W / 2 - 40, 200, 80, 20);
    addPlatform(W - 280, 160, 80, 20);
    addPlatform(W - 140, 100, 80, 20);
    monsters.push(new Monster(80, 120, currentLevel));
    monsters.push(new Monster(220, 180, currentLevel));
    monsters.push(new Monster(380, 140, currentLevel));
    monsters.push(new Monster(W / 2, 220, currentLevel));
    monsters.push(new Monster(W / 2 + 30, groundHeight, currentLevel));
    monsters.push(new Monster(W - 260, 180, currentLevel));
    monsters.push(new Monster(W - 120, 120, currentLevel));
}

// 第8关：高塔 — 多层堆叠，7只怪物
function generateRoom8() {
    const W = window.innerWidth;
    addPlatform(W / 2 - 150, 120, 100, 20);
    addPlatform(W / 2 - 120, 180, 100, 20);
    addPlatform(W / 2 - 90, 240, 100, 20);
    addPlatform(W / 2 - 10, 120, 100, 20);
    addPlatform(W / 2 + 10, 180, 100, 20);
    addPlatform(W / 2 + 30, 240, 100, 20);
    monsters.push(new Monster(W / 2 - 130, 140, currentLevel));
    monsters.push(new Monster(W / 2 - 100, 200, currentLevel));
    monsters.push(new Monster(W / 2 - 70, 260, currentLevel));
    monsters.push(new Monster(60, groundHeight, currentLevel));
    monsters.push(new Monster(W / 2 + 80, 200, currentLevel));
    monsters.push(new Monster(W / 2 + 60, 260, currentLevel));
    monsters.push(new Monster(W - 120, groundHeight, currentLevel));
}

// 第9关：竞技场 — 四角 + 中央平台，8只怪物
function generateRoom9() {
    const W = window.innerWidth;
    addPlatform(40, 100, 80, 20);
    addPlatform(W - 120, 100, 80, 20);
    addPlatform(40, 220, 80, 20);
    addPlatform(W - 120, 220, 80, 20);
    addPlatform(W / 2 - 100, 160, 200, 20);
    monsters.push(new Monster(60, 120, currentLevel));
    monsters.push(new Monster(60, 240, currentLevel));
    monsters.push(new Monster(W / 2 - 30, 180, currentLevel));
    monsters.push(new Monster(W / 2 + 30, 180, currentLevel));
    monsters.push(new Monster(W - 100, 120, currentLevel));
    monsters.push(new Monster(W - 100, 240, currentLevel));
    monsters.push(new Monster(W / 2 - 80, groundHeight, currentLevel));
    monsters.push(new Monster(W / 2 + 80, groundHeight, currentLevel));
}

// 第10关：最终关 — 对称多层布局，8只怪物满配
function generateRoom10() {
    const W = window.innerWidth;
    addPlatform(W / 2 - 40, 280, 80, 20);
    addPlatform(W / 2 - 160, 220, 100, 20);
    addPlatform(W / 2 + 60, 220, 100, 20);
    addPlatform(60, 160, 120, 20);
    addPlatform(W - 180, 160, 120, 20);
    addPlatform(150, 100, 100, 20);
    addPlatform(W - 250, 100, 100, 20);
    monsters.push(new Monster(W / 2 - 20, 300, currentLevel));
    monsters.push(new Monster(W / 2 - 140, 240, currentLevel));
    monsters.push(new Monster(W / 2 + 100, 240, currentLevel));
    monsters.push(new Monster(80, 180, currentLevel));
    monsters.push(new Monster(W - 140, 180, currentLevel));
    monsters.push(new Monster(170, 120, currentLevel));
    monsters.push(new Monster(W - 230, 120, currentLevel));
    monsters.push(new Monster(W / 2 - 30, groundHeight, currentLevel));
}

// ========== 房间生成调度 ==========
const roomGenerators = [
    generateRoom1,
    generateRoom2,
    generateRoom3,
    generateRoom4,
    generateRoom5,
    generateRoom6,
    generateRoom7,
    generateRoom8,
    generateRoom9,
    generateRoom10
];

function generateRoom(level) {
    if (level >= 1 && level <= MAX_LEVEL) {
        roomGenerators[level - 1]();
    }
}

// ========== 地图刷新 ==========
function updateLevelDisplay() {
    document.getElementById('level-info').textContent =
        `关卡: ${currentLevel} / ${MAX_LEVEL}`;
}

function refreshMap() {
    clearMap();
    currentLevel++;

    if (currentLevel > MAX_LEVEL) {
        showVictory();
        return;
    }

    updateLevelDisplay();
    generateRoom(currentLevel);
}

// ========== 胜利 & 重开 ==========
function showVictory() {
    document.getElementById('victory-screen').classList.remove('hidden');
    document.getElementById('victory-screen').classList.add('active');
}

function restartGame() {
    document.getElementById('victory-screen').classList.remove('active');
    document.getElementById('victory-screen').classList.add('hidden');

    clearMap();
    playerHealth = maxHealth;
    currentLevel = 0;
    x = 200;
    y = 0;
    vy = 0;
    updateHealthDisplay();
    updateLevelDisplay();
    refreshMap();
}

// ========== 主循环 ==========
function loop() {
    // 胜利界面激活时不处理游戏逻辑
    if (document.getElementById('victory-screen').classList.contains('active')) {
        requestAnimationFrame(loop);
        return;
    }

    // 移动
    if (keys.a) { x -= speed; faceDir = -1; }
    if (keys.d) { x += speed; faceDir = 1; }

    // 边界
    const playerWidth = 30;
    x = Math.max(0, Math.min(x, window.innerWidth - playerWidth));

    // 跳跃
    if (keys.k && isOnGround) {
        vy = jumpPower;
        isOnGround = false;
    }

    // 重力
    vy -= gravity;
    y += vy;

    // 地面
    if (y <= 0) {
        y = 0;
        vy = 0;
        isOnGround = true;
    }

    // 平台碰撞
    let onPlatform = false;
    const playerBottom = groundHeight + y;
    const playerTop = playerBottom + 50;

    for (const plat of platforms) {
        const platLeft = plat.x;
        const platRight = plat.x + plat.w;
        const platTop = plat.y + plat.h;

        if (
            (x + 30) > platLeft &&
            x < platRight &&
            playerTop >= platTop &&
            playerBottom <= platTop &&
            vy <= 0
        ) {
            y = platTop - groundHeight;
            vy = 0;
            onPlatform = true;
        }
    }

    isOnGround = (y <= 0 || onPlatform);

    // 怪物移动 + 碰撞伤害
    for (let i = 0; i < monsters.length; i++) {
        let m = monsters[i];
        m.update();

        const pRect = player.getBoundingClientRect();
        const mRect = m.element.getBoundingClientRect();
        const now = Date.now();

        if (
            pRect.left < mRect.right &&
            pRect.right > mRect.left &&
            pRect.top < mRect.bottom &&
            pRect.bottom > mRect.top
        ) {
            if (now - lastDamageTime >= damageCooldown) {
                playerHealth = Math.max(0, playerHealth - 1);
                lastDamageTime = now;
                updateHealthDisplay();
            }
        }
    }

    // 拾取掉落物检测
    for (let i = drops.length - 1; i >= 0; i--) {
        let drop = drops[i];
        const pRect = player.getBoundingClientRect();
        const dRect = drop.element.getBoundingClientRect();

        if (
            pRect.left < dRect.right &&
            pRect.right > dRect.left &&
            pRect.top < dRect.bottom &&
            pRect.bottom > dRect.top
        ) {
            if (addItemToBackpack("紫怪核心")) {
                drop.element.remove();
                drops.splice(i, 1);
            }
        }
    }

    // 传送门检测
    if (portal) {
        const pRect = player.getBoundingClientRect();
        const portRect = portal.getBoundingClientRect();
        if (
            pRect.left < portRect.right &&
            pRect.right > portRect.left &&
            pRect.top < portRect.bottom &&
            pRect.bottom > portRect.top
        ) {
            refreshMap();
        }
    }

    // 渲染
    player.style.left = x + 'px';
    player.style.bottom = groundHeight + y + 'px';
    player.className = 'idle';
    player.style.transform = `scaleX(${faceDir * 0.3}) scaleY(0.3)`;

    requestAnimationFrame(loop);
}

// ========== 启动游戏 ==========
document.addEventListener('DOMContentLoaded', function () {
    initStartScreen();
    document.getElementById('restart-btn').addEventListener('click', restartGame);
});
