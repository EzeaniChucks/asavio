// app/admin/page.tsx — redirect to full admin dashboard
import { redirect } from "next/navigation";

export default function AdminRedirect() {
  redirect("/dashboard/admin");
}
