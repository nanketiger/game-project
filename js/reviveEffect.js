/**
 * ReviveEffect — 拥有复活芯片期间显示的电光光环特效
 * 持续跟随人物，直到芯片被消耗或游戏重置
 */
class ReviveEffect {
    constructor(playerX, playerY) {
        this._el = null;
        this._destroyed = false;
        this._frameIndex = 0;
        this._totalFrames = 7;
        this._cols = 5;
        this._rows = 2;
        this._frameW = 96;
        this._frameH = 96;

        const el = document.createElement('div');
        el.style.cssText = [
            'position:absolute',
            'z-index:20',
            'pointer-events:none',
            `width:${this._frameW}px`,
            `height:${this._frameH}px`,
            'background-image:url("images/Spritesheets/Eletric%20Aura.png")',
            `background-size:${this._frameW * this._cols}px ${this._frameH * this._rows}px`,
            'background-repeat:no-repeat',
            'image-rendering:pixelated',
            'opacity:0.85',
        ].join(';');

        el.style.left = (playerX - 48) + 'px';
        el.style.bottom = (playerY + 10) + 'px';
        document.body.appendChild(el);
        this._el = el;

        // 帧动画（每秒 10 帧，纯循环）
        this._intervalId = setInterval(() => {
            if (this._destroyed || !this._el) return;
            this._frameIndex = (this._frameIndex + 1) % this._totalFrames;
            const col = this._frameIndex % this._cols;
            const row = Math.floor(this._frameIndex / this._cols);
            this._el.style.backgroundPosition = `-${col * this._frameW}px -${row * this._frameH}px`;
        }, 1000 / 5);
    }

    update(playerX, playerY) {
        if (this._destroyed || !this._el) return;
        this._el.style.left = (playerX - 48) + 'px';
        this._el.style.bottom = (playerY + 10) + 'px';
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        if (this._intervalId) clearInterval(this._intervalId);
        if (this._el && this._el.parentNode) {
            this._el.parentNode.removeChild(this._el);
        }
        this._el = null;
    }
}
