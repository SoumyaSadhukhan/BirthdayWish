/**
 * AngelInteraction.js
 * Manages throttled window scroll events and subtle mouse cursor tracking
 * without interfering with normal website interaction or button clicks.
 */
class AngelInteraction {
    constructor(controller) {
        this.controller = controller;
        this.camera = controller.renderer.camera;
        this.modelGroup = controller.renderer.modelGroup;

        this.mouse = new THREE.Vector2(0, 0);
        this.targetMouseRotation = new THREE.Vector2(0, 0);

        this.lastScrollY = window.scrollY;
        this.scrollTicking = false;

        this.init();
    }

    init() {
        // Subtle mouse tracking
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            // Subtle rotation offset toward cursor (max 15 degrees)
            this.targetMouseRotation.x = this.mouse.y * 0.15;
            this.targetMouseRotation.y = this.mouse.x * 0.25;
        });

        // Throttled scroll handling
        window.addEventListener('scroll', () => {
            if (!this.scrollTicking) {
                window.requestAnimationFrame(() => {
                    this.onScroll();
                    this.scrollTicking = false;
                });
                this.scrollTicking = true;
            }
        });
    }

    onScroll() {
        const deltaY = window.scrollY - this.lastScrollY;
        this.lastScrollY = window.scrollY;

        if (Math.abs(deltaY) > 50 && !this.controller.flight.isFlying) {
            // Gently drift Angel position on scroll
            const currentY = this.controller.flight.basePosition.y;
            this.controller.flight.basePosition.y = currentY - (deltaY * 0.003);
        }
    }

    update() {
        if (!this.controller.flight.isFlying && this.modelGroup) {
            // Apply subtle mouse tracking rotation offset
            this.modelGroup.rotation.x += (this.targetMouseRotation.x - this.modelGroup.rotation.x) * 0.05;
        }
    }
}
window.AngelInteraction = AngelInteraction;
