export function apiBaseUrl (__NEXTAUTH) {
  if (typeof window === 'undefined') {
    // Return absolute path when called server side
    return `${__NEXTAUTH.baseUrlServer}${__NEXTAUTH.basePathServer}`
  }
  // Return relative path when called client side
  return __NEXTAUTH.basePath
}
