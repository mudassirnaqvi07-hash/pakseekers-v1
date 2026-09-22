"use client";

/**
 * PublishToggleButton — PakSeekers Admin.
 *
 * Allows one-click publish/unpublish toggling for tests.
 */

import { useState, useTransition } from "react";
import type { TestStatus } from "@/types";
import { Button, Badge } from "@/components/ui";
import { togglePublishTestAction } from "@/server/actions/content-actions";

interface PublishToggleButtonProps {
  testId: string;
  initialStatus: TestStatus;
}

export function PublishToggleButton({
  testId,
  initialStatus,
}: PublishToggleButtonProps) {
  const [status, setStatus] = useState<TestStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await togglePublishTestAction(testId);
      if (res.success && res.data) {
        setStatus(res.data.status);
      }
    });
  };

  const isPublished = status === "published";

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={isPublished ? "success" : "draft"}
        dot
        className="capitalize text-xs cursor-default"
      >
        {status}
      </Badge>

      <Button
        type="button"
        size="sm"
        variant={isPublished ? "outline" : "primary"}
        isLoading={isPending}
        onClick={handleToggle}
        className="text-xs h-7 px-2"
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
    </div>
  );
}
