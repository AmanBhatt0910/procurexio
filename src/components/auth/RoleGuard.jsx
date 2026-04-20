'use client';

import { useAuth } from '@/hooks/useAuth';
import { hasPermission, hasAnyPermission } from '@/lib/auth/rbac';

/**
 * RoleGuard — conditionally renders children based on user role/permissions.
 *
 * Props:
 *   roles        {string[]}  - allowed roles (OR check)
 *   permission   {string}    - single required permission
 *   permissions  {string[]}  - any of these permissions (OR check)
 *   fallback     {ReactNode} - what to show if access denied (default: null)
 *   children     {ReactNode}
 *
 * Examples:
 *   <RoleGuard roles={['company_admin', 'manager']}>
 *     <CreateRFQButton />
 *   </RoleGuard>
 *
 *   <RoleGuard permission="award_contract" fallback={<p>No access</p>}>
 *     <AwardButton />
 *   </RoleGuard>
 */
export default function RoleGuard({
  roles,
  permission,
  permissions,
  fallback = null,
  children,
}) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user)   return fallback;

  // Check roles list
  if (roles && !roles.includes(user.role)) return fallback;

  // Check single permission
  if (permission && !hasPermission(user.role, permission)) return fallback;

  // Check multiple permissions (any match)
  if (permissions && !hasAnyPermission(user.role, permissions)) return fallback;

  return children;
}