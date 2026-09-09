// birthday.js - Ambient Birthday Room Manager

class BirthdayRoom {
    constructor() {
        this.bg = document.getElementById('party-bg');
        this.balloonsContainer = document.getElementById('balloons-container');
        this.data = JSON.parse(document.getElementById('birthday-data').textContent);
    }

    startAmbient() {
        this.createBalloons();
    }

    createBalloons() {
        if (!this.data.config.surprises.balloons) return;
        
        const colors = ['#ff4d6d', '#ffb703', '#a2d2ff', '#ffc8dd'];
        
        for (let i = 0; i < 8; i++) {
            const b = document.createElement('div');
            b.className = 'balloon-ambient';
            b.innerHTML = '🎈';
            
            // Random start positions
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight + window.innerHeight; // Start below screen
            
            b.style.left = x + 'px';
            b.style.top = y + 'px';
            b.style.fontSize = (Math.random() * 2 + 3) + 'rem';
            
            // Interactive pop
            b.onclick = () => {
                if (window.SoundManager) window.SoundManager.playEffect('balloon-pop');
                if (window.ParticleManager) {
                    const rect = b.getBoundingClientRect();
                    window.ParticleManager.confetti(rect.left, rect.top);
                }
                b.remove();
            };

            this.balloonsContainer.appendChild(b);

            // Float animation
            gsap.to(b, {
                y: -window.innerHeight * 1.5,
                x: `+=${Math.random() * 100 - 50}`, // slight sway
                duration: Math.random() * 15 + 10,
                repeat: -1,
                ease: 'none',
                delay: Math.random() * 5
            });
            
            // Sway animation
            gsap.to(b, {
                rotation: Math.random() * 20 - 10,
                duration: Math.random() * 2 + 2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.BirthdayRoom = new BirthdayRoom();
});
