// Interactive Disneyland Magic Fairytale Background Engine
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height, dpr;
    let particles = [];
    let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, isActive: false };

    // Disney Fairytale Magic Palettes
    const themePalettes = {
        index: ['#fde047', '#38bdf8', '#c084fc', '#f472b6', '#ffffff'],
        wish: ['#fde047', '#f43f5e', '#fb7185', '#fbbf24', '#ffffff'],
        cake: ['#f59e0b', '#fde047', '#e879f9', '#c084fc', '#ffffff'],
        gift: ['#22d3ee', '#a855f7', '#f472b6', '#818cf8', '#ffffff']
    };

    function getCurrentPalette() {
        const theme = document.body.getAttribute('data-theme') || 'index';
        return themePalettes[theme] || themePalettes.index;
    }

    function resize() {
        dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        initParticles();
    }

    class MagicStarParticle {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * width;
            this.y = initial ? Math.random() * height : height + 20;
            this.size = Math.random() * 3 + 1.5;
            this.baseAlpha = Math.random() * 0.6 + 0.3;
            this.alpha = this.baseAlpha;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = -(Math.random() * 0.9 + 0.4);
            this.rotation = Math.random() * Math.PI;
            this.rotSpeed = (Math.random() - 0.5) * 0.04;
            this.pulseSpeed = Math.random() * 0.04 + 0.02;
            this.pulseAngle = Math.random() * Math.PI * 2;
            this.isStar = Math.random() > 0.4; // 60% 4-point magic stars, 40% glowing motes
            
            const palette = getCurrentPalette();
            this.color = palette[Math.floor(Math.random() * palette.length)];
        }

        update() {
            this.pulseAngle += this.pulseSpeed;
            this.rotation += this.rotSpeed;
            this.alpha = this.baseAlpha + Math.sin(this.pulseAngle) * 0.25;
            if (this.alpha < 0) this.alpha = 0.05;

            // Soft drift
            this.x += this.vx;
            this.y += this.vy;

            // Mouse / Touch attraction and fairy dust swirl effect
            if (mouse.isActive) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const maxDist = 180;

                if (dist < maxDist) {
                    const force = (1 - dist / maxDist) * 1.2;
                    // Slight orbital swirl
                    this.x += (-dy / dist) * force * 1.5 - (dx / dist) * force * 0.5;
                    this.y += (dx / dist) * force * 1.5 - (dy / dist) * force * 0.5;
                    this.alpha = Math.min(1, this.alpha + force * 0.5);
                }
            }

            // Screen reset
            if (this.y < -30 || this.x < -30 || this.x > width + 30) {
                this.reset(false);
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = this.size * 5;

            if (this.isStar) {
                // Draw Disney 4-Point Magic Star
                ctx.beginPath();
                const s = this.size * 2;
                const inner = s * 0.25;
                for (let i = 0; i < 4; i++) {
                    ctx.lineTo(Math.cos((i * Math.PI) / 2) * s, Math.sin((i * Math.PI) / 2) * s);
                    ctx.lineTo(Math.cos((i * Math.PI) / 2 + Math.PI / 4) * inner, Math.sin((i * Math.PI) / 2 + Math.PI / 4) * inner);
                }
                ctx.closePath();
                ctx.fill();
            } else {
                // Draw Glowing Fairy Dust Mote
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    function initParticles() {
        const count = Math.min(Math.floor((width * height) / 16000), 75);
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(new MagicStarParticle());
        }
    }

    // Mouse & Touch tracking
    window.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
        mouse.isActive = true;
    });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.targetX = e.touches[0].clientX;
            mouse.targetY = e.touches[0].clientY;
            mouse.isActive = true;
        }
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
        mouse.isActive = false;
    });

    // Render Loop
    function animate() {
        mouse.x += (mouse.targetX - mouse.x) * 0.1;
        mouse.y += (mouse.targetY - mouse.y) * 0.1;

        ctx.clearRect(0, 0, width, height);

        // Draw Interactive Fairy Spotlight around Cursor
        if (mouse.isActive && mouse.x > 0 && mouse.y > 0) {
            const gradient = ctx.createRadialGradient(
                mouse.x, mouse.y, 0,
                mouse.x, mouse.y, 250
            );
            const palette = getCurrentPalette();
            const mainColor = palette[0] || '#fde047';

            gradient.addColorStop(0, mainColor + '30'); // ~18% glow opacity
            gradient.addColorStop(0.4, mainColor + '10');
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }

        // Draw Fairy Dust & Magic Stars
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    animate();
});
