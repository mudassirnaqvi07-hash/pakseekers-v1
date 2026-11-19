"use client";

/**
 * Settings Management Forms & Security Status — PakSeekers Admin.
 *
 * Tabbed interface managing:
 * 1. General Branding & Institutional Contacts
 * 2. Platform Operations (Registration toggle, Maintenance Mode, Announcements)
 * 3. Examination Defaults (Duration, Passing %, Retakes)
 * 4. Content & Moderation Defaults
 * 5. System & Security Health Overview (Read-only infrastructure verification)
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Sliders,
  Award,
  BookOpen,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Save,
  Server,
  Lock,
  Database,
} from "lucide-react";
import { Button, Input, Select, Card, Badge } from "@/components/ui";
import type { PlatformSettings, SystemSecurityStatus } from "@/types";
import {
  updateGeneralSettingsAction,
  updatePlatformConfigAction,
  updateExaminationSettingsAction,
  updateContentDefaultsAction,
} from "@/server/actions/admin-actions";

interface SettingsFormsProps {
  settings: PlatformSettings;
  securityStatus: SystemSecurityStatus;
}

export function SettingsForms({ settings, securityStatus }: SettingsFormsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "general" | "platform" | "examination" | "content" | "security"
  >("general");

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Form 1: General
  async function handleGeneralSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateGeneralSettingsAction(formData);
      if (!res.success) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "General settings saved successfully!" });
        router.refresh();
      }
    });
  }

  // Form 2: Platform Config
  async function handlePlatformSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updatePlatformConfigAction(formData);
      if (!res.success) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Platform operational config updated!" });
        router.refresh();
      }
    });
  }

  // Form 3: Examination Settings
  async function handleExaminationSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateExaminationSettingsAction(formData);
      if (!res.success) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Examination defaults updated!" });
        router.refresh();
      }
    });
  }

  // Form 4: Content Defaults
  async function handleContentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateContentDefaultsAction(formData);
      if (!res.success) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Content default rules saved!" });
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Feedback Banner */}
      {message && (
        <div
          className={`p-4 rounded-md border flex items-center gap-3 text-sm ${
            message.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-error/10 border-error/30 text-error"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-border pb-3 overflow-x-auto scrollbar-thin w-full">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`shrink-0 px-3 sm:px-3.5 py-2 min-h-[42px] sm:min-h-[38px] rounded-md text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "general"
              ? "bg-primary text-white shadow-xs"
              : "text-text-secondary hover:text-text-primary hover:bg-background"
          }`}
        >
          <Globe className="w-4 h-4 shrink-0" />
          General Information
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("platform")}
          className={`shrink-0 px-3 sm:px-3.5 py-2 min-h-[42px] sm:min-h-[38px] rounded-md text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "platform"
              ? "bg-primary text-white shadow-xs"
              : "text-text-secondary hover:text-text-primary hover:bg-background"
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          Platform Controls
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("examination")}
          className={`shrink-0 px-3 sm:px-3.5 py-2 min-h-[42px] sm:min-h-[38px] rounded-md text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "examination"
              ? "bg-primary text-white shadow-xs"
              : "text-text-secondary hover:text-text-primary hover:bg-background"
          }`}
        >
          <Award className="w-4 h-4 shrink-0" />
          Examination Defaults
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`shrink-0 px-3 sm:px-3.5 py-2 min-h-[42px] sm:min-h-[38px] rounded-md text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "content"
              ? "bg-primary text-white shadow-xs"
              : "text-text-secondary hover:text-text-primary hover:bg-background"
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          Content Rules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`shrink-0 px-3 sm:px-3.5 py-2 min-h-[42px] sm:min-h-[38px] rounded-md text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "security"
              ? "bg-primary text-white shadow-xs"
              : "text-text-secondary hover:text-text-primary hover:bg-background"
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          System & Security Health
        </button>
      </div>

      {/* Tab 1: General */}
      {activeTab === "general" && (
        <Card className="p-4 sm:p-6">
          <form onSubmit={handleGeneralSubmit} className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-text-primary mb-2">
              Institution & Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  name="platformName"
                  label="Platform Name"
                  defaultValue={settings.general.platformName}
                  required
                />
              </div>

              <div>
                <Input
                  name="tagline"
                  label="Platform Tagline / Slogan"
                  defaultValue={settings.general.tagline}
                  required
                />
              </div>

              <div>
                <Input
                  name="contactEmail"
                  label="Official Support Email"
                  type="email"
                  defaultValue={settings.general.contactEmail}
                  required
                />
              </div>

              <div>
                <Input
                  name="supportPhone"
                  label="Official Support Phone"
                  defaultValue={settings.general.supportPhone}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  name="address"
                  label="Registered Academic Address"
                  defaultValue={settings.general.address}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
                className="w-full sm:w-auto px-6 font-semibold"
                leftIcon={<Save className="w-3.5 h-3.5 shrink-0" />}
              >
                Save General Settings
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 2: Platform Controls */}
      {activeTab === "platform" && (
        <Card className="p-4 sm:p-6">
          <form onSubmit={handlePlatformSubmit} className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-text-primary mb-2">
              Operational Flags & Registration Controls
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-md border border-border bg-background flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-text-primary">New Student Registration</h4>
                  <p className="text-xs text-text-secondary mt-1">
                    Toggle whether new students can register accounts on the platform.
                  </p>
                </div>
                <div className="mt-4">
                  <Select
                    name="allowRegistration"
                    defaultValue={settings.platform.allowRegistration ? "true" : "false"}
                  >
                    <option value="true">Allowed (Open Registration)</option>
                    <option value="false">Paused (Registrations Temporarily Closed)</option>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-md border border-border bg-background flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-text-primary">Maintenance Mode</h4>
                  <p className="text-xs text-text-secondary mt-1">
                    When active, only administrators can access practice tests and dashboard features.
                  </p>
                </div>
                <div className="mt-4">
                  <Select
                    name="maintenanceMode"
                    defaultValue={settings.platform.maintenanceMode ? "true" : "false"}
                  >
                    <option value="false">Disabled (Normal Operations)</option>
                    <option value="true">Enabled (Maintenance Mode Active)</option>
                  </Select>
                </div>
              </div>

              <div className="md:col-span-2">
                <Input
                  name="announcementBanner"
                  label="Global Announcement Banner (Leave blank to hide)"
                  placeholder="e.g. MDCAT 2026 Grand Mock schedule announced. Registration closes Sunday!"
                  defaultValue={settings.platform.announcementBanner}
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
                className="w-full sm:w-auto px-6 font-semibold"
                leftIcon={<Save className="w-3.5 h-3.5 shrink-0" />}
              >
                Save Platform Controls
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 3: Examination Defaults */}
      {activeTab === "examination" && (
        <Card className="p-4 sm:p-6">
          <form onSubmit={handleExaminationSubmit} className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-text-primary mb-2">
              Default Parameters for New Tests
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  name="defaultTestDuration"
                  label="Default Duration (Minutes)"
                  type="number"
                  min="5"
                  max="360"
                  defaultValue={settings.examination.defaultTestDuration}
                  required
                />
              </div>

              <div>
                <Input
                  name="passingScorePercentage"
                  label="Standard Passing Benchmark (%)"
                  type="number"
                  min="1"
                  max="100"
                  defaultValue={settings.examination.passingScorePercentage}
                  required
                />
              </div>

              <div>
                <Select
                  name="allowTestRetakes"
                  label="Allow Test Retakes by Default"
                  defaultValue={settings.examination.allowTestRetakes ? "true" : "false"}
                >
                  <option value="true">Allowed (Unlimited Retakes)</option>
                  <option value="false">Disallowed (Single Attempt Only)</option>
                </Select>
              </div>

              <div>
                <Select
                  name="showExplanationsImmediately"
                  label="Post-Test Rationale Visibility"
                  defaultValue={
                    settings.examination.showExplanationsImmediately ? "true" : "false"
                  }
                >
                  <option value="true">Show Explanations Immediately on Submit</option>
                  <option value="false">Hide Explanations Until Test Period Closes</option>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
                className="w-full sm:w-auto px-6 font-semibold"
                leftIcon={<Save className="w-3.5 h-3.5 shrink-0" />}
              >
                Save Exam Defaults
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 4: Content Defaults */}
      {activeTab === "content" && (
        <Card className="p-4 sm:p-6">
          <form onSubmit={handleContentSubmit} className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-text-primary mb-2">
              Content Pipeline & Question Bank Moderation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  name="defaultQuestionStatus"
                  label="Default Status for Newly Created Questions"
                  defaultValue={settings.content.defaultQuestionStatus}
                >
                  <option value="published">Published (Available Immediately)</option>
                  <option value="draft">Draft (Requires Review)</option>
                  <option value="review">Review (Pending Academic Verification)</option>
                </Select>
              </div>

              <div>
                <Select
                  name="enableQuestionReporting"
                  label="Student Question Bug Reporting"
                  defaultValue={settings.content.enableQuestionReporting ? "true" : "false"}
                >
                  <option value="true">Enabled (Students Can Flag Question Errors)</option>
                  <option value="false">Disabled (Reporting Button Hidden)</option>
                </Select>
              </div>

              <div>
                <Input
                  name="maxQuestionsPerCustomTest"
                  label="Max Questions per Practice Test"
                  type="number"
                  min="5"
                  max="250"
                  defaultValue={settings.content.maxQuestionsPerCustomTest}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
                className="w-full sm:w-auto px-6 font-semibold"
                leftIcon={<Save className="w-3.5 h-3.5 shrink-0" />}
              >
                Save Content Defaults
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 5: Security & Infrastructure Status (Read-Only) */}
      {activeTab === "security" && (
        <Card className="p-4 sm:p-6">
          <h3 className="text-base font-bold text-text-primary mb-2 flex items-center gap-2">
            <Server className="w-4 h-4 text-primary shrink-0" />
            Infrastructure & Session Security Health
          </h3>
          <p className="text-xs text-text-secondary mb-6">
            Live status of host environment, database clustering, and authentication encryption.
            Sensitive keys and passwords are systematically protected and never exposed.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-md border border-border bg-background">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                Database Cluster
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Database className="w-4 h-4 text-success shrink-0" />
                <span className="text-sm font-bold text-text-primary">
                  {securityStatus.database.clusterType}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                {securityStatus.database.hostSummary}
              </p>
            </div>

            <div className="p-4 rounded-md border border-border bg-background">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                Replica Set Connectivity
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={securityStatus.database.connected ? "success" : "error"} className="text-xs">
                  {securityStatus.database.connected ? "Healthy" : "Offline"}
                </Badge>
                <span className="text-xs text-text-secondary font-mono">
                  RS: {securityStatus.database.replicaSet}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                Direct seedlist resolution active
              </p>
            </div>

            <div className="p-4 rounded-md border border-border bg-background">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                Session Auth Cookies
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Lock className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-bold text-text-primary">
                  {securityStatus.sessionSecurity.cookieSameSite} / HttpOnly
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                Token Hashing: {securityStatus.sessionSecurity.tokenHashing}
              </p>
            </div>

            <div className="p-4 rounded-md border border-border bg-background">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                CSRF & Host-Only Defense
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="success" className="text-xs">
                  RFC 6265 Compliant
                </Badge>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                Dynamic LAN dev origins enabled
              </p>
            </div>

            <div className="p-4 rounded-md border border-border bg-background">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                Node.js Engine
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-mono font-bold text-text-primary">
                  {securityStatus.runtime.nodeVersion}
                </span>
                <Badge variant="neutral" className="text-[10px]">
                  {securityStatus.runtime.nodeEnv}
                </Badge>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                Platform: {securityStatus.runtime.platform}
              </p>
            </div>

            <div className="p-4 rounded-md border border-border bg-background">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                Application Secrets
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={securityStatus.sessionSecurity.secretConfigured ? "success" : "warning"} className="text-xs">
                  {securityStatus.sessionSecurity.secretConfigured ? "Configured" : "Default"}
                </Badge>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                SHA-256 session token digest
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
