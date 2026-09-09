// particles.js - GSAP based particle system for DOM elements

class ParticleManager {
    constructor() {
        this.container = document.getElementById('party-particles');
        this.colors = ['#ff4d6d', '#ffb703', '#a2d2ff', '#ffc8dd', '#fff'];
    }

    createParticle(x, y, type = 'confetti') {
        const p = document.createElement('div');
        
        if (type === 'confetti') {
            p.style.width = Math.random() * 10 + 5 + 'px';
            p.style.height = Math.random() * 10 + 5 + 'px';
            p.style.backgroundColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            if (Math.random() > 0.5) p.style.borderRadius = '50%';
        } else if (type === 'sparkle') {
            p.innerHTML = '✨';
            p.style.fontSize = Math.random() * 20 + 10 + 'px';
        } else if (type === 'heart') {
            p.innerHTML = '❤️';
            p.style.fontSize = Math.random() * 20 + 10 + 'px';
        }

        p.style.position = 'absolute';
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.pointerEvents = 'none';
        
        this.container.appendChild(p);

        return p;
    }

    confetti(x = window.innerWidth / 2, y = window.innerHeight / 2) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (window.SoundManager) window.SoundManager.playEffect('confetti');

        for (let i = 0; i < 50; i++) {
            const p = this.createParticle(x, y, 'confetti');
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 300 + 100;
            
            gsap.to(p, {
                x: Math.cos(angle) * velocity,
                y: Math.sin(angle) * velocity + 200, // gravity
                rotation: Math.random() * 360,
                opacity: 0,
                duration: Math.random() * 1 + 1,
                ease: "power2.out",
                onComplete: () => p.remove()
            });
        }
    }

    sparkles(x, y) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (window.SoundManager) window.SoundManager.playEffect('sparkle');

        for (let i = 0; i < 10; i++) {
            const p = this.createParticle(x, y, 'sparkle');
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 50 + 20;
            
            gsap.to(p, {
                x: Math.cos(angle) * velocity,
                y: Math.sin(angle) * velocity,
                opacity: 0,
                scale: Math.random() * 1.5,
                duration: 1,
                onComplete: () => p.remove()
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.ParticleManager = new ParticleManager();
});
