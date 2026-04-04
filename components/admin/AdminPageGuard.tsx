"use client";

// components/admin/AdminPageGuard.tsx
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { hasAdminPermission, AdminPermission } from "@/lib/adminPermissions";

interface Props {
  permission: AdminPermission;
  children: React.ReactNode;
}

/**
 * Wraps an admin page. Redirects to the admin dashboard if the logged-in admin
 * does not have the required permission. Super-admins always pass.
 */
export default function AdminPageGuard({ permission, children }: Props) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== "admin") {
      router.replace("/login");
      return;
    }
    if (!hasAdminPermission(user, permission)) {
      router.replace("/dashboard/admin");
    }
  }, [isLoading, user, permission, router]);

  if (isLoading || !user || user.role !== "admin") return null;
  if (!hasAdminPermission(user, permission)) return null;

  return <>{children}</>;
}
