function formatError(o) {
  if (hasErrorProperty(o)) {
    o.error = formatError(o.error);
    o.message = o.message ?? o.error.message;
  }
  return o;
}

function hasErrorProperty(x) {
  return !!(x?.error);
}

const _logger = {
  error(code, metadata) {
    metadata = formatError(metadata);
    console.error(
      `[next-auth][error][${code}]`,
      `\nhttps://next-auth.js.org/errors#${code.toLowerCase()}`,
      metadata.message,
      metadata
    );
  },
  warn(code) {
    console.warn(
      `[next-auth][warn][${code}]`,
      `\nhttps://next-auth.js.org/warnings#${code.toLowerCase()}`
    );
  },
  debug(code, metadata) {
    console.log(`[next-auth][debug][${code}]`, metadata);
  },
};


export function setLogger(newLogger = {}, debug) {
  if (!debug) _logger.debug = () => {};

  if (newLogger.error) _logger.error = newLogger.error;
  if (newLogger.warn) _logger.warn = newLogger.warn;
  if (newLogger.debug) _logger.debug = newLogger.debug;
}

export function proxyLogger(logger = _logger, basePath) {
  try {
    if (typeof window === "undefined") {
      return logger;
    }

    const clientLogger = {};
    for (const level in logger) {
      clientLogger[level] = (code, metadata) => {
        _logger[level](code, metadata);

        if (level === "error") {
          metadata = formatError(metadata);
        }
        metadata.client = true;
        const url = `${basePath}/_log`;
        const body = new URLSearchParams({ level, code, ...metadata });
        if (navigator.sendBeacon) {
          return navigator.sendBeacon(url, body);
        }
        return fetch(url, { method: "POST", body, keepalive: true });
      };
    }
    return clientLogger;
  } catch {
    return _logger;
  }
}
export { _logger as default };

