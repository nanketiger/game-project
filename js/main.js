// ========== 全局变量 ==========
const player = document.getElementById('player');
const groundHeight = 100;

let x = 200;
let y = 0;
let speed = 2.5;
let jumpPower = 12;
let vy = 0;
let gravity = 0.3;
let isOnGround = false;

// 血量
let playerHealth = 30;
let maxHealth = 50;
let isDead = false; // 是否死亡状态

// 子弹伤害
let bulletDamage = 5;

// 平台
let platforms = [];

// 怪物
let monsters = [];

// 掉落物管理
let drops = [];

// 炸弹管理
let bombs = [];
let lastTrailDamageTime = 0;

// 关卡系统
const MAX_LEVEL = 10;
let currentLevel = 1;

// 暂停
let isPaused = false;

// 复活芯片
let hasRevive = false;

// 动画帧 ID（防止重复启动 loop）
let animFrameId = null;

// 房间开始倒计时（怪物延迟激活）
let monstersActive = true;
let roomStartTimer = null;

// 传送门
let portal = null;
let portalX = 0;
let portalY = 0;

// 人物跟随效果
let playerEffect = null;
// 待机光环
let idleAura = null;
let idleTimer = 0;
// 复活芯片光环
let reviveAura = null;

// ========== 工具函数 ==========

function damagePlayer(amount) {
    playerHealth = Math.max(0, playerHealth - amount);
    updateHealthDisplay();
    if (amount > 0) {
        player.classList.add('hurt-flash');
        setTimeout(() => player.classList.remove('hurt-flash'), 150);
    }
}

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
    portalX = (window.innerWidth - 78) / 2;
    portalY = groundHeight + 100;
    portal = new PortalEffect(portalX, portalY);
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

// ========== 清场 ==========
function clearPlatforms() {
    document.querySelectorAll('.platform').forEach(plat => plat.remove());
    platforms = [];
}

function clearMap() {
    clearPlatforms();
    if (portal) { portal.destroy(); portal = null; }
    if (playerEffect) { playerEffect.destroy(); playerEffect = null; }
    if (idleAura) { idleAura.destroy(); idleAura = null; }
    if (reviveAura) { reviveAura.destroy(); reviveAura = null; }
    idleTimer = 0;
    monsters.forEach(m => {
        if (m.trailElements) m.trailElements.forEach(t => t.element.remove());
        if (m.warningBeams) m.warningBeams.forEach(b => b.remove());
        m.element.remove();
        m.hpBarContainer.remove();
    });
    monsters = [];
    bombs.forEach(b => b.remove());
    bombs = [];
    drops.forEach(d => d.element.remove());
    drops = [];
}

// 将平台上的怪物绑定到对应平台边界，不在平台上的空中怪物落回地面
function bindMonstersToPlatforms() {
    for (let m of monsters) {
        // 天空怪强制飞到高处
        if (m.type === 'sky') {
            m.y = window.innerHeight * 0.75;
            m.element.style.bottom = m.y + 'px';
            continue;
        }
        const mBottom = m.y;
        const mLeft = m.x;
        const mRight = m.x + m.elW;
        let foundPlatform = false;
        for (let p of platforms) {
            const pTop = p.y + p.h;
            if (Math.abs(mBottom - pTop) < 5 &&
                mRight > p.x && mLeft < p.x + p.w) {
                if (p.w >= m.elW) {
                    m.setBounds(p.x, p.x + p.w - m.elW);
                } else {
                    // 平台太窄：将怪物固定在平台中央，防止边界振荡"两张贴图"
                    const cx = p.x + (p.w - m.elW) / 2;
                    m.setBounds(cx, cx);
                }
                foundPlatform = true;
                break;
            }
        }
        // 不在任何平台上且高于地面 → 掉到地面
        if (!foundPlatform && mBottom > groundHeight) {
            m.y = groundHeight;
            m.element.style.bottom = groundHeight + 'px';
        }
    }
}

// ========== 10个房间生成函数 ==========

// 第1关：入门关 — 平坦地面，2只怪物
function generateRoom1() {
    let positions = [200, window.innerWidth - 260];
    for (let px of positions) {
        monsters.push(new Monster(px, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    }
}

// 第2关：低矮平台 — 2个低平台，3只怪物
function generateRoom2() {
    const W = window.innerWidth;
    addPlatform(100, 150, 120, 20);
    addPlatform(W - 220, 150, 120, 20);
    monsters.push(new Monster(80, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 - 30, 170, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W - 140, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
}

// 第3关：阶梯平台 — 3个不同高度平台，4只怪物
function generateRoom3() {
    const W = window.innerWidth;
    addPlatform(50, 130, 100, 20);
    addPlatform(W / 2 - 60, 180, 120, 20);
    addPlatform(W - 150, 230, 100, 20);
    monsters.push(new Monster(60, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 - 20, 200, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 + 30, 250, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W - 100, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
}

// 第4关：多层平台 — 两侧低中间高，5只怪物
function generateRoom4() {
    const W = window.innerWidth;
    addPlatform(W / 2 - 180, 140, 100, 20);
    addPlatform(W / 2 - 60, 200, 120, 20);
    addPlatform(W / 2 + 60, 140, 100, 20);
    addPlatform(W / 2 - 60, 260, 120, 20);
    monsters.push(new Monster(80, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 - 30, 160, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2, 220, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 - 30, 280, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W - 140, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
}

// 第5关：裂谷 — 中间断开需跳跃，6只怪物
function generateRoom5() {
    const W = window.innerWidth;
    addPlatform(80, 130, 150, 20);
    addPlatform(W - 230, 130, 150, 20);
    addPlatform(W / 2 - 50, 190, 100, 20);
    monsters.push(new Monster(100, 150, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(200, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 - 20, 210, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 + 20, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W - 200, 150, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W - 100, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
}

// 第6关：双层结构 — 上下两层平台，6只怪物
function generateRoom6() {
    const W = window.innerWidth;
    addPlatform(50, 120, 200, 20);
    addPlatform(W - 250, 120, 200, 20);
    addPlatform(100, 200, 150, 20);
    addPlatform(W / 2 - 75, 200, 150, 20);
    addPlatform(W - 250, 200, 150, 20);
    monsters.push(new Monster(80, 140, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 - 30, 220, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 + 30, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W - 200, 220, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W - 80, 140, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 - 40, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
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
    monsters.push(new Monster(80, 120, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(220, 180, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(380, 140, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2, 220, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 + 30, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W - 260, 180, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W - 120, 120, currentLevel, groundHeight, rollMonsterType(currentLevel)));
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
    monsters.push(new Monster(W / 2 - 130, 140, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 - 100, 200, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 - 70, 260, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(60, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 + 80, 200, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 + 60, 260, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W - 120, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
}

// 第9关：竞技场 — 四角 + 中央平台，8只怪物
function generateRoom9() {
    const W = window.innerWidth;
    addPlatform(40, 100, 80, 20);
    addPlatform(W - 120, 100, 80, 20);
    addPlatform(40, 220, 80, 20);
    addPlatform(W - 120, 220, 80, 20);
    addPlatform(W / 2 - 100, 160, 200, 20);
    monsters.push(new Monster(60, 120, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(60, 240, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 - 30, 180, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 + 30, 180, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W - 100, 120, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W - 100, 240, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 - 80, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    monsters.push(new Monster(W / 2 + 80, groundHeight, currentLevel, groundHeight, rollMonsterType(currentLevel)));
}

// 第10关：Boss战 — 1个Boss+小怪混搭
function generateRoom10() {
    const W = window.innerWidth;
    const bossScale = 3;
    const bossTypes = ['sky', 'chase', 'tank'];
    const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
    const cfg = MONSTER_CONFIG[bossType];
    const bossW = cfg.w * bossScale;
    const bossX = (W - bossW) / 2;

    // 原有对称多层布局
    addPlatform(W / 2 - 40, 280, 80, 20);
    addPlatform(W / 2 - 160, 220, 100, 20);
    addPlatform(W / 2 + 60, 220, 100, 20);
    addPlatform(60, 160, 120, 20);
    addPlatform(W - 180, 160, 120, 20);
    addPlatform(150, 100, 100, 20);
    addPlatform(W - 250, 100, 100, 20);

    // Boss（居中，占地面最多区域）
    if (bossType === 'sky') {
        monsters.push(new Monster(bossX, window.innerHeight * 0.55, currentLevel, groundHeight, bossType, bossScale));
    } else {
        monsters.push(new Monster(bossX, groundHeight, currentLevel, groundHeight, bossType, bossScale));
    }

    // 其余5只小怪分散在各平台
    const sideMonsters = 5;
    for (let i = 0; i < sideMonsters; i++) {
        const mx = 80 + Math.random() * (W - 160);
        const my = groundHeight + Math.random() * 250;
        monsters.push(new Monster(mx, my, currentLevel, groundHeight, rollMonsterType(currentLevel)));
    }
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
    const text = currentLevel === MAX_LEVEL
        ? `最终关: BOSS战`
        : `关卡: ${currentLevel} / ${MAX_LEVEL}`;
    document.getElementById('level-info').textContent = text;
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
    bindMonstersToPlatforms();

    // 房间开始 2 秒内怪物不激活
    monstersActive = false;
    if (roomStartTimer) clearTimeout(roomStartTimer);
    roomStartTimer = setTimeout(() => {
        monstersActive = true;
        roomStartTimer = null;
    }, 1000);

    // 治疗仪：每进入新关卡恢复 5 点生命
    if (selectedRelics.includes(12)) {
        playerHealth = Math.min(maxHealth, playerHealth + 5);
        updateHealthDisplay();
    }

    // 人物跟随效果：进入新关卡前5秒显示
    if (playerEffect) playerEffect.destroy();
    playerEffect = new PlayerEffect(x, groundHeight + y);

    // 第5关起切换背景
    const skyEl = document.querySelector('.sky-background');
    if (skyEl) {
        skyEl.style.backgroundImage = currentLevel >= 5
            ? 'url("images/内部背景3.png")'
            : 'url("images/内部背景2.png")';
    }
}

// ========== 暂停 ==========
function togglePause() {
    // 选择遗物或胜利时不响应暂停
    if (isRelicSelecting || document.getElementById('victory-screen').classList.contains('active')) return;

    isPaused = !isPaused;
    if (isPaused) {
        document.getElementById('pause-screen').classList.remove('hidden');
        document.getElementById('pause-screen').classList.add('active');
    } else {
        document.getElementById('pause-screen').classList.remove('active');
        document.getElementById('pause-screen').classList.add('hidden');
    }
}

function resumeGame() {
    isPaused = false;
    document.getElementById('pause-screen').classList.remove('active');
    document.getElementById('pause-screen').classList.add('hidden');
}

function returnToMenu() {
    isPaused = false;
    document.getElementById('pause-screen').classList.remove('active');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('active');
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('start-screen').classList.add('active');

    clearMap();
    clearRelics();
    clearBackpackItems();
    hasRevive = false;
    isDead = false;
    monstersActive = true;
    if (roomStartTimer) { clearTimeout(roomStartTimer); roomStartTimer = null; }
    playerHealth = 30;
    currentLevel = 0;
    x = 200;
    y = 0;
    vy = 0;
    gravity = 0.3;
    jumpPower = 12;
    updateHealthDisplay();
    updateLevelDisplay();
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
    clearRelics();
    clearBackpackItems();
    hasRevive = false;
    monstersActive = true;
    if (roomStartTimer) { clearTimeout(roomStartTimer); roomStartTimer = null; }
    playerHealth = 30;
    currentLevel = 0;
    x = 200;
    y = 0;
    vy = 0;
    gravity = 0.3;
    jumpPower = 12;
    updateHealthDisplay();
    updateLevelDisplay();
    refreshMap();
}

// ========== 主循环 ==========
function loop() {
    // 胜利界面、遗物选择或暂停激活时不处理游戏逻辑
    if (document.getElementById('victory-screen').classList.contains('active') ||
        isRelicSelecting || isPaused) {
        animFrameId = requestAnimationFrame(loop);
        return;
    }

    // 移动（仅在没死的情况下可以操作）
    const isMoving = keys.a || keys.d;
    if (!isDead) {
        if (keys.a) { x -= speed; faceDir = -1; }
        if (keys.d) { x += speed; faceDir = 1; }
    }

    // 复活芯片光环：有芯片时显示，芯片消耗时移除
    if (hasRevive && !reviveAura) {
        reviveAura = new ReviveEffect(x, groundHeight + y);
    } else if (!hasRevive && reviveAura) {
        reviveAura.destroy();
        reviveAura = null;
    }

    // 待机检测：无任何操作时计时，满2秒显示光环
    const isActing = isMoving || keys.k || keys.j || keys.w || keys.s;
    if (!isDead && isOnGround && !isActing) {
        idleTimer++;
        if (idleTimer >= 120 && !idleAura) {  // 2秒 @ 60fps
            idleAura = new IdleAura(x, groundHeight + y);
        }
    } else {
        if (idleAura) { idleAura.destroy(); idleAura = null; }
        idleTimer = 0;
    }

    // 边界
    const playerWidth = 30;
    x = Math.max(0, Math.min(x, window.innerWidth - playerWidth));

    // 跳跃（仅在没死的情况下可以操作）
    if (!isDead && keys.k && isOnGround) {
        vy = jumpPower;
        isOnGround = false;
    }

    // 重力（先存上一帧位置用于平台碰撞检测）
    const prevPlayerBottom = groundHeight + y;
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

    for (const plat of platforms) {
        const platLeft = plat.x;
        const platRight = plat.x + plat.w;
        const platTop = plat.y + plat.h;

        if (
            (x + 30) > platLeft &&
            x < platRight &&
            prevPlayerBottom >= platTop &&
            playerBottom <= platTop &&
            vy <= 0
        ) {
            y = platTop - groundHeight;
            vy = 0;
            onPlatform = true;
            break;
        }
    }

    isOnGround = (y <= 0 || onPlatform);

    // 怪物移动 + 碰撞伤害
    for (let i = 0; i < monsters.length; i++) {
        let m = monsters[i];
        // 房间开始倒计时内怪物不可见、不活动
        m.element.style.display = monstersActive ? '' : 'none';
        m.hpBarContainer.style.display = monstersActive ? '' : 'none';
        if (!monstersActive) continue;
        m.update(x, groundHeight + y, player);

        // 天空怪蓄力攻击判定（遍历所有光束）
        if (m.type === 'sky' && m.state === 'charge' && m.chargeReady && m.warningBeams.length > 0) {
            const pRect = player.getBoundingClientRect();
            const now = Date.now();
            const beamDamage = m.isBoss ? 6 : 2;
            for (const beam of m.warningBeams) {
                const wRect = beam.getBoundingClientRect();
                if (
                    pRect.left < wRect.right &&
                    pRect.right > wRect.left &&
                    pRect.top < wRect.bottom &&
                    pRect.bottom > wRect.top
                ) {
                    if (now - lastDamageTime >= damageCooldown) {
                        damagePlayer(beamDamage);
                        lastDamageTime = now;
                    }
                    break;
                }
            }
            m.finishCharge();
        }

        // 天空怪不参与地面接触伤害
        if (m.type === 'sky') continue;

        const pRect = player.getBoundingClientRect();
        const rawMRect = m.element.getBoundingClientRect();
        // 碰撞框左右各缩 60%，贴近实际角色体积
        const shrink = rawMRect.width * 0.6;
        const mRect = {
            left: rawMRect.left + shrink,
            right: rawMRect.right - shrink,
            top: rawMRect.top,
            bottom: rawMRect.bottom
        };
        const now = Date.now();

        if (
            pRect.left < mRect.right &&
            pRect.right > mRect.left &&
            pRect.top < mRect.bottom &&
            pRect.bottom > mRect.top
        ) {
            if (now - lastDamageTime >= damageCooldown) {
                damagePlayer(m.contactDamage || 1);
                lastDamageTime = now;
            }
        }

        // Chase Boss 轨迹伤害（独立冷却，每秒2点）
        if (m.type === 'chase' && m.isBoss && m.trailElements && m.trailElements.length > 0) {
            const tNow = Date.now();
            if (tNow - lastTrailDamageTime >= 1000) {
                for (const t of m.trailElements) {
                    const tRect = t.element.getBoundingClientRect();
                    if (
                        pRect.left < tRect.right && pRect.right > tRect.left &&
                        pRect.top < tRect.bottom && pRect.bottom > tRect.top
                    ) {
                        damagePlayer(2);
                        lastTrailDamageTime = tNow;
                        break;
                    }
                }
            }
        }
    }

    // 更新炸弹（坦克怪投掷）
    for (let i = bombs.length - 1; i >= 0; i--) {
        const bomb = bombs[i];
        bomb.update(x, groundHeight + y, player, (damage) => {
            damagePlayer(damage);
        });
        if (!bomb.alive) {
            bombs.splice(i, 1);
        }
    }

    // 复活芯片判定
    if (playerHealth <= 0 && hasRevive) {
        playerHealth = Math.floor(maxHealth * 0.5);
        hasRevive = false;
        updateHealthDisplay();
    }

    if (playerHealth <= 0 && !hasRevive && !isDead) {
        playerHealth = 0;
        isDead = true;
        // 延迟一点时间显示重新开始（可以复用回到主菜单，或者其他界面），这里暂时先弹窗并回主菜单
        setTimeout(() => {
            alert('你已经死了，游戏结束！');
            returnToMenu();
        }, 1500);
    }

    // 拾取掉落物检测
    for (let i = drops.length - 1; i >= 0; i--) {
        let drop = drops[i];
        const pRect = player.getBoundingClientRect();
        const dRect = drop.element.getBoundingClientRect();

        // 收获钩锁：拾取范围扩大 50px
        const pickupMargin = selectedRelics.includes(6) ? 50 : 0;
        if (
            (pRect.left - pickupMargin) < (dRect.right + pickupMargin) &&
            (pRect.right + pickupMargin) > (dRect.left - pickupMargin) &&
            (pRect.top - pickupMargin) < (dRect.bottom + pickupMargin) &&
            (pRect.bottom + pickupMargin) > (dRect.top - pickupMargin)
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
        const portTop = window.innerHeight - portalY - 78;
        const portBottom = window.innerHeight - portalY;
        if (
            pRect.left < (portalX + 78) &&
            pRect.right > portalX &&
            pRect.top < portBottom &&
            pRect.bottom > portTop
        ) {
            refreshMap();
        }
    }

    // 渲染
    player.style.left = (x - 60) + 'px';
    player.style.bottom = groundHeight + y + 'px';

    // 获取当前时间，判断是否处于射击动作窗口（射击动作播放 200 毫秒）
    const isNowShooting = Date.now() - lastShootTime < 200;

    // 根据按键状态切换动画，优先级：死亡 > 射击 > 跳跃 > 跑动 > 待机
    const hadHurtFlash = player.classList.contains('hurt-flash');
    if (isDead) {
        player.className = 'dead';
    } else if (isNowShooting) {
        player.className = 'shooting';
    } else if (!isOnGround) {
        player.className = 'jumping'; // 当处于空中时，锁定为跳跃状态（防止播放跑步等地面动画）
    } else if (keys.a || keys.d) {
        player.className = 'running';
    } else {
        player.className = 'idle';
    }
    if (hadHurtFlash) player.classList.add('hurt-flash');
    
    // 调用 utils.js 中统一声明的 playerScale 来等比例缩放人物大小
    player.style.transform = `scaleX(${faceDir * playerScale}) scaleY(${playerScale})`;

    // 更新人物跟随效果的位置
    if (playerEffect) playerEffect.update(x, groundHeight + y);
    if (idleAura) idleAura.update(x, groundHeight + y);
    if (reviveAura) reviveAura.update(x, groundHeight + y);

    animFrameId = requestAnimationFrame(loop);
}

// ========== 启动游戏 ==========
document.addEventListener('DOMContentLoaded', function () {
    initStartScreen();
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('resume-btn').addEventListener('click', resumeGame);
    document.getElementById('menu-btn').addEventListener('click', returnToMenu);

    // 音量控制
    const bgm = document.getElementById('bgm');
    const volumeSlider = document.getElementById('volume-slider');
    const savedVolume = localStorage.getItem('bgmVolume');
    if (savedVolume !== null) {
        bgm.volume = parseFloat(savedVolume);
        volumeSlider.value = Math.round(bgm.volume * 100);
    } else {
        bgm.volume = 0.5;
        volumeSlider.value = 50;
    }
    volumeSlider.addEventListener('input', () => {
        const vol = volumeSlider.value / 100;
        bgm.volume = vol;
        localStorage.setItem('bgmVolume', vol);
    });

    // ESC 暂停
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') togglePause();
    });

    // 资源加载进度追踪
    (function trackLoading() {
        const bar = document.getElementById('loading-bar-fill');
        const text = document.getElementById('loading-text');
        if (!bar || !text) return;

        // 收集 CSS 中引用的背景图 + audio + img
        const resources = new Set();

        // 扫描所有样式表中的 url()
        try {
            for (const sheet of document.styleSheets) {
                try {
                    for (const rule of sheet.cssRules || []) {
                        const m = rule.cssText && rule.cssText.match(/url\(["']?([^"')]+)["']?\)/g);
                        if (m) m.forEach(u => {
                            const url = u.replace(/url\(["']?|["']?\)/g, '');
                            if (/\.(png|jpg|jpeg|gif|webp|svg|wav|mp3|ogg)/i.test(url))
                                resources.add(url);
                        });
                    }
                } catch (_) { /* 跨域样式表无法访问 */ }
            }
        } catch (_) {}

        // audio
        const audio = document.getElementById('bgm');
        if (audio && audio.src) resources.add(audio.src);

        const total = Math.max(resources.size, 10);
        let loaded = 0;

        function updateBar(forcePct) {
            if (forcePct !== undefined) {
                bar.style.width = forcePct + '%';
                text.textContent = `正在加载资源... (${forcePct}%)`;
                return;
            }
            loaded++;
            const pct = Math.round((loaded / total) * 100);
            bar.style.width = Math.min(pct, 90) + '%';
            text.textContent = `正在加载资源... (${Math.min(pct, 90)}%)`;
        }

        // 预加载每个资源
        let resourceIndex = 0;
        const resourceList = [...resources];
        function loadNext() {
            if (resourceIndex >= resourceList.length) return;
            const img = new Image();
            img.onload = img.onerror = () => {
                updateBar();
                resourceIndex++;
                setTimeout(loadNext, 50);
            };
            img.src = resourceList[resourceIndex];
            resourceIndex++;
        }
        if (resourceList.length > 0) {
            updateBar(0);
            setTimeout(loadNext, 100);
        }

        // 兜底：window.onload 或 10 秒后强制完成
        let done = false;
        function finish() {
            if (done) return; done = true;
            bar.style.width = '100%';
            text.textContent = '加载完成！';
            setTimeout(() => {
                const loading = document.getElementById('loading-screen');
                if (loading) { loading.classList.add('hidden'); loading.classList.remove('active'); }
            }, 500);
        }
        window.addEventListener('load', finish);
        setTimeout(finish, 10000);
    })();
});
