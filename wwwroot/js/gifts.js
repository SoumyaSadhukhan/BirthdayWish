// gifts.js - Interactive Gift Unboxing

class GiftsManager {
    constructor() {
        this.giftEl = document.getElementById('the-gift');
        this.grid = document.getElementById('surprises-grid');
        this.overlay = document.getElementById('overlay-container');
        this.overlayContent = document.getElementById('overlay-content');
        this.btnCloseOverlay = document.getElementById('btn-close-overlay');
        this.data = JSON.parse(document.getElementById('birthday-data').textContent);
        
        this.isOpened = false;

        this.btnCloseOverlay.onclick = () => this.closeOverlay();
    }

    init() {
        this.isOpened = false;
        this.giftEl.onclick = () => this.openGift();
        gsap.set('.gift-lid', { y: 0, rotation: 0 });
    }

    openGift() {
        if (this.isOpened) return;
        this.isOpened = true;

        if (window.SoundManager) window.SoundManager.playEffect('gift-open');

        const tl = gsap.timeline();

        // Shake
        tl.to(this.giftEl, { rotation: 5, yoyo: true, repeat: 5, duration: 0.1 })
          .to(this.giftEl, { rotation: 0, duration: 0.1 });

        // Lid pops off
        tl.to('.gift-lid', { y: -100, rotation: 15, duration: 0.5, ease: 'power2.out' })
          .to('.gift-lid', { opacity: 0, duration: 0.2 }, "-=0.2");

        // Light burst
        if (window.ParticleManager) {
            const rect = this.giftEl.getBoundingClientRect();
            setTimeout(() => {
                window.ParticleManager.confetti(rect.left + rect.width/2, rect.top);
                window.ParticleManager.sparkles(rect.left + rect.width/2, rect.top);
            }, 600);
        }

        // Transition
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent("birthday:gift-opened"));
        }, 1500);
    }

    populateSurprises() {
        this.grid.innerHTML = '';
        const s = this.data.config.surprises;

        if (this.data.config.letter.enabled) this.addSurpriseItem('💌', 'Letter', () => this.showLetter());
        if (s.flowers) this.addSurpriseItem('🌸', 'Flowers', () => this.showFlowers());
        if (s.gallery) this.addSurpriseItem('📸', 'Photos', () => this.showGallery());
        if (s.chocolates) this.addSurpriseItem('🍫', 'Chocolates', () => this.showSimple('Chocolates', 'One sweet thing for another sweet person ❤️', this.data.images.chocolates));
        if (s.sweets) this.addSurpriseItem('🍬', 'Sweets', () => this.showSimple('Sweets', 'Enjoy your digital treats!', null));
        if (s.teddy) this.addSurpriseItem('🧸', 'Teddy', () => this.showSimple('Virtual Hug', 'Sending you a virtual hug until I can give you a real one.', null));
        
        // Always add final button
        this.addSurpriseItem('❤️', 'Final Message', () => {
            document.dispatchEvent(new CustomEvent("birthday:final-reached"));
        });

        gsap.fromTo('.surprise-item', 
            { scale: 0, opacity: 0 }, 
            { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.5)' }
        );
    }

    addSurpriseItem(icon, label, onClick) {
        const div = document.createElement('div');
        div.className = 'surprise-item';
        div.innerHTML = `<div class="surprise-icon">${icon}</div><div class="surprise-label">${label}</div>`;
        div.onclick = onClick;
        this.grid.appendChild(div);
    }

    openOverlay() {
        this.overlay.classList.add('active');
        gsap.fromTo('#overlay-content', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' });
        if (window.SoundManager) window.SoundManager.playEffect('sparkle');
    }

    closeOverlay() {
        this.overlay.classList.remove('active');
        this.overlayContent.innerHTML = '';
    }

    showLetter() {
        this.overlayContent.innerHTML = `
            <div class="letter-paper">
                <h2>${this.data.config.letter.title}</h2>
                <div style="margin-top: 20px; white-space: pre-wrap;">${this.data.config.letter.text}</div>
            </div>
        `;
        this.openOverlay();
    }

    showFlowers() {
        let content = `<div style="text-align:center; color:white;">
            <div style="font-size: 5rem; margin-bottom: 20px;">🌸</div>
            <h2>These flowers can't reach you physically...</h2>
            <p>so I sent them digitally.</p>
        </div>`;
        
        if (this.data.images.flowers && this.data.images.flowers.length > 0) {
            content = `<div style="text-align:center; color:white;">
                <img src="${this.data.images.flowers[0]}" style="max-width:300px; border-radius:10px; margin-bottom:20px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);" />
                <h2>These flowers can't reach you physically...</h2>
                <p>so I sent them digitally.</p>
            </div>`;
        }
        
        this.overlayContent.innerHTML = content;
        this.openOverlay();
    }

    showGallery() {
        if (window.GalleryManager) {
            window.GalleryManager.start(this.overlayContent);
            this.openOverlay();
        }
    }

    showSimple(title, message, images) {
        let content = `<div style="text-align:center; color:white; background:rgba(255,255,255,0.1); padding:40px; border-radius:20px; backdrop-filter:blur(10px);">
            <h2 style="margin-bottom:20px;">${title}</h2>
            <p style="font-size:1.2rem;">${message}</p>
        </div>`;

        if (images && images.length > 0) {
             content = `<div style="text-align:center; color:white; background:rgba(255,255,255,0.1); padding:40px; border-radius:20px; backdrop-filter:blur(10px);">
                <img src="${images[0]}" style="max-width:200px; border-radius:10px; margin-bottom:20px;" />
                <h2 style="margin-bottom:20px;">${title}</h2>
                <p style="font-size:1.2rem;">${message}</p>
            </div>`;
        }
        
        this.overlayContent.innerHTML = content;
        this.openOverlay();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.GiftsManager = new GiftsManager();
});
