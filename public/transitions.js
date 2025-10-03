/**
 * Transition Effects
 * Smooth transitions between different emojis
 */

class TransitionEffects {
    constructor(renderer) {
        this.renderer = renderer;
        this.currentEffect = 'morph'; // Default transition
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionDuration = 0.5; // 500ms
    }
    
    /**
     * Start a transition
     */
    start() {
        this.isTransitioning = true;
        this.transitionProgress = 0;
    }
    
    /**
     * Update transition progress
     */
    update(deltaTime) {
        if (this.isTransitioning) {
            this.transitionProgress += deltaTime / this.transitionDuration;
            if (this.transitionProgress >= 1) {
                this.transitionProgress = 1;
                this.isTransitioning = false;
            }
        }
    }
    
    /**
     * Crossfade transition
     */
    crossfade(bufferFrom, bufferTo, alpha) {
        return this.renderer.blendBuffers(bufferFrom, bufferTo, alpha);
    }
    
    /**
     * Zoom transition
     */
    zoom(bufferFrom, bufferTo, alpha) {
        const result = this.renderer.createBuffer();
        const scale = 1 + Math.sin(alpha * Math.PI) * 0.5; // Scale up then down
        
        const centerX = this.renderer.cols / 2;
        const centerY = this.renderer.rows / 2;
        
        // Determine which buffer to use based on transition progress
        const sourceBuffer = alpha < 0.5 ? bufferFrom : bufferTo;
        const sourceAlpha = alpha < 0.5 ? (1 - alpha * 2) : ((alpha - 0.5) * 2);
        
        for (let y = 0; y < this.renderer.rows; y++) {
            for (let x = 0; x < this.renderer.cols; x++) {
                // Transform coordinates
                const dx = x - centerX;
                const dy = y - centerY;
                const srcX = Math.floor(centerX + dx / scale);
                const srcY = Math.floor(centerY + dy / scale);
                
                if (srcX >= 0 && srcX < this.renderer.cols && srcY >= 0 && srcY < this.renderer.rows) {
                    const brightness = sourceBuffer[srcY][srcX].brightness * sourceAlpha;
                    result[y][x] = {
                        char: this.renderer.brightnessToChar(brightness),
                        brightness: brightness
                    };
                }
            }
        }
        
        return result;
    }
    
    /**
     * Spiral transition
     */
    spiral(bufferFrom, bufferTo, alpha) {
        const result = this.renderer.createBuffer();
        const centerX = this.renderer.cols / 2;
        const centerY = this.renderer.rows / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
        
        for (let y = 0; y < this.renderer.rows; y++) {
            for (let x = 0; x < this.renderer.cols; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                // Spiral threshold
                const threshold = (dist / maxDist + angle / (Math.PI * 2)) % 1;
                
                const sourceBuffer = threshold < alpha ? bufferTo : bufferFrom;
                result[y][x] = {
                    char: sourceBuffer[y][x].char,
                    brightness: sourceBuffer[y][x].brightness
                };
            }
        }
        
        return result;
    }
    
    /**
     * Dissolve transition (random pixel-by-pixel)
     */
    dissolve(bufferFrom, bufferTo, alpha) {
        const result = this.renderer.createBuffer();
        
        for (let y = 0; y < this.renderer.rows; y++) {
            for (let x = 0; x < this.renderer.cols; x++) {
                // Pseudo-random but consistent for each cell
                const seed = (x * 12.345 + y * 67.890) % 1;
                const sourceBuffer = seed < alpha ? bufferTo : bufferFrom;
                
                result[y][x] = {
                    char: sourceBuffer[y][x].char,
                    brightness: sourceBuffer[y][x].brightness
                };
            }
        }
        
        return result;
    }
    
    /**
     * Morph transition (blend with spatial offset)
     */
    morph(bufferFrom, bufferTo, alpha) {
        const result = this.renderer.createBuffer();
        const offset = Math.sin(alpha * Math.PI) * 5; // Max 5 chars offset
        
        for (let y = 0; y < this.renderer.rows; y++) {
            for (let x = 0; x < this.renderer.cols; x++) {
                // Sample with offset
                const offsetX = Math.floor(x + offset * Math.sin(y * 0.5));
                const offsetY = Math.floor(y + offset * Math.cos(x * 0.5));
                
                let brightnessFrom = 0;
                let brightnessTo = 0;
                
                if (offsetX >= 0 && offsetX < this.renderer.cols && offsetY >= 0 && offsetY < this.renderer.rows) {
                    brightnessFrom = bufferFrom[offsetY][offsetX].brightness;
                }
                
                if (x >= 0 && x < this.renderer.cols && y >= 0 && y < this.renderer.rows) {
                    brightnessTo = bufferTo[y][x].brightness;
                }
                
                const blendedBrightness = brightnessFrom * (1 - alpha) + brightnessTo * alpha;
                result[y][x] = {
                    char: this.renderer.brightnessToChar(blendedBrightness),
                    brightness: blendedBrightness
                };
            }
        }
        
        return result;
    }
    
    /**
     * Apply current transition effect
     */
    apply(bufferFrom, bufferTo) {
        if (!this.isTransitioning) {
            return bufferTo;
        }
        
        const alpha = this.easeInOutCubic(this.transitionProgress);
        
        switch (this.currentEffect) {
            case 'crossfade':
                return this.crossfade(bufferFrom, bufferTo, alpha);
            case 'zoom':
                return this.zoom(bufferFrom, bufferTo, alpha);
            case 'spiral':
                return this.spiral(bufferFrom, bufferTo, alpha);
            case 'dissolve':
                return this.dissolve(bufferFrom, bufferTo, alpha);
            case 'morph':
                return this.morph(bufferFrom, bufferTo, alpha);
            default:
                return this.crossfade(bufferFrom, bufferTo, alpha);
        }
    }
    
    /**
     * Easing function for smooth transitions
     */
    easeInOutCubic(t) {
        return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    /**
     * Set transition effect
     */
    setEffect(effect) {
        this.currentEffect = effect;
    }
    
    /**
     * Check if transitioning
     */
    getIsTransitioning() {
        return this.isTransitioning;
    }
}

window.TransitionEffects = TransitionEffects;

