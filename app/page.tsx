'use client'

import { useEffect, useRef, useState } from 'react'
import { Drawer } from 'vaul'
import GIF from 'gif.js'

export default function Home() {
  const scriptsLoaded = useRef(false)
  const appInitialized = useRef(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    // Only load scripts once
    if (scriptsLoaded.current) {
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
      '/cameraCapture.js',
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

        const renderer = new window.ASCIIRenderer(canvas)
        const converter = new window.EmojiConverter()
        const rotation = new window.Rotation3D(renderer)
        const background = new window.BackgroundEffects(renderer)
        const transition = new window.TransitionEffects(renderer)
        const geometricShapes = new window.GeometricShapes()
        const camera = new window.CameraCapture(converter)

            // Detect initial theme from system preference or existing attribute
            const existingTheme = document.body.getAttribute('data-theme')
            const isDark = existingTheme === 'dark' || (!existingTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
            const initialTheme = isDark ? 'dark' : 'light'
            const initialBgColor = isDark ? '#000000' : '#FFFFFF'
            
            document.body.setAttribute('data-theme', initialTheme)
            document.body.style.backgroundColor = initialBgColor
            
            // Create app instance
            const app = {
              canvas,
              renderer,
              converter,
              rotation,
              background,
              transition,
              geometricShapes,
              camera,
              currentEmoji: '🦋',
              currentShape: null,
              currentDepthMap: null,
              uploadedImage: null,
              cameraActive: false,
              previousBuffer: renderer.createBuffer(),
              currentBuffer: renderer.createBuffer(),
              backgroundBuffer: renderer.createBuffer(),
              lastTime: performance.now(),
              isRunning: false,
              theme: initialTheme,
              keyboardMode: 'emoji', // 'emoji' or 'geometric'
            }

        // Setup UI
        setupUI(app)
        
        // Load initial emoji
        loadEmoji(app, '🦋')
        
        // Start animation
        start(app)
        
        window.app = app
        appInitialized.current = true
        console.log('ASCII Emoji Animator initialized!')
      } catch (error) {
        console.error('Failed to initialize app:', error)
      }
    }

    const exportAsGif = (app: any) => {
      const button = document.getElementById('export-gif-button')
      if (!button) return
      
      // Store original content
      const originalHTML = button.innerHTML
      
      // Disable button during export and show loading
      button.setAttribute('disabled', 'true')
      button.innerHTML = '<span class="export-spinner"></span>'
      button.classList.add('exporting')
      
      // Get actual display dimensions of the canvas
      const canvasRect = app.canvas.getBoundingClientRect()
      const exportWidth = Math.floor(canvasRect.width)
      const exportHeight = Math.floor(canvasRect.height)
      
      // Create a temporary canvas for proper sizing
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = exportWidth
      tempCanvas.height = exportHeight
      const tempCtx = tempCanvas.getContext('2d')
      
      // Create GIF encoder with proper dimensions
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: exportWidth,
        height: exportHeight,
        workerScript: '/gif.worker.js'
      })
      
      // Capture parameters
      const fps = 30
      const duration = 3 // seconds
      const totalFrames = fps * duration
      const frameDelay = 1000 / fps
      
      let framesCaptured = 0
      
      // Capture frames
      const captureFrame = () => {
        if (framesCaptured >= totalFrames) {
          // All frames captured, render GIF
          button.innerHTML = '<span class="export-spinner"></span>'
          gif.render()
          return
        }
        
        // Draw the current canvas to temp canvas at proper size
        if (tempCtx) {
          tempCtx.clearRect(0, 0, exportWidth, exportHeight)
          tempCtx.drawImage(app.canvas, 0, 0, exportWidth, exportHeight)
        }
        
        // Add frame to GIF
        gif.addFrame(tempCanvas, { copy: true, delay: frameDelay })
        framesCaptured++
        
        // Update button with progress
        const progress = Math.round((framesCaptured / totalFrames) * 100)
        button.innerHTML = `<span class="export-spinner"></span>`
        
        // Capture next frame
        requestAnimationFrame(captureFrame)
      }
      
      // Start capturing
      requestAnimationFrame(captureFrame)
      
      // When GIF is ready, download it
      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ascii-animation-${Date.now()}.gif`
        link.click()
        URL.revokeObjectURL(url)
        
        // Clean up
        tempCanvas.remove()
        
        // Re-enable button
        button.removeAttribute('disabled')
        button.classList.remove('exporting')
        button.innerHTML = originalHTML
      })
      
      gif.on('progress', (p: number) => {
        const progress = Math.round(p * 100)
        button.innerHTML = `<span class="export-spinner"></span>`
      })
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
              
              // Stop camera if active
              if (app.cameraActive) {
                app.camera.stop()
                app.cameraActive = false
                const cameraBtn = document.getElementById('camera-button')
                if (cameraBtn) {
                  cameraBtn.classList.remove('active')
                  cameraBtn.textContent = 'Start Camera'
                }
              }
              
              app.previousBuffer = JSON.parse(JSON.stringify(app.currentBuffer))
              loadUploadedImage(app, img)
              app.transition.start()
              
              // Clear emoji selection
              const allButtons = document.querySelectorAll('.emoji-btn')
              allButtons.forEach(btn => btn.classList.remove('active'))
            }
            img.src = event.target?.result as string
          }
          reader.readAsDataURL(file)
        }
      })
      
      // Camera button handler
      const cameraButton = document.getElementById('camera-button')
      cameraButton?.addEventListener('click', async () => {
        if (app.cameraActive) {
          // Stop camera
          app.camera.stop()
          app.cameraActive = false
          cameraButton.classList.remove('active')
          cameraButton.textContent = 'Start Camera'
          
          // Return to emoji mode
          loadEmoji(app, app.currentEmoji)
          app.rotation.setSpeed(1.0)
        } else {
          // Start camera
          const started = await app.camera.start()
          if (started) {
            app.cameraActive = true
            app.currentShape = null
            app.uploadedImage = null
            cameraButton.classList.add('active')
            cameraButton.textContent = 'Stop Camera'
            
            // Clear emoji selection
            const allButtons = document.querySelectorAll('.emoji-btn')
            allButtons.forEach(btn => btn.classList.remove('active'))
            
            // Set slower rotation speed for camera
            app.rotation.setSpeed(0.5)
          }
        }
      })
      
      // Emoji buttons
      const emojiButtons = document.querySelectorAll('.emoji-btn')
      emojiButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const emoji = btn.getAttribute('data-emoji')
          if (emoji) {
            // Stop camera if active
            if (app.cameraActive) {
              app.camera.stop()
              app.cameraActive = false
              const cameraBtn = document.getElementById('camera-button')
              if (cameraBtn) {
                cameraBtn.classList.remove('active')
                cameraBtn.textContent = 'Start Camera'
              }
            }
            
            // Handle cube as a special shape
            if (emoji === 'CUBE') {
              selectShape(app, 'cube')
            } else {
              selectEmoji(app, emoji)
            }
            emojiButtons.forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
          }
        })
      })

      // Set butterfly as active by default
      const butterflyBtn = Array.from(emojiButtons).find(btn => 
        btn.getAttribute('data-emoji') === '🦋'
      )
      if (butterflyBtn) {
        butterflyBtn.classList.add('active')
      }
      
      // Number key shortcuts (1-6)
      document.addEventListener('keydown', (e) => {
        // Don't intercept CMD/CTRL key combinations
        if (e.metaKey || e.ctrlKey) {
          return
        }
        
        // Number keys 1-6 for emojis
        const key = e.key
        if (key >= '1' && key <= '6') {
          const targetBtn = Array.from(emojiButtons).find(btn => 
            btn.getAttribute('data-key') === key
          )
          
          if (targetBtn) {
            e.preventDefault()
            ;(targetBtn as HTMLElement).click()
          }
        }
        
        // U key for upload
        if (key === 'u' || key === 'U') {
          e.preventDefault()
          uploadButton?.click()
        }
        
        // C key for camera
        if (key === 'c' || key === 'C') {
          e.preventDefault()
          const cameraBtn = document.getElementById('camera-button')
          cameraBtn?.click()
        }
      })

      // Settings toggle
      const settingsToggle = document.getElementById('settings-toggle')
      const settingsPanel = document.getElementById('settings-panel')
      settingsToggle?.addEventListener('click', () => {
        settingsPanel?.classList.toggle('collapsed')
      })

      // Export GIF button
      const exportGifButton = document.getElementById('export-gif-button')
      exportGifButton?.addEventListener('click', () => {
        exportAsGif(app)
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
          // Set initial theme select value to match current theme
          if (themeSelect) {
            themeSelect.value = app.theme
          }
          themeSelect?.addEventListener('change', (e) => {
            app.theme = (e.target as HTMLSelectElement).value
            if (app.theme === 'light') {
              document.body.style.backgroundColor = '#FFFFFF'
              document.body.setAttribute('data-theme', 'light')
              document.documentElement.setAttribute('data-theme', 'light')
              document.documentElement.style.backgroundColor = '#FFFFFF'
            } else if (app.theme === 'blue') {
              document.body.style.backgroundColor = '#0a0e27'
              document.body.setAttribute('data-theme', 'dark')
              document.documentElement.setAttribute('data-theme', 'dark')
              document.documentElement.style.backgroundColor = '#0a0e27'
            } else {
              document.body.style.backgroundColor = '#000000'
              document.body.setAttribute('data-theme', 'dark')
              document.documentElement.setAttribute('data-theme', 'dark')
              document.documentElement.style.backgroundColor = '#000000'
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
      const emojiWidth = Math.min(120, Math.floor(app.renderer.cols * 0.8))
      const emojiHeight = Math.min(100, Math.floor(app.renderer.rows * 0.8))
      app.currentDepthMap = app.converter.create3DDepthMap(emoji, emojiWidth, emojiHeight)
      app.currentShape = null
      app.uploadedImage = null
    }
    
    const loadShape = (app: any, shapeName: string) => {
      const shapeWidth = Math.min(120, Math.floor(app.renderer.cols * 0.8))
      const shapeHeight = Math.min(100, Math.floor(app.renderer.rows * 0.8))
      app.currentShape = shapeName
      app.uploadedImage = null
      // Shape will be generated each frame for animations
    }
    
    const loadUploadedImage = (app: any, image: any) => {
      // Use maximum dimensions for uploaded images to show much more detail
      const imgWidth = Math.min(180, Math.floor(app.renderer.cols * 0.95))
      const imgHeight = Math.min(140, Math.floor(app.renderer.rows * 0.95))
      app.currentDepthMap = app.converter.create3DDepthMapFromImage(image, imgWidth, imgHeight)
      app.currentShape = null
      app.uploadedImage = image
      
      // Slow down rotation significantly for uploaded images to make them easier to see
      app.rotation.setSpeed(0.3)
    }

    const selectEmoji = (app: any, emoji: string) => {
      if (emoji === app.currentEmoji || app.transition.getIsTransitioning()) return
      app.previousBuffer = JSON.parse(JSON.stringify(app.currentBuffer))
      app.currentEmoji = emoji
      app.currentShape = null
      loadEmoji(app, emoji)
      // Reset rotation speed to normal when switching to emoji
      app.rotation.setSpeed(1.0)
      app.transition.start()
    }
    
    const selectShape = (app: any, shapeName: string) => {
      if (shapeName === app.currentShape || app.transition.getIsTransitioning()) return
      app.previousBuffer = JSON.parse(JSON.stringify(app.currentBuffer))
      app.currentShape = shapeName
      loadShape(app, shapeName)
      // Reset rotation speed to normal when switching to shape
      app.rotation.setSpeed(1.0)
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
      if (app.cameraActive) {
        // Capture camera frame in real-time
        const frame = app.camera.captureFrame(app.renderer)
        if (frame) {
          app.currentDepthMap = frame
        }
      } else if (app.currentShape) {
        const shapeWidth = Math.min(100, Math.floor(app.renderer.cols * 0.7))
        const shapeHeight = Math.min(80, Math.floor(app.renderer.rows * 0.7))
        app.currentDepthMap = app.geometricShapes.generateShape(app.currentShape, shapeWidth, shapeHeight, app.geometricShapes.time)
      }
      // If neither camera nor shape is active, currentDepthMap retains the emoji depth map from loadEmoji()
      
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

      {/* Floating Control Panel */}
      <div className="floating-controls">
        <div className="emoji-grid">
          <button className="emoji-btn" data-emoji="🦋" data-key="1"><span className="emoji">🦋</span></button>
          <button className="emoji-btn" data-emoji="✨" data-key="2"><span className="emoji">✨</span></button>
          <button className="emoji-btn" data-emoji="🔥" data-key="3"><span className="emoji">🔥</span></button>
          <button className="emoji-btn" data-emoji="💎" data-key="4"><span className="emoji">💎</span></button>
          <button className="emoji-btn" data-emoji="❤️" data-key="5"><span className="emoji">❤️</span></button>
          <button 
            className="emoji-btn more-emoji-btn" 
            onClick={() => setDrawerOpen(true)}
            data-key="6"
          >
            <span className="emoji">➕</span>
          </button>
        </div>
        <div className="button-row">
          <button id="upload-button" className="upload-cta-full" title="Upload image (U)">
            <span className="upload-text">Upload Image</span>
          </button>
          <button id="camera-button" className="camera-cta-full" title="Start camera (C)">
            Start Camera
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <div id="settings-panel" className="settings-panel collapsed">
        <button id="export-gif-button" className="settings-toggle export-gif-btn" aria-label="Export as GIF" title="Export as GIF">
          <span className="button-icon">📹</span>
        </button>
        <button id="settings-toggle" className="settings-toggle" aria-label="Toggle settings">
          <span className="button-icon">⚙️</span>
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

      {/* Emoji Picker Drawer */}
      <Drawer.Root 
        open={drawerOpen} 
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) {
            setCurrentPage(0) // Reset to first page when closing
          }
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="drawer-overlay" />
          <Drawer.Content className="drawer-content">
            <div className="drawer-handle-container">
              <div className="drawer-handle" />
            </div>
            
            <div className="drawer-body">
              {/* Emoji Pages */}
              <div 
                className="emoji-pages-container"
                onTouchStart={(e) => {
                  touchStartX.current = e.touches[0].clientX
                }}
                onTouchMove={(e) => {
                  touchEndX.current = e.touches[0].clientX
                }}
                onTouchEnd={() => {
                  const swipeDistance = touchStartX.current - touchEndX.current
                  const minSwipeDistance = 50
                  
                  if (Math.abs(swipeDistance) > minSwipeDistance) {
                    if (swipeDistance > 0 && currentPage < 2) {
                      // Swipe left - next page
                      setCurrentPage(currentPage + 1)
                    } else if (swipeDistance < 0 && currentPage > 0) {
                      // Swipe right - previous page
                      setCurrentPage(currentPage - 1)
                    }
                  }
                }}
              >
                <div 
                  className="emoji-pages"
                  style={{ transform: `translateX(-${currentPage * 100}%)` }}
                >
                  {/* Page 1: Smileys & People */}
                  <div className="emoji-page">
                    <div className="emoji-picker-grid">
                      {['😀', '😂', '😍', '😎', '😭', '😡', '🤔', '😴', '🤩', '😇', '🥳', '🤗', '🙃', '😋', '😜', '🤓', '😈', '👻', '👽', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'].map(emoji => (
                        <button
                          key={emoji}
                          className="emoji-picker-btn"
                          onClick={() => {
                            const emojiBtn = document.querySelector(`[data-emoji="${emoji}"]`) as HTMLElement
                            if (emojiBtn) {
                              emojiBtn.click()
                            } else {
                              // For emojis not in quick select, select them directly
                              if (window.app) {
                                window.app.previousBuffer = JSON.parse(JSON.stringify(window.app.currentBuffer))
                                window.app.currentEmoji = emoji
                                const emojiWidth = Math.min(120, Math.floor(window.app.renderer.cols * 0.8))
                                const emojiHeight = Math.min(100, Math.floor(window.app.renderer.rows * 0.8))
                                window.app.currentDepthMap = window.app.converter.create3DDepthMap(emoji, emojiWidth, emojiHeight)
                                window.app.currentShape = null
                                window.app.uploadedImage = null
                                window.app.rotation.setSpeed(1.0)
                                window.app.transition.start()
                              }
                            }
                            setDrawerOpen(false)
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page 2: Animals & Nature */}
                  <div className="emoji-page">
                    <div className="emoji-picker-grid">
                      {['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙'].map(emoji => (
                        <button
                          key={emoji}
                          className="emoji-picker-btn"
                          onClick={() => {
                            if (window.app) {
                              window.app.previousBuffer = JSON.parse(JSON.stringify(window.app.currentBuffer))
                              window.app.currentEmoji = emoji
                              const emojiWidth = Math.min(120, Math.floor(window.app.renderer.cols * 0.8))
                              const emojiHeight = Math.min(100, Math.floor(window.app.renderer.rows * 0.8))
                              window.app.currentDepthMap = window.app.converter.create3DDepthMap(emoji, emojiWidth, emojiHeight)
                              window.app.currentShape = null
                              window.app.uploadedImage = null
                              window.app.rotation.setSpeed(1.0)
                              window.app.transition.start()
                            }
                            setDrawerOpen(false)
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page 3: Food & Drink */}
                  <div className="emoji-page">
                    <div className="emoji-picker-grid">
                      {['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟'].map(emoji => (
                        <button
                          key={emoji}
                          className="emoji-picker-btn"
                          onClick={() => {
                            if (window.app) {
                              window.app.previousBuffer = JSON.parse(JSON.stringify(window.app.currentBuffer))
                              window.app.currentEmoji = emoji
                              const emojiWidth = Math.min(120, Math.floor(window.app.renderer.cols * 0.8))
                              const emojiHeight = Math.min(100, Math.floor(window.app.renderer.rows * 0.8))
                              window.app.currentDepthMap = window.app.converter.create3DDepthMap(emoji, emojiWidth, emojiHeight)
                              window.app.currentShape = null
                              window.app.uploadedImage = null
                              window.app.rotation.setSpeed(1.0)
                              window.app.transition.start()
                            }
                            setDrawerOpen(false)
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Indicators */}
              <div className="page-indicators">
                {[0, 1, 2].map(page => (
                  <button
                    key={page}
                    className={`page-indicator ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  />
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="page-navigation">
                <button
                  className="nav-btn"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  ← Previous
                </button>
                <button
                  className="nav-btn"
                  onClick={() => setCurrentPage(Math.min(2, currentPage + 1))}
                  disabled={currentPage === 2}
                >
                  Next →
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}

