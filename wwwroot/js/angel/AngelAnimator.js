/**
 * AngelAnimator.js
 * Manages Three.js AnimationMixer, state transitions, action blending,
 * and safe fallback logic for missing model animations.
 */
class AngelAnimator {
    constructor(renderer) {
        this.renderer = renderer;
        this.mixer = null;
        this.actions = {};
        this.currentAction = null;
        this.currentClipName = 'Idle';

        // Known animation clip aliases
        this.clipNames = ['Idle', 'Fly', 'Hover', 'Wave', 'Point', 'Talk', 'TakeOff', 'Land'];

        this.init();
    }

    init() {
        this.renderer.onModelLoaded = (gltf) => {
            if (gltf.animations && gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(gltf.scene);
                gltf.animations.forEach((clip) => {
                    const action = this.mixer.clipAction(clip);
                    this.actions[clip.name] = action;
                });
                console.log('Available GLB animations:', Object.keys(this.actions));
                this.play('Idle');
            }
        };
    }

    play(clipName, duration = 0.5) {
        if (!this.mixer || Object.keys(this.actions).length === 0) {
            // Procedural animation active; fallback silently
            this.currentClipName = clipName;
            return;
        }

        let targetAction = this.actions[clipName];

        // Case-insensitive / partial match check
        if (!targetAction) {
            const lowerReq = clipName.toLowerCase();
            const matchingKey = Object.keys(this.actions).find(k => {
                const lowerK = k.toLowerCase();
                return lowerK.includes(lowerReq) || (lowerReq === 'idle' && (lowerK.includes('fly') || lowerK.includes('hover')));
            });
            if (matchingKey) {
                targetAction = this.actions[matchingKey];
            }
        }

        // Safe Fallback Logic if requested animation clip does not exist
        if (!targetAction) {
            targetAction = this.actions['02-flying'] || this.actions['01-flip'] || Object.values(this.actions)[0];
        }

        if (!targetAction) return;

        if (this.currentAction !== targetAction) {
            if (this.currentAction) {
                this.currentAction.fadeOut(duration);
            }
            targetAction.reset().fadeIn(duration).play();
            this.currentAction = targetAction;
            this.currentClipName = clipName;
        }
    }

    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }
}
window.AngelAnimator = AngelAnimator;
