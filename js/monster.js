// ================= 怪物类型配置表 =================
const MONSTER_CONFIG = {
    patrol: {
        color: '#9400D3', w: 60, h: 100,
        hpMult: 5, speedMult: 1.0,
        drop: '紫怪核心', dropColor: '#FFD700',
        knockback: 20
    },
    chase: {
        color: '#FF4444', w: 45, h: 75,
        hpMult: 3, speedMult: 1.5,
        drop: '赤怪碎片', dropColor: '#FF6B6B',
        detectRange: 200, knockback: 15
    },
    tank: {
        color: '#44AA44', w: 80, h: 120,
        hpMult: 12, speedMult: 0.6,
        drop: '绿怪甲壳', dropColor: '#90EE90',
        knockback: 8
    },
    sky: {
        color: '#44CCCC', w: 50, h: 50,
        hpMult: 2, speedMult: 1.0,
        drop: '天空之羽', dropColor: '#87CEEB',
        chargeTime: 120,
        patrolTime: 90,
        knockback: 25
    }
};

class Monster {
    constructor(x, y, level, groundHeight, type = 'patrol') {
        const cfg = MONSTER_CONFIG[type];
        this.x = x;
        this.y = y;
        this.type = type;
        this.cfg = cfg;
        this.groundHeight = groundHeight;
        this.maxHealth = cfg.hpMult * level;
        this.health = this.maxHealth;
        this.speed = (0.8 + Math.random() * 0.8) * cfg.speedMult;
        this.direction = Math.random() > 0.5 ? 1 : -1;

        // ================= 状态机核心属性 =================
        this.state = 'patrol';
        this.stateTimer = 0;
        this.chargeTimer = 0;
        this.patrolTimer = 0; // 天空怪蓄力倒计时，必须保留
        // this.patrolPhase = 'move'; // TODO: 巡逻AI增强时启用
        this.chargeReady = false;
        this.warningZone = null;
        this.boundsMinX = null;
        this.boundsMaxX = null;

        // 创建 DOM 元素
        this.element = document.createElement('div');
        this.element.className = 'monster ' + type;
        this.element.style.width = cfg.w + 'px';
        this.element.style.height = cfg.h + 'px';
        this.element.style.background = cfg.color;
        this.element.style.left = this.x + 'px';
        this.element.style.bottom = this.y + 'px';

        // 创建血条 HTML 结构
        this.element.innerHTML = `
            <div class="monster-hp-bar">
                <div class="hp-fill"></div>
            </div>
        `;
        this.hpFill = this.element.querySelector('.hp-fill');
        this.hpBarContainer = this.element.querySelector('.monster-hp-bar');

        document.getElementById('game-container').appendChild(this.element);
    }

    // 状态切换辅助函数
    changeState(newState, timer = 0) {
        if (this.state === 'dead') return;
        if (newState === 'dead') this.removeWarningZone();
        this.state = newState;
        this.stateTimer = timer;
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
                    else if (this.x >= window.innerWidth - this.cfg.w) {
                        this.x = window.innerWidth - this.cfg.w;
                        this.direction = -1;
                    }
                    this.patrolTimer++;
                    if (this.patrolTimer >= this.cfg.patrolTime) {
                        this.patrolTimer = 0;
                        this.changeState('charge');
                        this.warningZone = document.createElement('div');
                        this.warningZone.className = 'warning-beam';
                        this.warningZone.style.bottom = this.groundHeight + 'px';
                        this.warningZone.style.height = (this.y - this.groundHeight) + 'px';
                        this.warningZone.style.left = (this.x + this.cfg.w / 2 - 5) + 'px';
                        this.warningZone.style.width = '10px';
                        document.getElementById('game-container').appendChild(this.warningZone);
                    }
                } else {
                    // 地面怪巡逻：简单左右弹墙移动
                    this.x += this.speed * this.direction;
                    // 边界反弹（使用自定义边界或屏幕边缘）
                    const minX = this.boundsMinX !== null ? this.boundsMinX : 0;
                    const maxX = this.boundsMaxX !== null ? this.boundsMaxX : window.innerWidth - this.cfg.w;
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
                }
                break;

            case 'pursue':
                if (playerX !== undefined) {
                    this.direction = playerX > this.x ? 1 : -1;
                    this.x += this.speed * this.direction;
                }
                const pMinX = this.boundsMinX !== null ? this.boundsMinX : 0;
                const pMaxX = this.boundsMaxX !== null ? this.boundsMaxX : window.innerWidth - this.cfg.w;
                if (this.x <= pMinX) this.x = pMinX;
                if (this.x >= pMaxX) this.x = pMaxX;
                if (playerX !== undefined) {
                    const dist = Math.abs(this.x - playerX);
                    if (dist > this.cfg.detectRange * 1.5) {
                        this.changeState('patrol');
                    }
                }
                break;

            case 'charge':
                // 蓄力动画：预警光柱逐渐变宽
                this.chargeTimer++;
                if (this.warningZone) {
                    const progress = this.chargeTimer / this.cfg.chargeTime;
                    const maxWidth = 100;
                    const w = 10 + (maxWidth - 10) * progress;
                    const half = w / 2;
                    this.warningZone.style.width = w + 'px';
                    this.warningZone.style.left = (this.x + this.cfg.w / 2 - half) + 'px';
                }
                if (this.chargeTimer >= this.cfg.chargeTime) {
                    // 蓄力就绪，伤害判定由 main.js 碰撞循环处理
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

        // ================= 统一渲染位置与朝向 =================
        this.element.style.left = this.x + 'px';
        this.element.style.bottom = this.y + 'px';
        this.element.style.transform = `scaleX(${this.direction})`;
        this.hpBarContainer.style.transform = `translateX(-50%) scaleX(${this.direction})`;
    }

    // 移除预警圈
    removeWarningZone() {
        if (this.warningZone) {
            this.warningZone.remove();
            this.warningZone = null;
        }
    }

    // 设置巡逻边界（平台怪物用）
    setBounds(minX, maxX) {
        this.boundsMinX = minX;
        this.boundsMaxX = maxX;
    }

    // 完成蓄力攻击（由 main.js 碰撞检测后调用）
    finishCharge() {
        this.removeWarningZone();
        this.chargeReady = false;
        this.chargeTimer = 0;
        this.changeState('patrol');
    }

    // 受到伤害
    takeDamage(amount, knockbackDir = 0) {
        if (this.state === 'dead') return false;

        this.health -= amount;

        // 血条更新
        const healthPercent = Math.max(0, (this.health / this.maxHealth) * 100);
        this.hpFill.style.width = healthPercent + '%';

        // 蓄力被打断时移除预警圈
        if (this.state === 'charge') {
            this.removeWarningZone();
            this.chargeReady = false;
            this.chargeTimer = 0;
        }

        if (this.health <= 0) {
            // 死亡逻辑
            this.changeState('dead');
            this.element.classList.add('die');
            // 怪物死亡瞬间，在原地爆出战利品
            const dropY = this.type === 'sky' ? this.groundHeight : this.y;
            spawnDrop(this.x, dropY, this.cfg.drop, this.cfg.dropColor);
            setTimeout(() => { this.element.remove(); }, 300);
            return true;
        } else {
            // 受伤逻辑
            this.changeState('hurt', 15); // 进入受伤状态，设定 15 帧的僵直

            // 击退计算
            if (knockbackDir !== 0) {
                this.x += knockbackDir * this.cfg.knockback;
                const kbMinX = this.boundsMinX !== null ? this.boundsMinX : 0;
                const kbMaxX = this.boundsMaxX !== null ? this.boundsMaxX : window.innerWidth - this.cfg.w;
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