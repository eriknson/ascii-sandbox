/**
 * Geometric Shapes Generator
 * Creates programmatic geometric shapes with embedded animations
 */

class GeometricShapes {
    constructor() {
        this.time = 0;
    }
    
    /**
     * Generate a depth map for a given shape
     */
    generateShape(shapeName, width, height, time = 0) {
        this.time = time;
        
        switch(shapeName) {
            case 'circle':
                return this.createCircle(width, height);
            case 'square':
                return this.createSquare(width, height);
            case 'triangle':
                return this.createTriangle(width, height);
            case 'venn':
                return this.createVennDiagram(width, height);
            case 'diamond':
                return this.createDiamond(width, height);
            case 'hexagon':
                return this.createHexagon(width, height);
            case 'star':
                return this.createStar(width, height);
            case 'heart':
                return this.createHeart(width, height);
            case 'infinity':
                return this.createInfinity(width, height);
            case 'spiral':
                return this.createSpiral(width, height);
            case 'mandala':
                return this.createMandala(width, height);
            case 'wave':
                return this.createWave(width, height);
            case 'cube':
                return this.createCursorCube(width, height);
            default:
                return this.createCircle(width, height);
        }
    }
    
    /**
     * Create a circle with smooth gradient
     */
    createCircle(width, height) {
        const depthMap = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.42;
        
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < radius) {
                    // Smooth gradient from center to edge with better distribution
                    const normalizedDist = dist / radius;
                    const brightness = 255 * Math.pow(1 - normalizedDist, 1.5);
                    depthMap[y][x] = brightness;
                } else {
                    depthMap[y][x] = 0;
                }
            }
        }
        
        return depthMap;
    }
    
    /**
     * Create a square
     */
    createSquare(width, height) {
        const depthMap = [];
        const size = Math.min(width, height) * 0.6;
        const startX = (width - size) / 2;
        const startY = (height - size) / 2;
        const centerX = width / 2;
        const centerY = height / 2;
        
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                if (x >= startX && x < startX + size && y >= startY && y < startY + size) {
                    // Distance to center for gradient
                    const dx = x - centerX;
                    const dy = y - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = size * 0.7;
                    const brightness = 255 * Math.max(0, 1 - dist / maxDist);
                    depthMap[y][x] = brightness;
                } else {
                    depthMap[y][x] = 0;
                }
            }
        }
        
        return depthMap;
    }
    
    /**
     * Create a triangle
     */
    createTriangle(width, height) {
        const depthMap = [];
        const centerX = width / 2;
        const size = Math.min(width, height) * 0.7;
        
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                // Equilateral triangle pointing up
                const ty = y - height * 0.2;
                const triangleWidth = (ty / size) * size;
                
                if (ty > 0 && ty < size && Math.abs(x - centerX) < triangleWidth / 2) {
                    const distFromCenter = Math.abs(x - centerX) / (triangleWidth / 2);
                    const brightness = 255 * (1 - distFromCenter * 0.7);
                    depthMap[y][x] = brightness;
                } else {
                    depthMap[y][x] = 0;
                }
            }
        }
        
        return depthMap;
    }
    
    /**
     * Create Venn diagram - THREE circles converging together
     * Two from the sides (left/right) and one from the top
     */
    createVennDiagram(width, height) {
        const depthMap = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.32;
        
        // Smooth animation: circles move together and apart
        const animPhase = (Math.sin(this.time * 0.35) + 1) / 2; // 0 to 1
        
        // Separation distance for horizontal circles
        const maxSeparationH = radius * 1.4;
        const minSeparationH = radius * 0.4;
        const separationH = minSeparationH + (maxSeparationH - minSeparationH) * Math.abs(animPhase - 0.5) * 2;
        
        // Separation distance for top circle
        const maxSeparationV = radius * 1.2;
        const minSeparationV = radius * 0.3;
        const separationV = minSeparationV + (maxSeparationV - minSeparationV) * Math.abs(animPhase - 0.5) * 2;
        
        // Bottom left circle
        const circle1X = centerX - separationH / 2;
        const circle1Y = centerY + separationV * 0.4;
        
        // Bottom right circle
        const circle2X = centerX + separationH / 2;
        const circle2Y = centerY + separationV * 0.4;
        
        // Top circle - keep it lower to avoid clipping
        const circle3X = centerX;
        const circle3Y = centerY - separationV * 0.7;
        
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                // Distance to circle 1 (bottom left)
                const dx1 = x - circle1X;
                const dy1 = y - circle1Y;
                const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
                
                // Distance to circle 2 (bottom right)
                const dx2 = x - circle2X;
                const dy2 = y - circle2Y;
                const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                
                // Distance to circle 3 (top)
                const dx3 = x - circle3X;
                const dy3 = y - circle3Y;
                const dist3 = Math.sqrt(dx3 * dx3 + dy3 * dy3);
                
                const inCircle1 = dist1 < radius;
                const inCircle2 = dist2 < radius;
                const inCircle3 = dist3 < radius;
                
                let brightness = 0;
                
                // Count how many circles this point is in
                const overlapCount = (inCircle1 ? 1 : 0) + (inCircle2 ? 1 : 0) + (inCircle3 ? 1 : 0);
                
                if (overlapCount === 3) {
                    // ALL THREE CIRCLES overlap - brightest region!
                    brightness = 255;
                } else if (overlapCount === 2) {
                    // TWO CIRCLES overlap - bright
                    brightness = 220;
                } else if (overlapCount === 1) {
                    // SINGLE CIRCLE - solid and distinct
                    let dist = 0;
                    if (inCircle1) dist = dist1;
                    else if (inCircle2) dist = dist2;
                    else if (inCircle3) dist = dist3;
                    
                    const edgeDist = radius - dist;
                    const edgeSoftness = Math.min(1, edgeDist / (radius * 0.15));
                    brightness = 170 * edgeSoftness;
                }
                
                depthMap[y][x] = brightness;
            }
        }
        
        return depthMap;
    }
    
    /**
     * Create a diamond
     */
    createDiamond(width, height) {
        const depthMap = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const size = Math.min(width, height) * 0.6;
        
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                const dx = Math.abs(x - centerX);
                const dy = Math.abs(y - centerY);
                const dist = dx + dy;
                
                if (dist < size / 2) {
                    const brightness = 255 * (1 - dist / (size / 2));
                    depthMap[y][x] = brightness;
                } else {
                    depthMap[y][x] = 0;
                }
            }
        }
        
        return depthMap;
    }
    
    /**
     * Create a hexagon
     */
    createHexagon(width, height) {
        const depthMap = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.4;
        
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const angle = Math.atan2(dy, dx);
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Hexagon formula
                const hexAngle = Math.abs(((angle + Math.PI) % (Math.PI / 3)) - Math.PI / 6);
                const hexRadius = radius / Math.cos(hexAngle);
                
                if (dist < hexRadius) {
                    const brightness = 255 * (1 - dist / hexRadius);
                    depthMap[y][x] = brightness;
                } else {
                    depthMap[y][x] = 0;
                }
            }
        }
        
        return depthMap;
    }
    
    /**
     * Create a star
     */
    createStar(width, height) {
        const depthMap = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const outerRadius = Math.min(width, height) * 0.4;
        const innerRadius = outerRadius * 0.4;
        const points = 5;
        
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const angle = Math.atan2(dy, dx) + Math.PI / 2;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Calculate star radius at this angle
                const angleSegment = (angle + Math.PI * 2) % (Math.PI * 2 / points);
                const angleFactor = angleSegment / (Math.PI * 2 / points);
                const radius = innerRadius + (outerRadius - innerRadius) * Math.abs(Math.cos(angleFactor * Math.PI));
                
                if (dist < radius) {
                    const brightness = 255 * (1 - dist / radius);
                    depthMap[y][x] = brightness;
                } else {
                    depthMap[y][x] = 0;
                }
            }
        }
        
        return depthMap;
    }
    
    /**
     * Create a heart
     */
    createHeart(width, height) {
        const depthMap = [];
        const centerX = width / 2;
        const centerY = height / 2.5;
        const scale = Math.min(width, height) * 0.02;
        
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                const tx = (x - centerX) / scale;
                const ty = (centerY - y) / scale;
                
                // Heart equation
                const heartValue = Math.pow(tx * tx + ty * ty - 1, 3) - tx * tx * ty * ty * ty;
                
                if (heartValue < 0) {
                    const dist = Math.sqrt(tx * tx + ty * ty);
                    const brightness = 255 * Math.max(0, 1 - dist / 20);
                    depthMap[y][x] = brightness;
                } else {
                    depthMap[y][x] = 0;
                }
            }
        }
        
        return depthMap;
    }
    
    /**
     * Create infinity symbol
     */
    createInfinity(width, height) {
        const depthMap = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const a = Math.min(width, height) * 0.25;
        
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                
                // Lemniscate of Bernoulli
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                const r = a * Math.sqrt(2 * Math.cos(2 * angle));
                
                if (!isNaN(r) && dist < r + 5) {
                    const brightness = 255 * Math.max(0, 1 - Math.abs(dist - r) / 5);
                    depthMap[y][x] = Math.max(depthMap[y][x] || 0, brightness);
                } else {
                    depthMap[y][x] = depthMap[y][x] || 0;
                }
            }
        }
        
        return depthMap;
    }
    
    /**
     * Create spiral
     */
    createSpiral(width, height) {
        const depthMap = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) * 0.45;
        
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                // Archimedean spiral
                const spiralDist = (angle + Math.PI * 6) / (Math.PI * 2) * maxRadius / 3;
                const distFromSpiral = Math.abs(dist - spiralDist);
                
                if (distFromSpiral < 3 && dist < maxRadius) {
                    const brightness = 255 * (1 - distFromSpiral / 3) * (1 - dist / maxRadius);
                    depthMap[y][x] = brightness;
                } else {
                    depthMap[y][x] = 0;
                }
            }
        }
        
        return depthMap;
    }
    
    /**
     * Create mandala pattern
     */
    createMandala(width, height) {
        const depthMap = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) * 0.45;
        
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                if (dist < maxRadius) {
                    // Multiple layers of patterns
                    const pattern1 = Math.sin(dist * 0.5) * 0.5 + 0.5;
                    const pattern2 = Math.cos(angle * 8) * 0.5 + 0.5;
                    const pattern3 = Math.sin(dist * 0.2 - angle * 4) * 0.5 + 0.5;
                    
                    const combined = (pattern1 + pattern2 + pattern3) / 3;
                    const brightness = 255 * combined * (1 - dist / maxRadius);
                    depthMap[y][x] = brightness;
                } else {
                    depthMap[y][x] = 0;
                }
            }
        }
        
        return depthMap;
    }
    
    /**
     * Create wave pattern with flowing animation
     */
    createWave(width, height) {
        const depthMap = [];
        const centerY = height / 2;
        
        for (let y = 0; y < height; y++) {
            depthMap[y] = [];
            for (let x = 0; x < width; x++) {
                // Primary wave moving horizontally
                const wave1 = Math.sin(x * 0.15 + this.time * 3);
                // Secondary wave for depth
                const wave2 = Math.cos(x * 0.1 - this.time * 2);
                // Vertical modulation
                const verticalMod = Math.sin(y * 0.2);
                
                const combined = (wave1 * 0.6 + wave2 * 0.3 + verticalMod * 0.1);
                
                // Distance from center for vignette effect
                const distFromCenter = Math.abs(y - centerY) / (height / 2);
                const vignette = Math.pow(1 - distFromCenter, 2);
                
                const brightness = 255 * ((combined + 1) / 2) * vignette;
                depthMap[y][x] = Math.max(0, brightness);
            }
        }
        
        return depthMap;
    }
    
    /**
     * Create Cursor logo cube - Full 3D rotating cube with all 6 sides
     */
    createCursorCube(width, height) {
        const depthMap = [];
        
        // Initialize
        for (let y = 0; y < height; y++) {
            depthMap[y] = new Array(width).fill(0);
        }
        
        const cx = width / 2;
        const cy = height / 2;
        const cubeSize = Math.min(width, height) * 0.35; // Bigger cube
        
        // Continuous rotation
        const angleY = this.time * 0.8; // Rotate around Y axis
        const angleX = Math.PI / 7;     // Slightly less tilt for better face visibility
        
        // Define all 8 vertices of the cube in 3D space
        const vertices3D = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],  // back
            [-1, -1,  1], [1, -1,  1], [1, 1,  1], [-1, 1,  1]   // front
        ];
        
        // Apply rotations
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        
        const rotated = vertices3D.map(([x, y, z]) => {
            // Rotate around Y axis
            let xr = x * cosY - z * sinY;
            let yr = y;
            let zr = x * sinY + z * cosY;
            
            // Rotate around X axis
            let xr2 = xr;
            let yr2 = yr * cosX - zr * sinX;
            let zr2 = yr * sinX + zr * cosX;
            
            return [xr2, yr2, zr2];
        });
        
        // Project to 2D
        const projected = rotated.map(([x, y, z]) => {
            const scale = cubeSize;
            const perspective = 4;
            const factor = perspective / (perspective + z);
            return [
                cx + x * scale * factor,
                cy + y * scale * factor,
                z
            ];
        });
        
        // Define all 6 faces with their vertices
        const faces = [
            { name: 'front',  indices: [4, 5, 6, 7], color: 150 },
            { name: 'back',   indices: [1, 0, 3, 2], color: 120 },
            { name: 'top',    indices: [3, 2, 6, 7], color: 210 },
            { name: 'bottom', indices: [0, 1, 5, 4], color: 100 },
            { name: 'left',   indices: [0, 4, 7, 3], color: 85 },
            { name: 'right',  indices: [1, 5, 6, 2], color: 67 }
        ];
        
        // Calculate visibility and depth for each face
        const visibleFaces = [];
        
        faces.forEach(face => {
            const v0 = rotated[face.indices[0]];
            const v1 = rotated[face.indices[1]];
            const v2 = rotated[face.indices[2]];
            
            // Calculate face normal (cross product)
            const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
            const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
            
            const normal = [
                edge1[1] * edge2[2] - edge1[2] * edge2[1],
                edge1[2] * edge2[0] - edge1[0] * edge2[2],
                edge1[0] * edge2[1] - edge1[1] * edge2[0]
            ];
            
            // View direction (0, 0, 1) - camera looking down Z axis
            const viewDot = normal[2];
            
            // Face is visible if normal points toward camera
            // Use negative threshold to keep faces visible longer (prevents blinking)
            if (viewDot > -0.1) {
                const avgZ = face.indices.reduce((sum, i) => sum + rotated[i][2], 0) / 4;
                
                // Calculate opacity based on angle for smoother transitions
                const opacity = Math.max(0, Math.min(1, (viewDot + 0.1) / 0.3));
                
                visibleFaces.push({
                    name: face.name,
                    indices: face.indices,
                    color: face.color,
                    depth: avgZ,
                    opacity: opacity,
                    points: face.indices.map(i => projected[i])
                });
            }
        });
        
        // Sort by depth (back to front)
        visibleFaces.sort((a, b) => a.depth - b.depth);
        
        // Render each visible face
        visibleFaces.forEach(face => {
            // Apply opacity to color for smoother transitions
            const adjustedColor = Math.floor(face.color * face.opacity);
            
            // Draw base face
            this.fillFace(depthMap, face.points, adjustedColor, width, height);
            
            // Add white triangle highlights for top and right faces
            // (the iconic Cursor logo pattern)
            if (face.name === 'top' && face.opacity > 0.5) {
                // Right half white
                const tri = [face.points[1], face.points[2], face.points[3]];
                const whiteOpacity = Math.floor(255 * face.opacity);
                this.fillFace(depthMap, tri, whiteOpacity, width, height);
            }
            
            if (face.name === 'right' && face.opacity > 0.5) {
                // Top half white
                const tri = [face.points[0], face.points[1], face.points[2]];
                const whiteOpacity = Math.floor(255 * face.opacity);
                this.fillFace(depthMap, tri, whiteOpacity, width, height);
            }
        });
        
        return depthMap;
    }
    
    /**
     * Fill a face (quad or triangle)
     */
    fillFace(depthMap, pts, color, width, height) {
        const minX = Math.max(0, Math.floor(Math.min(...pts.map(p => p[0]))));
        const maxX = Math.min(width, Math.ceil(Math.max(...pts.map(p => p[0]))));
        const minY = Math.max(0, Math.floor(Math.min(...pts.map(p => p[1]))));
        const maxY = Math.min(height, Math.ceil(Math.max(...pts.map(p => p[1]))));
        
        for (let y = minY; y < maxY; y++) {
            for (let x = minX; x < maxX; x++) {
                if (pts.length === 3) {
                    if (this.pointInTri(x, y, pts)) {
                        depthMap[y][x] = color;
                    }
                } else {
                    if (this.pointInQuad(x, y, pts)) {
                        depthMap[y][x] = color;
                    }
                }
            }
        }
    }
    
    /**
     * Check if point is in quadrilateral
     */
    pointInQuad(x, y, pts) {
        let inside = false;
        for (let i = 0, j = 3; i < 4; j = i++) {
            const xi = pts[i][0], yi = pts[i][1];
            const xj = pts[j][0], yj = pts[j][1];
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }
    
    /**
     * Check if point is in triangle
     */
    pointInTri(x, y, pts) {
        let inside = false;
        for (let i = 0, j = 2; i < 3; j = i++) {
            const xi = pts[i][0], yi = pts[i][1];
            const xj = pts[j][0], yj = pts[j][1];
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }
    
    /**
     * Update time for animated shapes
     */
    updateTime(deltaTime) {
        this.time += deltaTime;
    }
}

window.GeometricShapes = GeometricShapes;

