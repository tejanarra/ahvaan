"use client";

import { logout } from "@/lib/auth-actions";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { UserIcon, ChevronDownIcon } from "@/components/icons";

export function AccountMenu({ email }: { email: string }) {
  return (
    <DropdownMenu
      trigger={
        <span className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface">
          <UserIcon className="h-3.5 w-3.5 text-muted" />
          <span className="hidden sm:inline">{email}</span>
          <ChevronDownIcon className="h-3.5 w-3.5 text-muted" />
        </span>
      }
      items={[
        {
          // logout() is a server action with no arguments and always
          // redirect()s — calling it directly from onSelect is simpler than
          // wrapping the whole trigger in a <form>.
          label: "Sign out",
          onSelect: () => void logout(),
        },
      ]}
    />
  );
}
