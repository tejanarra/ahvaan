import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { getEventFull } from "@/lib/data/events";
import { updateRsvpActionsAction } from "../actions";
import { parsePostSubmitAction, synthesizeLegacyRsvpAction } from "@/lib/schemas/post-submit-actions";
import { parsePageSchema } from "@/lib/schemas/page-schema";
import { defaultPageSchema } from "@/lib/blocks/types";
import type { BlockInstance, RsvpFormBlockConfig } from "@/lib/blocks/types";
import { ActionsEditor } from "../actions-editor";
import { GuestsSubTabs } from "../guests-sub-tabs";

export const dynamic = "force-dynamic";

// Same recursive search shape as findNamedCustomHtmlBlocks
// (dashboard/events/[eventId]/actions.ts) — the rsvp-form block can be
// nested inside any number of containers.
function findRsvpFormConfig(blocks: BlockInstance[]): RsvpFormBlockConfig | undefined {
  for (const block of blocks) {
    if (block.type === "rsvp-form") return block.config;
    if ("children" in block) {
      const found = findRsvpFormConfig(block.children);
      if (found) return found;
    }
  }
  return undefined;
}

export default async function EventActionsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const host = await requireHost();
  const event = await getEventFull(host.id, eventId);
  if (!event) notFound();

  // Not yet saved anything here (event.rsvp_actions is null) — show what's
  // actually live today (the rsvp-form block's own legacy confirmation
  // fields, synthesized), not a blank generic default. Otherwise hitting
  // Save without changing anything would silently replace a host's working
  // confirmation with the generic "Thanks!" message.
  const initialAction = event.rsvp_actions
    ? parsePostSubmitAction(event.rsvp_actions)
    : synthesizeLegacyRsvpAction(findRsvpFormConfig(parsePageSchema(event.page_schema)?.blocks ?? defaultPageSchema().blocks));

  return (
    <div>
      <GuestsSubTabs eventId={eventId} />
      <div className="mt-4">
        <ActionsEditor
          initialAction={initialAction}
          rsvpMode
          onSave={async (action) => {
            "use server";
            await updateRsvpActionsAction(eventId, action);
          }}
        />
      </div>
    </div>
  );
}
