"use client";

/**
 * StaffPermissionsEditor — PakSeekers Admin RBAC.
 *
 * Interactive grouped checkbox selector for assigning/modifying/revoking
 * Staff permissions. Strictly keeps Admin-only governance permissions locked.
 */

import { ShieldCheck, Lock, RotateCcw, CheckSquare, Square } from "lucide-react";
import type { Permission } from "@/types";
import {
  PERMISSION_GROUPS,
  DEFAULT_STAFF_PERMISSIONS,
  STAFF_ASSIGNABLE_PERMISSIONS,
} from "@/lib/auth/permissions";
import { Button, Badge } from "@/components/ui";

interface StaffPermissionsEditorProps {
  selectedPermissions: Permission[];
  onChange: (permissions: Permission[]) => void;
  disabled?: boolean;
}

export function StaffPermissionsEditor({
  selectedPermissions,
  onChange,
  disabled = false,
}: StaffPermissionsEditorProps) {
  const selectedSet = new Set<Permission>(selectedPermissions);

  const togglePermission = (perm: Permission) => {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (next.has(perm)) {
      next.delete(perm);
    } else {
      next.add(perm);
    }
    onChange(Array.from(next));
  };

  const toggleGroup = (groupPermissions: Permission[], selectAll: boolean) => {
    if (disabled) return;
    const next = new Set(selectedSet);
    for (const p of groupPermissions) {
      if (selectAll) {
        next.add(p);
      } else {
        next.delete(p);
      }
    }
    onChange(Array.from(next));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Quick Presets Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-background border border-border">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>
            <strong className="text-text-primary">{selectedPermissions.length}</strong> of{" "}
            {STAFF_ASSIGNABLE_PERMISSIONS.length} staff-assignable permissions selected
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onChange([...DEFAULT_STAFF_PERMISSIONS])}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs h-8"
          >
            Default Staff Preset
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onChange([...STAFF_ASSIGNABLE_PERMISSIONS])}
            leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
            className="text-xs h-8"
          >
            Select All Assignable
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={() => onChange([])}
            leftIcon={<Square className="w-3.5 h-3.5" />}
            className="text-xs h-8"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Permission Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PERMISSION_GROUPS.map((group) => {
          const assignableKeys = group.permissions
            .filter((p) => !p.adminOnly)
            .map((p) => p.key);
          const selectedInGroup = assignableKeys.filter((k) => selectedSet.has(k)).length;
          const allSelectedInGroup =
            assignableKeys.length > 0 && selectedInGroup === assignableKeys.length;

          return (
            <div
              key={group.id}
              className={`rounded-xl border p-4 flex flex-col gap-3 ${
                group.adminOnlyGroup
                  ? "border-border/60 bg-background/60 opacity-80"
                  : "border-border bg-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-border/70">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-text-primary">{group.title}</h4>
                    {group.adminOnlyGroup ? (
                      <Badge variant="error" className="text-[10px] py-0">
                        Admin Only
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px] py-0">
                        {selectedInGroup}/{assignableKeys.length}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5">{group.description}</p>
                </div>

                {!group.adminOnlyGroup && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleGroup(assignableKeys, !allSelectedInGroup)}
                    className="text-[11px] font-semibold text-primary hover:underline shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {allSelectedInGroup ? "Clear Group" : "Select Group"}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {group.permissions.map((perm) => {
                  const checked = !perm.adminOnly && selectedSet.has(perm.key);
                  const isLocked = Boolean(perm.adminOnly) || disabled;

                  return (
                    <label
                      key={perm.key}
                      className={`flex items-start gap-2.5 p-2 rounded-lg border transition-colors ${
                        perm.adminOnly
                          ? "border-transparent bg-background/50 cursor-not-allowed"
                          : checked
                          ? "border-primary/30 bg-primary/5 cursor-pointer"
                          : "border-transparent hover:bg-background cursor-pointer"
                      }`}
                    >
                      {perm.adminOnly ? (
                        <Lock className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                      ) : (
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isLocked}
                          onChange={() => togglePermission(perm.key)}
                          className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary shrink-0 cursor-pointer"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-text-primary">
                            {perm.label}
                          </span>
                          <code className="text-[10px] text-text-secondary bg-background px-1.5 py-0.5 rounded border border-border/60">
                            {perm.key}
                          </code>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-snug mt-0.5">
                          {perm.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
