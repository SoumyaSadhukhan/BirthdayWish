// gallery.js - Pinned Horizontal Scroll Gallery

class GalleryManager {
    constructor() {
        this.data = JSON.parse(document.getElementById('birthday-data').textContent);
        this.images = this.data.images.gallery || [];
    }

    initPinnedScroll() {
        const track = document.getElementById('gallery-track');
        if (!track) return;

        if (this.images.length === 0) {
            track.innerHTML = `<h2 style="color:white; margin:auto;">No photos found.</h2>`;
            return;
        }

        // Populate track
        track.innerHTML = '';
        this.images.forEach(imgSrc => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `<img src="${imgSrc}" alt="Memory" loading="lazy" />`;
            track.appendChild(item);
        });

        // Calculate scroll width
        const totalWidth = track.scrollWidth - window.innerWidth;

        // GSAP ScrollTrigger to translate horizontally
        gsap.to(track, {
            x: -totalWidth,
            ease: "none",
            scrollTrigger: {
                trigger: ".gallery-pin-container",
                pin: true,
                scrub: 1,
                start: "top top",
                end: () => `+=${totalWidth}`,
                invalidateOnRefresh: true
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.GalleryManager = new GalleryManager();
});
