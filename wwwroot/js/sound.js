// sound.js - Audio Manager

class SoundManager {
    constructor() {
        this.isMuted = false;
        this.data = JSON.parse(document.getElementById('birthday-data').textContent);
        this.musicPlayer = new Audio();
        this.effectsPlayer = new Audio();
        
        if (this.data.audio.music.length > 0) {
            this.musicPlayer.src = this.data.audio.music[0];
            this.musicPlayer.loop = true;
            this.musicPlayer.volume = this.data.config.music.volume || 0.35;
        }

        this.effectsMap = {};
        // Auto map effects based on discovered files. 
        // Example: /audio/effects/pop.mp3 -> effectsMap['pop']
        if (this.data.audio.effects) {
            this.data.audio.effects.forEach(url => {
                const filename = url.split('/').pop();
                const name = filename.split('.')[0];
                this.effectsMap[name] = new Audio(url);
            });
        }

        this.setupToggle();
    }

    unlockAudio() {
        // Silent play to unlock audio context on mobile
        this.musicPlayer.play().then(() => {
            this.musicPlayer.pause();
            this.musicPlayer.currentTime = 0;
        }).catch(e => console.log("Audio unlock failed (autoplay blocked)", e));
    }

    setupToggle() {
        const btn = document.getElementById('audio-toggle');
        if (btn) {
            btn.onclick = () => {
                this.isMuted = !this.isMuted;
                btn.innerHTML = this.isMuted ? '<span class="icon">🔇</span>' : '<span class="icon">🔊</span>';
                
                this.musicPlayer.muted = this.isMuted;
                Object.values(this.effectsMap).forEach(a => a.muted = this.isMuted);
            };
        }
    }

    playMusic() {
        if (!this.data.config.music.enabled || !this.musicPlayer.src) return;
        this.musicPlayer.play().catch(e => console.log("Music play blocked", e));
    }

    duckMusic() {
        if (!this.data.config.music.enabled) return;
        gsap.to(this.musicPlayer, { volume: 0.05, duration: 1 });
    }

    restoreMusic() {
        if (!this.data.config.music.enabled) return;
        gsap.to(this.musicPlayer, { volume: this.data.config.music.volume || 0.35, duration: 1 });
    }

    playEffect(name) {
        if (this.isMuted) return;
        const effect = this.effectsMap[name];
        if (effect) {
            // Clone to allow overlapping sounds
            const clone = effect.cloneNode();
            clone.volume = 0.5;
            clone.play().catch(e => console.log(`Effect ${name} play blocked`, e));
        } else {
            console.log(`Sound effect ${name} not found`);
        }
    }

    playVoice(url) {
        if (this.isMuted) return;
        this.duckMusic();
        const voice = new Audio(url);
        voice.onended = () => {
            this.restoreMusic();
            document.dispatchEvent(new CustomEvent("birthday:voice-complete"));
        };
        voice.play().catch(e => {
            console.log("Voice play blocked", e);
            document.dispatchEvent(new CustomEvent("birthday:voice-complete"));
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.SoundManager = new SoundManager();
});
