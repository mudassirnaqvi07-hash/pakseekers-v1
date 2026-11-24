"use client";

/**
 * Admin Student Device Sessions & Limit Management Card — PakSeekers.
 *
 * Allows administrators to:
 * 1. View all active device sessions for a student.
 * 2. Terminate individual active sessions.
 * 3. Terminate all active sessions at once.
 * 4. Configure the concurrent device limit (1-10 devices) for the student.
 */

import { useState, useTransition } from "react";
import {
  Laptop,
  Smartphone,
  Tablet,
  Shield,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sliders,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import type { UserDeviceSession, DeviceType } from "@/types";
import {
  terminateStudentSessionByAdminAction,
  terminateAllStudentSessionsByAdminAction,
  updateStudentDeviceLimitAction,
} from "@/server/actions/admin-actions";

interface StudentAdminSessionsCardProps {
  studentId: string;
  studentName: string;
  initialSessions: UserDeviceSession[];
  initialMaxDevices?: number;
}

function getDeviceIcon(type: DeviceType) {
  switch (type) {
    case "mobile":
      return <Smartphone className="w-5 h-5 text-primary shrink-0" />;
    case "tablet":
      return <Tablet className="w-5 h-5 text-primary shrink-0" />;
    case "desktop":
    default:
      return <Laptop className="w-5 h-5 text-primary shrink-0" />;
  }
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return "Recently";
  }
}

export function StudentAdminSessionsCard({
  studentId,
  studentName,
  initialSessions,
  initialMaxDevices = 2,
}: StudentAdminSessionsCardProps) {
  const [sessions, setSessions] = useState<UserDeviceSession[]>(initialSessions);
  const [maxDevices, setMaxDevices] = useState<number>(initialMaxDevices);
  const [limitInput, setLimitInput] = useState<string>(String(initialMaxDevices));
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTerminateSession = (sessionId: string) => {
    setTerminatingId(sessionId);
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await terminateStudentSessionByAdminAction(studentId, sessionId);
        if (!res.success) {
          setFeedback({ type: "error", message: res.error });
        } else {
          setSessions((prev) => prev.filter((s) => s.id !== sessionId));
          setFeedback({
            type: "success",
            message: "Student device session terminated successfully.",
          });
        }
      } catch (err) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to terminate session.",
        });
      } finally {
        setTerminatingId(null);
      }
    });
  };

  const handleTerminateAllSessions = () => {
    if (sessions.length === 0) return;

    const confirmAction = window.confirm(
      `Terminate all ${sessions.length} active session(s) for ${studentName}? The student will be signed out from all devices.`
    );
    if (!confirmAction) return;

    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await terminateAllStudentSessionsByAdminAction(studentId);
        if (!res.success) {
          setFeedback({ type: "error", message: res.error });
        } else {
          setSessions([]);
          setFeedback({
            type: "success",
            message: `All active sessions for ${studentName} have been terminated.`,
          });
        }
      } catch (err) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to terminate all sessions.",
        });
      }
    });
  };

  const handleSaveDeviceLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(limitInput, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 10) {
      setFeedback({
        type: "error",
        message: "Device limit must be an integer between 1 and 10.",
      });
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await updateStudentDeviceLimitAction(studentId, parsed);
        if (!res.success) {
          setFeedback({ type: "error", message: res.error });
        } else {
          setMaxDevices(parsed);
          setFeedback({
            type: "success",
            message: res.message || `Device limit successfully set to ${parsed} devices.`,
          });
        }
      } catch (err) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to update device limit.",
        });
      }
    });
  };

  return (
    <Card className="p-4 sm:p-6 shadow-2xs">
      <CardContent className="flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-text-primary">
                Active Device Sessions &amp; Limits
              </h3>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Currently active on{" "}
              <strong className="text-text-primary font-semibold">{sessions.length}</strong> of{" "}
              <strong className="text-text-primary font-semibold">{maxDevices}</strong> allowed
              device(s).
            </p>
          </div>

          {sessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTerminateAllSessions}
              disabled={isPending}
              className="text-error hover:bg-error/10 hover:border-error/30 text-xs shrink-0 self-start sm:self-auto"
              leftIcon={<LogOut className="w-3.5 h-3.5 shrink-0" />}
            >
              Terminate All Sessions ({sessions.length})
            </Button>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            role="alert"
            className={`p-3 rounded-lg text-xs flex items-center gap-2.5 animate-in fade-in ${
              feedback.type === "success"
                ? "bg-success/10 text-success border border-success/20"
                : "bg-error/10 text-error border border-error/20"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Sessions List */}
        <div className="divide-y divide-border">
          {sessions.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-secondary flex flex-col items-center gap-2">
              <HelpCircle className="w-6 h-6 text-text-secondary/50" />
              <span>No active device sessions for this student account.</span>
            </div>
          ) : (
            sessions.map((session) => {
              const isTerminating = terminatingId === session.id;

              return (
                <div
                  key={session.id || session.deviceId}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 mt-0.5">
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-text-primary">
                          {session.deviceName}
                        </span>
                        <Badge variant="neutral" className="text-[10px] px-2 py-0.5 capitalize">
                          {session.deviceType}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-text-secondary mt-0.5">
                        <span>{session.browser}</span>
                        <span>•</span>
                        <span>{session.operatingSystem}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-text-secondary" />
                          Last active: {formatRelativeTime(session.lastActiveAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTerminateSession(session.id)}
                      disabled={isPending || isTerminating}
                      className="text-error hover:bg-error/10 hover:border-error/30 text-xs h-8 px-2.5"
                      leftIcon={<Trash2 className="w-3.5 h-3.5 shrink-0" />}
                    >
                      {isTerminating ? "Revoking..." : "Revoke Session"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Device Limit Configuration Sub-section */}
        <div className="pt-4 border-t border-border bg-background/50 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 p-4 sm:p-6 rounded-b-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary shrink-0" />
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Concurrent Device Limit
              </h4>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Configure the maximum number of distinct devices this student can log in from simultaneously (default is 2, range 1–10).
            </p>
          </div>

          <form onSubmit={handleSaveDeviceLimit} className="flex items-center gap-2 shrink-0">
            <div className="w-24">
              <Input
                type="number"
                min={1}
                max={10}
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                disabled={isPending}
                className="h-9 text-xs font-semibold text-center"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={isPending || String(maxDevices) === limitInput.trim()}
              className="h-9 text-xs font-semibold px-4"
            >
              {isPending ? "Saving..." : "Update Limit"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
