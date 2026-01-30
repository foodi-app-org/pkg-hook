import pkg from '../package.json';
export * from './hooks/index'
export * from './utils'
export * from './utils/generateCode'
export * from './cookies'
export * from './security'
export * from './config/client'

// Export the version from package.json
export const version = pkg.version;

