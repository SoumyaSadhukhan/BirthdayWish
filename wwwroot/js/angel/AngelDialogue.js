/**
 * AngelDialogue.js
 * Projects 3D Angel world position to 2D screen coordinates, positions speech bubble,
 * manages typewriter text effect, and handles automatic bubble hide timeouts.
 */
class AngelDialogue {
    constructor(controller) {
        this.controller = controller;
        this.camera = controller.renderer.camera;
        this.modelGroup = controller.renderer.modelGroup;

        this.bubbleElem = null;
        this.textElem = null;
        this.closeBtn = null;

        this.typewriterTimer = null;
        this.hideTimeoutTimer = null;
        this.isVisible = false;

        this.init();
    }

    init() {
        this.bubbleElem = document.getElementById('angel-speech-bubble');
        if (!this.bubbleElem) {
            this.bubbleElem = document.createElement('div');
            this.bubbleElem.id = 'angel-speech-bubble';
            this.bubbleElem.innerHTML = `
                <div class="angel-bubble-header">
                    <span class="angel-bubble-title">✨ Angel Guide</span>
                    <button class="angel-bubble-close" id="angel-bubble-close-btn">✖</button>
                </div>
                <div class="angel-bubble-body" id="angel-bubble-text-body"></div>
            `;
            document.body.appendChild(this.bubbleElem);
        }

        this.textElem = document.getElementById('angel-bubble-text-body');
        this.closeBtn = document.getElementById('angel-bubble-close-btn');

        if (this.closeBtn) {
            this.closeBtn.onclick = () => this.hide();
        }
    }

    say(text, options = {}) {
        if (!this.textElem || !this.bubbleElem) return;

        if (this.typewriterTimer) clearInterval(this.typewriterTimer);
        if (this.hideTimeoutTimer) clearTimeout(this.hideTimeoutTimer);

        this.textElem.innerText = '';
        this.bubbleElem.classList.add('active');
        this.isVisible = true;

        this.controller.setState('Talking');
        this.controller.animator.play('Talk');

        // Typewriter text animation
        let charIdx = 0;
        const speed = options.speed || 25;

        this.typewriterTimer = setInterval(() => {
            if (charIdx < text.length) {
                this.textElem.innerText += text.charAt(charIdx);
                charIdx++;
            } else {
                clearInterval(this.typewriterTimer);
                this.typewriterTimer = null;

                // Auto hide duration if specified
                const duration = options.duration || 5000;
                if (duration > 0) {
                    this.hideTimeoutTimer = setTimeout(() => {
                        this.hide();
                    }, duration);
                }
            }
        }, speed);
    }

    hide() {
        if (this.typewriterTimer) clearInterval(this.typewriterTimer);
        if (this.hideTimeoutTimer) clearTimeout(this.hideTimeoutTimer);

        if (this.bubbleElem) {
            this.bubbleElem.classList.remove('active');
        }
        this.isVisible = false;
        this.controller.setState('Hovering');
        this.controller.animator.play('Hover');
    }

    update() {
        if (!this.isVisible || !this.bubbleElem || !this.modelGroup) return;

        // Project 3D Angel position to 2D Screen Coordinates
        const angelWorldPos = this.modelGroup.position.clone();
        const vector = angelWorldPos.project(this.camera);

        const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

        const isMobile = window.innerWidth <= 650;
        const angelRadius = isMobile ? 40 : 80; 

        this.bubbleElem.className = 'active'; // Reset classes
        let arrowClass = 'arrow-bottom';

        const bubbleRect = this.bubbleElem.getBoundingClientRect();
        const bW = bubbleRect.width || (isMobile ? 240 : 280);
        const bH = bubbleRect.height || 100;
        
        let targetX = screenX;
        let targetY = screenY - angelRadius; // Point above angel

        // Edge detection to place bubble correctly
        if (screenX > window.innerWidth - bW) {
            // Near right edge -> Place on left side
            targetX = screenX - (angelRadius * 0.8);
            targetY = screenY;
            arrowClass = 'arrow-right';
        } else if (screenX < bW) {
            // Near left edge -> Place on right side
            targetX = screenX + (angelRadius * 0.8);
            targetY = screenY;
            arrowClass = 'arrow-left';
        } else if (screenY - bH - angelRadius < 10) {
            // Near top edge -> Place below angel
            targetY = screenY + angelRadius;
            arrowClass = 'arrow-top';
        }

        this.bubbleElem.classList.add(arrowClass);

        let left = 0;
        let top = 0;

        if (arrowClass === 'arrow-bottom') {
            left = targetX - (bW / 2);
            top = targetY - bH;
        } else if (arrowClass === 'arrow-top') {
            left = targetX - (bW / 2);
            top = targetY;
        } else if (arrowClass === 'arrow-left') {
            left = targetX;
            top = targetY - (bH / 2);
        } else if (arrowClass === 'arrow-right') {
            left = targetX - bW;
            top = targetY - (bH / 2);
        }

        // Final safety clamp so it NEVER leaves viewport
        left = Math.max(10, Math.min(window.innerWidth - bW - 10, left));
        top = Math.max(10, Math.min(window.innerHeight - bH - 10, top));

        this.bubbleElem.style.left = `${left}px`;
        this.bubbleElem.style.top = `${top}px`;
    }
}
window.AngelDialogue = AngelDialogue;
