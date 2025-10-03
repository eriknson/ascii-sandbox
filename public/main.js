/**
 * Main Application
 * Orchestrates all components and handles user interaction
 */

class ASCIIEmojiAnimator {
    constructor() {
        // Get canvas
        this.canvas = document.getElementById('ascii-canvas');
        
        // Initialize components
        this.renderer = new ASCIIRenderer(this.canvas);
        this.converter = new EmojiConverter();
        this.rotation = new Rotation3D(this.renderer);
        this.background = new BackgroundEffects(this.renderer);
        this.transition = new TransitionEffects(this.renderer);
        
        // State
        this.currentEmoji = '😀';
        this.currentDepthMap = null;
        this.previousBuffer = this.renderer.createBuffer();
        this.currentBuffer = this.renderer.createBuffer();
        this.backgroundBuffer = this.renderer.createBuffer();
        
        // Animation
        this.lastTime = performance.now();
        this.isRunning = false;
        
        // Initialize
        this.setupUI();
        this.loadEmoji(this.currentEmoji);
        this.start();
    }
    
    /**
     * Setup UI event listeners
     */
    setupUI() {
        // Emoji buttons
        const emojiButtons = document.querySelectorAll('.emoji-btn');
        emojiButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.getAttribute('data-emoji');
                this.selectEmoji(emoji);
                
                // Update active state
                emojiButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Set first emoji as active
        if (emojiButtons.length > 0) {
            emojiButtons[0].classList.add('active');
        }
        
        // Settings toggle
        const settingsToggle = document.getElementById('settings-toggle');
        const settingsPanel = document.getElementById('settings-panel');
        settingsToggle.addEventListener('click', () => {
            settingsPanel.classList.toggle('collapsed');
        });
        
        // Background effect selector
        const backgroundSelect = document.getElementById('background-select');
        backgroundSelect.addEventListener('change', (e) => {
            this.background.setEffect(e.target.value);
        });
        
        // Transition effect selector
        const transitionSelect = document.getElementById('transition-select');
        transitionSelect.addEventListener('change', (e) => {
            this.transition.setEffect(e.target.value);
        });
        
        // Speed slider
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.rotation.setSpeed(speed);
            speedValue.textContent = `${speed.toFixed(1)}x`;
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const buttons = Array.from(document.querySelectorAll('.emoji-btn'));
            const currentIndex = buttons.findIndex(btn => btn.classList.contains('active'));
            
            let newIndex = currentIndex;
            
            switch(e.key) {
                case 'ArrowRight':
                    newIndex = (currentIndex + 1) % buttons.length;
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    newIndex = (currentIndex - 1 + buttons.length) % buttons.length;
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    newIndex = (currentIndex + 5) % buttons.length;
                    e.preventDefault();
                    break;
                case 'ArrowUp':
                    newIndex = (currentIndex - 5 + buttons.length) % buttons.length;
                    e.preventDefault();
                    break;
                case 'Enter':
                    if (currentIndex >= 0) {
                        buttons[currentIndex].click();
                    }
                    e.preventDefault();
                    break;
            }
            
            if (newIndex !== currentIndex && newIndex >= 0) {
                buttons.forEach(b => b.classList.remove('active'));
                buttons[newIndex].classList.add('active');
                buttons[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.renderer.resize();
            if (this.currentDepthMap) {
                this.currentDepthMap = this.converter.create3DDepthMap(
                    this.currentEmoji,
                    Math.min(100, Math.floor(this.renderer.cols * 0.7)),
                    Math.min(80, Math.floor(this.renderer.rows * 0.7))
                );
            }
        });
    }
    
    /**
     * Load and convert emoji to depth map
     */
    loadEmoji(emoji) {
        // Create depth map with higher resolution for more detail
        const emojiWidth = Math.min(100, Math.floor(this.renderer.cols * 0.7));
        const emojiHeight = Math.min(80, Math.floor(this.renderer.rows * 0.7));
        
        this.currentDepthMap = this.converter.create3DDepthMap(
            emoji,
            emojiWidth,
            emojiHeight
        );
    }
    
    /**
     * Select new emoji with transition
     */
    selectEmoji(emoji) {
        if (emoji === this.currentEmoji || this.transition.getIsTransitioning()) {
            return;
        }
        
        // Store previous state
        this.previousBuffer = JSON.parse(JSON.stringify(this.currentBuffer));
        
        // Load new emoji
        this.currentEmoji = emoji;
        this.loadEmoji(emoji);
        
        // Start transition
        this.transition.start();
    }
    
    /**
     * Animation loop
     */
    animate(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Cap delta time to avoid large jumps
        const dt = Math.min(deltaTime, 0.1);
        
        // Update rotation
        this.rotation.update(dt);
        
        // Update transition
        this.transition.update(dt);
        
        // Update background
        this.background.render(this.backgroundBuffer, dt);
        
        // Render rotated emoji
        if (this.currentDepthMap) {
            this.rotation.renderRotated(
                this.currentDepthMap,
                this.currentBuffer,
                this.rotation.getAngle()
            );
        }
        
        // Apply transition if active
        let displayBuffer = this.currentBuffer;
        if (this.transition.getIsTransitioning()) {
            displayBuffer = this.transition.apply(this.previousBuffer, this.currentBuffer);
        }
        
        // Render to canvas
        this.renderer.render(displayBuffer, this.backgroundBuffer);
        
        // Continue loop
        requestAnimationFrame((time) => this.animate(time));
    }
    
    /**
     * Start animation
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame((time) => this.animate(time));
        }
    }
    
    /**
     * Stop animation
     */
    stop() {
        this.isRunning = false;
    }
}

// Initialize app when DOM is ready (only once)
if (!window.app && typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.app = new ASCIIEmojiAnimator();
        });
    } else {
        window.app = new ASCIIEmojiAnimator();
    }
}

