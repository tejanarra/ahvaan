import { createServiceRoleClient } from "@/lib/supabase/server";
import { DataError } from "@/lib/data/errors";
import type { CustomComponentInput } from "@/lib/schemas/custom-component";

export type CustomComponentRecord = {
  id: string;
  host_id: string;
  name: string;
  html: string;
  css: string;
  js: string;
  created_at: string;
};

const COLUMNS = "id, host_id, name, html, css, js, created_at";

// Every reader is host-scoped — the same trust model as every other table
// (see supabase/schema-saas.sql's header comment): the service-role client
// bypasses RLS entirely, so `.eq("host_id", hostId)` on every query IS the
// tenancy boundary, not a defense-in-depth extra.
export async function listComponents(hostId: string): Promise<CustomComponentRecord[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("custom_components").select(COLUMNS).eq("host_id", hostId);
  if (error) throw new DataError(error.message);
  return (data ?? []) as CustomComponentRecord[];
}

// The public guest page (app/events/[slug]/page.tsx) intentionally never selects
// host_id on the event record it renders from (see events.ts's
// PUBLIC_COLUMNS comment: "the public page never needs host_id") — host_id
// never reaches the client either way here, it's just used server-side, in
// this one extra query, to find which host's component library to render
// <custom-component> tags from for that event.
export async function listComponentsForEventPublic(eventId: string): Promise<CustomComponentRecord[]> {
  const supabase = createServiceRoleClient();
  const { data: eventRow, error: eventError } = await supabase.from("events").select("host_id").eq("id", eventId).maybeSingle();
  if (eventError) throw new DataError(eventError.message);
  if (!eventRow) return [];
  return listComponents(eventRow.host_id as string);
}

// A host "saves" a component just by naming a Custom HTML/CSS/JS block and
// hitting the page builder's normal Save button — no separate save action.
// Upserted by (host_id, name): saving the same name again from a different
// event's block intentionally overwrites it, since the name is the single
// shared reference every <custom-component name="..."> tag points at,
// wherever it's used (see dashboard/events/[eventId]/actions.ts's
// updatePageSchema, which calls this for every named custom-html block on
// every save).
export async function upsertComponentByName(hostId: string, input: CustomComponentInput): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: existing, error: findError } = await supabase
    .from("custom_components")
    .select("id")
    .eq("host_id", hostId)
    .eq("name", input.name)
    .maybeSingle();
  if (findError) throw new DataError(findError.message);

  if (existing) {
    const { error } = await supabase
      .from("custom_components")
      .update({ html: input.html, css: input.css, js: input.js })
      .eq("id", existing.id);
    if (error) throw new DataError(error.message);
    return;
  }

  const { error } = await supabase.from("custom_components").insert({
    host_id: hostId,
    name: input.name,
    html: input.html,
    css: input.css,
    js: input.js,
  });
  if (error) throw new DataError(error.message);
}
