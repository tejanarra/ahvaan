"use client";

import { useState, useTransition } from "react";
import { updateHostProfile, clearAvatar, deleteAccount } from "./actions";
import { AvatarUploadField } from "@/components/avatar-upload-field";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { HostProfileRecord } from "@/lib/data/host-profile";

const MAX_BIO_LENGTH = 500;

export function ProfileForm({ profile }: { profile: HostProfileRecord | null }) {
  const { show } = useToast();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [isSaving, startSaveTransition] = useTransition();
  const [isClearingAvatar, startClearTransition] = useTransition();
  const [isDeletingAccount, startDeleteTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSave = () => {
    startSaveTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("displayName", displayName);
        formData.set("bio", bio);
        await updateHostProfile(formData);
        show("Saved.");
      } catch (err) {
        show(err instanceof Error ? err.message : "Failed to save.", "error");
      }
    });
  };

  const handleClearAvatar = () => {
    startClearTransition(async () => {
      try {
        await clearAvatar();
        setAvatarUrl("");
        show("Photo removed.");
      } catch (err) {
        show(err instanceof Error ? err.message : "Failed to remove photo.", "error");
      }
    });
  };

  const handleDeleteAccount = () => {
    startDeleteTransition(async () => {
      try {
        await deleteAccount();
        // Full reload (not router.push) so every bit of client-side state
        // for the now-deleted account is gone, not just the visible route.
        window.location.href = "/";
      } catch (err) {
        show(err instanceof Error ? err.message : "Failed to delete account.", "error");
      }
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Public host profile</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <p className="text-sm text-muted">
            Shown discreetly at the bottom of your events&rsquo; guest pages, so the people
            you invite know who&rsquo;s hosting. Leave any field blank to leave it off your
            guest pages entirely.
          </p>

          <Field label="Photo">
            <AvatarUploadField value={avatarUrl} onChange={setAvatarUrl} />
            {avatarUrl && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                loading={isClearingAvatar}
                onClick={handleClearAvatar}
                className="mt-1"
              >
                Remove photo
              </Button>
            )}
          </Field>

          <Field label="Display name" htmlFor="displayName" hint="Shown as “Hosted by …”.">
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={80}
            />
          </Field>

          <Field
            label="Bio"
            htmlFor="bio"
            hint={`A line or two about yourself. ${bio.length}/${MAX_BIO_LENGTH}`}
          >
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={MAX_BIO_LENGTH}
            />
          </Field>

          <Button onClick={handleSave} loading={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </CardBody>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-muted">
            Permanently delete your account — every event, guest, RSVP, uploaded image, and
            this profile. This cannot be undone.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="w-full sm:w-auto"
          >
            Delete account
          </Button>
        </CardBody>
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete account">
        <p className="text-sm text-muted">
          Delete your account? This permanently removes every event you&rsquo;ve created, all
          their guests and RSVPs, every image you&rsquo;ve uploaded, and this profile. This
          cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={isDeletingAccount}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteAccount} loading={isDeletingAccount}>
            {isDeletingAccount ? "Deleting..." : "Delete account"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
