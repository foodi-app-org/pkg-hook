// ticket-generator.ts
/**
 * Ticket generator for POS systems.
 * - Provides numeric and alphanumeric strategies.
 * - Supports prefix, timestamp embedding, synchronous generation and async uniqueness check.
 *
 * JSDoc comments are in English as requested.
 */

type Strategy = 'alphanumeric' | 'numeric';

export interface TicketConfig {
    /** Total length of the generated code excluding prefix. Minimum 4. */
    length?: number;
    /** Strategy: 'alphanumeric' | 'numeric' */
    strategy?: Strategy;
    /** Optional human-readable prefix (e.g. 'TKT-', 'POS1-') */
    prefix?: string;
    /** If true, embed a short timestamp chunk (base36) at start of payload */
    timestamp?: boolean;
    /** Maximum attempts for uniqueness check when using generateUniqueAsync */
    maxAttempts?: number;
    /** Padding char for numeric sequences (only used if `useSequential` provided) */
    padChar?: string;
}

/**
 * Result returned by generators.
 */
export type TicketResult =
    | { success: true; code: string; error?: undefined }
    | { success: false; error: string; code?: string };

/**
 * Async uniqueness checker signature.
 * Implement with DB query that returns true if code is unique (not found).
 */
export type IsUniqueFn = (code: string) => Promise<boolean>;

/* -------------------- Implementation -------------------- */

/**
 * Secure random integer in [0, max)
 * @param max
 * @returns random integer in [0, max)
 */
const secureRandomInt = (max: number): number => {
  if (typeof crypto !== 'undefined' && typeof (crypto as any).getRandomValues === 'function') {
    // browser
    const arr = new Uint32Array(1);
    (crypto as any).getRandomValues(arr)
    return arr[0] % max
  }
  try {
    // node
     
    const nodeCrypto = require('crypto')
    const buf = nodeCrypto.randomBytes(4)
    const val = buf.readUInt32BE(0)
    return val % max
  } catch {
    // fallback (less secure)
    return Math.floor(Math.random() * max)
  }
}

/**
 * Build a random string from charset.
 * @param length
 * @param charset
 */
const randomFromCharset = (length: number, charset: string): string => {
  const out: string[] = []
  const m = charset.length
  for (let i = 0; i < length; i += 1) {
    out.push(charset[secureRandomInt(m)])
  }
  return out.join('')
}

/**
 * Short fixed-size timestamp chunk that respects strategy.
 * - For 'numeric' returns decimal digits (zero-padded).
 * - For 'alphanumeric' returns base36 chars.
 *
 * @param strategy generation strategy
 * @param size chunk length (default 4)
 * @returns timestamp chunk string of length `size`
 */
const timestampChunk = (strategy: Strategy, size = 4): string => {
  const now = Date.now()
  if (strategy === 'numeric') {
    const mod = Math.pow(10, size)
    const n = (now % mod).toString().padStart(size, '0')
    return n
  }
  // alphanumeric: compact base36 slice (keeps letters & digits)
  return now.toString(36).slice(-size).padStart(size, '0')
}

/**
 * Validate config and return normalized defaults or error string.
 * @param cfg
 */
const normalizeConfig = (cfg?: TicketConfig): { cfg?: Required<TicketConfig>; error?: string } => {
  const defaultCfg: Required<TicketConfig> = {
    length: 10,
    strategy: 'alphanumeric',
    prefix: '',
    timestamp: false,
    maxAttempts: 5,
    padChar: '0'
  }

  if (!cfg) return { cfg: defaultCfg }

  const merged = { ...defaultCfg, ...cfg }

  if (!Number.isInteger(merged.length) || merged.length < 4) {
    return { error: 'length must be an integer >= 4' }
  }

  if (!['alphanumeric', 'numeric'].includes(merged.strategy)) {
    return { error: "strategy must be 'alphanumeric' or 'numeric'" }
  }

  if (typeof merged.prefix !== 'string' || /[^A-Za-z0-9-_]/.test(merged.prefix)) {
    return { error: 'prefix must be alphanumeric, dash or underscore only' }
  }

  if (typeof merged.maxAttempts !== 'number' || merged.maxAttempts < 1) {
    merged.maxAttempts = defaultCfg.maxAttempts
  }

  if (typeof merged.padChar !== 'string' || merged.padChar.length !== 1) {
    merged.padChar = defaultCfg.padChar
  }

  return { cfg: merged }
}

/**
 * Generate a ticket code (synchronous, no uniqueness guarantee).
 * Use generateUniqueAsync if you need persistence-level uniqueness.
 *
 * @param config Ticket generation options
 * @returns TicketResult with code or error
 */
export const generateTicket = (config?: TicketConfig): TicketResult => {
  const normalized = normalizeConfig(config)
  if (normalized.error) return { success: false, error: normalized.error }
  const cfg = normalized.cfg!

  const payloadLen = cfg.length
  const prefix = cfg.prefix || ''

  // decide charset
  const numericCharset = '0123456789'
  const alphaNumCharset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789' // removed O/0/l for readability
  const charset = cfg.strategy === 'numeric' ? numericCharset : alphaNumCharset

  // prepare timestamp chunk if requested (keep it short and strategy-aware)
  const ts = cfg.timestamp ? timestampChunk(cfg.strategy, 4) : ''


  // calc remaining length for random part
  const remaining = payloadLen - ts.length
  if (remaining < 1) return { success: false, error: 'length too small for timestamp embedding' }

  const randomPart = randomFromCharset(remaining, charset)

  const code = `${prefix}${ts}${randomPart}`
  return { success: true, code }
}

/**
 * Generate a ticket code with uniqueness guarantee using an async uniqueness checker.
 * Tries up to config.maxAttempts times.
 *
 * @param isUnique Async function that returns true if code is unique (not present)
 * @param config Ticket generation options
 * @returns TicketResult with unique code or error
 */
export const generateUniqueAsync = async (isUnique: IsUniqueFn, config?: TicketConfig): Promise<TicketResult> => {
  const normalized = normalizeConfig(config)
  if (normalized.error) return { success: false, error: normalized.error }
  const cfg = normalized.cfg!

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt += 1) {
    const candidateRes = generateTicket(cfg)
    if (!candidateRes.success) return candidateRes

    const candidate = candidateRes.code
    try {
      const unique = await isUnique(candidate)
      if (unique) return { success: true, code: candidate }
      // else collision -> retry
    } catch (err) {
      return { success: false, error: `isUnique function threw: ${(err as Error).message}` }
    }
  }

  return { success: false, error: 'unable to generate unique ticket after max attempts' }
}

/* -------------------- Example usage -------------------- */

/*
Example (sync):
const res = generateTicket({ length: 8, strategy: 'numeric', prefix: 'T-', timestamp: true });
if (!res.success) console.error(res.error);
else console.log('Ticket:', res.code);

Example (async uniqueness check, e.g. DB):
const isUniqueInDb = async (code: string) => {
  // query DB to see if code exists; return true if NOT exist
  return !(await db.exists({ ticketCode: code }));
};
const unique = await generateUniqueAsync(isUniqueInDb, { length: 10, strategy: 'alphanumeric', prefix: 'POS1-', timestamp: true });
if (unique.success) console.log('Unique ticket:', unique.code);
else console.error('Error generating unique:', unique.error);
*/
