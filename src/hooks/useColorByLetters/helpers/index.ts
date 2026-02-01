import AleaGen from './alea'
import MersenneTwister from './mersenne_twister'

/**
 *
 * @param opts
 * @param opts.random
 * @param opts.min
 * @param opts.max
 */
function minMax (opts: { random: number; min: number; max: number }): number {
  const { random, min, max } = opts
  return Math.floor(random * (max - min + 1) + min)
}

export const randomNumber = (opts: { value: string; min: number; max: number }): number => {
  const { value, min, max } = opts

  const prepareSeed = new AleaGen(value)
  // @ts-ignore
  const seedOutput = prepareSeed.s1 * 10000000
  
  // @ts-ignore
  const mersenne = new MersenneTwister(seedOutput)

  return minMax({ random: mersenne.random(), min, max })
}
