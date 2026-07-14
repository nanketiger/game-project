/**
 * IdleAura — 人物待机光环效果
 * 待机满2秒后在人物下方播放精灵图动画，做任何动作时立即消失
 */
class IdleAura {
    constructor(playerX, playerY) {
        this._el = null;
        this._destroyed = false;
        this._frameIndex = 0;
        this._totalFrames = 7;   // 精灵图前半部分只有7帧
        this._cols = 5;
        this._rows = 4;
        this._frameW = 96;
        this._frameH = 96;

        const el = document.createElement('div');
        el.style.cssText = [
            'position:absolute',
            'opacity:0.45',
            'z-index:1',
            'pointer-events:none',
            `width:${this._frameW}px`,
            `height:${this._frameH}px`,
            'background-image:url("images/Spritesheets/Holy%20Light%20Aura.png")',
            `background-size:${this._frameW * this._cols}px ${this._frameH * this._rows}px`,
            'background-repeat:no-repeat',
            'image-rendering:pixelated',
        ].join(';');

        this._el = el;
        this.update(playerX, playerY);
        this._updateFrame();
        // 放到游戏容器内、玩家下层
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.insertBefore(el, gameContainer.firstChild);
        } else {
            document.body.appendChild(el);
        }

        // 帧动画（每秒8帧，更慢）
        this._intervalId = setInterval(() => {
            if (this._destroyed) return;
            this._frameIndex = (this._frameIndex + 1) % this._totalFrames;
            this._updateFrame();
        }, 1000 / 8);
    }

    /** 更新光环位置，跟随人物 */
    update(playerX, playerY) {
        if (this._destroyed || !this._el) return;
        // 人物下方偏左：left偏移使光环中心对人物中心偏左，bottom在脚下
        this._el.style.left = (playerX - 55) + 'px';
        this._el.style.bottom = (playerY - 35) + 'px';
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
        if (this._el && this._el.parentNode) {
            this._el.parentNode.removeChild(this._el);
        }
        this._el = null;
    }
}
