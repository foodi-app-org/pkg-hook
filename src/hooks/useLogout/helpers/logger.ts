/**
 * Formats an error object recursively.
 * @param o The error object to format.
 * @returns The formatted error object.
 */
function formatError(o: Record<string, any>): Record<string, any> {
  if (hasErrorProperty(o)) {
    o.error = formatError(o.error)
    o.message = o.message ?? o.error.message
  }
  return o
}

/**
 * Checks if the object has an error property.
 * @param x The object to check.
 * @returns True if the object has an error property.
 */
function hasErrorProperty(x: Record<string, any>): boolean {
  return Boolean(x?.error)
}

type LoggerFunction = (code: string, metadata?: Record<string, any>) => void;
type Logger = {
  error: LoggerFunction;
  warn: (code: string) => void;
  debug: LoggerFunction;
  [key: string]: any;
};

const _logger: Logger = {
  error(code: string, metadata?: Record<string, any>) {
    metadata = formatError(metadata ?? {})
    console.error(
      `[next-auth][error][${code}]`,
      `\nhttps://next-auth.js.org/errors#${code.toLowerCase()}`,
      metadata.message,
      metadata
    )
  },
  warn(code: string) {
    console.warn(
      `[next-auth][warn][${code}]`,
      `\nhttps://next-auth.js.org/warnings#${code.toLowerCase()}`
    )
  },
  debug(code: string, metadata?: Record<string, any>) {
    // Only warn and error are allowed, so use warn for debug messages
    console.warn(`[next-auth][debug][${code}]`, metadata)
  }
}

/**
 * Sets a custom logger.
 * @param newLogger The new logger object.
 * @param debug Enable debug logging.
 */
export function setLogger(debug: boolean, newLogger: Partial<Logger> = {}) {
  if (!debug) _logger.debug = () => { }

  if (newLogger.error) _logger.error = newLogger.error
  if (newLogger.warn) _logger.warn = newLogger.warn
  if (newLogger.debug) _logger.debug = newLogger.debug
}

/**
 * Proxies the logger for client-side logging.
 * @param basePath The base path for logging endpoint.
 * @param logger The logger object to proxy.
 * @returns The proxied logger.
 */
export function proxyLogger(basePath: string, logger: Logger = _logger): Logger {
  try {
    if (globalThis.window === undefined) {
      return logger
    }

    const clientLogger: Logger = {
      error: logger.error,
      warn: logger.warn,
      debug: logger.debug
    }
    for (const level of ['error', 'warn', 'debug'] as const) {
      clientLogger[level] = (code: string, metadata: Record<string, any> = {}) => {
        _logger[level](code, metadata)

        if (level === 'error') {
          metadata = formatError(metadata)
        }
        metadata.client = true
        const url = `${basePath}/_log`
        const body = new URLSearchParams({ level, code, ...metadata })
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, body)
        } else {
          // Fire and forget, ignore the returned promise
          void fetch(url, { method: 'POST', body, keepalive: true })
        }
      }
    }
    return clientLogger
  } catch {
    return _logger
  }
}

export default _logger
