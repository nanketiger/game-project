// ========== 全局变量 ==========
const player = document.getElementById('player');
const groundHeight = 100;

let x = 200;
let y = 0;
const speed = 3.5;
const jumpPower = 10;
let vy = 0;
const gravity = 0.25;
let isOnGround = false;

// 血量
let playerHealth = 3;
const maxHealth = 3;

// 平台
let platforms = [];
const platformCount = 8;

// 怪物
let monsters = []; // 用数组统一管理当前关卡的所有怪物

// 关卡系统
let currentLevel = 1; // 当前关卡数

// 传送门
let portal = null;
let portalX = 0;
let portalY = 0;

// ========== 生成函数 ==========

function createPlatforms() {
    // 清空平台数组，游戏中没有平台
    platforms = [];
}

function createPortal() {
    portal = document.createElement('div');
    portal.className = 'portal';
    portalX = (window.innerWidth - 80) / 2;
    portalY = groundHeight + 100;
    portal.style.left = portalX + 'px';
    portal.style.bottom = portalY + 'px';
    document.body.appendChild(portal);
}

// ========== 地图刷新 ==========
function clearPlatforms() {
    document.querySelectorAll('.platform').forEach(plat => plat.remove());
    platforms = [];
}

function refreshMap() {
    clearPlatforms();
    if (portal) { portal.remove(); portal = null; }
    
    // 清理旧怪物
    monsters.forEach(m => m.element.remove());
    monsters = [];

    createPlatforms();
    currentLevel++;
    
    // 关卡越高，怪物越多（这里设定每关加1只，最多8只）
    let monsterCount = Math.min(1 + currentLevel, 8); 
    for(let i = 0; i < monsterCount; i++) {
        let randomX = Math.random() * (window.innerWidth - 100);
        monsters.push(new Monster(randomX, groundHeight, currentLevel));
    }
}

// ========== 主循环 ==========
function loop() {
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
        m.update(); // 让每只怪物动起来

        // 玩家受伤检测
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

    requestAnimationFrame(loop);
}

// ========== 启动游戏 ==========
// 初始化开始界面
document.addEventListener('DOMContentLoaded', function() {
    initStartScreen();
});