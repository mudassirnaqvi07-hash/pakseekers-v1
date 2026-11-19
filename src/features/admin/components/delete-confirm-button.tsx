"use client";

/**
 * DeleteConfirmButton — PakSeekers Admin.
 *
 * Safe delete action button that requires confirmation before executing
 * destructive server actions.
 */

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";

interface DeleteConfirmButtonProps {
  onDelete?: () => Promise<{ success: boolean; error?: string }>;
  itemId?: string;
  itemTitle?: string;
  deleteAction?: (id: string) => Promise<{ success: boolean; error?: string }>;
  itemType?: string;
  size?: "sm" | "md";
  iconOnly?: boolean;
}

export function DeleteConfirmButton({
  onDelete,
  itemId,
  itemTitle,
  deleteAction,
  itemType = "item",
  size = "sm",
  iconOnly = false,
}: DeleteConfirmButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    startTransition(async () => {
      setError(null);
      const res =
        deleteAction && itemId
          ? await deleteAction(itemId)
          : onDelete
          ? await onDelete()
          : { success: false, error: "No action provided" };
      if (!res.success) {
        setError(res.error || "Failed to delete");
        setIsConfirming(false);
      }
    });
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-1.5 animate-in fade-in">
        {itemTitle && (
          <span className="text-[10px] text-text-secondary max-w-[100px] truncate hidden sm:inline">
            {itemTitle}
          </span>
        )}
        <Button
          type="button"
          variant="danger"
          size={size}
          isLoading={isPending}
          onClick={handleConfirm}
          className="text-xs h-7 px-2"
        >
          Confirm Delete
        </Button>
        <Button
          type="button"
          variant="ghost"
          size={size}
          disabled={isPending}
          onClick={() => setIsConfirming(false)}
          className="text-xs h-7 px-2"
        >
          Cancel
        </Button>
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={() => setIsConfirming(true)}
      className="text-text-secondary hover:text-error hover:bg-red-50 transition-colors"
      title={`Delete this ${itemType}`}
      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
    >
      {!iconOnly ? <span className="text-xs">Delete</span> : undefined}
    </Button>
  );
}
