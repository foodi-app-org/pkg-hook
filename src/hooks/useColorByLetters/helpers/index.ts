import AleaGen from './alea'
import MersenneTwister from './mersenne_twister'

/**
 * Returns an integer between min and max (inclusive).
 * @param root0
 * @param root0.random
 * @param root0.min
 * @param root0.max
 * @returns {number}
 */
const minMax = ({
  random,
  min,
  max,
}: {
  random: number
  min: number
  max: number
}): number => {
  if (min > max) {
    throw new Error('min must be less than or equal to max')
  }

  return Math.floor(random * (max - min + 1)) + min
}

/**
 * Generates a deterministic random number based on a string value.
 * @param root0
 * @param root0.value
 * @param root0.min
 * @param root0.max
 * @returns {number}
 */
export const randomNumber = ({
  value,
  min,
  max,
}: {
  value: string
  min: number
  max: number
}): number => {
  if (!value) throw new Error('value is required')

  const alea = new AleaGen(value)
  const seed = alea.getSeed()

  // Add this type if you don't have one:
  type MersenneTwisterType = new (seed: number) => { random: () => number }

  // Then cast the import:
  const MersenneTwisterClass = MersenneTwister as unknown as MersenneTwisterType

  // Use the casted class:
  const mersenne = new MersenneTwisterClass(seed)

  return minMax({
    random: mersenne.random(),
    min,
    max,
  })
}
