import { useState, useEffect } from 'react'

export const usePWAInstall = () => {
  type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  };

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      const event = e as unknown as BeforeInstallPromptEvent
      event.preventDefault() // Evita que el navegador muestre el diálogo automáticamente
      setDeferredPrompt(event) // Almacena el evento para que puedas llamarlo más tarde
      setIsInstallable(true) // Marca que la PWA es instalable
    }

    globalThis.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      globalThis.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const installPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()

      deferredPrompt.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed'; platform: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.warn('User accepted the install prompt')
        } else {
          console.warn('User dismissed the install prompt')
        }
        setDeferredPrompt(null) // Limpia el evento después de usarlo
        setIsInstallable(false) // Oculta el botón de instalación
      })
    }
  }

  return { isInstallable, installPWA }
}
