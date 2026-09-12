// gallery-main.js - High-performance GSAP Gallery Controller

class GalleryApp {
    constructor() {
        this.images = [];
        this.currentIndex = 0;
        this.totalImages = 0;
        this.isLoading = true;
        
        // Settings
        this.thumbWidth = 400; // via ImageSharp.Web
        this.largeWidth = 1600;

        // Elements
        this.lightbox = document.getElementById('lightbox-viewer');
        this.lbImg = document.getElementById('lb-img');
        this.lbCounter = document.getElementById('lb-counter');
        this.lbFilename = document.getElementById('lb-filename');
        this.lbDownload = document.getElementById('lb-download');

        this.init();
    }

    async init() {
        gsap.registerPlugin(ScrollTrigger);
        this.setupNavigation();
        this.setupLightboxEvents();
        
        await this.fetchManifest();
        if (this.totalImages > 0) {
            this.buildSections();
            this.initGSAP();
        }
    }

    async fetchManifest() {
        try {
            const res = await fetch('/api/gallery');
            if (!res.ok) throw new Error("Manifest fetch failed");
            const data = await res.json();
            this.images = data.images;
            this.totalImages = data.total;
            console.log(`Loaded ${this.totalImages} images`);
        } catch (e) {
            console.error(e);
            document.getElementById('gallery-container').innerHTML = 
                '<h2 style="color:white; text-align:center; margin-top:20vh;">Failed to load photo manifest. Check backend connection.</h2>';
        }
    }

    getThumbUrl(imgObj) {
        return `${imgObj.url}?width=${this.thumbWidth}`;
    }

    getLargeUrl(imgObj) {
        return `${imgObj.url}?width=${this.largeWidth}`;
    }

    getOriginalUrl(imgObj) {
        return imgObj.url;
    }

    buildSections() {
        // Section 1: Hero (1 image)
        if (this.totalImages > 0) {
            document.querySelector('.hero-img').src = this.getLargeUrl(this.images[0]);
            document.querySelector('.hero-img').dataset.index = 0;
        }

        // Section 2: Filmstrip (120 images)
        const filmTrack = document.getElementById('filmstrip-track');
        const filmCount = Math.min(120, this.totalImages - 1);
        for(let i = 1; i <= filmCount; i++) {
            const div = document.createElement('div');
            div.className = 'filmstrip-item';
            div.innerHTML = `<img data-src="${this.getThumbUrl(this.images[i])}" alt="Filmstrip" loading="lazy" onclick="window.GalleryApp.openLightbox(${i})" />`;
            filmTrack.appendChild(div);
        }

        // Section 3: Stacked Cards (120 images)
        const deck = document.getElementById('cards-deck');
        const stackCount = Math.min(120, this.totalImages - 121);
        for(let i = 0; i < stackCount; i++) {
            const imgIdx = 121 + i;
            const div = document.createElement('div');
            div.className = 'stacked-card';
            div.innerHTML = `<img data-src="${this.getLargeUrl(this.images[imgIdx])}" alt="Stacked" loading="lazy" onclick="window.GalleryApp.openLightbox(${imgIdx})" />`;
            deck.appendChild(div);
        }

        // Section 4: Editorial Masonry (150 images)
        const masonry = document.getElementById('masonry-grid');
        const masonryCount = Math.min(150, this.totalImages - 241);
        for(let i = 0; i < masonryCount; i++) {
            const imgIdx = 241 + i;
            const div = document.createElement('div');
            div.className = 'masonry-item';
            // Random row span for masonry look
            const span = Math.floor(Math.random() * 2) + 12; // 12 or 13 grid rows
            div.style.gridRowEnd = `span ${span}`;
            div.innerHTML = `<img data-src="${this.getThumbUrl(this.images[imgIdx])}" alt="Editorial" loading="lazy" onclick="window.GalleryApp.openLightbox(${imgIdx})" />`;
            masonry.appendChild(div);
        }

        // Section 5: Journey (100 images)
        const journeyWrapper = document.getElementById('journey-wrapper');
        const journeyCount = Math.min(100, this.totalImages - 391);
        for(let i = 0; i < journeyCount; i++) {
            const imgIdx = 391 + i;
            const img = document.createElement('img');
            img.className = 'journey-img';
            img.dataset.src = this.getLargeUrl(this.images[imgIdx]);
            img.loading = 'lazy';
            img.onclick = () => window.GalleryApp.openLightbox(imgIdx);
            journeyWrapper.appendChild(img);
        }

        // Section 6: Photo Wall Virtualization (Remaining images)
        this.initPhotoWallVirtualization(491);
        
        // Lazy load processor via IntersectionObserver
        this.initLazyLoading();
    }

    initLazyLoading() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    const img = entry.target;
                    if(img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    if(img.classList.contains('wall-img') || img.classList.contains('journey-img')) {
                        gsap.to(img, { opacity: 1, duration: 0.5 });
                    }
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '200px' });

        document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
        this.imgObserver = observer;
    }

    initPhotoWallVirtualization(startIndex) {
        if(startIndex >= this.totalImages) return;

        const wallGrid = document.getElementById('wall-grid');
        const remaining = this.totalImages - startIndex;
        
        // Batch append with DocumentFragment for performance
        const frag = document.createDocumentFragment();
        
        for(let i = 0; i < remaining; i++) {
            const imgIdx = startIndex + i;
            const img = document.createElement('img');
            img.className = 'wall-img';
            img.dataset.src = this.getThumbUrl(this.images[imgIdx]);
            img.loading = 'lazy'; // Let browser handle virtualization
            img.onclick = () => window.GalleryApp.openLightbox(imgIdx);
            frag.appendChild(img);
        }
        
        wallGrid.appendChild(frag);
    }

    initGSAP() {
        // Scroll Progress Bar
        gsap.to('#scroll-progress', {
            width: '100%',
            ease: 'none',
            scrollTrigger: { scrub: 0.3 }
        });

        // 1. Hero Parallax
        gsap.to('.hero-img', {
            yPercent: 20,
            ease: 'none',
            scrollTrigger: {
                trigger: '#s1-hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });
        gsap.to('.hero-text-overlay', {
            yPercent: -50,
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: '#s1-hero',
                start: 'top top',
                end: 'center top',
                scrub: true
            }
        });

        // 2. Filmstrip
        const track = document.getElementById('filmstrip-track');
        if (track && track.children.length > 0) {
            gsap.to(track, {
                x: () => -(track.scrollWidth - window.innerWidth),
                ease: "none",
                scrollTrigger: {
                    trigger: "#s2-filmstrip",
                    pin: ".filmstrip-pin",
                    scrub: 1,
                    start: "top top",
                    end: () => `+=${track.scrollWidth}`, // Scroll amount equals total width
                    invalidateOnRefresh: true
                }
            });
        }

        // 3. Stacked Cards
        const cards = gsap.utils.toArray('.stacked-card');
        if (cards.length > 0) {
            const stackTl = gsap.timeline({
                scrollTrigger: {
                    trigger: "#s3-stacked",
                    pin: ".stacked-container",
                    start: "top top",
                    end: `+=${cards.length * 600}`, // 600px scroll per card
                    scrub: 1
                }
            });

            cards.forEach((card, i) => {
                gsap.set(card, { rotationZ: i * 3 - 5, zIndex: cards.length - i });
                
                stackTl.to(card, {
                    yPercent: -150,
                    rotationZ: i * 8,
                    opacity: 0,
                    ease: "power1.inOut",
                    duration: 1
                }, i * 1); // Strictly sequential 1 second per card
            });
        }

        // 4. Editorial Stagger
        gsap.from('.masonry-item', {
            y: 50,
            opacity: 0,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: '#s4-editorial',
                start: 'top 80%',
                once: true
            }
        });

        // 5. Journey Crossfades
        const jImgs = gsap.utils.toArray('.journey-img');
        if (jImgs.length > 0) {
            const jTl = gsap.timeline({
                scrollTrigger: {
                    trigger: "#s5-journey",
                    pin: ".journey-pin",
                    start: "top top",
                    end: `+=${jImgs.length * 800}`, // 800px scroll per crossfade
                    scrub: 1
                }
            });

            jImgs.forEach((img, i) => {
                if (i === 0) {
                    gsap.set(img, { opacity: 1, scale: 1 });
                } else {
                    // Start next image fading in at time = i
                    jTl.to(img, { opacity: 1, scale: 1, duration: 1 }, i * 1)
                       .to(jImgs[i-1], { opacity: 0, scale: 1.1, duration: 1 }, `<`);
                }
            });
        }
    }

    // Navigation Updates
    setupNavigation() {
        const sections = gsap.utils.toArray('.gallery-section');
        const navLinks = document.querySelectorAll('.nav-link');

        sections.forEach((sec, i) => {
            ScrollTrigger.create({
                trigger: sec,
                start: 'top 50%',
                end: 'bottom 50%',
                onToggle: self => {
                    if(self.isActive) {
                        navLinks.forEach(l => l.classList.remove('active'));
                        if(navLinks[i]) navLinks[i].classList.add('active');
                    }
                }
            });
        });
    }

    // ---- LIGHTBOX VIEWER ----
    setupLightboxEvents() {
        document.getElementById('lb-close').onclick = () => this.closeLightbox();
        document.getElementById('lb-prev').onclick = () => this.navigateLightbox(-1);
        document.getElementById('lb-next').onclick = () => this.navigateLightbox(1);

        document.addEventListener('keydown', (e) => {
            if (!this.lightbox.classList.contains('hidden')) {
                if (e.key === 'Escape') this.closeLightbox();
                if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
                if (e.key === 'ArrowRight') this.navigateLightbox(1);
                if (e.key === 'd' || e.key === 'D') document.getElementById('lb-download').click();
            }
        });
    }

    openLightbox(index) {
        if(index < 0 || index >= this.totalImages) return;
        this.currentIndex = index;
        const imgObj = this.images[index];

        this.lbImg.src = this.getLargeUrl(imgObj);
        this.lbCounter.innerText = `${index + 1} / ${this.totalImages}`;
        this.lbFilename.innerText = imgObj.filename;
        
        // Direct download of the original via the endpoint mapping
        this.lbDownload.href = this.getOriginalUrl(imgObj);
        this.lbDownload.download = imgObj.filename;

        this.lightbox.classList.remove('hidden');
        gsap.fromTo(this.lightbox, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' });
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        gsap.to(this.lightbox, { opacity: 0, scale: 1.05, duration: 0.3, onComplete: () => {
            this.lightbox.classList.add('hidden');
            this.lbImg.src = '';
            document.body.style.overflow = 'auto';
        }});
    }

    navigateLightbox(dir) {
        let newIdx = this.currentIndex + dir;
        if (newIdx < 0) newIdx = this.totalImages - 1;
        if (newIdx >= this.totalImages) newIdx = 0;
        
        // Crossfade effect
        gsap.to(this.lbImg, { opacity: 0, duration: 0.15, onComplete: () => {
            this.openLightbox(newIdx);
            gsap.fromTo(this.lbImg, { opacity: 0 }, { opacity: 1, duration: 0.15 });
        }});
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.GalleryApp = new GalleryApp();
});
