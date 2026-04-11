// lib/adminPermissions.ts
import { User } from "@/types";

export const ADMIN_PERMISSIONS = {
  MANAGE_USERS:       "manage_users",
  MANAGE_PROPERTIES:  "manage_properties",
  MANAGE_VEHICLES:    "manage_vehicles",
  MANAGE_BOOKINGS:    "manage_bookings",
  MANAGE_PAYOUTS:     "manage_payouts",
  MANAGE_REVIEWS:     "manage_reviews",
  MANAGE_MARKETING:   "manage_marketing",
  MANAGE_SETTINGS:    "manage_settings",
  MANAGE_KYC:         "manage_kyc",
  MANAGE_ADMINS:      "manage_admins",
  VIEW_AUDIT_LOGS:    "view_audit_logs",
  MANAGE_SUPPORT:         "manage_support",
  MANAGE_SUBSCRIPTIONS:   "manage_subscriptions",
} as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

/** Returns true for super-admins (all access) and for admins with the specific permission. */
export function hasAdminPermission(user: User | null, permission: AdminPermission): boolean {
  if (!user || user.role !== "admin") return false;
  if (user.isSuperAdmin || user.adminPermissions === null) return true;
  return (user.adminPermissions ?? []).includes(permission);
}
