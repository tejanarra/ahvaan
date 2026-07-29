import type { EventType } from "./event-types";
import type { ThemeId } from "./themes";

export type EventRecord = {
  id: string;
  host_id: string;
  slug: string;
  event_type: EventType;
  theme_id: ThemeId;
  title: string;
  subtitle: string | null;
  event_date: string | null;
  event_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
};

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

// Appending a short random suffix (rather than retrying on a unique-
// constraint violation) keeps event creation a single insert — collisions
// on an 8-hex-char suffix are astronomically unlikely for this scale.
export function makeEventSlug(title: string) {
  const base = slugify(title) || "event";
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${base}-${suffix}`;
}
