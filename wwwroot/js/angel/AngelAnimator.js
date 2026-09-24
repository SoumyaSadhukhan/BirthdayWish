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

        // Safe Fallback Logic if requested animation clip does not exist
        if (!targetAction) {
            if (clipName === 'Fly' || clipName === 'Hover' || clipName === 'TakeOff') {
                targetAction = this.actions['Idle'] || this.actions['Hover'];
            } else if (clipName === 'Talk' || clipName === 'Point') {
                targetAction = this.actions['Wave'] || this.actions['Idle'];
            } else {
                targetAction = this.actions['Idle'] || Object.values(this.actions)[0];
            }
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
