"use client";

import { useState } from "react";
import { CopyIcon, ShareIcon, CheckIcon } from "@/components/icons";
import { buildInviteLink, buildInviteMessage } from "./invite-link";
import { IconButton } from "@/components/ui/icon-button";
import { Tooltip } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useClipboardCopy } from "@/hooks/use-clipboard-copy";
import { useNativeShare } from "@/hooks/use-native-share";

export function CopyIconButton({
  eventSlug,
  eventTitle,
  inviteId,
}: {
  eventSlug: string;
  eventTitle: string;
  inviteId: string;
}) {
  const { copied, copyFailed, copy } = useClipboardCopy();
  // useClipboardCopy only reports failure via `copyFailed`; the fallback
  // UI itself (an inline editable field, dismissable on blur) is this
  // caller's own choice, same as share-invite-button.tsx choosing
  // explanatory text instead. `dismissed` layers "the guest closed it"
  // on top, since `copyFailed` alone has no notion of dismissal.
  const [dismissed, setDismissed] = useState(false);

  const handleCopy = async () => {
    setDismissed(false);
    const link = buildInviteLink(eventSlug, inviteId);
    const message = buildInviteMessage(eventTitle, link);
    await copy(message);
  };

  if (copyFailed && !dismissed) {
    const message = buildInviteMessage(eventTitle, buildInviteLink(eventSlug, inviteId));
    return (
      <Input
        type="text"
        readOnly
        value={message}
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => setDismissed(true)}
        className="h-8 max-w-56 min-w-0 text-xs"
      />
    );
  }

  return (
    <Tooltip content={copied ? "Copied" : "Copy invite message"}>
      <IconButton
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy invite message"}
        className={copied ? "text-success" : undefined}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </IconButton>
    </Tooltip>
  );
}

export function ShareIconButton({
  eventSlug,
  eventTitle,
  inviteId,
  guestName,
}: {
  eventSlug: string;
  eventTitle: string;
  inviteId: string;
  guestName: string;
}) {
  const { canShare, share } = useNativeShare();
  if (!canShare) return null;

  const handleShare = () => {
    const link = buildInviteLink(eventSlug, inviteId);
    return share({
      title: eventTitle,
      text: `You're invited${guestName ? `, ${guestName}` : ""}! Please RSVP here:`,
      url: link,
    });
  };

  return (
    <Tooltip content="Share invite">
      <IconButton onClick={handleShare} aria-label="Share invite">
        <ShareIcon />
      </IconButton>
    </Tooltip>
  );
}
