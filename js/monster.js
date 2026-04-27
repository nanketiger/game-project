class Monster {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.health = 5 * level; // 血量随关卡数增加
        this.speed = 1.5 + Math.random(); // 随机速度，防止怪物重叠
        this.direction = Math.random() > 0.5 ? 1 : -1; // 随机初始面向
        
        // 创建 DOM 元素
        this.element = document.createElement('div');
        this.element.className = 'monster';
        this.element.style.left = this.x + 'px';
        this.element.style.bottom = this.y + 'px';
        
        // 将怪物添加到游戏容器中，而不是 body
        document.getElementById('game-container').appendChild(this.element);
    }

    // 更新怪物位置
    update() {
        this.x += this.speed * this.direction;
        
        // 碰壁反弹逻辑
        if (this.x <= 0) {
            this.x = 0;
            this.direction = 1;
        } else if (this.x >= window.innerWidth - 60) {
            this.x = window.innerWidth - 60;
            this.direction = -1;
        }
        
        this.element.style.left = this.x + 'px';
    }

    // 受到伤害
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.element.remove(); // 从画面中移除
            return true; // 告诉主程序怪物死了
        }
        return false;
    }
}