"use client";

/**
 * StaffStatusToggle — PakSeekers Admin.
 *
 * Inline status toggle for activating or deactivating Staff accounts.
 * Deactivation immediately revokes active Staff sessions in MongoDB.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UserStatus } from "@/types";
import { updateStaffStatusAction } from "@/server/actions/staff-actions";
import { Badge, Button } from "@/components/ui";

interface StaffStatusToggleProps {
  staffId: string;
  currentStatus: UserStatus;
}

export function StaffStatusToggle({ staffId, currentStatus }: StaffStatusToggleProps) {
  const router = useRouter();
  const [status, setStatus] = useState<UserStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const isSuspended = status === "suspended";

  const handleToggle = () => {
    const nextStatus: UserStatus = isSuspended ? "active" : "suspended";
    startTransition(async () => {
      const res = await updateStaffStatusAction(staffId, nextStatus);
      if (res.success && res.data) {
        setStatus(res.data.status || nextStatus);
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isSuspended ? "error" : "success"} dot className="text-xs capitalize">
        {isSuspended ? "Deactivated" : "Active"}
      </Badge>
      <Button
        type="button"
        size="sm"
        variant={isSuspended ? "primary" : "outline"}
        isLoading={isPending}
        onClick={handleToggle}
        className="text-xs h-7 px-2.5"
      >
        {isSuspended ? "Activate" : "Deactivate"}
      </Button>
    </div>
  );
}
