// ================= 怪物类型配置表 =================
// 精灵图数据：src=图片路径, w=图片总宽, h=图片总高, frames=总帧数
const MONSTER_SPRITES = {
    ground1: { originX: 47.4, charWidth: 89,
        idle:   { src: 'images/地面怪物1/Idle.png',   w: 384, h: 96, frames: 4 },
        walk:   { src: 'images/地面怪物1/Walk.png',   w: 384, h: 96, frames: 4 },
        hurt:   { src: 'images/地面怪物1/Hurt.png',   w: 192, h: 96, frames: 2 },
        death:  { src: 'images/地面怪物1/Death.png',  w: 576, h: 96, frames: 6 },
    },
    ground2: { originX: 28.1, charWidth: 30,
        idle:   { src: 'images/地面怪物2/Idle.png',   w: 384, h: 96, frames: 4 },
        walk:   { src: 'images/地面怪物2/Walk.png',   w: 576, h: 96, frames: 6 },
        hurt:   { src: 'images/地面怪物2/Hurt.png',   w: 192, h: 96, frames: 2 },
        death:  { src: 'images/地面怪物2/Death.png',  w: 576, h: 96, frames: 6 },
    },
    ground3: { originX: 25.0, charWidth: 20,
        idle:   { src: 'images/地面怪物3/Idle.png',   w: 384, h: 96, frames: 4 },
        walk:   { src: 'images/地面怪物3/Walk.png',   w: 576, h: 96, frames: 6 },
        hurt:   { src: 'images/地面怪物3/Hurt.png',   w: 192, h: 96, frames: 2 },
        death:  { src: 'images/地面怪物3/Death.png',  w: 576, h: 96, frames: 6 },
    },
    fly: { originX: 49.0, charWidth: 39,
        idle:   { src: 'images/飞行怪物/1/Idle.png',   w: 192, h: 48, frames: 4 },
        walk:   { src: 'images/飞行怪物/1/Walk.png',   w: 192, h: 48, frames: 4 },
        hurt:   { src: 'images/飞行怪物/1/Idle.png',   w: 192, h: 48, frames: 4 },
        death:  { src: 'images/飞行怪物/1/Death.png',  w: 288, h: 48, frames: 6 },
    },
};

const MONSTER_CONFIG = {
    patrol: {
        color: '#9400D3', w: 144, h: 144,
        hpMult: 5, speedMult: 1.0,
        drop: '紫怪核心', dropColor: '#FFD700',
        knockback: 20,
        spriteSet: 'ground2',
    },
    chase: {
        color: '#FF4444', w: 144, h: 144,
        hpMult: 3, speedMult: 0.9,
        drop: '赤怪碎片', dropColor: '#FF6B6B',
        detectRange: 200, knockback: 15,
        spriteSet: 'ground3',
    },
    tank: {
        color: '#44AA44', w: 168, h: 168,
        hpMult: 12, speedMult: 0.6,
        drop: '绿怪甲壳', dropColor: '#90EE90',
        knockback: 8,
        spriteSet: 'ground1',
    },
    sky: {
        color: '#44CCCC', w: 72, h: 72,
        hpMult: 2, speedMult: 1.0,
        drop: '天空之羽', dropColor: '#87CEEB',
        chargeTime: 120,
        patrolTime: 90,
        knockback: 25,
        spriteSet: 'fly',
    }
};

// ================= 炸弹类（坦克怪投掷） =================
class Bomb {
    constructor(x, y, vx, vy, groundHeight, bossScale = 1, isMini = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.gravity = 0.25;
        this.groundHeight = groundHeight;
        this.bossScale = bossScale;
        this.isMini = isMini;
        this.isBoss = bossScale > 1;
        const scaleFactor = this.isBoss ? Math.sqrt(bossScale) : 1;
        this.radius = isMini ? 5 : (8 * scaleFactor);
        this.explosionRadius = isMini ? 40 : (this.isBoss ? 80 * scaleFactor : 80);
        this.explosionDamage = isMini
            ? Math.floor((this.isBoss ? 9 : 3) * 0.4)
            : (this.isBoss ? 9 : 3);
        this.alive = true;

        this.element = document.createElement('div');
        this.element.className = 'bomb';
        this.element.style.width = (this.radius * 2) + 'px';
        this.element.style.height = (this.radius * 2) + 'px';
        this.element.style.left = this.x + 'px';
        this.element.style.bottom = this.y + 'px';
        document.getElementById('game-container').appendChild(this.element);
    }

    update(playerX, playerY, playerEl, onExplode) {
        if (!this.alive) return;

        // 抛物线运动
        this.vy -= this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        this.element.style.left = this.x + 'px';
        this.element.style.bottom = this.y + 'px';

        // 碰玩家检测（AABB）—— 直接命中，必定造成伤害
        const bRect = this.element.getBoundingClientRect();
        const pRect = playerEl.getBoundingClientRect();
        if (
            bRect.left < pRect.right && bRect.right > pRect.left &&
            bRect.top < pRect.bottom && bRect.bottom > pRect.top
        ) {
            this.explode(playerX, playerY, playerEl, onExplode, true);
            return;
        }

        // 碰地检测 —— 范围伤害判定
        if (this.y <= this.groundHeight) {
            this.explode(playerX, playerY, playerEl, onExplode, false);
            return;
        }

        // 超出屏幕边界则销毁
        if (this.x < -50 || this.x > window.innerWidth + 50 ||
            this.y > window.innerHeight + 50) {
            this.remove();
        }
    }

    explode(playerX, playerY, playerEl, onExplode, directHit = false) {
        if (!this.alive) return;
        this.alive = false;

        // 爆炸视觉效果
        const exp = document.createElement('div');
        exp.className = 'explosion';
        exp.style.left = (this.x - this.explosionRadius) + 'px';
        exp.style.bottom = (this.y - this.explosionRadius) + 'px';
        exp.style.width = (this.explosionRadius * 2) + 'px';
        exp.style.height = (this.explosionRadius * 2) + 'px';
        document.getElementById('game-container').appendChild(exp);
        setTimeout(() => { if (exp.parentNode) exp.remove(); }, 500);

        if (directHit) {
            onExplode(this.explosionDamage);
        } else {
            const px = playerX + 15;
            const py = playerY;
            const dx = px - this.x;
            const dy = py - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.explosionRadius + 15) {
                onExplode(this.explosionDamage);
            }
        }

        // Boss炸弹分裂：4个小炸弹向四个方向飞出
        if (this.isBoss && !this.isMini) {
            const dirs = [[-4, 6], [4, 6], [-2.5, 10], [2.5, 10]];
            for (const [dx, dy] of dirs) {
                const mini = new Bomb(this.x, this.y, dx, dy, this.groundHeight, this.bossScale, true);
                if (typeof bombs !== 'undefined') bombs.push(mini);
            }
        }

        this.remove();
    }

    remove() {
        if (this.element.parentNode) this.element.remove();
        this.alive = false;
    }
}

class Monster {
    constructor(x, y, level, groundHeight, type = 'patrol', bossScale = 1) {
        const cfg = MONSTER_CONFIG[type];
        this.x = x;
        this.y = y;
        this.type = type;
        this.cfg = cfg;
        this.groundHeight = groundHeight;
        this.bossScale = bossScale;
        this.isBoss = bossScale > 1;
        this.elW = cfg.w * bossScale;
        this.elH = cfg.h * bossScale;
        this.maxHealth = cfg.hpMult * level * bossScale;
        this.health = this.maxHealth;
        this.speed = (0.8 + Math.random() * 0.8) * cfg.speedMult * 0.8;
        // 冰霜核心：所有怪物移速降低 30%
        if (selectedRelics.includes(8)) this.speed *= 0.7;
        this.direction = Math.random() > 0.5 ? 1 : -1;

        // ================= 状态机核心属性 =================
        this.state = 'patrol';
        this.stateTimer = 0;
        this.chargeTimer = 0;
        this.patrolTimer = 0; // 天空怪蓄力倒计时，必须保留
        this.chargeReady = false;
        this.warningZone = null;     // 兼容旧代码
        this.warningBeams = [];      // 多光束数组（Boss用）
        this.boundsMinX = null;
        this.boundsMaxX = null;

        // ================= 攻击与伤害属性 =================
        this.attackCooldown = 60 + Math.floor(Math.random() * 120); // 坦克首次攻击随机延迟
        this.contactDamage = this.isBoss ? 3 : 1;  // Boss接触伤害3倍
        this.baseSpeed = this.speed;     // 记录原始速度（狂暴恢复用）
        this.enraged = false;            // 狂暴状态标记

        // ================= Chase Boss 轨迹 =================
        this.trailElements = [];   // { element, time }
        this.trailTimer = 0;

        // ================= 精灵帧动画属性 =================
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.frameDelay = 8;       // 每 8 tick 切换一帧（约 133ms）
        this.currentSpriteKey = null;

        // 创建 DOM 元素
        this.element = document.createElement('div');
        this.element.className = 'monster ' + type;
        this.element.style.width = this.elW + 'px';
        this.element.style.height = this.elH + 'px';
        this.element.style.backgroundRepeat = 'no-repeat';
        this.element.style.left = this.x + 'px';
        this.element.style.bottom = this.y + 'px';

        // 创建血条（独立于 monster 元素，避免父级 scaleX 翻转影响定位）
        this.hpBarContainer = document.createElement('div');
        this.hpBarContainer.className = 'monster-hp-bar';
        this.hpBarContainer.innerHTML = '<div class="hp-fill"></div>';
        this.hpFill = this.hpBarContainer.querySelector('.hp-fill');
        // 血条宽度 ≈ 角色实际像素宽度 × 缩放比
        const spriteSet = MONSTER_SPRITES[cfg.spriteSet];
        const frameW = spriteSet.idle.w / spriteSet.idle.frames;
        const scale = this.elW / frameW;
        this.hpBarWidth = Math.round((spriteSet.charWidth || frameW) * scale);
        this.hpBarContainer.style.width = this.hpBarWidth + 'px';
        this.hpBarContainer.style.height = '6px';
        document.getElementById('game-container').appendChild(this.element);
        document.getElementById('game-container').appendChild(this.hpBarContainer);
    }

    // 状态切换辅助函数
    changeState(newState, timer = 0) {
        if (this.state === 'dead') return;
        if (newState === 'dead') this.removeWarningBeams();
        this.state = newState;
        this.stateTimer = timer;
    }

    // 根据当前状态切换精灵图（只切换图片，帧动画由 update 驱动）
    setSprite() {
        const sprites = MONSTER_SPRITES[this.cfg.spriteSet];
        let spriteKey = 'idle';
        switch (this.state) {
            case 'patrol':
            case 'pursue':
                spriteKey = 'walk';
                break;
            case 'charge':
                spriteKey = 'idle';
                break;
            case 'hurt':
                spriteKey = 'hurt';
                break;
            case 'dead':
                spriteKey = 'death';
                break;
        }
        if (!sprites || !sprites[spriteKey]) return;

        const s = sprites[spriteKey];
        if (this.currentSpriteKey !== spriteKey) {
            this.currentSpriteKey = spriteKey;
            this.frameIndex = 0;
            this.frameTimer = 0;
            this.element.style.backgroundImage = 'url(' + s.src + ')';
        }
        // 根据元素宽等比缩放 spritesheet（使用缩放后的 elW）
        const scale = this.elW / (s.w / s.frames);
        this.element.style.backgroundSize = (s.w * scale) + 'px ' + (s.h * scale) + 'px';
        this.element.style.backgroundPosition = `-${this.frameIndex * this.elW}px 0`;
    }

    // 更新怪物行为（玩家位置由外部传入，避免耦合全局变量）
    update(playerX, playerY, playerEl) {
        if (this.state === 'dead') return;

        switch (this.state) {
            case 'patrol':
                if (this.type === 'sky') {
                    // 天空怪巡逻：水平移动 → 计时满后进入蓄力
                    this.x += this.speed * this.direction;
                    if (this.x <= 0) { this.x = 0; this.direction = 1; }
                    else if (this.x >= window.innerWidth - this.elW) {
                        this.x = window.innerWidth - this.elW;
                        this.direction = -1;
                    }
                    this.patrolTimer++;
                    if (this.patrolTimer >= this.cfg.patrolTime) {
                        this.patrolTimer = 0;
                        this.changeState('charge');
                        this._createBeams();
                    }
                } else {
                    // 地面怪巡逻：简单左右弹墙移动
                    // 如果平台太窄被钉死（两边界相等），跳过位移防止振荡
                    if (this.boundsMinX !== null && this.boundsMinX === this.boundsMaxX) {
                        this.x = this.boundsMinX;
                    } else {
                        this.x += this.speed * this.direction;
                        // 边界反弹（使用自定义边界或屏幕边缘）
                        const minX = this.boundsMinX !== null ? this.boundsMinX : 0;
                        const maxX = this.boundsMaxX !== null ? this.boundsMaxX : window.innerWidth - this.elW;
                        if (this.x <= minX) { this.x = minX; this.direction = 1; }
                        else if (this.x >= maxX) { this.x = maxX; this.direction = -1; }
                        // TODO: 巡逻AI增强（走走停停+随机变向），当前效果不理想，暂注释
                        // this.patrolTimer--;
                        // if (this.patrolTimer <= 0) {
                        //     if (this.patrolPhase === 'move') {
                        //         this.patrolPhase = 'idle';
                        //         this.patrolTimer = 20 + Math.floor(Math.random() * 40);
                        //     } else {
                        //         this.patrolPhase = 'move';
                        //         this.patrolTimer = 60 + Math.floor(Math.random() * 90);
                        //         if (Math.random() < 0.15) this.direction *= -1;
                        //     }
                        // }
                        // if (this.patrolPhase === 'move') {
                        //     this.x += this.speed * this.direction;
                        //     if (Math.random() < 0.005) this.direction *= -1;
                        // }
                        // 追击型怪物检测玩家距离
                        if (this.type === 'chase' && playerX !== undefined) {
                            const dist = Math.abs(this.x - playerX);
                            if (dist < this.cfg.detectRange) {
                                this.changeState('pursue');
                            }
                        }
                        // 坦克怪攻击冷却与投弹
                        if (this.type === 'tank' && playerX !== undefined) {
                            this.attackCooldown--;
                            if (this.attackCooldown <= 0) {
                                this.throwBomb(playerX, playerY !== undefined ? playerY : this.groundHeight);
                                this.attackCooldown = 150 + Math.floor(Math.random() * 60);
                            }
                        }
                    }
                }
                break;

            case 'pursue':
                if (this.boundsMinX !== null && this.boundsMinX === this.boundsMaxX) {
                    this.x = this.boundsMinX;
                } else if (playerX !== undefined) {
                    this.direction = playerX > this.x ? 1 : -1;
                    this.x += this.speed * this.direction;
                    const pMinX = this.boundsMinX !== null ? this.boundsMinX : 0;
                    const pMaxX = this.boundsMaxX !== null ? this.boundsMaxX : window.innerWidth - this.elW;
                    if (this.x <= pMinX) this.x = pMinX;
                    if (this.x >= pMaxX) this.x = pMaxX;
                }
                if (playerX !== undefined) {
                    const dist = Math.abs(this.x - playerX);
                    if (dist > this.cfg.detectRange * 1.5) {
                        this.changeState('patrol');
                    }
                }
                // 坦克怪在追击时也可投弹
                if (this.type === 'tank' && playerX !== undefined) {
                    this.attackCooldown--;
                    if (this.attackCooldown <= 0) {
                        this.throwBomb(playerX, playerY !== undefined ? playerY : this.groundHeight);
                        this.attackCooldown = 150 + Math.floor(Math.random() * 60);
                    }
                }
                break;

            case 'charge':
                // 蓄力动画：所有光束逐渐变宽
                this.chargeTimer++;
                if (this.warningBeams.length > 0) {
                    const progress = this.chargeTimer / this.cfg.chargeTime;
                    const maxWidth = this.isBoss ? 100 * this.bossScale : 100;
                    const w = 10 + (maxWidth - 10) * progress;
                    const half = w / 2;
                    const beamCount = this.warningBeams.length;
                    const spacing = this.elW / (beamCount + 1);
                    for (let i = 0; i < beamCount; i++) {
                        const beam = this.warningBeams[i];
                        const beamX = this.x + spacing * (i + 1) - half;
                        beam.style.width = w + 'px';
                        beam.style.left = beamX + 'px';
                    }
                }
                if (this.chargeTimer >= this.cfg.chargeTime) {
                    this.chargeReady = true;
                }
                break;

            case 'hurt':
                this.stateTimer--;
                if (this.stateTimer <= 0) {
                    this.changeState('patrol');
                }
                break;
        }

        // ================= 红怪低血量狂暴检测 =================
        const rageThreshold = this.isBoss ? 0.5 : 0.3;
        if (this.type === 'chase' && !this.enraged && this.maxHealth > 0 &&
            this.health / this.maxHealth < rageThreshold) {
            this.enraged = true;
            this.speed = this.baseSpeed * 1.6;
            this.contactDamage = this.isBoss ? 5 : 2; // Boss狂暴接触伤害5
            this.element.style.filter = 'drop-shadow(0 0 8px red) brightness(1.3)';
        }

        // ================= Chase Boss 轨迹生成 =================
        if (this.type === 'chase' && this.isBoss && (this.state === 'patrol' || this.state === 'pursue')) {
            this.trailTimer++;
            if (this.trailTimer >= 8) {
                this.trailTimer = 0;
                const trail = document.createElement('div');
                trail.className = 'boss-trail';
                trail.style.left = (this.x + this.elW * 0.25) + 'px';
                trail.style.bottom = (this.y + 2) + 'px';
                trail.style.width = (this.elW * 0.5) + 'px';
                trail.style.height = '10px';
                document.getElementById('game-container').appendChild(trail);
                this.trailElements.push({ element: trail, time: 0 });
            }
        }
        // 轨迹生命周期管理
        for (let i = this.trailElements.length - 1; i >= 0; i--) {
            this.trailElements[i].time++;
            if (this.trailElements[i].time >= 180) {
                this.trailElements[i].element.remove();
                this.trailElements.splice(i, 1);
            }
        }

        // ================= 根据状态切换精灵图 =================
        this.setSprite();

        // ================= 帧动画推进 =================
        this.frameTimer++;
        const s = MONSTER_SPRITES[this.cfg.spriteSet];
        const currentSprite = s ? s[this.currentSpriteKey || 'idle'] : null;
        if (currentSprite) {
            const frameCount = currentSprite.frames;
            if (this.frameTimer >= this.frameDelay) {
                this.frameTimer = 0;
                this.frameIndex = (this.frameIndex + 1) % frameCount;
            }
        }

        // ================= 统一渲染位置与朝向 =================
        this.element.style.left = this.x + 'px';
        this.element.style.bottom = this.y + 'px';
        // 根据精灵角色实际中心设置变换原点，使翻转时角色不偏移
        const spriteSet = MONSTER_SPRITES[this.cfg.spriteSet];
        const originX = spriteSet ? spriteSet.originX : 50;
        this.element.style.transformOrigin = originX + '% center';
        this.element.style.transform = `scaleX(${this.direction})`;
        // 血条定位到角色实际中心上方（基于 originX，不受翻转影响）
        const charCenterX = this.x + this.elW * (originX / 100);
        this.hpBarContainer.style.left = (charCenterX - this.hpBarWidth / 2) + 'px';
        this.hpBarContainer.style.bottom = (this.y - 12) + 'px'; // 血条在怪物脚底下 6px
    }

    // 移除所有预警光束
    removeWarningBeams() {
        for (const beam of this.warningBeams) {
            beam.remove();
        }
        this.warningBeams = [];
        this.warningZone = null;
    }

    // 创建预警光束（天空怪蓄力前调用）
    _createBeams() {
        this.removeWarningBeams();
        const beamCount = (this.type === 'sky' && this.isBoss) ? 3 : 1;
        const spacing = this.elW / (beamCount + 1);
        for (let i = 0; i < beamCount; i++) {
            const beam = document.createElement('div');
            beam.className = 'warning-beam';
            beam.style.bottom = this.groundHeight + 'px';
            beam.style.height = (this.y - this.groundHeight) + 'px';
            beam.style.left = (this.x + spacing * (i + 1) - 5) + 'px';
            beam.style.width = '10px';
            document.getElementById('game-container').appendChild(beam);
            this.warningBeams.push(beam);
        }
        this.warningZone = this.warningBeams[0] || null;
    }

    // 坦克怪投掷炸弹
    throwBomb(playerX, playerY) {
        const bombX = this.x + this.elW / 2;
        const bombY = this.y + this.elH * 0.6;
        const dx = (playerX + 15) - bombX;
        const dist = Math.abs(dx);
        const vx = (dx / Math.max(dist, 1)) * Math.min(5, dist * 0.03);
        const vy = 8 + Math.min(dist * 0.05, 6);
        const bomb = new Bomb(bombX, bombY, vx, vy, this.groundHeight, this.bossScale);
        // 炸弹加入全局 bombs 数组（在 main.js 中定义）
        if (typeof bombs !== 'undefined') {
            bombs.push(bomb);
        }
    }

    // 设置巡逻边界（平台怪物用）
    setBounds(minX, maxX) {
        this.boundsMinX = minX;
        this.boundsMaxX = maxX;
    }

    // 完成蓄力攻击（由 main.js 碰撞检测后调用）
    finishCharge() {
        this.removeWarningBeams();
        this.chargeReady = false;
        this.chargeTimer = 0;
        this.changeState('patrol');
    }

    // 受到伤害
    takeDamage(amount, knockbackDir = 0) {
        if (this.state === 'dead') return false;

        // 瞄准镜：对满血怪物伤害翻倍
        if (selectedRelics.includes(13) && this.health === this.maxHealth) amount *= 2;
        // 暴击之芯：15% 概率双倍伤害
        if (selectedRelics.includes(10) && Math.random() < 0.15) amount *= 2;

        this.health -= amount;

        // 血条更新
        const healthPercent = Math.max(0, (this.health / this.maxHealth) * 100);
        this.hpFill.style.width = healthPercent + '%';

        // 蓄力被打断时移除所有预警光束
        if (this.state === 'charge') {
            this.removeWarningBeams();
            this.chargeReady = false;
            this.chargeTimer = 0;
        }

        if (this.health <= 0) {
            // 死亡逻辑
            this.changeState('dead');
            this.element.classList.add('die');
            // 显式切换到死亡精灵（update 不再执行，setSprite 不会自动触发）
            const deathSprite = MONSTER_SPRITES[this.cfg.spriteSet].death;
            if (deathSprite) {
                const scale = this.elW / (deathSprite.w / deathSprite.frames);
                this.element.style.backgroundImage = 'url(' + deathSprite.src + ')';
                this.element.style.backgroundSize = (deathSprite.w * scale) + 'px ' + (deathSprite.h * scale) + 'px';
                this.element.style.backgroundPosition = '0 0';
            }
            // 吸血芯片：击杀恢复 1 点生命
            if (selectedRelics.includes(3)) {
                playerHealth = Math.min(maxHealth, playerHealth + 1);
                updateHealthDisplay();
            }
            // 怪物死亡瞬间，在原地爆出战利品
            const dropY = this.type === 'sky' ? this.groundHeight : this.y;
            spawnDrop(this.x, dropY, this.cfg.drop, this.cfg.dropColor);
            setTimeout(() => { this.element.remove(); this.hpBarContainer.remove(); }, 300);
            return true;
        } else {
            // 受伤逻辑
            this.changeState('hurt', 15); // 进入受伤状态，设定 15 帧的僵直

            // 击退计算
            if (knockbackDir !== 0) {
                this.x += knockbackDir * this.cfg.knockback;
                const kbMinX = this.boundsMinX !== null ? this.boundsMinX : 0;
                const kbMaxX = this.boundsMaxX !== null ? this.boundsMaxX : window.innerWidth - this.elW;
                if (this.x <= kbMinX) this.x = kbMinX;
                if (this.x >= kbMaxX) this.x = kbMaxX;
                this.element.style.left = this.x + 'px';
            }

            // 闪烁特效
            this.element.classList.add('hit');
            setTimeout(() => {
                if (this.state !== 'dead') {
                    this.element.classList.remove('hit');
                }
            }, 150);

            return false;
        }
    }
}

// 按关卡随机怪物类型（洗牌保底：每种可用类型至少出现一次）
let _rollLevel = 0;
let _rollQueue = [];

function getAvailableTypes(level) {
    const types = ['patrol'];
    if (level >= 3) types.push('chase');
    if (level >= 4) types.push('tank');
    if (level >= 5) types.push('sky');
    return types;
}

function buildRollPool(level) {
    const pool = ['patrol'];
    if (level >= 3) pool.push('chase', 'chase');
    if (level >= 4) pool.push('tank');
    if (level >= 5) pool.push('sky');
    return pool;
}

function rollMonsterType(level) {
    // 关卡变化或队列耗尽时重建洗牌队列
    if (_rollLevel !== level || _rollQueue.length === 0) {
        _rollLevel = level;
        _rollQueue = [];
        const available = getAvailableTypes(level);
        const pool = buildRollPool(level);
        // 洗牌可用类型，保证前 available.length 个各不同
        for (let i = available.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available[i], available[j]] = [available[j], available[i]];
        }
        for (let t of available) _rollQueue.push(t);
        // 剩余槽位从加权池随机填充
        while (_rollQueue.length < 20) {
            _rollQueue.push(pool[Math.floor(Math.random() * pool.length)]);
        }
        // 只洗牌尾部（保证前 available.length 个多样化）
        const tail = _rollQueue.length - available.length;
        for (let i = _rollQueue.length - 1; i > available.length; i--) {
            const j = available.length + Math.floor(Math.random() * (tail + 1));
            [_rollQueue[i], _rollQueue[j]] = [_rollQueue[j], _rollQueue[i]];
        }
    }
    return _rollQueue.shift();
}