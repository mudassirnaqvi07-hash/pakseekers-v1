/**
 * Admin Root Page — /admin
 *
 * Automatically forwards authenticated administrators to the canonical
 * /admin/dashboard route.
 */

import { redirect } from "next/navigation";

export default function AdminRootPage() {
  redirect("/admin/dashboard");
}