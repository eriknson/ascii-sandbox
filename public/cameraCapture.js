/**
 * Camera Capture Module
 * Captures webcam feed and converts to ASCII in real-time
 */

class CameraCapture {
    constructor(emojiConverter) {
        this.converter = emojiConverter;
        this.video = null;
        this.stream = null;
        this.isActive = false;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }
    
    async start() {
        if (this.isActive) {
            return true;
        }
        
        try {
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            
            // Create video element if it doesn't exist
            if (!this.video) {
                this.video = document.createElement('video');
                this.video.autoplay = true;
                this.video.playsInline = true;
            }
            
            this.video.srcObject = this.stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    resolve();
                };
            });
            
            // Setup canvas for capturing frames
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            this.isActive = true;
            console.log('Camera started successfully');
            return true;
        } catch (error) {
            console.error('Failed to start camera:', error);
            alert('Failed to access camera. Please ensure you have granted camera permissions.');
            return false;
        }
    }
    
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
        
        this.isActive = false;
        console.log('Camera stopped');
    }
    
    captureFrame(renderer) {
        if (!this.isActive || !this.video || !this.video.readyState || this.video.readyState < 2) {
            return null;
        }
        
        try {
            // Draw current video frame to canvas
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Convert to depth map using existing converter
            // Pass the canvas directly - it works like an image element
            const imgWidth = Math.min(180, Math.floor(renderer.cols * 0.95));
            const imgHeight = Math.min(140, Math.floor(renderer.rows * 0.95));
            
            // Create depth map from canvas (canvas can be used like an image)
            return this.converter.create3DDepthMapFromImage(this.canvas, imgWidth, imgHeight);
        } catch (error) {
            console.error('Failed to capture frame:', error);
            return null;
        }
    }
    
    getIsActive() {
        return this.isActive;
    }
}

window.CameraCapture = CameraCapture;

