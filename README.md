# ASCII Sandbox

Convert images and emojis to animated ASCII art.

## Quick Start

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000)

## What It Does

Real-time ASCII art rendering with 3D rotation, animated backgrounds, and smooth transitions. Upload any image or pick from the emoji keyboard.

## Controls

**Keyboard:** QWERTY keys select emojis/shapes  
**Tab:** Switch between emoji and geometric keyboards  
**Upload:** Click the button to convert your own images  
**Settings:** Top right corner (⚙️)

## Tech Stack

- Next.js 14
- Canvas API for rendering
- Pure JavaScript modules (no dependencies for core rendering)

## Structure

```
public/
  ├── asciiRenderer.js    # Canvas rendering engine
  ├── emojiConverter.js   # Image → ASCII conversion
  ├── rotation3D.js       # 3D transforms
  ├── backgrounds.js      # Animated effects
  ├── transitions.js      # Morph effects
  └── geometricShapes.js  # Parametric shapes

app/
  ├── page.tsx           # Main component
  ├── layout.tsx         # App shell
  └── globals.css        # Styles
```

## Features

- 5 background effects (matrix, particles, waves, starfield, geometric)
- 5 transition effects (crossfade, zoom, spiral, dissolve, morph)
- 10 animation styles (float, rotate, pulse, wave, etc.)
- 8 character sets (detailed, blocks, dots, lines, etc.)
- 3 themes (dark, light, P3 blue)
- Adaptive contrast for uploaded images
- Mobile-optimized touch controls

## License

MIT
