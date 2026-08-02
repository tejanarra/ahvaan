import { createServiceRoleClient } from "@/lib/supabase/server";
import { DataError, NotFoundError } from "@/lib/data/errors";
import { parseCustomFormSchema } from "@/lib/schemas/custom-form-schema";
import { parsePostSubmitAction, DEFAULT_POST_SUBMIT_ACTION } from "@/lib/schemas/post-submit-actions";
import type { CustomFormSchema } from "@/lib/forms/types";
import type { PostSubmitAction } from "@/lib/schemas/post-submit-actions";

export type FormRecord = {
  id: string;
  host_id: string;
  event_id: string;
  name: string;
  schema: CustomFormSchema;
  actions: PostSubmitAction;
  created_at: string;
};

const COLUMNS = "id, host_id, event_id, name, schema, actions, created_at";

type FormRow = {
  id: string;
  host_id: string;
  event_id: string;
  name: string;
  schema: unknown;
  actions: unknown;
  created_at: string;
};

// Every raw jsonb column is re-parsed through its validator on the way out
// — never an `as`-cast (docs/02) — so a hand-edited or since-drifted row
// can't crash a caller that trusts FormRecord's shape. Who's allowed to
// submit is NOT stored per-form (see events.submission_mode) — every form
// on an event follows that one event-wide setting.
function toRecord(row: FormRow): FormRecord {
  return {
    id: row.id,
    host_id: row.host_id,
    event_id: row.event_id,
    name: row.name,
    schema: parseCustomFormSchema(row.schema),
    actions: parsePostSubmitAction(row.actions),
    created_at: row.created_at,
  };
}

// Host-scoped queries (dashboard) — every read/write filters host_id
// directly, the same tenancy boundary as every other table (docs/02).
export async function listForms(hostId: string, eventId: string): Promise<FormRecord[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("forms")
    .select(COLUMNS)
    .eq("host_id", hostId)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) throw new DataError(error.message);
  return ((data ?? []) as FormRow[]).map(toRecord);
}

export async function getForm(hostId: string, eventId: string, formId: string): Promise<FormRecord | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("forms")
    .select(COLUMNS)
    .eq("host_id", hostId)
    .eq("event_id", eventId)
    .eq("id", formId)
    .maybeSingle();
  if (error) throw new DataError(error.message);
  return data ? toRecord(data as FormRow) : null;
}

// The unique(event_id, name) DB constraint is the real guard against a
// race between two saves — this pre-check just gives a friendlier error
// message than a raw Postgres unique-violation would.
export async function createForm(hostId: string, eventId: string, name: string): Promise<FormRecord> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("forms")
    .insert({
      host_id: hostId,
      event_id: eventId,
      name,
      schema: { fields: [] },
      actions: DEFAULT_POST_SUBMIT_ACTION,
    })
    .select(COLUMNS)
    .single();
  if (error) {
    if (error.code === "23505") throw new DataError(`A form named "${name}" already exists for this event.`);
    throw new DataError(error.message);
  }
  return toRecord(data as FormRow);
}

export async function renameForm(hostId: string, eventId: string, formId: string, name: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("forms")
    .update({ name })
    .eq("host_id", hostId)
    .eq("event_id", eventId)
    .eq("id", formId)
    .select("id")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") throw new DataError(`A form named "${name}" already exists for this event.`);
    throw new DataError(error.message);
  }
  if (!data) throw new NotFoundError("Form not found");
}

export async function updateFormSchema(hostId: string, eventId: string, formId: string, schema: CustomFormSchema): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("forms")
    .update({ schema })
    .eq("host_id", hostId)
    .eq("event_id", eventId)
    .eq("id", formId)
    .select("id")
    .maybeSingle();
  if (error) throw new DataError(error.message);
  if (!data) throw new NotFoundError("Form not found");
}

export async function updateFormActions(hostId: string, eventId: string, formId: string, actions: PostSubmitAction): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("forms")
    .update({ actions })
    .eq("host_id", hostId)
    .eq("event_id", eventId)
    .eq("id", formId)
    .select("id")
    .maybeSingle();
  if (error) throw new DataError(error.message);
  if (!data) throw new NotFoundError("Form not found");
}

export async function deleteForm(hostId: string, eventId: string, formId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("forms").delete().eq("host_id", hostId).eq("event_id", eventId).eq("id", formId);
  if (error) throw new DataError(error.message);
}

// Public read for the page-builder embed block's render path (the public
// guest page, src/app/events/[slug]/page.tsx) — no host filter, matching
// listComponentsForEventPublic's shape. `id` alone is enough to serve
// (forms are looked up by id from the block's own config), scoping is
// implicit since a block can only reference a form its own event created.
export async function getFormPublic(formId: string): Promise<FormRecord | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("forms").select(COLUMNS).eq("id", formId).maybeSingle();
  if (error) throw new DataError(error.message);
  return data ? toRecord(data as FormRow) : null;
}

// One query per public page render — every form for the event, keyed by
// id, threaded into PageRenderContext.customForms (mirrors
// listComponentsForEventPublic → customComponents).
export async function listFormsForEventPublic(eventId: string): Promise<FormRecord[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("forms").select(COLUMNS).eq("event_id", eventId);
  if (error) throw new DataError(error.message);
  return ((data ?? []) as FormRow[]).map(toRecord);
}
