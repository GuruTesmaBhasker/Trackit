class ClickSpark {
    constructor() {
        this.options = {
            sparkColor: '#38bdf8', // Sky Blue to match the theme
            sparkSize: 10,
            sparkRadius: 15,
            sparkCount: 8,
            duration: 400,
            easing: 'ease-out',
            extraScale: 1.0,
        };
        
        this.sparks = [];
        this.canvas = null;
        this.ctx = null;
        this.init();
    }

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 99999;
        `;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        window.addEventListener('resize', () => this.resize());
        document.addEventListener('click', (e) => this.handleClick(e));
        
        requestAnimationFrame((t) => this.animate(t));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    easeFunc(t) {
        // ease-out: t * (2 - t)
        return t * (2 - t);
    }

    handleClick(e) {
        const x = e.clientX;
        const y = e.clientY;
        const now = performance.now();
        
        for (let i = 0; i < this.options.sparkCount; i++) {
            this.sparks.push({
                x,
                y,
                angle: (2 * Math.PI * i) / this.options.sparkCount,
                startTime: now
            });
        }
    }

    animate(timestamp) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.sparks = this.sparks.filter(spark => {
            const elapsed = timestamp - spark.startTime;
            if (elapsed >= this.options.duration) return false;

            const progress = elapsed / this.options.duration;
            const eased = this.easeFunc(progress);

            const distance = eased * this.options.sparkRadius * this.options.extraScale;
            const lineLength = this.options.sparkSize * (1 - eased);

            const x1 = spark.x + distance * Math.cos(spark.angle);
            const y1 = spark.y + distance * Math.sin(spark.angle);
            const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
            const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

            this.ctx.strokeStyle = this.options.sparkColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();

            return true;
        });

        requestAnimationFrame((t) => this.animate(t));
    }
}

// Initialize automatically
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ClickSpark());
} else {
    new ClickSpark();
}
