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
let monsters = []; // 用数组统一管理当前关卡的所有怪物

// 掉落物管理
let drops = [];

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

// 生成掉落物
function spawnDrop(x, y, itemName = '紫怪核心', dropColor = '#FFD700') {
    const drop = document.createElement('div');
    drop.className = 'drop-item';
    drop.style.left = (x + 20) + 'px';
    drop.style.bottom = (y + 10) + 'px';
    drop.style.background = dropColor;
    drop.style.boxShadow = `0 0 10px ${dropColor}, 0 0 20px ${dropColor}`;

    document.getElementById('game-container').appendChild(drop);

    drops.push({
        element: drop,
        x: x + 20,
        y: y + 10,
        itemName: itemName,
        dropColor: dropColor
    });
}

// ========== 地图刷新 ==========
function clearPlatforms() {
    document.querySelectorAll('.platform').forEach(plat => plat.remove());
    platforms = [];
}

// 按关卡随机怪物类型
function rollMonsterType(level) {
    if (level <= 2) return 'patrol';
    const pool = ['patrol'];
    if (level >= 3) pool.push('chase', 'chase');
    if (level >= 4) pool.push('tank');
    if (level >= 5) pool.push('sky');
    return pool[Math.floor(Math.random() * pool.length)];
}

function refreshMap() {
    clearPlatforms();
    if (portal) { portal.remove(); portal = null; }
    
    // 清理旧怪物
    monsters.forEach(m => m.element.remove());
    monsters = [];

    // 清理旧掉落物
    drops.forEach(d => d.element.remove());
    drops = [];

    createPlatforms();
    currentLevel++;
    
    // 关卡越高，怪物越多（每关加1只，最多12只）
    let monsterCount = Math.min(1 + currentLevel, 12);
    for (let i = 0; i < monsterCount; i++) {
        let randomX = Math.random() * (window.innerWidth - 100);
        let type = rollMonsterType(currentLevel);
        if (type === 'sky') {
            monsters.push(new Monster(randomX, groundHeight + 400, currentLevel, type));
        } else {
            monsters.push(new Monster(randomX, groundHeight, currentLevel, type));
        }
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
        m.update();

        // 天空怪不参与地面接触伤害
        if (m.type === 'sky') continue;

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
            // 拾取成功：先尝试放进背包
            if (addItemToBackpack(drop.itemName || '紫怪核心', drop.dropColor || '#FFD700')) {
                // 放进背包成功，才从画面中移除
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

    // 默认给玩家赋予待机类名
    player.className = 'idle';
    // 根据面朝方向水平翻转（因为原图缩放了0.3，所以X轴缩放要乘以0.3）
    player.style.transform = `scaleX(${faceDir * 0.3}) scaleY(0.3)`;

    requestAnimationFrame(loop);
}

// ========== 启动游戏 ==========
// 初始化开始界面
document.addEventListener('DOMContentLoaded', function() {
    initStartScreen();
});