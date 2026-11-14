const EVENT = 'venty:delivery-catalog-changed'
const CHANNEL = 'venty-delivery-catalog-v1'
export function publishDeliveryCatalogChange(storeId: string): void {
  if (typeof window === 'undefined' || !storeId) return
  window.dispatchEvent(new CustomEvent(EVENT, { detail: storeId }))
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(CHANNEL)
      try { channel.postMessage(storeId) } finally { channel.close() }
    }
  } catch { /* Cross-tab synchronization is best-effort; focus refresh remains. */ }
}
export function subscribeDeliveryCatalog(storeId: string, refresh: () => void): () => void {
  if (typeof window === 'undefined' || !storeId) return () => {}
  const local = (event: Event) => { if ((event as CustomEvent<unknown>).detail === storeId) refresh() }
  window.addEventListener(EVENT, local)
  let channel: BroadcastChannel | undefined
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(CHANNEL)
      channel.onmessage = event => { if (event.data === storeId) refresh() }
    }
  } catch { channel?.close(); channel = undefined }
  window.addEventListener('focus', refresh)
  return () => { window.removeEventListener(EVENT, local); window.removeEventListener('focus', refresh); channel?.close() }
}
