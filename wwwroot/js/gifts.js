// gifts.js - Interactive Gift Unboxing & ScrollTrigger Sequences

class GiftsManager {
    constructor() {
        this.giftEl = document.getElementById('the-gift');
        this.data = JSON.parse(document.getElementById('birthday-data').textContent);
        this.isOpened = false;
        this.balloonInterval = null;
    }

    init() {
        this.isOpened = false;
        gsap.set('.gift-lid', { y: 0, rotation: 0, opacity: 1 });
        gsap.set('.gift-visual', { scale: 1 });

        this.giftEl.onclick = () => this.openGift();
        
        // Clean up balloons when leaving scene
        document.addEventListener('scene:leave:scene-balloons', () => {
            if (this.balloonInterval) {
                clearInterval(this.balloonInterval);
                this.balloonInterval = null;
            }
        });
        document.addEventListener('scene:enter:scene-balloons', () => {
            if (!this.balloonInterval) this.startBalloons();
        });
    }

    openGift() {
        if (this.isOpened) return;
        this.isOpened = true;

        if (window.SoundManager) window.SoundManager.playEffect('gift-open');

        const tl = gsap.timeline();

        tl.to('.gift-visual', { rotation: 5, yoyo: true, repeat: 5, duration: 0.1 })
          .to('.gift-visual', { rotation: 0, duration: 0.1 });

        tl.to('.gift-lid', { y: -150, rotation: 25, duration: 0.6, ease: 'power2.out' })
          .to('.gift-lid', { opacity: 0, duration: 0.2 }, "-=0.3");

        if (window.ParticleManager) {
            const rect = this.giftEl.getBoundingClientRect();
            setTimeout(() => {
                window.ParticleManager.confetti(rect.left + rect.width/2, rect.top);
                window.ParticleManager.sparkles(rect.left + rect.width/2, rect.top);
            }, 600);
        }

        setTimeout(() => {
            document.dispatchEvent(new CustomEvent("birthday:gift-opened"));
        }, 1500);
    }

    initScrollingSurprises() {
        // Populate Letter
        if (this.data.config.letter && this.data.config.letter.text) {
            document.getElementById('svg-letter-title').textContent = this.data.config.letter.title || "My Dearest,";
            document.getElementById('html-letter-body').innerText = this.data.config.letter.text;
        }

        // --- Envelope Animation ---
        const envelopeTl = gsap.timeline({
            scrollTrigger: {
                trigger: '#scene-letter',
                start: 'top 60%',
                end: 'center center',
                scrub: 1
            }
        });
        envelopeTl.to('#envelope-flap', { rotationX: 180, duration: 1 })
                  .to('#the-letter-paper', { y: -250, duration: 2 }, "+=0.2");

        // --- Teddy Hug Animation ---
        const teddyTl = gsap.timeline({
            scrollTrigger: {
                trigger: '#scene-teddy',
                start: 'top 80%',
                end: 'center center',
                scrub: 1
            }
        });
        teddyTl.to('.teddy-svg', { scale: 3, opacity: 1, duration: 1, ease: 'power1.inOut' })
               .to('#teddy-left-paw', { rotation: -10, duration: 0.5 }, 0)
               .to('#teddy-right-paw', { rotation: 10, duration: 0.5 }, 0);

        // --- Roses Animation ---
        this.generateSVGRoses();
        gsap.to('.floating-rose', {
            y: -800,
            rotation: 360,
            opacity: 1,
            stagger: 0.1,
            scrollTrigger: {
                trigger: '#scene-roses',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 2
            }
        });
        
        // --- Setup trigger for Cake Scene ---
        ScrollTrigger.create({
            trigger: "#scene-cake",
            start: "top center",
            onEnter: () => document.dispatchEvent(new CustomEvent("birthday:cake-reached")),
            once: true
        });
    }

    generateSVGRoses() {
        const canvas = document.getElementById('roses-canvas');
        canvas.innerHTML = '';
        const roseSVG = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="floating-rose">
            <defs>
                <radialGradient id="rose-grad" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#ff3366"/>
                    <stop offset="100%" stop-color="#8b0000"/>
                </radialGradient>
            </defs>
            <path d="M50 80 Q60 50 80 40 Q90 30 70 20 Q50 10 30 20 Q10 30 20 40 Q40 50 50 80 Z" fill="url(#rose-grad)"/>
            <path d="M50 80 Q55 60 70 50 Q80 40 60 30 Q50 20 40 30 Q20 40 30 50 Q45 60 50 80 Z" fill="#b30000"/>
            <path d="M50 70 Q55 55 65 45 Q70 35 55 30 Q50 25 45 30 Q30 35 35 45 Q45 55 50 70 Z" fill="#d90000"/>
            <circle cx="50" cy="40" r="8" fill="#ff4d4d"/>
        </svg>`;

        for(let i=0; i<15; i++) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = roseSVG;
            const svg = wrapper.firstElementChild;
            svg.style.left = (Math.random() * 90) + '%';
            svg.style.top = (Math.random() * 50 + 50) + '%';
            svg.style.transform = `scale(${Math.random() * 1.5 + 0.5})`;
            canvas.appendChild(svg);
        }
    }

    startBalloons() {
        const canvas = document.getElementById('balloons-canvas');
        const emojis = ['🎈', '💖', '✨'];
        
        this.balloonInterval = setInterval(() => {
            const b = document.createElement('div');
            b.innerText = emojis[Math.floor(Math.random() * emojis.length)];
            b.style.position = 'absolute';
            b.style.left = Math.random() * 90 + 'vw';
            b.style.bottom = '-50px';
            b.style.fontSize = (Math.random() * 2 + 2) + 'rem';
            b.style.opacity = 0.8;
            b.style.zIndex = 1;
            canvas.appendChild(b);
            
            gsap.to(b, {
                y: - (window.innerHeight + 100),
                x: "+=" + (Math.random() * 100 - 50),
                rotation: Math.random() * 45 - 22,
                duration: Math.random() * 4 + 4,
                ease: 'power1.out',
                onComplete: () => { if (b.parentNode) b.remove(); }
            });
        }, 800);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.GiftsManager = new GiftsManager();
});
