/**
 * Background Effects
 * Animated background layers for ASCII art
 */

class BackgroundEffects {
    constructor(renderer) {
        this.renderer = renderer;
        this.currentEffect = 'matrix';
        this.time = 0;
        
        // Matrix rain state
        this.matrixColumns = [];
        this.initMatrix();
    }
    
    initMatrix() {
        this.matrixColumns = [];
        for (let x = 0; x < this.renderer.cols; x++) {
            this.matrixColumns.push({
                y: Math.random() * this.renderer.rows,
                speed: 0.5 + Math.random() * 1.5,
                brightness: 100 + Math.random() * 155
            });
        }
    }
    
    /**
     * Update and render matrix rain effect
     */
    renderMatrix(buffer, deltaTime) {
        // Fade existing characters
        for (let y = 0; y < this.renderer.rows; y++) {
            for (let x = 0; x < this.renderer.cols; x++) {
                buffer[y][x].brightness *= 0.95;
                if (buffer[y][x].brightness < 5) {
                    buffer[y][x].brightness = 0;
                    buffer[y][x].char = ' ';
                }
            }
        }
        
        // Update columns
        for (let x = 0; x < this.matrixColumns.length; x++) {
            const col = this.matrixColumns[x];
            col.y += col.speed * deltaTime * 30;
            
            if (col.y > this.renderer.rows) {
                col.y = 0;
                col.speed = 0.5 + Math.random() * 1.5;
                col.brightness = 100 + Math.random() * 155;
            }
            
            const y = Math.floor(col.y);
            if (y >= 0 && y < this.renderer.rows) {
                // Random character from limited set
                const chars = ['0', '1', '|', '/', '\\', '-', '+', '*'];
                buffer[y][x].char = chars[Math.floor(Math.random() * chars.length)];
                // Increased base brightness for better visibility
                buffer[y][x].brightness = col.brightness * 1.2;
            }
        }
    }
    
    /**
     * Render particle field effect
     */
    renderParticles(buffer, deltaTime) {
        this.time += deltaTime;
        
        // Clear buffer
        for (let y = 0; y < this.renderer.rows; y++) {
            for (let x = 0; x < this.renderer.cols; x++) {
                buffer[y][x].brightness = 0;
                buffer[y][x].char = ' ';
            }
        }
        
        // Draw moving particles
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const phase = (this.time * 0.3 + i * 123.456) % 1;
            const x = Math.floor((Math.sin(phase * Math.PI * 2 + i) * 0.5 + 0.5) * this.renderer.cols);
            const y = Math.floor((Math.cos(phase * Math.PI * 2 + i * 0.7) * 0.5 + 0.5) * this.renderer.rows);
            
            if (x >= 0 && x < this.renderer.cols && y >= 0 && y < this.renderer.rows) {
                buffer[y][x].char = '.';
                buffer[y][x].brightness = 150 + Math.sin(phase * Math.PI * 2) * 100;
            }
        }
    }
    
    /**
     * Render wave effect
     */
    renderWaves(buffer, deltaTime) {
        this.time += deltaTime;
        
        for (let y = 0; y < this.renderer.rows; y++) {
            for (let x = 0; x < this.renderer.cols; x++) {
                const wave1 = Math.sin(x * 0.2 + this.time * 2);
                const wave2 = Math.cos(y * 0.2 + this.time * 1.5);
                const combined = (wave1 + wave2) * 0.5;
                
                const brightness = (combined * 0.5 + 0.5) * 100;
                
                buffer[y][x].char = combined > 0 ? '~' : '-';
                buffer[y][x].brightness = brightness;
            }
        }
    }
    
    /**
     * Render starfield effect
     */
    renderStarfield(buffer, deltaTime) {
        this.time += deltaTime;
        
        // Clear buffer
        for (let y = 0; y < this.renderer.rows; y++) {
            for (let x = 0; x < this.renderer.cols; x++) {
                buffer[y][x].brightness = 0;
                buffer[y][x].char = ' ';
            }
        }
        
        // Draw stars
        const starCount = 100;
        for (let i = 0; i < starCount; i++) {
            // Pseudo-random but consistent positions
            const seed = i * 12345.6789;
            const x = Math.floor((Math.sin(seed) * 0.5 + 0.5) * this.renderer.cols);
            const y = Math.floor((Math.cos(seed) * 0.5 + 0.5) * this.renderer.rows);
            
            // Twinkling effect
            const twinkle = Math.sin(this.time * 3 + i) * 0.5 + 0.5;
            const brightness = 100 + twinkle * 155;
            
            if (x >= 0 && x < this.renderer.cols && y >= 0 && y < this.renderer.rows) {
                buffer[y][x].char = '*';
                buffer[y][x].brightness = brightness;
            }
        }
    }
    
    /**
     * Render geometric patterns
     */
    renderGeometric(buffer, deltaTime) {
        this.time += deltaTime;
        
        const centerX = this.renderer.cols / 2;
        const centerY = this.renderer.rows / 2;
        
        for (let y = 0; y < this.renderer.rows; y++) {
            for (let x = 0; x < this.renderer.cols; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                const pattern = Math.sin(dist * 0.5 - this.time * 2) * Math.cos(angle * 6 + this.time);
                const brightness = (pattern * 0.5 + 0.5) * 120;
                
                buffer[y][x].char = pattern > 0 ? '#' : '+';
                buffer[y][x].brightness = brightness;
            }
        }
    }
    
    /**
     * Update and render current effect
     */
    render(buffer, deltaTime) {
        switch (this.currentEffect) {
            case 'matrix':
                this.renderMatrix(buffer, deltaTime);
                break;
            case 'particles':
                this.renderParticles(buffer, deltaTime);
                break;
            case 'waves':
                this.renderWaves(buffer, deltaTime);
                break;
            case 'starfield':
                this.renderStarfield(buffer, deltaTime);
                break;
            case 'geometric':
                this.renderGeometric(buffer, deltaTime);
                break;
        }
    }
    
    /**
     * Set background effect
     */
    setEffect(effect) {
        this.currentEffect = effect;
        this.time = 0;
        if (effect === 'matrix') {
            this.initMatrix();
        }
    }
}

window.BackgroundEffects = BackgroundEffects;

