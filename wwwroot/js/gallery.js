// gallery.js - Interactive Photo Stack

class GalleryManager {
    constructor() {
        this.data = JSON.parse(document.getElementById('birthday-data').textContent);
        this.images = this.data.images.gallery || [];
        this.currentIndex = 0;
    }

    start(container) {
        if (this.images.length === 0) {
            container.innerHTML = `<h2 style="color:white;">No photos found.</h2>`;
            return;
        }

        this.currentIndex = 0;

        container.innerHTML = `
            <div style="text-align:center;">
                <h2 style="color:white; margin-bottom: 20px;">Memories</h2>
                <div class="gallery-stack" id="gallery-stack"></div>
                <p style="color:rgba(255,255,255,0.5); margin-top: 20px;">Click or swipe to view next</p>
            </div>
        `;

        this.stackEl = document.getElementById('gallery-stack');
        this.renderStack();
    }

    renderStack() {
        this.stackEl.innerHTML = '';
        
        // Render up to 5 images to keep DOM light
        const maxToShow = Math.min(5, this.images.length - this.currentIndex);
        
        for (let i = maxToShow - 1; i >= 0; i--) {
            const actualIndex = this.currentIndex + i;
            const imgEl = document.createElement('img');
            imgEl.src = this.images[actualIndex];
            imgEl.className = 'gallery-photo';
            
            // Random slight rotation for stack effect
            const rotation = (Math.random() * 10 - 5) * (i===0? 0 : 1); 
            
            gsap.set(imgEl, { 
                rotation: rotation,
                z: -i * 10,
                scale: 1 - (i * 0.05),
                opacity: 1 - (i * 0.1)
            });

            // Top card is interactive
            if (i === 0) {
                imgEl.style.cursor = 'pointer';
                imgEl.onclick = () => this.nextPhoto(imgEl);
                
                // Simple drag/swipe handling
                let isDragging = false;
                let startX = 0;

                imgEl.addEventListener('pointerdown', (e) => {
                    isDragging = true;
                    startX = e.clientX;
                    imgEl.setPointerCapture(e.pointerId);
                });

                imgEl.addEventListener('pointermove', (e) => {
                    if (!isDragging) return;
                    const diffX = e.clientX - startX;
                    gsap.set(imgEl, { x: diffX, rotation: rotation + diffX * 0.05 });
                });

                imgEl.addEventListener('pointerup', (e) => {
                    if (!isDragging) return;
                    isDragging = false;
                    const diffX = e.clientX - startX;
                    
                    if (Math.abs(diffX) > 50) {
                        this.nextPhoto(imgEl, diffX > 0 ? 1 : -1);
                    } else {
                        gsap.to(imgEl, { x: 0, rotation: rotation, duration: 0.3, ease: 'back.out' });
                    }
                });
            }

            this.stackEl.appendChild(imgEl);
        }

        if (maxToShow === 0) {
            this.stackEl.innerHTML = `<h2 style="color:white; margin-top:50px;">That's all for now ❤️</h2>`;
        }
    }

    nextPhoto(el, dir = 1) {
        if (window.SoundManager) window.SoundManager.playEffect('paper'); // Optional: Add a paper slide sound
        
        gsap.to(el, {
            x: dir * window.innerWidth,
            rotation: dir * 45,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.in',
            onComplete: () => {
                this.currentIndex++;
                this.renderStack();
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.GalleryManager = new GalleryManager();
});
