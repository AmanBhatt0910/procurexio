/**
 * src/config/index.js
 *
 * Barrel exports for all configuration modules.
 *
 * @example
 * import { ROUTES, ROLES, APP_NAME } from '@/config';
 * import loggingConfig from '@/config/logging';
 */

export * from './constants';
export * from './routes';
export { default as loggingConfig } from './logging';
