/**
 * ASCII Renderer Engine
 * Converts image data to ASCII art using gradient character mapping
 */

class ASCIIRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        
        // ASCII character sets for different styles
        this.characterSets = {
            detailed: [
                ' ', '.', '`', "'", ',', ':', ';', '"', '^', 
                '~', '-', '_', '+', '=', '<', '>', 'i', '!', 
                'l', 'I', '?', '/', '\\', '|', '(', ')', '1', 
                '{', '}', '[', ']', 'r', 'c', 'v', 'u', 'n', 
                'x', 'z', 'j', 'f', 't', 'L', 'C', 'J', 'U', 
                'Y', 'X', 'Z', 'O', 'Q', '0', 'o', 'a', 'h', 
                'k', 'b', 'd', 'p', 'q', 'w', 'm', '*', '#', 
                'M', 'W', '&', '8', '%', 'B', '@', '█'
            ],
            blocks: [
                ' ', '░', '▒', '▓', '█'
            ],
            dots: [
                ' ', '·', '•', '⋅', '∘', '○', '●', '◉', '⬤'
            ],
            lines: [
                ' ', '─', '│', '┼', '╬', '║', '═', '╫', '█'
            ],
            minimal: [
                ' ', '.', ':', '|', 'o', 'O', '#', '@', '█'
            ],
            geometric: [
                ' ', '▫', '▪', '◽', '◾', '▢', '▣', '■', '█'
            ],
            circles: [
                ' ', '◌', '○', '◍', '◎', '◐', '◑', '●', '⬤'
            ],
            stars: [
                ' ', '.', '·', '*', '✦', '✧', '★', '✪', '✯'
            ]
        };
        
        // Default character set
        this.charSet = this.characterSets.detailed;
        this.currentStyle = 'detailed';
        
        // Character dimensions (smaller for more detail)
        this.charWidth = 6;
        this.charHeight = 12;
        
        // Grid dimensions (will be calculated, but these are minimums)
        this.cols = 100;
        this.rows = 60;
        
        // Setup canvas
        this.setupCanvas();
        
        // Double buffer for smooth transitions
        this.bufferA = this.createBuffer();
        this.bufferB = this.createBuffer();
        this.currentBuffer = this.bufferA;
    }
    
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        
        // Calculate canvas size based on viewport (full screen)
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;
        
        // Calculate optimal grid size
        this.cols = Math.floor(maxWidth / this.charWidth);
        this.rows = Math.floor(maxHeight / this.charHeight);
        
        // Ensure minimum size and higher maximum for more detail
        this.cols = Math.max(80, Math.min(200, this.cols));
        this.rows = Math.max(50, Math.min(120, this.rows));
        
        this.canvas.width = this.cols * this.charWidth * dpr;
        this.canvas.height = this.rows * this.charHeight * dpr;
        this.canvas.style.width = `${this.cols * this.charWidth}px`;
        this.canvas.style.height = `${this.rows * this.charHeight}px`;
        
        this.ctx.scale(dpr, dpr);
        this.ctx.imageSmoothingEnabled = false;
        
        // Set font with bold for better visibility
        this.ctx.font = `bold ${this.charHeight}px "Courier New", monospace`;
        this.ctx.textBaseline = 'top';
        this.ctx.textAlign = 'left';
    }
    
    createBuffer() {
        const buffer = [];
        for (let y = 0; y < this.rows; y++) {
            buffer[y] = [];
            for (let x = 0; x < this.cols; x++) {
                buffer[y][x] = {
                    char: ' ',
                    brightness: 0
                };
            }
        }
        return buffer;
    }
    
    /**
     * Map brightness value (0-255) to ASCII character
     */
    brightnessToChar(brightness) {
        const index = Math.floor((brightness / 255) * (this.charSet.length - 1));
        return this.charSet[Math.max(0, Math.min(this.charSet.length - 1, index))];
    }
    
    /**
     * Map brightness to color based on theme
     */
    brightnessToColor(brightness, theme = 'dark') {
        // Compress the upper range to prevent harsh whites
        const compressed = Math.pow(brightness / 255, 0.85) * 200;
        const intensity = compressed / 200;
        
        switch(theme) {
            case 'light':
                // Light mode: invert (bright background, dark text)
                const gray = Math.floor(255 - compressed);
                return `rgb(${gray}, ${gray}, ${gray})`;
                
            case 'blue':
                // P3 Blue theme: vibrant blue gradient on dark blue background
                const r = Math.floor(intensity * 80);
                const g = Math.floor(100 + intensity * 155);
                const b = Math.floor(180 + intensity * 75);
                return `color(display-p3 ${r/255} ${g/255} ${b/255})`;
                
            case 'dark':
            default:
                // Dark mode: normal grayscale
                const grayDark = Math.floor(compressed);
                return `rgb(${grayDark}, ${grayDark}, ${grayDark})`;
        }
    }
    
    /**
     * Set a character in the buffer
     */
    setChar(buffer, x, y, brightness) {
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            buffer[y][x] = {
                char: this.brightnessToChar(brightness),
                brightness: brightness
            };
        }
    }
    
    /**
     * Clear the buffer
     */
    clearBuffer(buffer) {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                buffer[y][x] = {
                    char: ' ',
                    brightness: 0
                };
            }
        }
    }
    
    /**
     * Render the buffer to canvas
     */
    render(buffer = this.currentBuffer, backgroundBuffer = null, theme = 'dark') {
        // Clear canvas with appropriate background
        let bgColor = '#000000';
        if (theme === 'light') bgColor = '#FFFFFF';
        if (theme === 'blue') bgColor = '#0a0e27'; // Deep blue background
        
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render background if provided (more visible)
        if (backgroundBuffer) {
            for (let y = 0; y < this.rows; y++) {
                for (let x = 0; x < this.cols; x++) {
                    const bgCell = backgroundBuffer[y][x];
                    if (bgCell.brightness > 0) {
                        // Increased background visibility from 0.3 to 0.5
                        this.ctx.fillStyle = this.brightnessToColor(bgCell.brightness * 0.5, theme);
                        this.ctx.fillText(
                            bgCell.char,
                            x * this.charWidth,
                            y * this.charHeight
                        );
                    }
                }
            }
        }
        
        // Render main content
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = buffer[y][x];
                if (cell.brightness > 0) {
                    this.ctx.fillStyle = this.brightnessToColor(cell.brightness, theme);
                    this.ctx.fillText(
                        cell.char,
                        x * this.charWidth,
                        y * this.charHeight
                    );
                }
            }
        }
    }
    
    /**
     * Set character style
     */
    setCharacterStyle(style) {
        if (this.characterSets[style]) {
            this.charSet = this.characterSets[style];
            this.currentStyle = style;
        }
    }
    
    /**
     * Blend two buffers for transition effects
     */
    blendBuffers(bufferA, bufferB, alpha) {
        const blended = this.createBuffer();
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const brightnessA = bufferA[y][x].brightness;
                const brightnessB = bufferB[y][x].brightness;
                const blendedBrightness = brightnessA * (1 - alpha) + brightnessB * alpha;
                
                blended[y][x] = {
                    char: this.brightnessToChar(blendedBrightness),
                    brightness: blendedBrightness
                };
            }
        }
        
        return blended;
    }
    
    /**
     * Resize handler
     */
    resize() {
        this.setupCanvas();
        this.bufferA = this.createBuffer();
        this.bufferB = this.createBuffer();
        this.currentBuffer = this.bufferA;
    }
}

window.ASCIIRenderer = ASCIIRenderer;

