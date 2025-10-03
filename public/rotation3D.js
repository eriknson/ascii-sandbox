/**
 * 3D Rotation Engine
 * Handles 3D transformation and projection of emoji depth maps
 */

class Rotation3D {
    constructor(renderer) {
        this.renderer = renderer;
        this.angle = 0;
        this.speed = 1.0;
        this.animationStyle = 'float'; // Default animation style
        this.time = 0;
    }
    
    /**
     * Apply 3D rotation to depth map
     */
    rotate3D(depthMap, angle) {
        const height = depthMap.length;
        const width = depthMap[0].length;
        const rotated = [];
        
        // Initialize rotated buffer
        for (let y = 0; y < height; y++) {
            rotated[y] = new Array(width).fill(0);
        }
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 3D rotation matrix (Y-axis rotation for now)
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (depthMap[y][x] > 0) {
                    // Translate to center
                    const tx = x - centerX;
                    const ty = y - centerY;
                    
                    // Use brightness as pseudo-depth
                    const tz = (depthMap[y][x] / 255) * 20 - 10;
                    
                    // Apply Y-axis rotation
                    const rx = tx * cosA - tz * sinA;
                    const rz = tx * sinA + tz * cosA;
                    const ry = ty;
                    
                    // Perspective projection
                    const perspective = 200;
                    const scale = perspective / (perspective + rz);
                    
                    const projX = Math.round(rx * scale + centerX);
                    const projY = Math.round(ry * scale + centerY);
                    
                    // Z-buffer: only draw if closer or brighter
                    if (projX >= 0 && projX < width && projY >= 0 && projY < height) {
                        // Apply lighting based on depth with better falloff
                        const depthFalloff = Math.max(0.5, scale);
                        const brightness = depthMap[y][x] * depthFalloff;
                        
                        if (brightness > rotated[projY][projX]) {
                            rotated[projY][projX] = brightness;
                        }
                    }
                }
            }
        }
        
        return rotated;
    }
    
    /**
     * Apply animation and render to buffer
     */
    renderRotated(depthMap, buffer, angle) {
        let transformed;
        
        switch(this.animationStyle) {
            case 'rotate':
                transformed = this.rotate3D(depthMap, angle);
                break;
            case 'pulse':
                transformed = this.animatePulse(depthMap);
                break;
            case 'wave':
                transformed = this.animateWave(depthMap);
                break;
            case 'spiral':
                transformed = this.animateSpiral(depthMap);
                break;
            case 'zoom':
                transformed = this.animateZoom(depthMap);
                break;
            case 'tilt':
                transformed = this.animateTilt(depthMap, angle);
                break;
            case 'bounce':
                transformed = this.animateBounce(depthMap);
                break;
            case 'spin':
                transformed = this.animateSpin(depthMap, angle);
                break;
            case 'float':
                transformed = this.animateFloat(depthMap);
                break;
            case 'shimmer':
                transformed = this.animateShimmer(depthMap);
                break;
            default:
                transformed = this.rotate3D(depthMap, angle);
        }
        
        // Clear buffer
        this.renderer.clearBuffer(buffer);
        
        // Center the transformed emoji
        const offsetX = Math.floor((this.renderer.cols - transformed[0].length) / 2);
        const offsetY = Math.floor((this.renderer.rows - transformed.length) / 2);
        
        // Copy transformed data to buffer
        for (let y = 0; y < transformed.length; y++) {
            for (let x = 0; x < transformed[0].length; x++) {
                const brightness = transformed[y][x];
                if (brightness > 0) {
                    this.renderer.setChar(
                        buffer,
                        x + offsetX,
                        y + offsetY,
                        brightness
                    );
                }
            }
        }
    }
    
    /**
     * Animation: Pulse effect
     */
    animatePulse(depthMap) {
        const height = depthMap.length;
        const width = depthMap[0].length;
        const pulsed = [];
        
        const scale = 1 + Math.sin(this.time * 2) * 0.2;
        const centerX = width / 2;
        const centerY = height / 2;
        
        for (let y = 0; y < height; y++) {
            pulsed[y] = new Array(width).fill(0);
        }
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = (x - centerX) * scale + centerX;
                const dy = (y - centerY) * scale + centerY;
                const sx = Math.floor(dx);
                const sy = Math.floor(dy);
                
                if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
                    pulsed[y][x] = depthMap[sy][sx];
                }
            }
        }
        
        return pulsed;
    }
    
    /**
     * Animation: Wave effect
     */
    animateWave(depthMap) {
        const height = depthMap.length;
        const width = depthMap[0].length;
        const waved = [];
        
        for (let y = 0; y < height; y++) {
            waved[y] = new Array(width).fill(0);
            for (let x = 0; x < width; x++) {
                const offset = Math.sin(x * 0.2 + this.time * 3) * 3;
                const sy = Math.floor(y + offset);
                
                if (sy >= 0 && sy < height) {
                    waved[y][x] = depthMap[sy][x];
                }
            }
        }
        
        return waved;
    }
    
    /**
     * Animation: Spiral effect
     */
    animateSpiral(depthMap) {
        const rotated = this.rotate3D(depthMap, this.time * 0.5);
        const height = rotated.length;
        const width = rotated[0].length;
        const centerX = width / 2;
        const centerY = height / 2;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                const spiral = angle + dist * 0.1 - this.time;
                const brightness = rotated[y][x] * (Math.sin(spiral * 2) * 0.3 + 0.7);
                rotated[y][x] = brightness;
            }
        }
        
        return rotated;
    }
    
    /**
     * Animation: Zoom in/out
     */
    animateZoom(depthMap) {
        return this.animatePulse(depthMap);
    }
    
    /**
     * Animation: Tilt back and forth
     */
    animateTilt(depthMap, baseAngle) {
        const tiltAngle = baseAngle + Math.sin(this.time * 2) * 0.5;
        return this.rotate3D(depthMap, tiltAngle);
    }
    
    /**
     * Animation: Bounce effect
     */
    animateBounce(depthMap) {
        const height = depthMap.length;
        const width = depthMap[0].length;
        const bounced = [];
        
        const bounceOffset = Math.abs(Math.sin(this.time * 3)) * 5;
        
        for (let y = 0; y < height; y++) {
            bounced[y] = new Array(width).fill(0);
        }
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const sy = Math.floor(y - bounceOffset);
                if (sy >= 0 && sy < height) {
                    bounced[y][x] = depthMap[sy][x];
                }
            }
        }
        
        return bounced;
    }
    
    /**
     * Animation: Fast spin
     */
    animateSpin(depthMap, baseAngle) {
        return this.rotate3D(depthMap, this.time * 2);
    }
    
    /**
     * Animation: Floating motion
     */
    animateFloat(depthMap) {
        const height = depthMap.length;
        const width = depthMap[0].length;
        const floated = [];
        
        for (let y = 0; y < height; y++) {
            floated[y] = new Array(width).fill(0);
            for (let x = 0; x < width; x++) {
                const xOffset = Math.sin(y * 0.1 + this.time * 2) * 2;
                const yOffset = Math.cos(x * 0.1 + this.time * 2) * 2;
                
                const sx = Math.floor(x + xOffset);
                const sy = Math.floor(y + yOffset);
                
                if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
                    floated[y][x] = depthMap[sy][sx];
                }
            }
        }
        
        return floated;
    }
    
    /**
     * Animation: Shimmer effect
     */
    animateShimmer(depthMap) {
        const height = depthMap.length;
        const width = depthMap[0].length;
        const shimmered = [];
        
        for (let y = 0; y < height; y++) {
            shimmered[y] = [];
            for (let x = 0; x < width; x++) {
                const shimmer = Math.sin(x * 0.2 + y * 0.2 + this.time * 4) * 0.3 + 1;
                shimmered[y][x] = depthMap[y][x] * shimmer;
            }
        }
        
        return shimmered;
    }
    
    /**
     * Update rotation angle and time
     */
    update(deltaTime) {
        // Rotate at speed (radians per second)
        const rotationSpeed = (Math.PI / 2) * this.speed; // 90 degrees per second at 1x speed
        this.angle += rotationSpeed * deltaTime;
        this.time += deltaTime;
        
        // Keep angle in 0 to 2π range
        if (this.angle > Math.PI * 2) {
            this.angle -= Math.PI * 2;
        }
    }
    
    /**
     * Set rotation speed multiplier
     */
    setSpeed(speed) {
        this.speed = Math.max(0.5, Math.min(3, speed));
    }
    
    /**
     * Get current angle
     */
    getAngle() {
        return this.angle;
    }
    
    /**
     * Set animation style
     */
    setAnimationStyle(style) {
        this.animationStyle = style;
        this.time = 0;
    }
    
    /**
     * Reset angle
     */
    reset() {
        this.angle = 0;
        this.time = 0;
    }
}

window.Rotation3D = Rotation3D;

