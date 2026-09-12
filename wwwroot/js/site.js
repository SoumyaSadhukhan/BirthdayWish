// site.js - Hybrid Scroll & State Controller

class AppController {
    constructor() {
        this.data = JSON.parse(document.getElementById('birthday-data').textContent);
        
        // Modules
        this.modules = {};
        this.scrollTriggers = [];
        this.isAudioUnlocked = false;

        this.init();
    }

    init() {
        console.log("Initializing Cinematic Birthday Experience...");
        
        // Initial setup - hide scroll track
        gsap.set('#surprises-track', { display: 'none', opacity: 0 });
        gsap.set('.scene', { opacity: 0 }); // Hide all scenes initially
        
        // Audio Toggle
        document.getElementById('audio-toggle').addEventListener('click', (e) => {
            this.toggleAudio();
        });

        // 1. Intro & Countdown
        gsap.to('#scene-intro', { opacity: 1, duration: 1 });
        
        setTimeout(() => {
            if (this.data.config.countdown.enabled) {
                const bdDate = new Date(this.data.config.birthdayDateIso);
                if (new Date() < bdDate) {
                    this.showCountdown();
                } else {
                    this.transitionToIntroComplete();
                }
            } else {
                this.transitionToIntroComplete();
            }
        }, 1500);
    }

    unlockAudioContext() {
        if (!this.isAudioUnlocked && window.SoundManager) {
            window.SoundManager.unlockAudio();
            this.isAudioUnlocked = true;
        }
    }

    toggleAudio() {
        if (!window.SoundManager) return;
        const icon = document.getElementById('audio-icon');
        if (window.SoundManager.isMuted) {
            window.SoundManager.unmute();
            icon.innerText = '🔊';
        } else {
            window.SoundManager.mute();
            icon.innerText = '🔇';
        }
    }

    showCountdown() {
        document.getElementById('loading-ui').classList.add('hidden');
        document.getElementById('countdown-ui').classList.remove('hidden');
        document.querySelector('.countdown-title').innerText = this.data.config.countdown.title || "Something special is coming...";
        
        const bdDate = new Date(this.data.config.birthdayDateIso).getTime();
        
        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = bdDate - now;

            if (distance < 0) {
                clearInterval(this.interval);
                this.transitionToIntroComplete();
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
    }

    transitionToIntroComplete() {
        const tl = gsap.timeline();
        tl.to('#scene-intro', { opacity: 0, duration: 1, onComplete: () => {
            document.getElementById('scene-intro').style.display = 'none';
        }});
        
        // Show Welcome
        const welcomeScene = document.getElementById('scene-welcome');
        gsap.to(welcomeScene, { opacity: 1, duration: 1, delay: 1 });
        
        document.querySelector('.welcome-title').innerText = this.data.config.welcome.title;
        document.querySelector('.welcome-message').innerText = this.data.config.welcome.message;
        
        document.getElementById('btn-enter').onclick = () => {
            this.unlockAudioContext();
            if (window.SoundManager) window.SoundManager.playMusic();
            if (window.BirthdayRoom) window.BirthdayRoom.startAmbient();
            
            // Transition to Gift Box
            gsap.to(welcomeScene, { opacity: 0, y: -50, duration: 1, onComplete: () => {
                welcomeScene.style.display = 'none';
                this.startCinematicScroll();
            }});
        };
    }

    startCinematicScroll() {
        console.log("Starting Cinematic Scroll");
        
        // Unlock scroll on body
        document.body.style.overflowY = 'auto';
        document.body.style.position = 'relative';

        gsap.registerPlugin(ScrollTrigger);

        // Fade in Gift Scene
        gsap.to('#scene-gift', { opacity: 1, duration: 1 });
        if (window.GiftsManager) window.GiftsManager.init();

        // Pin the gift scene until it is opened
        ScrollTrigger.create({
            trigger: "#scene-gift",
            start: "top top",
            end: "+=100%", // Virtual scroll space
            pin: true,
            id: "gift-pin",
            onLeave: () => {
                // If they scroll past without opening, force open
                if (window.GiftsManager && !window.GiftsManager.isOpened) {
                    window.GiftsManager.openGift();
                }
            }
        });

        // Listen for gift opened to show surprises track
        document.addEventListener("birthday:gift-opened", () => {
            gsap.set('#surprises-track', { display: 'block' });
            gsap.to('#surprises-track', { opacity: 1, duration: 1 });
            
            // Allow scrolling to continue normally
            if(window.GiftsManager) window.GiftsManager.initScrollingSurprises();
            
            // Cleanup: remove gift pin so we can scroll smoothly
            ScrollTrigger.getById("gift-pin").kill();
            gsap.set('#scene-gift', { clearProps: "pin" });
        }, { once: true });


        // Setup Cake Scene Pin
        document.addEventListener("birthday:cake-reached", () => {
            gsap.to('#scene-cake', { opacity: 1, duration: 1 });
            if (window.CakeManager) window.CakeManager.init();
        }, { once: true });

        ScrollTrigger.create({
            trigger: "#scene-cake",
            start: "top top",
            end: "+=2000", // Needs a lot of space to prevent scrolling while cutting
            pin: true,
            id: "cake-pin"
        });

        document.addEventListener("birthday:cake-complete", () => {
            // Unpin cake to allow scrolling to final sections
            ScrollTrigger.getById("cake-pin").kill();
            gsap.set('#scene-cake', { clearProps: "pin" });
            
            // Reveal Voice/Final
            gsap.set('#scene-voice', { display: 'flex', opacity: 1 });
            
            if (this.data.config.birthdayVoice.enabled && this.data.audio.birthdayVoice.length > 0) {
                document.getElementById('voice-container').classList.remove('hidden');
                gsap.fromTo('#voice-container', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1 });
                
                document.getElementById('btn-play-voice').onclick = () => {
                    if (window.SoundManager) window.SoundManager.playVoice(this.data.audio.birthdayVoice[0]);
                    document.getElementById('btn-play-voice').classList.add('hidden');
                    document.getElementById('voice-visualizer').classList.remove('hidden');
                    gsap.to('.bar', { height: '100%', duration: 0.5, stagger: 0.1, yoyo: true, repeat: -1 });
                    
                    document.getElementById('btn-continue-final').classList.remove('hidden');
                };

                document.getElementById('btn-continue-final').onclick = () => {
                    this.showFinalDestination();
                };
            } else {
                this.showFinalDestination();
            }
            
        }, { once: true });
        
        // Scroll Lifecycle Cleanup
        this.setupScrollLifecycle();
    }

    setupScrollLifecycle() {
        // Automatically pause animations for scenes not in viewport to save mobile battery
        const scenes = document.querySelectorAll('.scene');
        scenes.forEach(scene => {
            ScrollTrigger.create({
                trigger: scene,
                start: "top bottom", // enters from bottom
                end: "bottom top",   // leaves from top
                onEnter: () => {
                    scene.classList.add('in-view');
                    // Dispatch event for local managers to start drawing
                    document.dispatchEvent(new CustomEvent(`scene:enter:${scene.id}`));
                },
                onLeave: () => {
                    scene.classList.remove('in-view');
                    document.dispatchEvent(new CustomEvent(`scene:leave:${scene.id}`));
                },
                onEnterBack: () => {
                    scene.classList.add('in-view');
                    document.dispatchEvent(new CustomEvent(`scene:enter:${scene.id}`));
                },
                onLeaveBack: () => {
                    scene.classList.remove('in-view');
                    document.dispatchEvent(new CustomEvent(`scene:leave:${scene.id}`));
                }
            });
        });
    }

    showFinalDestination() {
        gsap.to(window, { duration: 1, scrollTo: "#scene-final", ease: "power2.inOut" });
        gsap.to('#scene-final', { opacity: 1, duration: 1 });

        document.getElementById('final-title').innerText = this.data.config.finalMessage.title;
        document.getElementById('final-message').innerText = this.data.config.finalMessage.message;
        
        if (this.data.images.final && this.data.images.final.length > 0) {
            const img = document.createElement('img');
            img.src = this.data.images.final[0];
            img.loading = "lazy";
            document.getElementById('final-image-wrapper').appendChild(img);
        }

        gsap.fromTo('.final-content', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 2, ease: 'power2.out', delay: 0.5 });
        
        document.getElementById('btn-replay').onclick = () => location.reload();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.App = new AppController();
});
