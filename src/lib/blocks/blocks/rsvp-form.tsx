import { RsvpForm } from "@/app/e/[slug]/rsvp-form";
import type { RsvpFormBlockConfig } from "../types";
import type { PageRenderContext } from "../context";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const DEFAULT_NO_INVITE_HEADING = "By invitation only";
const DEFAULT_NO_INVITE_MESSAGE =
  "RSVPs are only accepted through a personal invite link. If you're expecting one, please check with the host.";
const DEFAULT_CONFIRMED_YES_HEADING = "You're on the list!";
const DEFAULT_CONFIRMED_NO_HEADING = "Thanks for letting us know";

export const rsvpFormDefaultConfig: RsvpFormBlockConfig = {
  heading: "Kindly RSVP",
  helperText:
    "Please let us know who's coming from your side — you and anyone joining you — so we can plan accordingly.",
  noInviteHeading: DEFAULT_NO_INVITE_HEADING,
  noInviteMessage: DEFAULT_NO_INVITE_MESSAGE,
  confirmedYesHeading: DEFAULT_CONFIRMED_YES_HEADING,
  confirmedNoHeading: DEFAULT_CONFIRMED_NO_HEADING,
  showVenueOnConfirmation: true,
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

      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          When someone opens the page without a personal invite link
        </p>
        <Field label="Heading">
          <Input
            type="text"
            value={config.noInviteHeading ?? ""}
            onChange={(e) => onChange({ ...config, noInviteHeading: e.target.value })}
            placeholder={DEFAULT_NO_INVITE_HEADING}
          />
        </Field>
        <Field label="Message">
          <Textarea
            value={config.noInviteMessage ?? ""}
            onChange={(e) => onChange({ ...config, noInviteMessage: e.target.value })}
            placeholder={DEFAULT_NO_INVITE_MESSAGE}
            rows={3}
          />
        </Field>
      </div>

      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">After a guest submits their RSVP</p>
        <Field label="Heading when attending">
          <Input
            type="text"
            value={config.confirmedYesHeading ?? ""}
            onChange={(e) => onChange({ ...config, confirmedYesHeading: e.target.value })}
            placeholder={DEFAULT_CONFIRMED_YES_HEADING}
          />
        </Field>
        <Field label="Heading when not attending">
          <Input
            type="text"
            value={config.confirmedNoHeading ?? ""}
            onChange={(e) => onChange({ ...config, confirmedNoHeading: e.target.value })}
            placeholder={DEFAULT_CONFIRMED_NO_HEADING}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={config.showVenueOnConfirmation !== false}
            onChange={(e) => onChange({ ...config, showVenueOnConfirmation: e.target.checked })}
          />
          Show the venue map after a guest responds
        </label>
      </div>
    </div>
  );
}

function InviteOnlyNote({ config }: { config: RsvpFormBlockConfig }) {
  return (
    <div className="w-full text-center">
      <h2 className="text-lg font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]">
        {config.noInviteHeading || DEFAULT_NO_INVITE_HEADING}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--t-fg)]/75">
        {config.noInviteMessage || DEFAULT_NO_INVITE_MESSAGE}
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

  if (!hasInvite) return <InviteOnlyNote config={config} />;

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
          confirmedYesHeading={config.confirmedYesHeading || DEFAULT_CONFIRMED_YES_HEADING}
          confirmedNoHeading={config.confirmedNoHeading || DEFAULT_CONFIRMED_NO_HEADING}
          showVenueOnConfirmation={config.showVenueOnConfirmation !== false}
        />
      </div>
    </div>
  );
}
