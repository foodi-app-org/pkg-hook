/**
 *
 * @param d
 * @param s
 * @param id
 * @param jsSrc
 * @param cb
 * @param onError
 */
export default function loadScript(
  d: Document,
  s: string,
  id: string,
  jsSrc: string,
  cb: () => void,
  onError: OnErrorEventHandler
): void {
  const element = d.getElementsByTagName(s)[0]
  const fjs = element
  const js = d.createElement('script')
  js.id = id
  js.src = jsSrc
  if (fjs && fjs.parentNode) {
    fjs.parentNode.insertBefore(js, fjs)
  } else {
    d.head.appendChild(js)
  }
  js.onerror = onError
  js.onload = cb
}
