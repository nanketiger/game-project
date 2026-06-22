/**
 * PortalEffect — Frame-cycled portal animation.
 * Cycles through 22 extracted PNG frames at a controlled speed.
 */
class PortalEffect {
    constructor(x, y) {
        this._el = null;
        this._frameIdx = 0;
        this._frameCount = 22;
        this._images = [];
        this._rafId = null;

        // create portal element
        const el = document.createElement('div');
        el.style.cssText = [
            'position:absolute',
            'left:' + x + 'px',
            'bottom:' + (y - 40) + 'px',
            'width:78px',
            'height:78px',
            'background-size:100% 100%',
            'z-index:10',
            'pointer-events:none',
        ].join(';');
        document.body.appendChild(el);
        this._el = el;

        // preload all frames
        let loaded = 0;
        for (let i = 0; i < this._frameCount; i++) {
            const img = new Image();
            const num = String(i).padStart(2, '0');
            img.src = 'images/Portal/frames/Sequence' + num + '.png';
            this._images.push(img);
            img.onload = () => {
                loaded++;
                if (loaded === 1) {
                    el.style.backgroundImage = 'url("' + img.src + '")';
                }
            };
        }

        // start animation loop (~8 fps instead of original GIF speed)
        this._lastTime = performance.now();
        this._frameInterval = 120; // ms between frames (~8 fps, slower than original)
        this._tick();
    }

    _tick() {
        if (!this._el) return;
        const now = performance.now();
        const dt = now - this._lastTime;
        if (dt >= this._frameInterval) {
            this._lastTime = now - (dt % this._frameInterval);
            this._frameIdx = (this._frameIdx + 1) % this._frameCount;
            const img = this._images[this._frameIdx];
            if (img && img.complete) {
                this._el.style.backgroundImage = 'url("' + img.src + '")';
            }
        }
        this._rafId = requestAnimationFrame(() => this._tick());
    }

    destroy() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        if (this._el && this._el.parentNode) {
            this._el.parentNode.removeChild(this._el);
        }
        this._el = null;
        this._images = [];
    }
}
