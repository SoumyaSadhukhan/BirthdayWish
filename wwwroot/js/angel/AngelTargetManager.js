/**
 * AngelTargetManager.js
 * Converts HTML DOM element screen coordinates into Three.js 3D world space coordinates,
 * calculates target offsets, and coordinates element flying and pointing interactions.
 */
class AngelTargetManager {
    constructor(controller) {
        this.controller = controller;
        this.camera = controller.renderer.camera;
    }

    /**
     * Converts DOM Element bounding box screen center to Three.js 3D World Position
     */
    getThreePositionForElement(elementOrId, offsets = {}) {
        const elem = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
        if (!elem) {
            console.warn('AngelTargetManager: Element not found:', elementOrId);
            return new THREE.Vector3(0, 1, 0);
        }

        const rect = elem.getBoundingClientRect();
        
        // Target screen center + offsets
        const offsetX = offsets.offsetX || 80;
        const offsetY = offsets.offsetY || -20;
        const offsetZ = offsets.offsetZ || 0;

        const screenX = rect.left + rect.width / 2 + offsetX;
        const screenY = rect.top + rect.height / 2 + offsetY;

        // Convert screen pixel coordinates to Normalized Device Coordinates (-1 to +1)
        const ndcX = (screenX / window.innerWidth) * 2 - 1;
        const ndcY = -(screenY / window.innerHeight) * 2 + 1;

        // Unproject NDC coordinates into 3D camera frustum at distance Z
        const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
        vector.unproject(this.camera);

        const dir = vector.sub(this.camera.position).normalize();
        const distance = (0 - this.camera.position.z) / dir.z;
        const worldPos = this.camera.position.clone().add(dir.multiplyScalar(distance));

        worldPos.z += offsetZ;
        return worldPos;
    }

    flyToElement(elementOrId, options = {}) {
        const targetPos = this.getThreePositionForElement(elementOrId, options);
        this.controller.flight.flyTo(targetPos, options);
    }

    pointToElement(elementOrId, options = {}) {
        const targetPos = this.getThreePositionForElement(elementOrId, options);
        const originalOnComplete = options.onComplete;

        this.controller.flight.flyTo(targetPos, {
            duration: options.duration || 1800,
            onComplete: () => {
                this.controller.animator.play('Point');
                this.controller.setState('Pointing');

                if (options.speech) {
                    this.controller.dialogue.say(options.speech, options.speechOptions || {});
                }

                if (originalOnComplete) {
                    originalOnComplete();
                }
            }
        });
    }
}
window.AngelTargetManager = AngelTargetManager;
