import md5 from 'md5'

async function getCPUInfo () {
  if (navigator.hardwareConcurrency) {
    try {
      const logicalCores = navigator.hardwareConcurrency
      const agent = window.navigator.userAgent
      const hyperThreaded = /Intel|Apple/.test(agent) && /Win64|Linux x86_64|MacIntel/.test(agent)

      // Ajustar el número de núcleos lógicos si se sospecha hiperprocesamiento
      const physicalCores = hyperThreaded ? logicalCores / 2 : logicalCores

      const cpuInfo = {
        logicalCores,
        physicalCores,
        hyperThreaded
      }
      return JSON.stringify(cpuInfo)
    } catch (error) {
      console.error('Error al obtener información de la CPU:', error)
      return 'cpu-info-error'
    }
  } else {
    return 'cpu-info-not-available'
  }
}

async function generateFingerprint () {
  const canvas = document.createElement('canvas')
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()

  const userAgent = navigator.userAgent
  const language = navigator.language
  const colorDepth = window.screen.colorDepth
  const availableScreenHeight = window.screen.availHeight
  const platform = navigator.platform
  const cpuClass = navigator.cpuClass || 'unknown'

  const canvasFingerprint = await generateCanvasFingerprint(canvas)
  const audioFingerprint = await generateAudioFingerprint(audioContext)

  const cpuInfo = await getCPUInfo()
  const webGLInfo = await getWebGLInfo()
  const fonts = getInstalledFonts()
  const touchscreenInfo = getTouchscreenInfo()

  const fingerprintData = {
    browser: {
      userAgent,
      language,
      colorDepth,
      availableScreenHeight,
      plugins: Array.from(navigator.plugins).map(plugin => plugin.name).join(','),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hardwareConcurrency: cpuInfo.logicalCores || 'unknown',
      platformVersion: navigator.platformVersion || 'unknown'
    },
    device: {
      platform,
      cpuClass
    },
    canvas: canvasFingerprint,
    audio: audioFingerprint,
    cpu: cpuInfo,
    webgl: webGLInfo,
    fonts,
    touchscreen: touchscreenInfo
  }

  const fingerprint = JSON.stringify(fingerprintData)
  const uniqueID = md5(fingerprint)

  return uniqueID
}

// Función para generar huella digital del audio
async function generateAudioFingerprint (audioContext) {
  if (audioContext) {
    try {
      await audioContext.resume()

      // Obtén propiedades del audio que puedas obtener en modo incógnito
      const audioProperties = {
        isAudioContextAvailable: true
        // Agrega más propiedades relevantes aquí
      }

      return audioProperties
    } catch (error) {
      console.error('Error al generar huella digital de audio:', error)
    }
  }

  return { isAudioContextAvailable: false }
}

// Función para generar huella digital del canvas
async function generateCanvasFingerprint (canvas) {
  if (canvas) {
    try {
      canvas.width = 200
      canvas.height = 200
      const context = canvas.getContext('2d')
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#f60'
      context.fillRect(125, 1, 62, 20)
      context.fillStyle = '#069'
      context.font = '16pt Arial'
      context.fillText('Cwm fjordbank glyphs vext quiz', 125, 20)

      // Obtén más propiedades del canvas que puedas obtener en modo incógnito
      const canvasProperties = {
        width: canvas.width,
        height: canvas.height
        // Agrega más propiedades relevantes aquí
      }

      return canvasProperties
    } catch (error) {
      console.error('Error al generar huella digital del canvas:', error)
    }
  }

  return { width: 0, height: 0 }
}

async function getWebGLInfo () {
  if ('WebGLRenderingContext' in window) {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

    if (gl) {
      const renderer = gl.getParameter(gl.RENDERER)
      const version = gl.getParameter(gl.VERSION)

      // Obtener más información sobre las capacidades WebGL si es necesario

      return `${renderer}-${version}`
    }
  }

  return 'webgl-info-not-supported'
}

function getInstalledFonts () {
  const fonts = []

  if ('fonts' in document) {
    document.fonts.forEach(font => {
      fonts.push(font.family)
    })
  }

  return fonts.join(',')
}

function getTouchscreenInfo () {
  if ('maxTouchPoints' in navigator) {
    const maxTouchPoints = navigator.maxTouchPoints
    const touchEvent = 'ontouchstart' in window ? 'true' : 'false'

    return `${maxTouchPoints}-${touchEvent}`
  }

  return 'touchscreen-info-not-supported'
}

export async function fingerprintJs () {
  const fingerprint = await generateFingerprint()
  const uniqueID = md5(fingerprint)
  return uniqueID
}
