// cake.js - Interactive Cake Cutting & Candles

class CakeManager {
    constructor() {
        this.container = document.getElementById('cake-container');
        this.cutLine = document.getElementById('cake-cut-line');
        this.candlesContainer = document.getElementById('candles-container');
        this.trailContainer = document.getElementById('swipe-trail-container');
        this.instructions = document.getElementById('cake-instructions-text');
        
        this.candlesLit = 3;
        this.isCut = false;
        
        // Ensure initial config is passed if needed
        this.data = JSON.parse(document.getElementById('birthday-data').textContent);
    }

    init() {
        this.isCut = false;
        this.candlesLit = 3;
        this.instructions.innerText = "Tap the candles to blow them out 💨";
        this.renderCandles();
    }

    renderCandles() {
        this.candlesContainer.innerHTML = '';
        for(let i = 0; i < 3; i++) {
            const candle = document.createElement('div');
            candle.className = 'candle';
            
            const flame = document.createElement('div');
            flame.className = 'flame';
            
            candle.appendChild(flame);
            
            // Allow tap/swipe on flame to extinguish
            flame.addEventListener('pointerdown', (e) => this.extinguishCandle(e, flame));
            flame.addEventListener('pointerenter', (e) => {
                // If dragging across, extinguish
                if(e.buttons > 0) this.extinguishCandle(e, flame);
            });
            
            this.candlesContainer.appendChild(candle);
        }
    }

    extinguishCandle(e, flameEl) {
        if (flameEl.classList.contains('extinguished')) return;
        flameEl.classList.add('extinguished');
        
        gsap.to(flameEl, { scale: 0, opacity: 0, duration: 0.2 });
        
        if (window.ParticleManager) {
            const rect = flameEl.getBoundingClientRect();
            window.ParticleManager.sparkles(rect.left, rect.top);
        }
        
        this.candlesLit--;
        
        if (this.candlesLit <= 0) {
            this.candlesExtinguished();
        }
    }

    candlesExtinguished() {
        if (window.SoundManager) window.SoundManager.playEffect('magic');
        this.instructions.innerText = "Now swipe down to cut the cake 🎂";
        
        // Show glowing arrow cue
        gsap.fromTo(this.cutLine, 
            { opacity: 0, height: '0%' }, 
            { opacity: 0.5, height: '100%', yoyo: true, repeat: -1, duration: 1, ease: 'sine.inOut' }
        );
        
        this.initCuttingLogic();
    }

    initCuttingLogic() {
        let isDragging = false;
        let startY = 0;
        const visual = document.querySelector('.cake-visual');
        
        const createTrail = (x, y) => {
            const p = document.createElement('div');
            p.className = 'swipe-particle';
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            this.trailContainer.appendChild(p);
            
            gsap.to(p, {
                opacity: 0,
                scale: 2,
                duration: 0.5,
                onComplete: () => p.remove()
            });
        };
        
        visual.addEventListener('pointerdown', (e) => {
            if (this.isCut) return;
            isDragging = true;
            gsap.killTweensOf(this.cutLine); // Stop pulsating cue
            
            const rect = visual.getBoundingClientRect();
            startY = e.clientY - rect.top;
            
            this.cutLine.style.opacity = '1';
            this.cutLine.style.left = (e.clientX - rect.left) + 'px';
        });

        visual.addEventListener('pointermove', (e) => {
            if (!isDragging || this.isCut) return;
            const rect = visual.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.cutLine.style.left = x + 'px';
            createTrail(x, y);

            // If dragged down significantly (swipe gesture)
            if (y - startY > 100) {
                isDragging = false;
                this.cutCake();
            }
        });

        visual.addEventListener('pointerup', () => {
            isDragging = false;
            if (!this.isCut) {
                gsap.to(this.cutLine, { opacity: 0, duration: 0.2 });
            }
        });
        
        visual.addEventListener('pointercancel', () => {
            isDragging = false;
            if (!this.isCut) gsap.to(this.cutLine, { opacity: 0, duration: 0.2 });
        });
    }

    cutCake() {
        if (this.isCut) return;
        this.isCut = true;

        if (window.SoundManager) window.SoundManager.playEffect('cake-cut');
        this.instructions.innerText = "";

        // Animations
        this.cutLine.style.opacity = '1';
        this.cutLine.style.left = '50%';
        this.cutLine.style.height = '100%';
        
        const tl = gsap.timeline();
        
        // Knife slice effect
        tl.to(this.cutLine, { height: '110%', duration: 0.3, ease: 'power2.in' })
          .to(this.cutLine, { opacity: 0, duration: 0.1 });

        // Separate cake
        const layers = document.querySelectorAll('.cake-layer');
        layers.forEach(l => {
            l.style.clipPath = 'polygon(0 0, 48% 0, 48% 100%, 0 100%)';
            const clone = l.cloneNode(true);
            clone.style.clipPath = 'polygon(52% 0, 100% 0, 100% 100%, 52% 100%)';
            l.parentNode.appendChild(clone);
            
            gsap.to(l, { x: '-=20', rotation: -5, duration: 1, ease: 'bounce.out', delay: 0.3 });
            gsap.to(clone, { x: '+=20', rotation: 5, duration: 1, ease: 'bounce.out', delay: 0.3 });
        });

        if (window.ParticleManager) {
            setTimeout(() => {
                const rect = this.container.getBoundingClientRect();
                window.ParticleManager.confetti(rect.left + rect.width/2, rect.top);
            }, 300);
        }

        // Trigger CELEBRATION scene transition
        setTimeout(() => {
            // Flash celebration text
            const text = document.getElementById('celebration-text');
            text.classList.remove('hidden');
            document.getElementById('celeb-name').innerText = this.data.config.name;
            
            gsap.fromTo(text, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.3)' });
            
            setTimeout(() => {
                gsap.to(text, { scale: 1.5, opacity: 0, duration: 1, onComplete: () => {
                    text.classList.add('hidden');
                    document.dispatchEvent(new CustomEvent("birthday:cake-complete"));
                }});
            }, 3000);
            
        }, 1500);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.CakeManager = new CakeManager();
});
