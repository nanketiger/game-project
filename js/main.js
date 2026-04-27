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

// 平台
let platforms = [];
const platformCount = 8;

// 怪物
let monster = null;
let monsterX = 0;
let monsterY = 0;
let monsterSpeed = 2;
let monsterDirection = -1;
let monsterHealth = 5;

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

function createMonster() {
    monster = document.createElement('div');
    monster.className = 'monster';
    monsterX = window.innerWidth - 60;
    monsterY = groundHeight;
    monster.style.left = monsterX + 'px';
    monster.style.bottom = monsterY + 'px';
    document.body.appendChild(monster);
}

function createPortal() {
    portal = document.createElement('div');
    portal.className = 'portal';
    portalX = (window.innerWidth - 80) / 2;
    portalY = groundHeight + 100;
    portal.style.left = portalX + 'px';
    portal.style.bottom = portalY + 'px';
    
    // 生成粒子
    for (let i = 0; i < 20; i++) {
        let particle = document.createElement('div');
        particle.className = 'portal-particle';
        
        // 随机生成粒子起始位置，在周围一个稍大一点的范围内
        let angle = Math.random() * Math.PI * 2;
        let radius = 60 + Math.random() * 60; // 60 到 120 的距离
        let startX = Math.cos(angle) * radius + 'px';
        let startY = Math.sin(angle) * radius + 'px';
        
        particle.style.setProperty('--startX', startX);
        particle.style.setProperty('--startY', startY);
        
        // 随机动画时长和延迟，形成连绵不断的吸入效果
        let duration = 0.8 + Math.random() * 1.5;
        let delay = Math.random() * 2;
        particle.style.animation = `suckIn ${duration}s ease-in ${delay}s infinite`;
        
        portal.appendChild(particle);
    }
    
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
    if (monster) { monster.remove(); monster = null; }

    createPlatforms();
    // 增加关卡数
    currentLevel++;
    // 怪物血量 = 5 * 关卡数
    monsterHealth = 5 * currentLevel;
    monsterDirection = -1;
    monsterSpeed = 2; // 确保怪物速度正确
    createMonster();
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
    if (monster && monsterHealth > 0) {
        monsterX += monsterSpeed * monsterDirection;
        if (monsterX <= 0) {
            monsterX = 0;
            monsterDirection = 1;
        } else if (monsterX >= window.innerWidth - 60) {
            monsterX = window.innerWidth - 60;
            monsterDirection = -1;
        }
        monster.style.left = monsterX + 'px';

        // 受伤检测
        const pRect = player.getBoundingClientRect();
        const mRect = monster.getBoundingClientRect();
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