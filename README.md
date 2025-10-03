# ASCII Emoji Animator 🎨

A dynamic web-based ASCII art animation system that converts emojis into rotating 3D ASCII art with animated backgrounds and smooth transitions.

## Features

### Core Functionality
- **20 Popular Emojis**: Quick access to the most-used emojis
- **3D Rotation**: Real-time 3D rotation with perspective projection
- **ASCII Gradient Rendering**: Sophisticated character density mapping
- **30 FPS Performance**: Optimized for smooth mobile and desktop experience

### Visual Effects
- **5 Background Animations**:
  - Matrix Rain: Classic falling characters
  - Particles: Floating particle field
  - Waves: Sine wave patterns
  - Starfield: Twinkling stars
  - Geometric: Animated geometric patterns

- **5 Transition Effects** (500ms duration):
  - Crossfade: Smooth alpha blending
  - Zoom: Scale in/out transition
  - Spiral: Rotating spiral reveal
  - Dissolve: Random pixel transition
  - Morph: Spatial distortion blend

### Controls
- **Emoji Selection**: Click/tap emojis or use arrow keys + Enter
- **Rotation Speed**: Adjustable slider (0.5x - 3x)
- **Effect Toggles**: Switch backgrounds and transitions on the fly
- **Responsive Design**: Works on mobile, tablet, and desktop

## Usage

### Quick Start
1. Open `index.html` in a modern web browser
2. Select an emoji from the keyboard at the bottom
3. Watch it rotate in 3D ASCII art!

### Keyboard Controls
- **Arrow Keys**: Navigate emoji selection
- **Enter**: Select highlighted emoji
- **Settings Button** (⚙️): Toggle settings panel

### Settings
- **Background Effect**: Choose your preferred animated background
- **Transition Effect**: Select how emojis transition
- **Rotation Speed**: Adjust rotation speed with slider

## Technical Details

### Architecture
- **Pure JavaScript**: No external dependencies for core rendering
- **HTML5 Canvas**: High-performance rendering
- **Modular Design**: Separated concerns into focused modules

### Files
- `index.html` - Main HTML structure
- `styles.css` - Responsive styling
- `main.js` - Application orchestration
- `asciiRenderer.js` - Core ASCII rendering engine
- `emojiConverter.js` - Emoji to depth map conversion
- `rotation3D.js` - 3D rotation and projection
- `backgrounds.js` - Background effect implementations
- `transitions.js` - Transition effect implementations

### Performance
- Target: 30 FPS on mobile devices
- Optimized character rendering
- Efficient buffer management
- Smooth 500ms transitions

## Browser Support
Works on all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript
- RequestAnimationFrame

## Development

### Phase 1 (MVP) ✅
- Core ASCII rendering engine
- 3D rotation system
- 20 emoji keyboard
- Matrix rain background
- Crossfade transition

### Phase 2 (In Progress)
- All 5 background effects
- All 5 transition effects
- Speed control slider
- Mobile optimization

### Phase 3 (Planned)
- Performance tuning
- Cross-device testing
- UI/UX polish
- Accessibility improvements

## Credits
Built with reference to ASCII art techniques from [ASCII Art Archive](https://www.asciiart.eu/glossary)

## License
MIT License - Feel free to use and modify!

