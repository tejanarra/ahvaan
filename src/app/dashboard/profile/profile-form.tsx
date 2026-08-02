"use client";

import { useState, useTransition } from "react";
import { updateHostProfile, clearAvatar } from "./actions";
import { AvatarUploadField } from "@/components/avatar-upload-field";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
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
    </div>
  );
}
