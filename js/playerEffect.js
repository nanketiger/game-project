/**
 * PlayerEffect — 跟随人物的精灵图动画效果（延迟跟随）
 * 进入新关卡后出现在人物左上方，5秒后自动消失
 */
class PlayerEffect {
    constructor(playerX, playerY) {
        this._el = null;
        this._destroyed = false;
        this._frameIndex = 0;
        this._totalFrames = 63;   // 9列 × 7行
        this._cols = 9;
        this._rows = 7;
        this._frameW = 60;
        this._frameH = 60;

        // 当前实际位置（用于延迟跟随）
        this._currentX = playerX - 50;
        this._currentY = playerY + 70;

        // 创建精灵元素
        const el = document.createElement('div');
        el.style.cssText = [
            'position:absolute',
            'z-index:15',
            'pointer-events:none',
            `width:${this._frameW}px`,
            `height:${this._frameH}px`,
            'background-image:url("images/practical/result%20(118).png")',
            `background-size:${this._frameW * this._cols}px ${this._frameH * this._rows}px`,
            'background-repeat:no-repeat',
            'image-rendering:pixelated',
        ].join(';');
        el.style.left = this._currentX + 'px';
        el.style.bottom = this._currentY + 'px';
        document.body.appendChild(el);
        this._el = el;

        // 初始帧
        this._updateFrame();

        // 帧动画（每秒30帧）
        this._intervalId = setInterval(() => {
            if (this._destroyed) return;
            this._frameIndex = (this._frameIndex + 1) % this._totalFrames;
            this._updateFrame();
        }, 1000 / 30);

        // 5秒后自动销毁
        this._timerId = setTimeout(() => {
            this.destroy();
        }, 5000);
    }

    /** 更新精灵位置（延迟跟随：用 lerp 缓慢追向目标） */
    update(playerX, playerY) {
        if (this._destroyed || !this._el) return;

        // 目标位置：人物左上方（靠近角色）
        const targetX = playerX - 50;
        const targetY = playerY + 70;

        // 延迟跟随：每帧向目标靠近 15%
        this._currentX += (targetX - this._currentX) * 0.15;
        this._currentY += (targetY - this._currentY) * 0.15;

        this._el.style.left = this._currentX + 'px';
        this._el.style.bottom = this._currentY + 'px';
    }

    /** 更新背景定位到当前帧 */
    _updateFrame() {
        if (!this._el) return;
        const col = this._frameIndex % this._cols;
        const row = Math.floor(this._frameIndex / this._cols);
        this._el.style.backgroundPosition = `-${col * this._frameW}px -${row * this._frameH}px`;
    }

    /** 销毁 */
    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        if (this._intervalId) clearInterval(this._intervalId);
        if (this._timerId) clearTimeout(this._timerId);
        if (this._el && this._el.parentNode) {
            this._el.parentNode.removeChild(this._el);
        }
        this._el = null;
    }
}
