/**
 * AngelPageBehavior.js
 * Encapsulates ASP.NET Core page-specific behaviors, onboarding flows,
 * and page navigation triggers without cluttering AngelController.js.
 */
class AngelPageBehavior {
    constructor(controller) {
        this.controller = controller;
        this.path = window.location.pathname.toLowerCase();
        this.demoRun = false;
    }

    startPageSequence() {
        if (this.demoRun) return;
        this.demoRun = true;

        // Check if initial intro greeting has already been shown once
        if (sessionStorage.getItem('angel_intro_shown')) {
            // Already shown once -> Skip intro greeting completely
            return;
        }

        // Mark as shown so it never displays again
        sessionStorage.setItem('angel_intro_shown', 'true');

        setTimeout(() => {
            this.runDemoSequence();
        }, 800);
    }

    runDemoSequence() {
        // 1. Initial entrance from top-right outside viewport
        const startPos = { x: 6, y: 3.5, z: -1 };
        
        // Settle near top-right (approx 75% width, 30% height from top)
        const hoverPos = { x: 3.2, y: 1.5, z: 0 };

        this.controller.renderer.modelGroup.position.set(startPos.x, startPos.y, startPos.z);

        // 2. Fly in a curved path to hover position
        this.controller.flight.flyTo(hoverPos, {
            duration: 2200,
            onComplete: () => {
                // 3. Play Wave & trigger current step speech popup
                this.controller.animator.play('Wave');
                this.controller.triggerStandingPopup();
            }
        });
    }
}
window.AngelPageBehavior = AngelPageBehavior;
