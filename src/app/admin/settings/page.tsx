import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import {
  getPlatformSettings,
  getSystemSecurityStatus,
} from "@/server/services/settings-service";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsForms } from "@/features/admin/components/settings-forms";

export const metadata: Metadata = {
  title: "Platform Settings — PakSeekers Admin",
  description: "Platform configuration, operational flags, examination defaults, and security health.",
};

export default async function SettingsPage() {
  await requireAdmin();

  const [settings, securityStatus] = await Promise.all([
    getPlatformSettings(),
    getSystemSecurityStatus(),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <PageHeader
        title="Platform & System Settings"
        description="Configure institutional metadata, operational flags, examination defaults, and monitor infrastructure security."
      />

      <SettingsForms settings={settings} securityStatus={securityStatus} />
    </div>
  );
}
