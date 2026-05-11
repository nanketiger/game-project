// ================= 怪物类型配置表 =================
const MONSTER_CONFIG = {
    patrol: {
        color: '#9400D3', w: 60, h: 100,
        hpMult: 5, speedMult: 1.0,
        drop: '紫怪核心', dropColor: '#FFD700'
    },
    chase: {
        color: '#FF4444', w: 45, h: 75,
        hpMult: 3, speedMult: 1.5,
        drop: '赤怪碎片', dropColor: '#FF6B6B',
        detectRange: 200
    },
    tank: {
        color: '#44AA44', w: 80, h: 120,
        hpMult: 12, speedMult: 0.6,
        drop: '绿怪甲壳', dropColor: '#90EE90'
    },
    sky: {
        color: '#44CCCC', w: 50, h: 50,
        hpMult: 2, speedMult: 1.0,
        drop: '天空之羽', dropColor: '#87CEEB',
        chargeTime: 120,
        patrolTime: 90
    }
};

class Monster {
    constructor(x, y, level, type = 'patrol') {
        const cfg = MONSTER_CONFIG[type];
        this.x = x;
        this.y = y;
        this.type = type;
        this.cfg = cfg;
        this.maxHealth = cfg.hpMult * level;
        this.health = this.maxHealth;
        this.speed = (1.5 + Math.random()) * cfg.speedMult;
        this.direction = Math.random() > 0.5 ? 1 : -1;

        // ================= 状态机核心属性 =================
        this.state = 'patrol';
        this.stateTimer = 0;
        this.chargeTimer = 0;
        this.patrolTimer = 0;
        this.warningZone = null;

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
        this.state = newState;
        this.stateTimer = timer;
    }

    // 更新怪物行为
    update() {
        if (this.state === 'dead') return;

        switch (this.state) {
            case 'patrol':
                if (this.type === 'sky') {
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
                        this.warningZone.style.bottom = groundHeight + 'px';
                        this.warningZone.style.height = (this.y - groundHeight) + 'px';
                        this.warningZone.style.left = (this.x + this.cfg.w / 2 - 5) + 'px';
                        this.warningZone.style.width = '10px';
                        document.getElementById('game-container').appendChild(this.warningZone);
                    }
                } else {
                    this.x += this.speed * this.direction;
                    if (this.x <= 0) { this.x = 0; this.direction = 1; }
                    else if (this.x >= window.innerWidth - this.cfg.w) {
                        this.x = window.innerWidth - this.cfg.w;
                        this.direction = -1;
                    }
                    if (this.type === 'chase' && typeof x !== 'undefined') {
                        const dist = Math.abs(this.x - x);
                        if (dist < this.cfg.detectRange) {
                            this.changeState('chase');
                        }
                    }
                }
                break;

            case 'chase':
                if (typeof x !== 'undefined') {
                    this.direction = x > this.x ? 1 : -1;
                    this.x += this.speed * this.direction;
                }
                if (this.x <= 0) this.x = 0;
                if (this.x >= window.innerWidth - this.cfg.w) this.x = window.innerWidth - this.cfg.w;
                if (typeof x !== 'undefined') {
                    const dist = Math.abs(this.x - x);
                    if (dist > this.cfg.detectRange * 1.5) {
                        this.changeState('patrol');
                    }
                }
                break;

            case 'charge':
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
                    if (this.warningZone && typeof player !== 'undefined' && typeof x !== 'undefined') {
                        const pRect = player.getBoundingClientRect();
                        const wRect = this.warningZone.getBoundingClientRect();
                        if (
                            pRect.left < wRect.right &&
                            pRect.right > wRect.left &&
                            pRect.top < wRect.bottom &&
                            pRect.bottom > wRect.top
                        ) {
                            if (Date.now() - lastDamageTime >= damageCooldown) {
                                playerHealth = Math.max(0, playerHealth - 2);
                                lastDamageTime = Date.now();
                                updateHealthDisplay();
                            }
                        }
                    }
                    this.removeWarningZone();
                    this.chargeTimer = 0;
                    this.changeState('patrol');
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
            this.chargeTimer = 0;
        }

        if (this.health <= 0) {
            // 死亡逻辑
            this.changeState('dead');
            this.element.classList.add('die');
            // 怪物死亡瞬间，在原地爆出战利品
            const dropY = this.type === 'sky' ? groundHeight : this.y;
            spawnDrop(this.x, dropY, this.cfg.drop, this.cfg.dropColor);
            setTimeout(() => { this.element.remove(); }, 300);
            return true;
        } else {
            // 受伤逻辑
            this.changeState('hurt', 15); // 进入受伤状态，设定 15 帧的僵直

            // 击退计算
            if (knockbackDir !== 0) {
                this.x += knockbackDir * 20;
                if (this.x <= 0) this.x = 0;
                if (this.x >= window.innerWidth - this.cfg.w) this.x = window.innerWidth - this.cfg.w;
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