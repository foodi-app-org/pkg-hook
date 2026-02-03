/**
 *
 * @param __NEXTAUTH
 * @returns The base URL for API requests.
 */
interface NextAuthConfig {
  baseUrlServer: string;
  basePathServer: string;
  basePath: string;
}

/**
 *
 * @param __NEXTAUTH
 * @returns The base URL for API requests.
 */
export function apiBaseUrl(__NEXTAUTH: NextAuthConfig): string {
  if (globalThis.window === undefined) {
    // Return absolute path when called server side
    return `${__NEXTAUTH.baseUrlServer}${__NEXTAUTH.basePathServer}`;
  }
  // Return relative path when called client side
  return __NEXTAUTH.basePath;
}
