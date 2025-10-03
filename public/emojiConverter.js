/**
 * Emoji Converter
 * Converts emoji to depth map for ASCII rendering
 */

class EmojiConverter {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.size = 256; // Increased base emoji render size for more detail
        this.canvas.width = this.size;
        this.canvas.height = this.size;
    }
    
    /**
     * Convert emoji to depth map
     */
    emojiToDepthMap(emoji, width, height) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.size, this.size);
        
        // Draw emoji with better quality
        this.ctx.font = `${this.size * 0.85}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(emoji, this.size / 2, this.size / 2);
        
        // Apply slight blur for smoother gradients
        this.ctx.filter = 'blur(1px)';
        this.ctx.drawImage(this.canvas, 0, 0);
        this.ctx.filter = 'none';
        
        // Get image data
        const imageData = this.ctx.getImageData(0, 0, this.size, this.size);
        const data = imageData.data;
        
        // Create depth map
        const depthMap = [];
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                // Map to source canvas coordinates
                const srcX = Math.floor((x / width) * this.size);
                const srcY = Math.floor((y / height) * this.size);
                const idx = (srcY * this.size + srcX) * 4;
                
                // Calculate brightness from RGBA
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];
                
                // Weighted brightness with alpha (perceptual luminance)
                const brightness = (r * 0.299 + g * 0.587 + b * 0.114) * (a / 255);
                
                // Apply slight gamma correction to enhance mid-tones
                const gammaCorrected = Math.pow(brightness / 255, 0.9) * 255;
                depthMap[y][x] = gammaCorrected;
            }
        }
        
        return depthMap;
    }
    
    /**
     * Apply edge detection for enhanced detail with brightness normalization
     */
    applyEdgeDetection(depthMap) {
        const height = depthMap.length;
        const width = depthMap[0].length;
        const enhanced = [];
        
        // Find max brightness for normalization
        let maxBrightness = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                maxBrightness = Math.max(maxBrightness, depthMap[y][x]);
            }
        }
        
        for (let y = 0; y < height; y++) {
            enhanced[y] = [];
            for (let x = 0; x < width; x++) {
                let edgeStrength = 0;
                
                // Sobel edge detection
                if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                    const gx = 
                        -depthMap[y-1][x-1] + depthMap[y-1][x+1] +
                        -2*depthMap[y][x-1] + 2*depthMap[y][x+1] +
                        -depthMap[y+1][x-1] + depthMap[y+1][x+1];
                    
                    const gy = 
                        -depthMap[y-1][x-1] - 2*depthMap[y-1][x] - depthMap[y-1][x+1] +
                        depthMap[y+1][x-1] + 2*depthMap[y+1][x] + depthMap[y+1][x+1];
                    
                    edgeStrength = Math.sqrt(gx * gx + gy * gy);
                }
                
                // Combine original brightness with edge detection
                let combined = depthMap[y][x] + edgeStrength * 0.4;
                
                // Normalize to prevent overexposure while keeping detail
                if (maxBrightness > 0) {
                    combined = (combined / maxBrightness) * 220; // Cap at 220 instead of 255
                }
                
                enhanced[y][x] = Math.min(220, combined);
            }
        }
        
        return enhanced;
    }
    
    /**
     * Create a 3D-ready depth map with center scaling
     */
    create3DDepthMap(emoji, width, height) {
        const depthMap = this.emojiToDepthMap(emoji, width, height);
        const enhanced = this.applyEdgeDetection(depthMap);
        
        // Add depth information (center is "closer")
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const depthFactor = 1 - (dist / maxDist) * 0.3; // Subtle depth curve
                
                enhanced[y][x] *= depthFactor;
            }
        }
        
        return enhanced;
    }
    
    /**
     * Convert custom uploaded image to depth map
     */
    imageToDepthMap(image, width, height) {
        // Calculate the best fit for the image
        const imgAspect = image.width / image.height;
        const canvasAspect = this.size / this.size;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgAspect > canvasAspect) {
            // Image is wider
            drawWidth = this.size;
            drawHeight = this.size / imgAspect;
            offsetX = 0;
            offsetY = (this.size - drawHeight) / 2;
        } else {
            // Image is taller or square
            drawHeight = this.size;
            drawWidth = this.size * imgAspect;
            offsetX = (this.size - drawWidth) / 2;
            offsetY = 0;
        }
        
        // Clear and draw image
        this.ctx.clearRect(0, 0, this.size, this.size);
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.size, this.size);
        this.ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        
        // Get image data
        const imageData = this.ctx.getImageData(0, 0, this.size, this.size);
        const data = imageData.data;
        
        // Create depth map
        const depthMap = [];
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                // Map to source canvas coordinates
                const srcX = Math.floor((x / width) * this.size);
                const srcY = Math.floor((y / height) * this.size);
                const idx = (srcY * this.size + srcX) * 4;
                
                // Calculate brightness from RGBA
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];
                
                // Weighted brightness with alpha (perceptual luminance)
                const brightness = (r * 0.299 + g * 0.587 + b * 0.114) * (a / 255);
                
                // Apply gamma correction
                const gammaCorrected = Math.pow(brightness / 255, 0.9) * 255;
                depthMap[y][x] = gammaCorrected;
            }
        }
        
        return depthMap;
    }
    
    /**
     * Create a 3D-ready depth map from uploaded image
     */
    create3DDepthMapFromImage(image, width, height) {
        const depthMap = this.imageToDepthMap(image, width, height);
        const enhanced = this.applyEdgeDetection(depthMap);
        
        // Add depth information (center is "closer")
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const depthFactor = 1 - (dist / maxDist) * 0.3; // Subtle depth curve
                
                enhanced[y][x] *= depthFactor;
            }
        }
        
        return enhanced;
    }
}

window.EmojiConverter = EmojiConverter;

