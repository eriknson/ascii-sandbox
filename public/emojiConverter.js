/**
 * Emoji Converter
 * Converts emoji to depth map for ASCII rendering
 */

class EmojiConverter {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.size = 512; // Increased base render size for much more detail
        this.canvas.width = this.size;
        this.canvas.height = this.size;
    }
    
    /**
     * Bilinear interpolation for smooth sampling
     */
    bilinearSample(data, x, y, width) {
        const x0 = Math.floor(x);
        const x1 = Math.min(x0 + 1, width - 1);
        const y0 = Math.floor(y);
        const y1 = Math.min(y0 + 1, width - 1);
        
        const fx = x - x0;
        const fy = y - y0;
        
        const getPixel = (px, py) => {
            const idx = (py * width + px) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            return (r * 0.299 + g * 0.587 + b * 0.114) * (a / 255);
        };
        
        const c00 = getPixel(x0, y0);
        const c10 = getPixel(x1, y0);
        const c01 = getPixel(x0, y1);
        const c11 = getPixel(x1, y1);
        
        const c0 = c00 * (1 - fx) + c10 * fx;
        const c1 = c01 * (1 - fx) + c11 * fx;
        
        return c0 * (1 - fy) + c1 * fy;
    }
    
    /**
     * Gaussian blur for unsharp masking
     */
    gaussianBlur(depthMap, radius = 1) {
        const height = depthMap.length;
        const width = depthMap[0].length;
        const blurred = [];
        const sigma = radius / 2;
        const kernelSize = Math.ceil(radius * 2) * 2 + 1;
        const kernel = [];
        let kernelSum = 0;
        
        // Generate Gaussian kernel
        const center = Math.floor(kernelSize / 2);
        for (let i = 0; i < kernelSize; i++) {
            const x = i - center;
            const value = Math.exp(-(x * x) / (2 * sigma * sigma));
            kernel.push(value);
            kernelSum += value;
        }
        
        // Normalize kernel
        for (let i = 0; i < kernelSize; i++) {
            kernel[i] /= kernelSum;
        }
        
        // Apply separable Gaussian blur (horizontal then vertical)
        const temp = [];
        
        // Horizontal pass
        for (let y = 0; y < height; y++) {
            temp[y] = [];
            for (let x = 0; x < width; x++) {
                let sum = 0;
                for (let k = 0; k < kernelSize; k++) {
                    const sx = x + k - center;
                    const sample = sx >= 0 && sx < width ? depthMap[y][sx] : 0;
                    sum += sample * kernel[k];
                }
                temp[y][x] = sum;
            }
        }
        
        // Vertical pass
        for (let y = 0; y < height; y++) {
            blurred[y] = [];
            for (let x = 0; x < width; x++) {
                let sum = 0;
                for (let k = 0; k < kernelSize; k++) {
                    const sy = y + k - center;
                    const sample = sy >= 0 && sy < height ? temp[sy][x] : 0;
                    sum += sample * kernel[k];
                }
                blurred[y][x] = sum;
            }
        }
        
        return blurred;
    }
    
    /**
     * Unsharp mask for detail enhancement
     */
    applyUnsharpMask(depthMap, amount = 1.5, radius = 1.5) {
        const height = depthMap.length;
        const width = depthMap[0].length;
        const blurred = this.gaussianBlur(depthMap, radius);
        const sharpened = [];
        
        for (let y = 0; y < height; y++) {
            sharpened[y] = [];
            for (let x = 0; x < width; x++) {
                const original = depthMap[y][x];
                const detail = original - blurred[y][x];
                const enhanced = original + detail * amount;
                sharpened[y][x] = Math.max(0, Math.min(255, enhanced));
            }
        }
        
        return sharpened;
    }
    
    /**
     * CLAHE (Contrast Limited Adaptive Histogram Equalization)
     */
    applyCLAHE(depthMap, tileSize = 8, clipLimit = 2.0) {
        const height = depthMap.length;
        const width = depthMap[0].length;
        const enhanced = [];
        
        // Initialize output
        for (let y = 0; y < height; y++) {
            enhanced[y] = [];
            for (let x = 0; x < width; x++) {
                enhanced[y][x] = 0;
            }
        }
        
        const numTilesY = Math.ceil(height / tileSize);
        const numTilesX = Math.ceil(width / tileSize);
        
        // Process each tile
        for (let ty = 0; ty < numTilesY; ty++) {
            for (let tx = 0; tx < numTilesX; tx++) {
                const y0 = ty * tileSize;
                const x0 = tx * tileSize;
                const y1 = Math.min(y0 + tileSize, height);
                const x1 = Math.min(x0 + tileSize, width);
                
                // Build histogram for this tile
                const histogram = new Array(256).fill(0);
                let pixelCount = 0;
                
                for (let y = y0; y < y1; y++) {
                    for (let x = x0; x < x1; x++) {
                        const bin = Math.floor(depthMap[y][x]);
                        histogram[bin]++;
                        pixelCount++;
                    }
                }
                
                // Apply clip limit
                const clipValue = Math.floor((clipLimit * pixelCount) / 256);
                let clippedTotal = 0;
                
                for (let i = 0; i < 256; i++) {
                    if (histogram[i] > clipValue) {
                        clippedTotal += histogram[i] - clipValue;
                        histogram[i] = clipValue;
                    }
                }
                
                // Redistribute clipped pixels
                const redistributePerBin = Math.floor(clippedTotal / 256);
                for (let i = 0; i < 256; i++) {
                    histogram[i] += redistributePerBin;
                }
                
                // Build cumulative distribution function
                const cdf = new Array(256);
                cdf[0] = histogram[0];
                for (let i = 1; i < 256; i++) {
                    cdf[i] = cdf[i - 1] + histogram[i];
                }
                
                // Normalize CDF
                const cdfMin = cdf.find(v => v > 0) || 0;
                const cdfMax = cdf[255];
                const cdfRange = cdfMax - cdfMin;
                
                // Create lookup table
                const lut = new Array(256);
                for (let i = 0; i < 256; i++) {
                    if (cdfRange > 0) {
                        lut[i] = ((cdf[i] - cdfMin) / cdfRange) * 255;
                    } else {
                        lut[i] = i;
                    }
                }
                
                // Apply to pixels in tile
                for (let y = y0; y < y1; y++) {
                    for (let x = x0; x < x1; x++) {
                        const bin = Math.floor(depthMap[y][x]);
                        enhanced[y][x] = lut[bin];
                    }
                }
            }
        }
        
        return enhanced;
    }
    
    /**
     * Floyd-Steinberg dithering for smoother gradients
     */
    applyDithering(depthMap, numLevels = 64) {
        const height = depthMap.length;
        const width = depthMap[0].length;
        const dithered = [];
        
        // Copy depthMap to dithered array
        for (let y = 0; y < height; y++) {
            dithered[y] = [...depthMap[y]];
        }
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const oldPixel = dithered[y][x];
                const newPixel = Math.round((oldPixel / 255) * (numLevels - 1)) * (255 / (numLevels - 1));
                dithered[y][x] = newPixel;
                
                const error = oldPixel - newPixel;
                
                // Distribute error to neighboring pixels
                if (x + 1 < width) {
                    dithered[y][x + 1] += error * 7 / 16;
                }
                if (y + 1 < height) {
                    if (x > 0) {
                        dithered[y + 1][x - 1] += error * 3 / 16;
                    }
                    dithered[y + 1][x] += error * 5 / 16;
                    if (x + 1 < width) {
                        dithered[y + 1][x + 1] += error * 1 / 16;
                    }
                }
            }
        }
        
        return dithered;
    }
    
    /**
     * Convert emoji to depth map with bilinear interpolation
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
        
        // Create depth map using bilinear interpolation
        const depthMap = [];
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                // Use bilinear interpolation for smooth sampling
                const srcX = (x / width) * this.size;
                const srcY = (y / height) * this.size;
                const brightness = this.bilinearSample(data, srcX, srcY, this.size);
                
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
     * Convert custom uploaded image to depth map with better contrast
     * Now uses bilinear interpolation for smoother sampling
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
        
        // First pass: collect all brightness values using bilinear interpolation
        const allBrightness = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcX = (x / width) * this.size;
                const srcY = (y / height) * this.size;
                const brightness = this.bilinearSample(data, srcX, srcY, this.size);
                allBrightness.push(brightness);
            }
        }
        
        // Calculate min and max for contrast stretching
        allBrightness.sort((a, b) => a - b);
        const minBright = allBrightness[Math.floor(allBrightness.length * 0.02)]; // 2nd percentile
        const maxBright = allBrightness[Math.floor(allBrightness.length * 0.98)]; // 98th percentile
        const range = maxBright - minBright;
        
        // Create depth map with bilinear interpolation and contrast enhancement
        const depthMap = [];
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                // Use bilinear interpolation for smooth sampling
                const srcX = (x / width) * this.size;
                const srcY = (y / height) * this.size;
                let brightness = this.bilinearSample(data, srcX, srcY, this.size);
                
                // Apply contrast stretching
                if (range > 0) {
                    brightness = ((brightness - minBright) / range) * 255;
                    brightness = Math.max(0, Math.min(255, brightness));
                }
                
                // Apply lighter gamma correction for better mid-tones
                const gammaCorrected = Math.pow(brightness / 255, 0.85) * 255;
                depthMap[y][x] = gammaCorrected;
            }
        }
        
        return depthMap;
    }
    
    /**
     * Create a 3D-ready depth map from uploaded image
     * Now uses enhanced processing pipeline: CLAHE -> Unsharp Mask -> Dithering
     */
    create3DDepthMapFromImage(image, width, height) {
        // Step 1: Get initial depth map with bilinear interpolation
        let depthMap = this.imageToDepthMap(image, width, height);
        
        // Step 2: Apply CLAHE for adaptive local contrast
        depthMap = this.applyCLAHE(depthMap, 8, 2.0);
        
        // Step 3: Apply unsharp masking for detail enhancement
        depthMap = this.applyUnsharpMask(depthMap, 1.2, 1.5);
        
        // Step 4: Apply Floyd-Steinberg dithering for smoother gradients
        depthMap = this.applyDithering(depthMap, 64);
        
        // Step 5: Add very subtle depth curve for uploaded images (much less than emojis)
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const depthFactor = 1 - (dist / maxDist) * 0.1; // Very subtle depth curve
                
                depthMap[y][x] *= depthFactor;
            }
        }
        
        return depthMap;
    }
    
    /**
     * Apply lighter edge detection specifically for uploaded images
     * Less aggressive to maintain recognizability
     */
    applyLightEdgeDetection(depthMap) {
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
                
                // Lighter Sobel edge detection
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
                
                // Use less edge enhancement and more original brightness
                let combined = depthMap[y][x] + edgeStrength * 0.2; // Reduced from 0.4
                
                // Normalize with brightness boost for better contrast
                if (maxBrightness > 0) {
                    combined = (combined / maxBrightness) * 240; // Higher cap
                }
                
                enhanced[y][x] = Math.min(255, combined);
            }
        }
        
        return enhanced;
    }
}

window.EmojiConverter = EmojiConverter;

