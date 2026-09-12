document.addEventListener('DOMContentLoaded', async () => {
    const rack = document.getElementById('disk-rack');
    const bg = document.getElementById('ambient-bg');
    const countDisplay = document.getElementById('img-count');
    
    let images = [];
    
    try {
        const res = await fetch('/api/gallery');
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        
        // Take up to 400 images
        images = data.images.slice(0, 100);
        countDisplay.innerText = `${images.length} Disks`;
        
        buildRack(images);
    } catch (e) {
        console.error(e);
        countDisplay.innerText = "Error loading disks";
    }

    function buildRack(imgs) {
        const frag = document.createDocumentFragment();
        
        imgs.forEach((imgObj, idx) => {
            const container = document.createElement('div');
            container.className = 'disk-container';
            
            const disk = document.createElement('div');
            disk.className = 'disk';
            
            const img = document.createElement('img');
            // Using a low-res thumbnail to prevent 400 images crashing the browser
            img.dataset.src = `${imgObj.url}?width=400`;
            img.dataset.largeSrc = `${imgObj.url}?width=1600`;
            img.loading = 'lazy';
            img.alt = `Disk ${idx}`;
            
            disk.appendChild(img);
            container.appendChild(disk);
            
            // Hover logic to load high-res and change ambient background
            container.addEventListener('mouseenter', () => {
                if(img.src !== img.dataset.largeSrc) {
                    img.src = img.dataset.largeSrc; // Swap to high-res when inspecting
                }
                bg.style.backgroundImage = `url('${img.dataset.largeSrc}')`;
            });
            
            frag.appendChild(container);
        });
        
        rack.appendChild(frag);
        initLazyLoading();
    }
    
    function initLazyLoading() {
        // Load thumbnails when they come near the viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    const img = entry.target;
                    if(img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '500px 0px', threshold: 0.1 });

        document.querySelectorAll('.disk img').forEach(img => observer.observe(img));
    }
    
    // Optional: Allow mouse wheel to scroll horizontally across the rack
    const rackWrapper = document.querySelector('.rack-wrapper');
    rackWrapper.addEventListener('wheel', (evt) => {
        if(evt.deltaY !== 0) {
            evt.preventDefault();
            rackWrapper.scrollLeft += evt.deltaY * 2;
        }
    });
});
