"use client";

/**
 * Student Device Sessions Card — PakSeekers Session Management.
 *
 * Displays active devices/sessions for the authenticated student, allows individual
 * session termination, and provides a one-click "Log out from all other devices".
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Laptop,
  Smartphone,
  Tablet,
  Shield,
  LogOut,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import type { UserDeviceSession, DeviceType } from "@/types";
import {
  terminateStudentSessionAction,
  terminateAllOtherStudentSessionsAction,
} from "@/server/actions/auth-actions";

interface StudentDeviceSessionsCardProps {
  initialSessions: UserDeviceSession[];
  maxDevices?: number;
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

export function StudentDeviceSessionsCard({
  initialSessions,
  maxDevices = 2,
}: StudentDeviceSessionsCardProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<UserDeviceSession[]>(initialSessions);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  const handleTerminateSession = (session: UserDeviceSession) => {
    if (session.isCurrent) {
      const confirmLogout = window.confirm(
        "Terminating your current device session will log you out immediately. Proceed?"
      );
      if (!confirmLogout) return;
    }

    setTerminatingId(session.id);
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await terminateStudentSessionAction(session.id);
        if (!res.success) {
          setFeedback({ type: "error", message: res.error });
        } else {
          if (res.data?.isCurrentSessionTerminated) {
            router.push("/student/login");
            return;
          }

          setSessions((prev) => prev.filter((s) => s.id !== session.id));
          setFeedback({
            type: "success",
            message: res.message || "Device session terminated successfully.",
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

  const handleTerminateAllOthers = () => {
    if (otherSessionsCount === 0) return;

    const confirmAction = window.confirm(
      `Are you sure you want to log out of all ${otherSessionsCount} other connected device(s)?`
    );
    if (!confirmAction) return;

    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await terminateAllOtherStudentSessionsAction();
        if (!res.success) {
          setFeedback({ type: "error", message: res.error });
        } else {
          setSessions((prev) => prev.filter((s) => s.isCurrent));
          setFeedback({
            type: "success",
            message: res.message || "Logged out of all other devices successfully.",
          });
        }
      } catch (err) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to revoke other sessions.",
        });
      }
    });
  };

  return (
    <Card className="shadow-2xs">
      <CardContent className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-text-primary">
                Active Devices &amp; Security Sessions
              </h3>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Your account allows up to{" "}
              <strong className="text-text-primary font-semibold">{maxDevices}</strong> concurrent
              active devices. You can manage or revoke access below.
            </p>
          </div>

          {otherSessionsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTerminateAllOthers}
              disabled={isPending}
              className="text-error hover:bg-error/10 hover:border-error/30 text-xs shrink-0"
              leftIcon={<LogOut className="w-3.5 h-3.5 shrink-0" />}
            >
              Sign out other devices ({otherSessionsCount})
            </Button>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            role="alert"
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2.5 animate-in fade-in ${
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
        <div className="mt-4 divide-y divide-border">
          {sessions.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-secondary flex flex-col items-center gap-2">
              <HelpCircle className="w-6 h-6 text-text-secondary/50" />
              <span>No active sessions found for this account.</span>
            </div>
          ) : (
            sessions.map((session) => {
              const isTerminating = terminatingId === session.id;

              return (
                <div
                  key={session.id || session.deviceId}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-2 last:pb-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0 mt-0.5">
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-text-primary">
                          {session.deviceName}
                        </span>
                        {session.isCurrent ? (
                          <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5">
                            This Device
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="text-[10px] px-2 py-0.5 capitalize">
                            {session.deviceType}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary mt-1">
                        <span>{session.browser}</span>
                        <span>•</span>
                        <span>{session.operatingSystem}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-text-secondary" />
                          Active {formatRelativeTime(session.lastActiveAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant={session.isCurrent ? "outline" : "outline"}
                      size="sm"
                      onClick={() => handleTerminateSession(session)}
                      disabled={isPending || isTerminating}
                      className={`text-xs ${
                        session.isCurrent
                          ? "text-text-secondary hover:text-error hover:border-error/40"
                          : "text-error hover:bg-error/10 hover:border-error/30"
                      }`}
                      leftIcon={<Trash2 className="w-3.5 h-3.5 shrink-0" />}
                    >
                      {isTerminating
                        ? "Terminating..."
                        : session.isCurrent
                        ? "Log out"
                        : "Disconnect"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
