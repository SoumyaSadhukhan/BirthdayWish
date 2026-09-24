/**
 * AngelFlight.js
 * Manages 3D CatmullRomCurve3 path generation, smooth curve flight, lerped rotations,
 * flight direction orientation, animated takeoff and landing transitions,
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

        // Takeoff rotation transition
        this.takeoffDuration = (this.controller.config.takeoffTransitionTimeSec || 0.5) * 1000; // ms
        this.takeoffStartQuat = new THREE.Quaternion();
        this.takeoffTargetQuat = new THREE.Quaternion();

        // Landing rotation transition
        this.isLandingTransition = false;
        this.landingStartTime = 0;
        this.landingDuration = (this.controller.config.landingTransitionTimeSec || 0.7) * 1000; // ms
        this.startQuat = new THREE.Quaternion();
        this.targetQuat = new THREE.Quaternion();

        // Bobbing & Drift physics
        this.bobbingFrequency = 2.0;
        this.bobbingAmplitude = 0.05;
        this.basePosition = new THREE.Vector3(0, 1, 0);

        // Snap to initial position on startup
        setTimeout(() => this.setPermanentHomePosition(), 100);
    }

    setPermanentHomePosition() {
        const camera = this.controller.renderer.camera;
        if (!camera) return;
        
        // Bottom Right Corner
        const ndcX = 0.75; 
        const ndcY = -0.75;
        const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distanceZ = (0 - camera.position.z) / dir.z; 
        let homePos = camera.position.clone().add(dir.multiplyScalar(distanceZ));
        
        homePos = this.getSafeWorldPosition(homePos);
        
        this.basePosition.copy(homePos);
        this.modelGroup.position.copy(homePos);
    }

    getSafeWorldPosition(targetPos) {
        if (!this.controller.renderer || !this.controller.renderer.camera) return targetPos;
        
        const vectorPos = (targetPos instanceof THREE.Vector3) ? targetPos : new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
        const camera = this.controller.renderer.camera;
        const projected = vectorPos.clone().project(camera);
        const screenX = (projected.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-(projected.y * 0.5) + 0.5) * window.innerHeight;

        const isMobile = window.innerWidth <= 650;
        
        // 90vw * 90vh Centered Invisible Box Edges (5vw to 95vw, 5vh to 95vh)
        const boxMinX = window.innerWidth * 0.05;
        const boxMaxX = window.innerWidth * 0.95;
        const boxMinY = window.innerHeight * 0.05;
        const boxMaxY = window.innerHeight * 0.95;

        // Internal Bird Radius Clearance to guarantee 0.0001% of bird never leaves 90vw * 90vh box
        const padX = isMobile ? 40 : 95;
        const padY = isMobile ? 35 : 75;

        const clampedX = Math.max(boxMinX + padX, Math.min(boxMaxX - padX, screenX));
        const clampedY = Math.max(boxMinY + padY, Math.min(boxMaxY - padY, screenY));

        const ndcX = (clampedX / window.innerWidth) * 2 - 1;
        const ndcY = -(clampedY / window.innerHeight) * 2 + 1;
        
        const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
        vector.unproject(camera);
        
        const dir = vector.sub(camera.position).normalize();
        const distance = (vectorPos.z - camera.position.z) / dir.z; 
        
        return camera.position.clone().add(dir.multiplyScalar(distance));
    }

    flyTo(rawTargetPos, options = {}) {
        if (this.controller.config.fixedPosition) {
            if (options.onComplete) options.onComplete();
            return;
        }

        // Hide speech bubble during flight
        if (this.controller.dialogue) {
            this.controller.dialogue.hide();
        }

        const targetPos = this.getSafeWorldPosition(rawTargetPos);
        const startPos = this.modelGroup.position.clone();

        if (startPos.distanceTo(targetPos) < 0.2) {
            if (options.onComplete) options.onComplete();
            return;
        }

        // Curved arc upward in flight direction
        const dist = startPos.distanceTo(targetPos);
        const midPos = startPos.clone().lerp(targetPos, 0.5);
        midPos.y += Math.min(1.5, Math.max(0.4, dist * 0.3));

        this.flightCurve = new THREE.CatmullRomCurve3([startPos, midPos, targetPos]);
        this.flightStartTime = performance.now();
        
        // Calculate flight duration based on flyTimePerUnitSec (sec per unit distance)
        const timePerUnitSec = (this.controller.config.flyTimePerUnitSec !== undefined) 
            ? this.controller.config.flyTimePerUnitSec 
            : 1.0;
        this.flightDuration = options.duration || Math.max(1200, dist * timePerUnitSec * 1000);
        
        this.takeoffDuration = (this.controller.config.takeoffTransitionTimeSec !== undefined ? this.controller.config.takeoffTransitionTimeSec : 0.5) * 1000;
        this.landingDuration = (this.controller.config.landingTransitionTimeSec !== undefined ? this.controller.config.landingTransitionTimeSec : 0.7) * 1000;

        this.onFlightComplete = options.onComplete || null;

        // Takeoff animated rotation transition setup
        this.takeoffStartQuat.copy(this.modelGroup.quaternion);

        // Get initial flight vector angle (tangent at progress 0)
        const startTangent = this.flightCurve.getTangentAt(0).normalize();
        const lookPoint = startPos.clone().add(startTangent);
        
        const dummyObj = new THREE.Object3D();
        dummyObj.position.copy(startPos);
        dummyObj.lookAt(lookPoint);
        this.takeoffTargetQuat.copy(dummyObj.quaternion);

        this.isFlying = true;
        this.isLandingTransition = false;

        // Cross-fade animation to flight
        this.controller.animator.play('Fly', 0.5);
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

                const finalPoint = this.flightCurve.getPointAt(1.0);
                this.basePosition.copy(finalPoint);
                this.modelGroup.position.copy(finalPoint);

                // Save starting orientation (flight vector orientation)
                this.startQuat.copy(this.modelGroup.quaternion);

                // Calculate target orientation (facing user camera)
                if (this.controller.renderer && this.controller.renderer.camera) {
                    const dummyObj = new THREE.Object3D();
                    dummyObj.position.copy(this.modelGroup.position);
                    dummyObj.lookAt(this.controller.renderer.camera.position);
                    this.targetQuat.copy(dummyObj.quaternion);
                } else {
                    this.targetQuat.copy(this.startQuat);
                }

                // Trigger smooth animated landing turn
                this.isLandingTransition = true;
                this.landingStartTime = time;

                this.controller.animator.play('Hover', 0.8);
                this.controller.setState('Hovering');

                // Trigger Text Popup when landing at target standing position!
                if (this.controller.triggerStandingPopup) {
                    this.controller.triggerStandingPopup();
                }

                if (this.onFlightComplete) {
                    const callback = this.onFlightComplete;
                    this.onFlightComplete = null;
                    callback();
                }
            } else {
                // Smooth easing along flight curve
                const easedProgress = progress < 0.5 
                    ? 4 * progress * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                const point = this.flightCurve.getPointAt(easedProgress);
                const tangent = this.flightCurve.getTangentAt(easedProgress).normalize();

                this.basePosition.copy(point);
                this.modelGroup.position.copy(point);

                // Takeoff Slerp Transition vs In-Flight Tracking
                if (elapsed < this.takeoffDuration) {
                    const takeoffProgress = elapsed / this.takeoffDuration;
                    const easedTP = takeoffProgress < 0.5
                        ? 4 * takeoffProgress * takeoffProgress * takeoffProgress
                        : 1 - Math.pow(-2 * takeoffProgress + 2, 3) / 2;
                    this.modelGroup.quaternion.slerpQuaternions(this.takeoffStartQuat, this.takeoffTargetQuat, easedTP);
                } else {
                    // Align bird body directly in the direction of flight movement
                    const lookPoint = point.clone().add(tangent);
                    this.modelGroup.lookAt(lookPoint);
                }
            }
        } else if (this.isLandingTransition) {
            const landingElapsed = time - this.landingStartTime;
            let landingProgress = landingElapsed / this.landingDuration;

            if (landingProgress >= 1.0) {
                landingProgress = 1.0;
                this.isLandingTransition = false;
            }

            // Smooth cubic easing for arrival turn
            const easedLP = landingProgress < 0.5 
                ? 4 * landingProgress * landingProgress * landingProgress 
                : 1 - Math.pow(-2 * landingProgress + 2, 3) / 2;

            // Smoothly slerp body rotation from flight angle to camera facing angle
            this.modelGroup.quaternion.slerpQuaternions(this.startQuat, this.targetQuat, easedLP);

            // Gentle vertical bobbing physics during arrival
            const sec = time * 0.001;
            const bobY = Math.sin(sec * this.bobbingFrequency) * this.bobbingAmplitude;
            this.modelGroup.position.y = this.basePosition.y + bobY;
        } else {
            // Hovering vertical bobbing physics
            const sec = time * 0.001;
            const bobY = Math.sin(sec * this.bobbingFrequency) * this.bobbingAmplitude;
            const driftX = Math.cos(sec * (this.bobbingFrequency * 0.6)) * (this.bobbingAmplitude * 0.4);

            this.modelGroup.position.x = this.basePosition.x + driftX;
            this.modelGroup.position.y = this.basePosition.y + bobY;

            // Turn to face the user's face (camera) while hovering
            if (this.controller.renderer && this.controller.renderer.camera) {
                this.modelGroup.lookAt(this.controller.renderer.camera.position);
            }
        }
    }
}
window.AngelFlight = AngelFlight;
