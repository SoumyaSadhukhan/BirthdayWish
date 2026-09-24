/**
 * AngelFlight.js
 * Manages 3D CatmullRomCurve3 path generation, smooth curve flight, lerped rotations,
 * vertical bobbing physics, and flight state transitions.
 */
class AngelFlight {
    constructor(controller) {
        this.controller = controller;
        this.modelGroup = controller.renderer.modelGroup;

        this.isFlying = false;
        this.flightCurve = null;
        this.flightStartTime = 0;
        this.flightDuration = 2000; // ms
        this.onFlightComplete = null;

        // Bobbing & Drift physics
        this.bobbingFrequency = 2.0;
        this.bobbingAmplitude = 0.05;
        this.basePosition = new THREE.Vector3(0, 1, 0);

        // Rotation Lerp speed
        this.targetRotationY = 0;
    }

    getSafeWorldPosition(targetPos) {
        if (!this.controller.renderer || !this.controller.renderer.camera) return targetPos;
        
        // Ensure it's a THREE.Vector3, as plain objects might be passed in
        const vectorPos = (targetPos instanceof THREE.Vector3) ? targetPos : new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
        
        const camera = this.controller.renderer.camera;
        const projected = vectorPos.clone().project(camera);
        const screenX = (projected.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-(projected.y * 0.5) + 0.5) * window.innerHeight;

        const isMobile = window.innerWidth <= 650;
        const pad = isMobile ? 60 : 100; // Pixel padding from screen edge
        
        const clampedX = Math.max(pad, Math.min(window.innerWidth - pad, screenX));
        const clampedY = Math.max(pad, Math.min(window.innerHeight - pad, screenY));

        const ndcX = (clampedX / window.innerWidth) * 2 - 1;
        const ndcY = -(clampedY / window.innerHeight) * 2 + 1;
        
        const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
        vector.unproject(camera);
        
        const dir = vector.sub(camera.position).normalize();
        const distance = (vectorPos.z - camera.position.z) / dir.z; 
        
        return camera.position.clone().add(dir.multiplyScalar(distance));
    }

    flyTo(rawTargetPos, options = {}) {
        const targetPos = this.getSafeWorldPosition(rawTargetPos);
        const startPos = this.modelGroup.position.clone();
        const duration = options.duration || 2000;

        // Calculate random intermediate arc control point for realistic curved path
        const midX = (startPos.x + targetPos.x) / 2 + (Math.random() - 0.5) * 1.0;
        const midY = (startPos.y + targetPos.y) / 2 + (Math.random() > 0.5 ? 0.6 : -0.4);
        const midZ = (startPos.z + targetPos.z) / 2 + (Math.random() - 0.5) * 0.5;

        const controlPoints = [
            startPos,
            new THREE.Vector3(midX, midY, midZ),
            new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
        ];

        this.flightCurve = new THREE.CatmullRomCurve3(controlPoints);
        this.flightStartTime = performance.now();
        this.flightDuration = duration;
        this.onFlightComplete = options.onComplete || null;

        this.isFlying = true;
        this.controller.animator.play('Fly');
        this.controller.setState('Flying');
    }

    update() {
        const time = performance.now();

        if (this.isFlying && this.flightCurve) {
            const elapsed = time - this.flightStartTime;
            let progress = elapsed / this.flightDuration;

            if (progress >= 1.0) {
                progress = 1.0;
                this.isFlying = false;

                // Set final position
                const finalPoint = this.flightCurve.getPointAt(1.0);
                this.basePosition.copy(finalPoint);
                this.modelGroup.position.copy(finalPoint);

                this.controller.animator.play('Hover');
                this.controller.setState('Hovering');

                if (this.onFlightComplete) {
                    const callback = this.onFlightComplete;
                    this.onFlightComplete = null;
                    callback();
                }
            } else {
                // Smooth Easing (cubic in-out)
                const easedProgress = progress < 0.5 
                    ? 4 * progress * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                const point = this.flightCurve.getPointAt(easedProgress);
                const tangent = this.flightCurve.getTangentAt(easedProgress).normalize();

                // Move model
                this.basePosition.copy(point);
                this.modelGroup.position.copy(point);

                // Always face the user (camera)
                this.targetRotationY = 0;
            }
        } else {
            // Idle / Hovering vertical bobbing physics
            const sec = time * 0.001;
            const bobY = Math.sin(sec * this.bobbingFrequency) * this.bobbingAmplitude;
            const driftX = Math.cos(sec * (this.bobbingFrequency * 0.6)) * (this.bobbingAmplitude * 0.4);

            this.modelGroup.position.x = this.basePosition.x + driftX;
            this.modelGroup.position.y = this.basePosition.y + bobY;
        }

        // Smoothly lerp Y rotation toward flight vector angle
        this.modelGroup.rotation.y += (this.targetRotationY - this.modelGroup.rotation.y) * 0.08;
    }
}
window.AngelFlight = AngelFlight;
