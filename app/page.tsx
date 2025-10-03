'use client'

import { useEffect, useRef } from 'react'

export default function Home() {
  const scriptsLoaded = useRef(false)
  const appInitialized = useRef(false)

  useEffect(() => {
    // Only load scripts once
    if (scriptsLoaded.current) {
      // If scripts are already loaded, just initialize the app
      if (!appInitialized.current && window.ASCIIRenderer) {
        initializeApp()
      }
      return
    }

    // Load scripts dynamically
    const scripts = [
      '/asciiRenderer.js',
      '/emojiConverter.js',
      '/rotation3D.js',
      '/backgrounds.js',
      '/transitions.js',
      '/geometricShapes.js',
    ]

    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        // Check if script already exists
        const existing = document.querySelector(`script[src="${src}"]`)
        if (existing) {
          resolve(null)
          return
        }

        const script = document.createElement('script')
        script.src = src
        script.async = false
        script.onload = resolve
        script.onerror = reject
        document.body.appendChild(script)
      })
    }

    const initializeApp = () => {
      if (appInitialized.current || !window.ASCIIRenderer) return
      
      try {
        const canvas = document.getElementById('ascii-canvas')
        if (!canvas) {
          console.error('Canvas not found')
          return
        }

        // @ts-ignore
        const renderer = new window.ASCIIRenderer(canvas)
        // @ts-ignore
        const converter = new window.EmojiConverter()
        // @ts-ignore
        const rotation = new window.Rotation3D(renderer)
        // @ts-ignore
        const background = new window.BackgroundEffects(renderer)
        // @ts-ignore
        const transition = new window.TransitionEffects(renderer)
        // @ts-ignore
        const geometricShapes = new window.GeometricShapes()

            // Set initial theme
            document.body.setAttribute('data-theme', 'dark')
            document.body.style.backgroundColor = '#000000'
            
            // Create app instance
            const app = {
              canvas,
              renderer,
              converter,
              rotation,
              background,
              transition,
              geometricShapes,
              currentEmoji: '💎',
              currentShape: null,
              currentDepthMap: null,
              uploadedImage: null,
              previousBuffer: renderer.createBuffer(),
              currentBuffer: renderer.createBuffer(),
              backgroundBuffer: renderer.createBuffer(),
              lastTime: performance.now(),
              isRunning: false,
              theme: 'dark',
              keyboardMode: 'emoji', // 'emoji' or 'geometric'
            }

        // Setup UI
        setupUI(app)
        
        // Load initial emoji
        loadEmoji(app, '💎')
        
        // Start animation
        start(app)
        
        window.app = app
        appInitialized.current = true
        console.log('ASCII Emoji Animator initialized!')
      } catch (error) {
        console.error('Failed to initialize app:', error)
      }
    }

    const setupUI = (app: any) => {
      // Image upload handler
      const uploadInput = document.getElementById('image-upload') as HTMLInputElement
      const uploadButton = document.getElementById('upload-button')
      
      uploadButton?.addEventListener('click', () => {
        uploadInput?.click()
      })
      
      uploadInput?.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const img = new Image()
            img.onload = () => {
              if (app.transition.getIsTransitioning()) return
              app.previousBuffer = JSON.parse(JSON.stringify(app.currentBuffer))
              loadUploadedImage(app, img)
              app.transition.start()
              
              // Clear emoji/shape selection
              const allButtons = document.querySelectorAll('.emoji-key, .shape-key')
              allButtons.forEach(btn => btn.classList.remove('active'))
            }
            img.src = event.target?.result as string
          }
          reader.readAsDataURL(file)
        }
      })
      
      // Keyboard mode toggles
      const keyboardToggle = document.getElementById('keyboard-toggle')
      const keyboardToggleShapes = document.getElementById('keyboard-toggle-shapes')
      const emojiKeyboard = document.getElementById('emoji-keyboard')
      const geometricKeyboard = document.getElementById('geometric-keyboard')
      
      const switchToGeometric = () => {
        app.keyboardMode = 'geometric'
        emojiKeyboard?.classList.add('hidden')
        geometricKeyboard?.classList.remove('hidden')
      }
      
      const switchToEmoji = () => {
        app.keyboardMode = 'emoji'
        emojiKeyboard?.classList.remove('hidden')
        geometricKeyboard?.classList.add('hidden')
      }
      
      keyboardToggle?.addEventListener('click', switchToGeometric)
      keyboardToggleShapes?.addEventListener('click', switchToEmoji)
      
      // Emoji buttons
      const emojiButtons = document.querySelectorAll('.emoji-key')
      emojiButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const emoji = btn.getAttribute('data-emoji')
          if (emoji) {
            selectEmoji(app, emoji)
            emojiButtons.forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
          }
        })
      })

      if (emojiButtons.length > 0) {
        emojiButtons[0].classList.add('active')
      }
      
      // Geometric shape buttons
      const shapeButtons = document.querySelectorAll('.shape-key')
      shapeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const shape = btn.getAttribute('data-shape')
          if (shape) {
            selectShape(app, shape)
            shapeButtons.forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
          }
        })
      })
      
      // Keyboard shortcuts - Full QWERTY (don't block CMD+R)
      document.addEventListener('keydown', (e) => {
        // Don't intercept CMD/CTRL key combinations (like CMD+R for reload)
        if (e.metaKey || e.ctrlKey) {
          return
        }
        
        // Tab to toggle keyboards
        if (e.key === 'Tab') {
          e.preventDefault()
          if (app.keyboardMode === 'emoji') {
            switchToGeometric()
          } else {
            switchToEmoji()
          }
          return
        }
        
        // Letter keys - find the matching button
        const key = e.key.toUpperCase()
        if (key >= 'A' && key <= 'Z') {
          const allButtons = app.keyboardMode === 'emoji' 
            ? document.querySelectorAll('.emoji-key') 
            : document.querySelectorAll('.shape-key')
          
          const targetBtn = Array.from(allButtons).find(btn => 
            btn.getAttribute('data-key') === key
          )
          
          if (targetBtn) {
            e.preventDefault()
            targetBtn.click()
          }
        }
      })

      // Settings toggle
      const settingsToggle = document.getElementById('settings-toggle')
      const settingsPanel = document.getElementById('settings-panel')
      settingsToggle?.addEventListener('click', () => {
        settingsPanel?.classList.toggle('collapsed')
      })

      // Background effect
      const backgroundSelect = document.getElementById('background-select') as HTMLSelectElement
      backgroundSelect?.addEventListener('change', (e) => {
        app.background.setEffect((e.target as HTMLSelectElement).value)
      })

      // Transition effect
      const transitionSelect = document.getElementById('transition-select') as HTMLSelectElement
      transitionSelect?.addEventListener('change', (e) => {
        app.transition.setEffect((e.target as HTMLSelectElement).value)
      })
      
      // Animation style
      const animationSelect = document.getElementById('animation-select') as HTMLSelectElement
      animationSelect?.addEventListener('change', (e) => {
        app.rotation.setAnimationStyle((e.target as HTMLSelectElement).value)
      })
      
          // Theme toggle
          const themeSelect = document.getElementById('theme-select') as HTMLSelectElement
          themeSelect?.addEventListener('change', (e) => {
            app.theme = (e.target as HTMLSelectElement).value
            if (app.theme === 'light') {
              document.body.style.backgroundColor = '#FFFFFF'
              document.body.setAttribute('data-theme', 'light')
            } else if (app.theme === 'blue') {
              document.body.style.backgroundColor = '#0a0e27'
              document.body.setAttribute('data-theme', 'dark')
            } else {
              document.body.style.backgroundColor = '#000000'
              document.body.setAttribute('data-theme', 'dark')
            }
          })
      
      // Character style
      const characterSelect = document.getElementById('character-select') as HTMLSelectElement
      characterSelect?.addEventListener('change', (e) => {
        app.renderer.setCharacterStyle((e.target as HTMLSelectElement).value)
      })

      // Speed slider
      const speedSlider = document.getElementById('speed-slider') as HTMLInputElement
      const speedValue = document.getElementById('speed-value')
      speedSlider?.addEventListener('input', (e) => {
        const speed = parseFloat((e.target as HTMLInputElement).value)
        app.rotation.setSpeed(speed)
        if (speedValue) speedValue.textContent = `${speed.toFixed(1)}x`
      })

      // Window resize
      window.addEventListener('resize', () => {
        app.renderer.resize()
        if (app.currentDepthMap) {
          loadEmoji(app, app.currentEmoji)
        }
      })
    }

    const loadEmoji = (app: any, emoji: string) => {
      const emojiWidth = Math.min(100, Math.floor(app.renderer.cols * 0.7))
      const emojiHeight = Math.min(80, Math.floor(app.renderer.rows * 0.7))
      app.currentDepthMap = app.converter.create3DDepthMap(emoji, emojiWidth, emojiHeight)
      app.currentShape = null
      app.uploadedImage = null
    }
    
    const loadShape = (app: any, shapeName: string) => {
      const shapeWidth = Math.min(100, Math.floor(app.renderer.cols * 0.7))
      const shapeHeight = Math.min(80, Math.floor(app.renderer.rows * 0.7))
      app.currentShape = shapeName
      app.uploadedImage = null
      // Shape will be generated each frame for animations
    }
    
    const loadUploadedImage = (app: any, image: any) => {
      const imgWidth = Math.min(100, Math.floor(app.renderer.cols * 0.7))
      const imgHeight = Math.min(80, Math.floor(app.renderer.rows * 0.7))
      app.currentDepthMap = app.converter.create3DDepthMapFromImage(image, imgWidth, imgHeight)
      app.currentShape = null
      app.uploadedImage = image
    }

    const selectEmoji = (app: any, emoji: string) => {
      if (emoji === app.currentEmoji || app.transition.getIsTransitioning()) return
      app.previousBuffer = JSON.parse(JSON.stringify(app.currentBuffer))
      app.currentEmoji = emoji
      app.currentShape = null
      loadEmoji(app, emoji)
      app.transition.start()
    }
    
    const selectShape = (app: any, shapeName: string) => {
      if (shapeName === app.currentShape || app.transition.getIsTransitioning()) return
      app.previousBuffer = JSON.parse(JSON.stringify(app.currentBuffer))
      app.currentShape = shapeName
      loadShape(app, shapeName)
      app.transition.start()
    }

    const animate = (app: any, currentTime: number) => {
      if (!app.isRunning) return

      const deltaTime = (currentTime - app.lastTime) / 1000
      app.lastTime = currentTime
      const dt = Math.min(deltaTime, 0.1)

      app.rotation.update(dt)
      app.transition.update(dt)
      app.background.render(app.backgroundBuffer, dt)
      app.geometricShapes.updateTime(dt)

      // Generate depth map based on mode
      if (app.currentShape) {
        const shapeWidth = Math.min(100, Math.floor(app.renderer.cols * 0.7))
        const shapeHeight = Math.min(80, Math.floor(app.renderer.rows * 0.7))
        app.currentDepthMap = app.geometricShapes.generateShape(app.currentShape, shapeWidth, shapeHeight, app.geometricShapes.time)
      }
      
      if (app.currentDepthMap) {
        app.rotation.renderRotated(app.currentDepthMap, app.currentBuffer, app.rotation.getAngle())
      }

      let displayBuffer = app.currentBuffer
      if (app.transition.getIsTransitioning()) {
        displayBuffer = app.transition.apply(app.previousBuffer, app.currentBuffer)
      }

      app.renderer.render(displayBuffer, app.backgroundBuffer, app.theme)
      requestAnimationFrame((time) => animate(app, time))
    }

    const start = (app: any) => {
      if (!app.isRunning) {
        app.isRunning = true
        app.lastTime = performance.now()
        requestAnimationFrame((time) => animate(app, time))
      }
    }

    const loadAllScripts = async () => {
      try {
        for (const src of scripts) {
          await loadScript(src)
        }
        scriptsLoaded.current = true
        
        // Wait a bit for DOM to be ready
        setTimeout(() => {
          initializeApp()
        }, 100)
      } catch (error) {
        console.error('Failed to load scripts:', error)
      }
    }

    loadAllScripts()
  }, [])

  return (
    <div id="app">
      {/* Main Canvas Area */}
      <div id="canvas-container">
        <canvas id="ascii-canvas"></canvas>
      </div>
      
      {/* Hidden file input for image upload */}
      <input
        type="file"
        id="image-upload"
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Emoji Keyboard - Optimized for Touch (44x44 minimum) */}
      <div id="emoji-keyboard" className="keyboard-container">
        <div className="keyboard-row keyboard-row-top">
          <button className="key emoji-key" data-emoji="💎" data-key="Q"><span className="emoji">💎</span><span className="key-label">Q</span></button>
          <button className="key emoji-key" data-emoji="✨" data-key="W"><span className="emoji">✨</span><span className="key-label">W</span></button>
          <button className="key emoji-key" data-emoji="🌙" data-key="E"><span className="emoji">🌙</span><span className="key-label">E</span></button>
          <button className="key emoji-key" data-emoji="⭐" data-key="R"><span className="emoji">⭐</span><span className="key-label">R</span></button>
          <button className="key emoji-key" data-emoji="🌟" data-key="T"><span className="emoji">🌟</span><span className="key-label">T</span></button>
          <button className="key emoji-key" data-emoji="💫" data-key="Y"><span className="emoji">💫</span><span className="key-label">Y</span></button>
          <button className="key emoji-key" data-emoji="🔮" data-key="U"><span className="emoji">🔮</span><span className="key-label">U</span></button>
          <button className="key emoji-key" data-emoji="🦋" data-key="I"><span className="emoji">🦋</span><span className="key-label">I</span></button>
        </div>
        <div className="keyboard-row keyboard-row-middle">
          <button className="key emoji-key" data-emoji="🌸" data-key="A"><span className="emoji">🌸</span><span className="key-label">A</span></button>
          <button className="key emoji-key" data-emoji="❄️" data-key="S"><span className="emoji">❄️</span><span className="key-label">S</span></button>
          <button className="key emoji-key" data-emoji="🔥" data-key="D"><span className="emoji">🔥</span><span className="key-label">D</span></button>
          <button className="key emoji-key" data-emoji="🌊" data-key="F"><span className="emoji">🌊</span><span className="key-label">F</span></button>
          <button className="key emoji-key" data-emoji="☄️" data-key="G"><span className="emoji">☄️</span><span className="key-label">G</span></button>
          <button className="key emoji-key" data-emoji="🪐" data-key="H"><span className="emoji">🪐</span><span className="key-label">H</span></button>
          <button className="key emoji-key" data-emoji="🌕" data-key="J"><span className="emoji">🌕</span><span className="key-label">J</span></button>
        </div>
        <div className="keyboard-row keyboard-row-bottom">
          <button id="keyboard-toggle" className="key toggle-key">
            <span className="toggle-icon">🔷</span>
          </button>
          <button className="key emoji-key" data-emoji="🎭" data-key="Z"><span className="emoji">🎭</span><span className="key-label">Z</span></button>
          <button className="key emoji-key" data-emoji="🌈" data-key="X"><span className="emoji">🌈</span><span className="key-label">X</span></button>
          <button className="key emoji-key" data-emoji="🎨" data-key="C"><span className="emoji">🎨</span><span className="key-label">C</span></button>
          <button className="key emoji-key" data-emoji="🌴" data-key="V"><span className="emoji">🌴</span><span className="key-label">V</span></button>
          <button className="key emoji-key" data-emoji="🦚" data-key="B"><span className="emoji">🦚</span><span className="key-label">B</span></button>
        </div>
      </div>

      {/* Geometric Keyboard - Optimized for Touch */}
      <div id="geometric-keyboard" className="keyboard-container hidden">
        <div className="keyboard-row keyboard-row-top">
          <button className="key shape-key" data-shape="circle" data-key="Q"><span className="shape-name">Circle</span><span className="key-label">Q</span></button>
          <button className="key shape-key" data-shape="square" data-key="W"><span className="shape-name">Square</span><span className="key-label">W</span></button>
          <button className="key shape-key" data-shape="triangle" data-key="E"><span className="shape-name">Triangle</span><span className="key-label">E</span></button>
          <button className="key shape-key" data-shape="diamond" data-key="R"><span className="shape-name">Diamond</span><span className="key-label">R</span></button>
          <button className="key shape-key" data-shape="hexagon" data-key="T"><span className="shape-name">Hexagon</span><span className="key-label">T</span></button>
          <button className="key shape-key" data-shape="star" data-key="Y"><span className="shape-name">Star</span><span className="key-label">Y</span></button>
        </div>
        <div className="keyboard-row keyboard-row-middle">
          <button className="key shape-key" data-shape="heart" data-key="A"><span className="shape-name">Heart</span><span className="key-label">A</span></button>
          <button className="key shape-key" data-shape="infinity" data-key="S"><span className="shape-name">Infinity</span><span className="key-label">S</span></button>
          <button className="key shape-key" data-shape="spiral" data-key="D"><span className="shape-name">Spiral</span><span className="key-label">D</span></button>
          <button className="key shape-key" data-shape="mandala" data-key="F"><span className="shape-name">Mandala</span><span className="key-label">F</span></button>
          <button className="key shape-key" data-shape="venn" data-key="G"><span className="shape-name">Venn</span><span className="key-label">G</span></button>
          <button className="key shape-key" data-shape="wave" data-key="H"><span className="shape-name">Wave</span><span className="key-label">H</span></button>
        </div>
        <div className="keyboard-row keyboard-row-bottom">
          <button id="keyboard-toggle-shapes" className="key toggle-key">
            <span className="toggle-icon">😊</span>
          </button>
        </div>
      </div>

      {/* Upload Image CTA Button */}
      <button id="upload-button" className="upload-cta">
        <span className="upload-icon">📸</span>
        <span className="upload-text">Upload Your Own Image</span>
      </button>

      {/* Settings Panel */}
      <div id="settings-panel" className="settings-panel collapsed">
        <button id="settings-toggle" className="settings-toggle" aria-label="Toggle settings">
          ⚙️
        </button>
        <div className="settings-content">
          <h3>Settings</h3>
          
          <div className="setting-group">
            <label htmlFor="background-select">Background Effect:</label>
            <select id="background-select">
              <option value="matrix">Matrix Rain</option>
              <option value="particles">Particles</option>
              <option value="waves">Waves</option>
              <option value="starfield">Starfield</option>
              <option value="geometric">Geometric</option>
            </select>
          </div>

              <div className="setting-group">
                <label htmlFor="animation-select">Animation Style:</label>
                <select id="animation-select" defaultValue="float">
                  <option value="float">Float</option>
                  <option value="rotate">3D Rotate</option>
                  <option value="pulse">Pulse</option>
                  <option value="wave">Wave</option>
                  <option value="spiral">Spiral</option>
                  <option value="zoom">Zoom</option>
                  <option value="tilt">Tilt</option>
                  <option value="bounce">Bounce</option>
                  <option value="spin">Fast Spin</option>
                  <option value="shimmer">Shimmer</option>
                </select>
              </div>

          <div className="setting-group">
            <label htmlFor="transition-select">Transition Effect:</label>
            <select id="transition-select" defaultValue="morph">
              <option value="crossfade">Crossfade</option>
              <option value="zoom">Zoom</option>
              <option value="spiral">Spiral</option>
              <option value="dissolve">Dissolve</option>
              <option value="morph">Morph</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="theme-select">Theme:</label>
            <select id="theme-select">
              <option value="dark">Dark Mode</option>
              <option value="light">Light Mode</option>
              <option value="blue">P3 Blue Theme</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="character-select">Character Style:</label>
            <select id="character-select">
              <option value="detailed">Detailed</option>
              <option value="blocks">Blocks</option>
              <option value="dots">Dots</option>
              <option value="lines">Lines</option>
              <option value="minimal">Minimal</option>
              <option value="geometric">Geometric</option>
              <option value="circles">Circles</option>
              <option value="stars">Stars</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="speed-slider">Animation Speed: <span id="speed-value">1.0x</span></label>
            <input type="range" id="speed-slider" min="0.5" max="3" step="0.1" defaultValue="1.0" />
          </div>
        </div>
      </div>
    </div>
  )
}

