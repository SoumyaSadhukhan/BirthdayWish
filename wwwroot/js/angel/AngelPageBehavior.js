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
                // 3. Play Wave & Display Greeting
                this.controller.animator.play('Wave');
                this.controller.dialogue.say("Hi! I'm your guide. Welcome! ✨", { duration: 4000 });

                // 4. After 3.5s, fly to demo target element (#angel-demo-target or page action target)
                setTimeout(() => {
                    const demoElem = document.getElementById('angel-demo-target') || 
                                     document.getElementById('action-container') || 
                                     document.getElementById('countdown-timer') ||
                                     document.getElementById('the-cake') ||
                                     document.getElementById('the-gift-box');

                    if (demoElem && demoElem.id) {
                        this.controller.pointToElement(demoElem.id, {
                            offsetX: 100,
                            offsetY: -30,
                            duration: 2000,
                            speech: "Let me show you this magical section! ✨",
                            speechOptions: { duration: 4000 }
                        });
                    }
                }, 3800);
            }
        });
    }
}
window.AngelPageBehavior = AngelPageBehavior;
