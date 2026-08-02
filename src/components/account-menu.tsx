"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth-actions";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { UserIcon, ChevronDownIcon } from "@/components/icons";

export function AccountMenu({ email }: { email: string }) {
  const router = useRouter();

  return (
    <DropdownMenu
      trigger={
        // Below sm the email is already hidden, leaving an orphaned
        // icon+chevron pill under the 40px touch bar — a round icon-only
        // trigger reads as a single confident affordance instead (and is
        // the one Google/Meta-style convention worth adopting literally: a
        // top-right round account button is universally understood).
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-surface sm:h-auto sm:w-auto sm:justify-start sm:gap-1.5 sm:rounded-md sm:px-2.5 sm:py-1.5 sm:text-xs sm:font-medium">
          <UserIcon className="h-4 w-4 text-muted sm:h-3.5 sm:w-3.5" />
          <span className="hidden sm:inline">{email}</span>
          <ChevronDownIcon className="hidden h-3.5 w-3.5 text-muted sm:inline" />
        </span>
      }
      items={[
        {
          label: "Edit profile",
          onSelect: () => router.push("/dashboard/profile"),
        },
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
