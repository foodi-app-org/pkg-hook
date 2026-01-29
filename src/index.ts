import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as { version: string }

export * from './hooks/index'
export * from './utils'
export * from './utils/generateCode'
export * from './cookies'
export * from './security'

// version
export const version = packageJson.version
