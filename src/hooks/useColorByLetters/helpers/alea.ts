/**
 * Alea pseudo-random number generator.
 */
class AleaGen {
  private c: number
  private s0: number
  private s1: number
  private s2: number

  /**
   * Creates a new AleaGen instance.
   * @param seed The seed value for the generator.
   */
  constructor(seed?: unknown) {
    seed ??= Date.now()
    let n = 0xefc8249d

    this.c = 1
    this.s0 = mash(' ')
    this.s1 = mash(' ')
    this.s2 = mash(' ')

    this.s0 = (this.s0 - mash(seed) + 1) % 1
    this.s1 = (this.s1 - mash(seed) + 1) % 1
    this.s2 = (this.s2 - mash(seed) + 1) % 1

    /**
     *
     * @param data
     * @returns {number}
     */
    function mash(data: unknown): number {
      const str = String(data)
      for (let i = 0; i < str.length; i++) {
        n += str.codePointAt(i) ?? 0
        let h = 0.02519603282416938 * n
        n = h >>> 0
        h -= n
        h *= n
        n = h >>> 0
        h -= n
        n += h * 0x100000000
      }
      return (n >>> 0) * 2.3283064365386963e-10
    }
  }

  /**
   * Returns a deterministic 32-bit integer seed.
   * @returns {number} A pseudo-random 32-bit integer.
   */
  getSeed(): number {
    return Math.floor(this.next() * 0xffffffff)
  }

  /**
   * Generates the next random number.
   * @returns {number} A pseudo-random number between 0 (inclusive) and 1 (exclusive).
   */
  next(): number {
    const t = 2091639 * this.s0 + this.c * 2.3283064365386963e-10
    this.c = Math.trunc(t)
    this.s0 = this.s1
    this.s1 = this.s2
    this.s2 = t - this.c
    return this.s2
  }
}

export default AleaGen
