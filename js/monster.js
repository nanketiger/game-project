class Monster {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.maxHealth = 5 * level;
        this.health = this.maxHealth;
        this.speed = 1.5 + Math.random(); 
        this.direction = Math.random() > 0.5 ? 1 : -1; 
        
        // ================= 状态机核心属性 =================
        this.state = 'patrol'; // 初始状态：无脑巡逻
        this.stateTimer = 0;   // 状态计时器（用于控制受伤僵直等）
        
        // 创建 DOM 元素
        this.element = document.createElement('div');
        this.element.className = 'monster';
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
        if (this.state === 'dead') return; // 如果死了，立刻停止所有行为

        // ================= 状态机逻辑分支 =================
        switch (this.state) {
            case 'patrol':
                // 还原原始逻辑：无脑左右移动 + 碰壁反弹
                this.x += this.speed * this.direction; 
                
                if (this.x <= 0) { 
                    this.x = 0; 
                    this.direction = 1; 
                } else if (this.x >= window.innerWidth - 60) { 
                    this.x = window.innerWidth - 60; 
                    this.direction = -1; 
                }
                // 注意：这里不再检测玩家距离，所以它会一直傻乎乎地走
                break;

            case 'hurt':
                // 受伤状态：原地僵直，无法移动
                this.stateTimer--;
                if (this.stateTimer <= 0) {
                    this.changeState('patrol'); // 僵直结束，继续回去无脑巡逻！
                }
                break;
                
            // 未来如果你要加高级怪，可以在这里把 'chase', 'attack' 等状态加回来
        }

        // ================= 统一渲染位置与朝向 =================
        this.element.style.left = this.x + 'px';
        this.element.style.transform = `scaleX(${this.direction})`;
        this.hpBarContainer.style.transform = `translateX(-50%) scaleX(${this.direction})`;
    }

    // 受到伤害
    takeDamage(amount, knockbackDir = 0) {
        if (this.state === 'dead') return false; 

        this.health -= amount;

        // 血条更新
        const healthPercent = Math.max(0, (this.health / this.maxHealth) * 100);
        this.hpFill.style.width = healthPercent + '%';

        if (this.health <= 0) {
            // 死亡逻辑
            this.changeState('dead'); 
            this.element.classList.add('die');
            // 怪物死亡瞬间，在原地爆出战利品
            spawnDrop(this.x, this.y);
            setTimeout(() => { this.element.remove(); }, 300);
            return true; 
        } else {
            // 受伤逻辑
            this.changeState('hurt', 15); // 进入受伤状态，设定 15 帧的僵直
            
            // 击退计算
            if (knockbackDir !== 0) {
                this.x += knockbackDir * 20;
                if (this.x <= 0) this.x = 0;
                if (this.x >= window.innerWidth - 60) this.x = window.innerWidth - 60;
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