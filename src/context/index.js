/**
 * src/context/index.js
 *
 * Barrel exports for all React Context providers and hooks.
 * Import from '@/context' instead of individual context files.
 *
 * @example
 * import { NotificationProvider, useNotificationContext } from '@/context';
 */

export {
  NotificationProvider,
  useNotifications as useNotificationContext,
} from './NotificationContext';
