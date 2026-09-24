/**
 * AngelController.js
 * Main Orchestrator & State Machine for the 3D Angel Guide.
 * Manages states: Idle, Flying, Hovering, Talking, Pointing, Following, TakingOff, Landing, Hidden.
 */

// Angel State Machine Constants
const AngelState = {
    Idle: 'Idle',
    Flying: 'Flying',
    Hovering: 'Hovering',
    Talking: 'Talking',
    Pointing: 'Pointing',
    Following: 'Following',
    TakingOff: 'TakingOff',
    Landing: 'Landing',
    Hidden: 'Hidden'
};

class AngelController {
    constructor(config = {}) {
        // Merge configuration
        this.config = Object.assign({
            enabled: true,
            modelUrl: '/models/angel/angel.glb',
            initialPosition: { x: 0, y: 1, z: 0 },
            scale: 1.0,
            mobileScale: 0.7,
            shadowEnabled: true,
            dialogueEnabled: true
        }, window.AngelConfig || {}, config);

        // State
        this.state = AngelState.Idle;
        this.isInitialized = false;

        // Submodules
        this.renderer = null;
        this.animator = null;
        this.flight = null;
        this.targetManager = null;
        this.dialogue = null;
        this.pageBehavior = null;
        this.interaction = null;

        if (this.config.enabled && !document.body.hasAttribute('data-angel-disabled')) {
            this.init();
        } else {
            console.log('3D Angel Guide is disabled via config or data-angel-disabled attribute.');
        }
    }

    init() {
        if (this.isInitialized) return;

        // 1. Renderer
        this.renderer = new AngelRenderer(this.config);

        // 2. Animator
        this.animator = new AngelAnimator(this.renderer);

        // 3. Flight System
        this.flight = new AngelFlight(this);

        // 4. Target Manager
        this.targetManager = new AngelTargetManager(this);

        // 5. Dialogue System
        this.dialogue = new AngelDialogue(this);

        // 6. Page Behavior
        this.pageBehavior = new AngelPageBehavior(this);

        // 7. Interaction
        this.interaction = new AngelInteraction(this);

        this.isInitialized = true;

        // Main animation loop
        this.startLoop();

        // Start page sequence
        this.pageBehavior.startPageSequence();

        // Start random background roaming
        this.initRoaming();
    }

    initRoaming() {
        const standingTime = (this.config.standingTimeSec || 5) * 1000;
        const flightSpeed = this.config.flySpeed || 3.0; // World units per second

        setInterval(() => {
            if (this.config.roamingEnabled !== false && !this.config.fixedPosition && this.state === AngelState.Hovering && !this.dialogue.isVisible) {
                const camera = this.renderer.camera;
                
                // Pick random NDC screen coordinates inside safe viewing area
                const randomNdcX = (Math.random() - 0.5) * 1.3; // -0.65 to +0.65
                const randomNdcY = (Math.random() - 0.5) * 1.1; // -0.55 to +0.55
                
                const vector = new THREE.Vector3(randomNdcX, randomNdcY, 0.5);
                vector.unproject(camera);
                
                const dir = vector.sub(camera.position).normalize();
                const distanceZ = (0 - camera.position.z) / dir.z; 
                let targetPos = camera.position.clone().add(dir.multiplyScalar(distanceZ));
                
                targetPos = this.flight.getSafeWorldPosition(targetPos);
                
                const currentPos = this.renderer.modelGroup.position;
                const dist = currentPos.distanceTo(targetPos);
                
                if (dist > 0.6) {
                    const durationMs = Math.max(1500, (dist / flightSpeed) * 1000);
                    this.flight.flyTo(targetPos, { duration: durationMs });
                }
            }
        }, standingTime);
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;
    }

    // Public API Methods
    say(text, options = {}) {
        if (this.dialogue) {
            this.dialogue.say(text, options);
        }
    }

    triggerStandingPopup() {
        if (!this.dialogue) return;
        const standingMsg = this.getCurrentPageStandingMessage();
        const durationMs = (this.config.standingTimeSec || 5.0) * 1000;
        this.dialogue.say(standingMsg, { duration: durationMs });
    }

    getCurrentPageStandingMessage() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('wish')) {
            return "Happy Birthday Piu! Today is all about you! 🎂✨";
        } else if (path.includes('cake')) {
            return "Make a wish and blow out the candle! 🕯️✨";
        } else if (path.includes('gift')) {
            return "Tap the gift box to open your birthday surprises! 🎁✨";
        } else {
            const phrases = [
                "Shh... magical surprises await you! ✨",
                "I'm right here celebrating with you! 🎉",
                "Wishing you the happiest birthday ever! 💖",
                "Tap around to explore your special day! 🌟"
            ];
            const randomIdx = Math.floor(Math.random() * phrases.length);
            return phrases[randomIdx];
        }
    }

    flyTo(targetPos, options = {}) {
        if (this.flight) {
            this.flight.flyTo(targetPos, options);
        }
    }

    flyToElement(elementOrId, options = {}) {
        if (this.targetManager) {
            this.targetManager.flyToElement(elementOrId, options);
        }
    }

    pointToElement(elementOrId, options = {}) {
        if (this.targetManager) {
            this.targetManager.pointToElement(elementOrId, options);
        }
    }

    wave() {
        if (this.animator) {
            this.animator.play('Wave');
        }
    }

    startLoop() {
        const loop = () => {
            if (!this.isInitialized) return;

            // Update submodules
            const delta = this.renderer.clock.getDelta();
            this.animator.update(delta);
            this.flight.update();
            this.dialogue.update();
            this.interaction.update();

            // Render scene
            this.renderer.render(delta);

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

window.AngelState = AngelState;
window.AngelController = AngelController;

// Auto-instantiate global controller instance if config exists
document.addEventListener('DOMContentLoaded', () => {
    if (window.AngelConfig && window.AngelConfig.enabled !== false && !window.angelController) {
        window.angelController = new AngelController(window.AngelConfig);
    }
});
