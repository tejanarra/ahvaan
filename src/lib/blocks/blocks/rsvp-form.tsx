import { RsvpForm } from "@/app/e/[slug]/rsvp-form";
import type { RsvpFormBlockConfig } from "../types";
import type { PageRenderContext } from "../context";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const rsvpFormDefaultConfig: RsvpFormBlockConfig = {
  heading: "Kindly RSVP",
  helperText:
    "Please let us know who's coming from your side — you and anyone joining you — so we can plan accordingly.",
};

export function RsvpFormEdit({
  config,
  onChange,
}: {
  config: RsvpFormBlockConfig;
  onChange: (next: RsvpFormBlockConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Heading">
        <Input type="text" value={config.heading ?? ""} onChange={(e) => onChange({ ...config, heading: e.target.value })} />
      </Field>
      <Field label="Helper text" hint="Shown under the heading, above the form fields.">
        <Textarea value={config.helperText ?? ""} onChange={(e) => onChange({ ...config, helperText: e.target.value })} rows={3} />
      </Field>
    </div>
  );
}

function InviteOnlyNote() {
  return (
    <div className="w-full text-center">
      <h2 className="text-lg font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]">
        By invitation only
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--t-fg)]/75">
        RSVPs are only accepted through a personal invite link. If you&rsquo;re
        expecting one, please check with the host.
      </p>
    </div>
  );
}

export function RsvpFormRender({
  config,
  ctx,
}: {
  config: RsvpFormBlockConfig;
  ctx: PageRenderContext;
}) {
  const { event, inviteId, guestName, schema, initialResponses } = ctx;
  const hasInvite = Boolean(inviteId && guestName);

  if (!hasInvite) return <InviteOnlyNote />;

  return (
    <div className="w-full">
      {config.heading && (
        <h2 className="text-center text-lg font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]">
          {config.heading}
        </h2>
      )}
      {config.helperText && (
        <p className="mx-auto mt-2 max-w-sm text-center text-sm text-[var(--t-fg)]/75">{config.helperText}</p>
      )}
      <div className="mt-4">
        <RsvpForm
          eventId={event.id}
          inviteId={inviteId!}
          guestName={guestName!}
          schema={schema}
          initialResponses={initialResponses}
          venueName={event.venue_name}
          venueAddress={event.venue_address}
        />
      </div>
    </div>
  );
}
