export type EventType = "wedding" | "birthday" | "baby_shower" | "party" | "other";

export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "wedding", label: "Wedding" },
  { value: "birthday", label: "Birthday" },
  { value: "baby_shower", label: "Baby Shower" },
  { value: "party", label: "Party" },
  { value: "other", label: "Other" },
];

export function getEventTypeLabel(value: string): string {
  return EVENT_TYPES.find((t) => t.value === value)?.label ?? "Event";
}
