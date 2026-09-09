// site.js - Main State Machine Controller

const STATES = Object.freeze({
    LOADING: "LOADING",
    WELCOME: "WELCOME",
    COUNTDOWN: "COUNTDOWN",
    PARTY: "PARTY",
    CAKE: "CAKE",
    CELEBRATION: "CELEBRATION",
    VOICE: "VOICE",
    GIFT: "GIFT",
    SURPRISES: "SURPRISES",
    FINAL: "FINAL",
    COMPLETE: "COMPLETE"
});

class AppController {
    constructor() {
        this.currentState = null;
        this.data = JSON.parse(document.getElementById('birthday-data').textContent);
        
        // Modules will attach themselves here
        this.modules = {};

        this.init();
    }

    init() {
        console.log("Initializing Birthday App...");
        
        // Listen for module events
        document.addEventListener("birthday:cake-complete", () => this.transitionTo(STATES.CELEBRATION));
        document.addEventListener("birthday:voice-complete", () => this.transitionTo(STATES.GIFT));
        document.addEventListener("birthday:gift-opened", () => this.transitionTo(STATES.SURPRISES));
        document.addEventListener("birthday:final-reached", () => this.transitionTo(STATES.FINAL));

        // Start loading
        this.transitionTo(STATES.LOADING);

        // Simulate asset loading (audio, images are lazy/preload handled by modules)
        setTimeout(() => {
            if (this.data.config.countdown.enabled) {
                const bdDate = new Date(this.data.config.birthdayDateIso);
                if (new Date() < bdDate) {
                    this.transitionTo(STATES.COUNTDOWN);
                } else {
                    this.transitionTo(STATES.WELCOME);
                }
            } else {
                this.transitionTo(STATES.WELCOME);
            }
        }, 1500); // Minimum loading screen time
    }

    registerModule(name, moduleObj) {
        this.modules[name] = moduleObj;
    }

    hideAllStates() {
        document.querySelectorAll('.state-section').forEach(el => {
            el.classList.remove('active');
            gsap.set(el, { opacity: 0, pointerEvents: 'none' });
        });
    }

    showStateElement(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('active');
            gsap.to(el, { opacity: 1, duration: 1, pointerEvents: 'auto' });
        }
    }

    transitionTo(state) {
        console.log(`Transitioning to ${state}`);
        this.currentState = state;

        if(state !== STATES.CAKE && state !== STATES.CELEBRATION && state !== STATES.VOICE && state !== STATES.GIFT && state !== STATES.SURPRISES) {
            this.hideAllStates();
        }

        switch (state) {
            case STATES.LOADING:
                this.showStateElement('state-loading');
                break;
            case STATES.WELCOME:
                this.showStateElement('state-welcome');
                document.querySelector('.welcome-title').innerText = this.data.config.welcome.title;
                document.querySelector('.welcome-message').innerText = this.data.config.welcome.message;
                
                document.getElementById('btn-enter').onclick = () => {
                    // First interaction unlocks audio
                    if (window.SoundManager) window.SoundManager.unlockAudio();
                    this.transitionTo(STATES.PARTY);
                };
                break;
            case STATES.COUNTDOWN:
                this.showStateElement('state-countdown');
                document.querySelector('.countdown-title').innerText = this.data.config.countdown.beforeTitle;
                this.startCountdown();
                break;
            case STATES.PARTY:
                this.showStateElement('state-party');
                if (window.BirthdayRoom) window.BirthdayRoom.startAmbient();
                if (window.SoundManager) window.SoundManager.playMusic();
                
                // Proceed to cake
                setTimeout(() => this.transitionTo(STATES.CAKE), 2000);
                break;
            case STATES.CAKE:
                this.updateProgress('cake');
                document.getElementById('cake-container').classList.remove('hidden');
                document.getElementById('cake-title').innerText = this.data.config.cake.title;
                gsap.fromTo('#cake-container', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.7)' });
                if (window.CakeManager) window.CakeManager.init();
                break;
            case STATES.CELEBRATION:
                document.getElementById('cake-container').classList.add('hidden');
                document.getElementById('celebration-text').classList.remove('hidden');
                document.getElementById('celeb-name').innerText = this.data.config.name;
                gsap.fromTo('#celebration-text', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.3)' });
                if (window.ParticleManager) window.ParticleManager.confetti();
                
                setTimeout(() => {
                    gsap.to('#celebration-text', { scale: 1.5, opacity: 0, duration: 1, onComplete: () => {
                        document.getElementById('celebration-text').classList.add('hidden');
                        if (this.data.config.birthdayVoice.enabled && this.data.audio.birthdayVoice.length > 0) {
                            this.transitionTo(STATES.VOICE);
                        } else {
                            this.transitionTo(STATES.GIFT);
                        }
                    }});
                }, 4000);
                break;
            case STATES.VOICE:
                document.getElementById('voice-container').classList.remove('hidden');
                gsap.fromTo('#voice-container', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1 });
                
                document.getElementById('btn-play-voice').onclick = () => {
                    if (window.SoundManager) window.SoundManager.playVoice(this.data.audio.birthdayVoice[0]);
                    document.getElementById('btn-play-voice').classList.add('hidden');
                    document.getElementById('voice-visualizer').classList.remove('hidden');
                    // visualizer animation
                    gsap.to('.bar', { height: '100%', duration: 0.5, stagger: 0.1, yoyo: true, repeat: -1 });
                };
                break;
            case STATES.GIFT:
                this.updateProgress('gift');
                document.getElementById('voice-container').classList.add('hidden');
                document.getElementById('gift-container').classList.remove('hidden');
                document.getElementById('gift-title').innerText = this.data.config.gifts.title;
                gsap.fromTo('#gift-container', { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'back.out(1.5)' });
                if (window.GiftsManager) window.GiftsManager.init();
                break;
            case STATES.SURPRISES:
                this.updateProgress('surprises');
                document.getElementById('gift-container').classList.add('hidden');
                document.getElementById('surprises-grid').classList.remove('hidden');
                if (window.GiftsManager) window.GiftsManager.populateSurprises();
                break;
            case STATES.FINAL:
                this.updateProgress('final');
                this.hideAllStates();
                this.showStateElement('state-final');
                document.getElementById('final-title').innerText = this.data.config.finalMessage.title;
                document.getElementById('final-message').innerText = this.data.config.finalMessage.message;
                
                if (this.data.images.final && this.data.images.final.length > 0) {
                    const img = document.createElement('img');
                    img.src = this.data.images.final[0];
                    document.getElementById('final-image-wrapper').appendChild(img);
                }

                gsap.fromTo('.final-content', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 2, ease: 'power2.out' });
                
                document.getElementById('btn-replay').onclick = () => this.replay();
                break;
        }
    }

    startCountdown() {
        const bdDate = new Date(this.data.config.birthdayDateIso).getTime();
        
        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = bdDate - now;

            if (distance < 0) {
                clearInterval(this.interval);
                document.querySelector('.countdown-title').innerText = this.data.config.countdown.birthdayTitle;
                document.getElementById('btn-skip-countdown').classList.remove('hidden');
                document.getElementById('btn-skip-countdown').onclick = () => this.transitionTo(STATES.WELCOME);
                if (window.ParticleManager) window.ParticleManager.confetti();
                return;
            }

            document.getElementById('cd-days').innerText = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
            document.getElementById('cd-hours').innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
            document.getElementById('cd-minutes').innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
            document.getElementById('cd-seconds').innerText = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');
        };

        updateTimer();
        this.interval = setInterval(updateTimer, 1000);
        
        // Fallback skip button
        setTimeout(() => {
            document.getElementById('btn-skip-countdown').classList.remove('hidden');
            document.getElementById('btn-skip-countdown').onclick = () => this.transitionTo(STATES.WELCOME);
        }, 5000);
    }

    updateProgress(stage) {
        document.querySelectorAll('.prog-item').forEach(el => {
            if (el.dataset.stage === stage) {
                el.classList.add('active');
            }
        });
    }

    replay() {
        location.reload(); // Cleanest way to reset everything for now
    }
}

// Initialize on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    window.App = new AppController();
});
