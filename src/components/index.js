/**
 * src/components/index.js
 *
 * Barrel exports for all reusable components.
 * Import from '@/components' for cleaner import paths.
 *
 * @example
 * import { Badge, Modal, PageHeader, DataTable } from '@/components';
 * import { RoleGuard } from '@/components';
 */

// ── UI primitives ─────────────────────────────────────────────────────────────
export { default as Badge }       from './ui/Badge';
export { default as Modal }       from './ui/Modal';
export { default as PageHeader }  from './ui/PageHeader';
export { default as DataTable }   from './ui/DataTable';

// ── Auth ──────────────────────────────────────────────────────────────────────
export { default as RoleGuard }   from './auth/RoleGuard';
export { default as AuthButton }  from './auth/AuthButton';
export { default as AuthInput }   from './auth/AuthInput';

// ── Notifications ─────────────────────────────────────────────────────────────
export { default as NotificationItem } from './notifications/NotificationItem';
