import MersenneTwister from './mersenne_twister.js'
import AleaGen from './alea.js'

function minMax (opts) {
  const { random, min, max } = opts
  return Math.floor(random * (max - min + 1) + min)
}

export const randomNumber = (opts) => {
  const { value, min, max } = opts

  const prepareSeed = new AleaGen(value)
  const seedOutput = prepareSeed.s1 * 10000000

  const mersenne = new MersenneTwister(seedOutput)

  return minMax({ random: mersenne.random(), min, max })
}
