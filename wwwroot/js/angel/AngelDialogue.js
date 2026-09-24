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
                <button class="angel-bubble-close" id="angel-bubble-close-btn">✖</button>
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

        this.textElem.textContent = '';
        this.bubbleElem.classList.add('active');
        this.isVisible = true;

        this.controller.setState('Talking');
        this.controller.animator.play('Talk');

        // Typewriter text animation
        let charIdx = 0;
        const speed = options.speed || 25;

        this.typewriterTimer = setInterval(() => {
            if (charIdx < text.length) {
                this.textElem.textContent += text.charAt(charIdx);
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

        // Project 3D Bird position to 2D Screen Coordinates
        const angelWorldPos = this.modelGroup.position.clone();
        const vector = angelWorldPos.project(this.camera);

        const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

        const isMobile = window.innerWidth <= 650;
        
        // 3D Bird Bounding Radius on 2D Screen (wingspan + body clearance)
        const birdRadiusX = isMobile ? 55 : 85; 
        const birdRadiusY = isMobile ? 45 : 65; 

        this.bubbleElem.className = 'active'; // Reset arrow classes

        const bubbleRect = this.bubbleElem.getBoundingClientRect();
        const bW = bubbleRect.width || (isMobile ? 180 : 210);
        const bH = bubbleRect.height || 100;

        const margin = 15; // Gap between speech bubble and screen edge

        // 100% Strict Viewport Clamping inside 90vw * 90vh centered box (5vw to 95vw, 5vh to 95vh)
        const boxLeftMargin = Math.max(15, window.innerWidth * 0.05);
        const boxRightMargin = Math.max(15, window.innerWidth * 0.05);
        const boxTopMargin = Math.max(15, window.innerHeight * 0.05);
        const boxBottomMargin = Math.max(15, window.innerHeight * 0.05);

        let arrowClass = 'arrow-right';
        let left = 0;
        let top = 0;

        // PREFERRED POSITION: Place to the LEFT side of the parrot
        const leftSidePos = screenX - birdRadiusX - bW - 12;
        const rightSidePos = screenX + birdRadiusX + 12;

        // Shift bubble higher up (placing ~80% of bubble height above bird center)
        const higherTop = screenY - (bH * 0.8);

        if (leftSidePos >= boxLeftMargin) {
            // Place to the LEFT side of the parrot
            arrowClass = 'arrow-right';
            left = leftSidePos;
            top = higherTop;
        } else if (rightSidePos + bW <= window.innerWidth - boxRightMargin) {
            // Place to the RIGHT side of the parrot
            arrowClass = 'arrow-left';
            left = rightSidePos;
            top = higherTop;
        } else if (screenY - birdRadiusY - bH - 12 >= boxTopMargin) {
            // Fallback: Place ABOVE
            arrowClass = 'arrow-bottom';
            left = Math.max(boxLeftMargin, screenX - (bW / 2));
            top = screenY - birdRadiusY - bH - 12;
        } else {
            // Fallback: Place BELOW
            arrowClass = 'arrow-top';
            left = Math.max(boxLeftMargin, screenX - (bW / 2));
            top = screenY + birdRadiusY + 12;
        }

        left = Math.max(boxLeftMargin, Math.min(window.innerWidth - bW - boxRightMargin, left));
        top = Math.max(boxTopMargin, Math.min(window.innerHeight - bH - boxBottomMargin, top));

        // ZERO OVERLAP SAFETY CHECK:
        // If clamped bubble box intersects bird bounding box, push bubble to the left
        const birdMinX = screenX - birdRadiusX;
        const birdMaxX = screenX + birdRadiusX;
        const birdMinY = screenY - birdRadiusY;
        const birdMaxY = screenY + birdRadiusY;

        const bubbleMinX = left;
        const bubbleMaxX = left + bW;
        const bubbleMinY = top;
        const bubbleMaxY = top + bH;

        const overlaps = (bubbleMinX < birdMaxX && bubbleMaxX > birdMinX && bubbleMinY < birdMaxY && bubbleMaxY > birdMinY);

        if (overlaps) {
            if (arrowClass === 'arrow-right') {
                left = Math.max(margin, birdMinX - bW - 10);
            } else if (arrowClass === 'arrow-left') {
                left = Math.min(window.innerWidth - bW - margin, birdMaxX + 10);
            } else if (arrowClass === 'arrow-bottom') {
                top = Math.max(margin, birdMinY - bH - 10);
            } else if (arrowClass === 'arrow-top') {
                top = Math.min(window.innerHeight - bH - margin, birdMaxY + 10);
            }
        }

        // Calculate dynamic arrow position pointing directly at bird center
        if (arrowClass === 'arrow-right' || arrowClass === 'arrow-left') {
            const relY = screenY - top;
            const arrowY = Math.max(16, Math.min(bH - 16, relY));
            this.bubbleElem.style.setProperty('--arrow-y', `${arrowY}px`);
        } else {
            const relX = screenX - left;
            const arrowX = Math.max(16, Math.min(bW - 16, relX));
            this.bubbleElem.style.setProperty('--arrow-x', `${arrowX}px`);
        }

        this.bubbleElem.classList.add(arrowClass);
        this.bubbleElem.style.left = `${left}px`;
        this.bubbleElem.style.top = `${top}px`;
    }
}
window.AngelDialogue = AngelDialogue;
