// import md5 from 'md5'

/**
 * @returns Información de la CPU en formato JSON
 */
async function getCPUInfo () {
  if (navigator.hardwareConcurrency) {
    try {
      const logicalCores = navigator.hardwareConcurrency
      const agent = globalThis.navigator.userAgent
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

/**
 * Genera una huella digital única del navegador y dispositivo del usuario
 * @returns {Promise<string>} Huella digital en formato JSON
 */
async function generateFingerprint () {
  const canvas = document.createElement('canvas')
  const audioContext = new ((globalThis as any).AudioContext || (globalThis as any).webkitAudioContext)()

  const userAgent = globalThis.navigator.userAgent
  const language = globalThis.navigator.language
  const colorDepth = globalThis.screen.colorDepth
  const availableScreenHeight = globalThis.screen.availHeight
  const platform = globalThis.navigator.platform
  const cpuClass = (globalThis.navigator as any)?.cpuClass || 'unknown'

  const canvasFingerprint = await generateCanvasFingerprint(canvas)
  const audioFingerprint = await generateAudioFingerprint(audioContext)

  const cpuInfoStr = await getCPUInfo()
  const cpuInfoObj = (() => {
    try {
      return JSON.parse(cpuInfoStr)
    } catch {
      return {}
    }
  })()
  const webGLInfo = await getWebGLInfo()
  const fonts = getInstalledFonts()
  const touchscreenInfo = getTouchscreenInfo()

  const fingerprintData = {
    browser: {
      userAgent,
      language,
      colorDepth,
      availableScreenHeight,
      plugins: Array.from(globalThis.navigator.plugins).map(plugin => {return plugin.name}).join(','),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hardwareConcurrency: cpuInfoObj.logicalCores || 'unknown',
      platformVersion: (globalThis.navigator as any)?.platformVersion || 'unknown'
    },
    device: {
      platform,
      cpuClass
    },
    canvas: canvasFingerprint,
    audio: audioFingerprint,
    cpu: cpuInfoStr,
    webgl: webGLInfo,
    fonts,
    touchscreen: touchscreenInfo
  }

  const fingerprint = JSON.stringify(fingerprintData)
  // const uniqueID = md5(fingerprint)
  return fingerprint
}

// Función para generar huella digital del audio
/**
 *
 * @param audioContext
 * @returns {Promise<{isAudioContextAvailable: boolean}>}
 */
async function generateAudioFingerprint (audioContext: AudioContext) {
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
/**
 *
 * @param canvas
 * @returns {Promise<{width: number, height: number}>}
 */
async function generateCanvasFingerprint (canvas: HTMLCanvasElement) {
  if (canvas) {
    try {
      canvas.width = 200
      canvas.height = 200
      const context = canvas.getContext('2d')
      if (!context) { throw new Error('No se pudo obtener el contexto del canvas') }
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

/**
 * @returns Información de WebGL en formato string
 */
async function getWebGLInfo () {
  if ('WebGLRenderingContext' in globalThis) {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

    if (gl) {
      const webgl = gl as WebGLRenderingContext
      const renderer = webgl.getParameter(webgl.RENDERER)
      const version = webgl.getParameter(webgl.VERSION)

      // Obtener más información sobre las capacidades WebGL si es necesario

      return `${renderer}-${version}`
    }
  }

  return 'webgl-info-not-supported'
}

/**
 * @returns {string} Información de las fuentes instaladas
 */
function getInstalledFonts () {
  const fonts = [] as string[]

  if ('fonts' in document) {
    document.fonts.forEach(font => {
      fonts.push(font.family)
    })
  }

  return fonts.join(',')
}

/**
 * @returns {string} Información de la pantalla táctil
 */
function getTouchscreenInfo () {
  if ('maxTouchPoints' in navigator) {
    const maxTouchPoints = navigator.maxTouchPoints
    const touchEvent = 'ontouchstart' in window ? 'true' : 'false'

    return `${maxTouchPoints}-${touchEvent}`
  }

  return 'touchscreen-info-not-supported'
}

/**
 * Genera y devuelve la huella digital del usuario
 * @returns {Promise<string>} Huella digital en formato JSON
 */
export async function fingerprintJs () {
  const fingerprint = await generateFingerprint()
  // const uniqueID = md5(fingerprint)
  return fingerprint
}
