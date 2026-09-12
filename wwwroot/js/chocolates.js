// chocolates.js - Interactive Chocolate Box

class ChocolatesManager {
    constructor() {
        this.box = document.getElementById('chocolate-box');
        this.isOpened = false;
        this.isAnimating = false;
    }

    init() {
        this.isOpened = false;
        if (this.box) {
            this.box.onclick = () => this.openBox();
        }

        // Cleanup handling
        document.addEventListener('scene:leave:scene-chocolates', () => {
            // Pause any heavy stuff if needed
        });
    }

    openBox() {
        if (this.isOpened || this.isAnimating) return;
        this.isAnimating = true;
        this.isOpened = true;

        if (window.SoundManager) window.SoundManager.playEffect('gift-open');

        const tl = gsap.timeline();

        // Lid opens up and fades out
        tl.to('.choc-lid', { y: -100, rotationX: 45, opacity: 0, duration: 0.8, ease: 'power2.out' });

        // Chocolates float up slightly
        tl.to('.choc-piece', { 
            y: -15, 
            stagger: 0.1, 
            duration: 0.5, 
            ease: 'back.out(1.5)',
            onComplete: () => {
                // Add floating idle animation
                gsap.to('.choc-piece', {
                    y: -20,
                    stagger: { each: 0.1, from: "random" },
                    duration: 1.5,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inOut'
                });
            }
        }, "-=0.3");
        
        // Add sparkles
        if (window.ParticleManager) {
            const rect = this.box.getBoundingClientRect();
            setTimeout(() => {
                window.ParticleManager.sparkles(rect.left + rect.width/2, rect.top + rect.height/2);
            }, 300);
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.ChocolatesManager = new ChocolatesManager();
    // We will initialize it when scroll reaches it, or just init here since click is manual
    window.ChocolatesManager.init();
});
