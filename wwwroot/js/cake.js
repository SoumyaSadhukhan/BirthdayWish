// cake.js - Interactive Cake Cutting

class CakeManager {
    constructor() {
        this.container = document.getElementById('cake-container');
        this.btnCut = document.getElementById('btn-cut-cake');
        this.cutLine = document.getElementById('cake-cut-line');
        this.candlesContainer = document.getElementById('candles-container');
        this.isCut = false;
    }

    init() {
        this.isCut = false;
        this.renderCandles();

        // Fallback Button
        this.btnCut.onclick = () => this.cutCake();

        // Pointer/Drag logic
        let isDragging = false;
        
        const visual = document.querySelector('.cake-visual');
        
        visual.addEventListener('pointerdown', (e) => {
            if (this.isCut) return;
            isDragging = true;
            this.cutLine.style.opacity = '1';
            this.cutLine.style.left = (e.clientX - visual.getBoundingClientRect().left) + 'px';
        });

        visual.addEventListener('pointermove', (e) => {
            if (!isDragging || this.isCut) return;
            const rect = visual.getBoundingClientRect();
            const x = e.clientX - rect.left;
            this.cutLine.style.left = x + 'px';

            // If dragged across middle threshold
            if (x > rect.width * 0.4 && x < rect.width * 0.6) {
                isDragging = false;
                this.cutCake();
            }
        });

        visual.addEventListener('pointerup', () => {
            isDragging = false;
            if (!this.isCut) this.cutLine.style.opacity = '0';
        });
    }

    renderCandles() {
        this.candlesContainer.innerHTML = '';
        for(let i=0; i<3; i++) {
            this.candlesContainer.innerHTML += `<div class="candle"><div class="flame"></div></div>`;
        }
    }

    cutCake() {
        if (this.isCut) return;
        this.isCut = true;

        if (window.SoundManager) window.SoundManager.playEffect('cake-cut');

        // Animations
        this.cutLine.style.opacity = '1';
        this.cutLine.style.left = '50%';
        this.cutLine.style.height = '100%';
        
        const tl = gsap.timeline();
        
        // Knife slice effect
        tl.to(this.cutLine, { height: '110%', duration: 0.3, ease: 'power2.in' })
          .to(this.cutLine, { opacity: 0, duration: 0.1 });

        // Blow out candles
        document.querySelectorAll('.flame').forEach(f => {
            gsap.to(f, { scale: 0, opacity: 0, duration: 0.2 });
            if (window.ParticleManager) {
                const rect = f.getBoundingClientRect();
                window.ParticleManager.sparkles(rect.left, rect.top);
            }
        });

        // Separate cake
        const layers = document.querySelectorAll('.cake-layer');
        layers.forEach(l => {
            // Split visually by clip path
            l.style.clipPath = 'polygon(0 0, 48% 0, 48% 100%, 0 100%)';
            const clone = l.cloneNode(true);
            clone.style.clipPath = 'polygon(52% 0, 100% 0, 100% 100%, 52% 100%)';
            l.parentNode.appendChild(clone);
            
            gsap.to(l, { x: '-=20', rotation: -5, duration: 1, ease: 'bounce.out', delay: 0.3 });
            gsap.to(clone, { x: '+=20', rotation: 5, duration: 1, ease: 'bounce.out', delay: 0.3 });
        });

        if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
            gsap.to('#app-container', { x: 5, y: -5, yoyo: true, repeat: 5, duration: 0.05, delay: 0.3 });
        }

        // Complete Event
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent("birthday:cake-complete"));
        }, 1500);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.CakeManager = new CakeManager();
});
