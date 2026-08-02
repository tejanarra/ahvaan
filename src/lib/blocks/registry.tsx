import type { ComponentType } from "react";
import type { BlockInstance, BlockType } from "./types";
import type { PageRenderContext } from "./context";
import type { EventRecord } from "@/lib/data/events";
import type { FormRecord } from "@/lib/data/forms";
import {
  HeroEdit,
  HeroRender,
  heroDefaultConfig,
} from "./blocks/hero";
import { TextEdit, TextRender, textDefaultConfig } from "./blocks/text";
import { ImageEdit, ImageRender, imageDefaultConfig } from "./blocks/image";
import { CarouselEdit, CarouselRender, carouselDefaultConfig } from "./blocks/carousel";
import { SpacerEdit, SpacerRender, spacerDefaultConfig } from "./blocks/spacer";
import {
  CountdownEdit,
  CountdownRender,
  countdownDefaultConfig,
} from "./blocks/countdown";
import {
  ScheduleEdit,
  ScheduleRender,
  scheduleDefaultConfig,
} from "./blocks/schedule";
import {
  RsvpFormEdit,
  RsvpFormRender,
  rsvpFormDefaultConfig,
} from "./blocks/rsvp-form";
import { FormEdit, FormRender, formDefaultConfig } from "./blocks/form";
import {
  VenueMapEdit,
  VenueMapRender,
  venueMapDefaultConfig,
} from "./blocks/venue-map";
import {
  CustomHtmlEdit,
  CustomHtmlRender,
  customHtmlDefaultConfig,
} from "./blocks/custom-html";
import {
  ContainerEdit,
  ContainerRender,
  containerDefaultConfig,
} from "./blocks/container";
import type { ReactNode } from "react";

export type BlockDefinition<C> = {
  type: BlockType;
  label: string;
  defaultConfig: C;
  // childBlocks/renderBlock(Editor) are only used by the "container" block;
  // `event`/`onEventFieldsChange` only by blocks (like hero) that edit the
  // event's own fields directly from within the block editor; `availableForms`
  // only by the "form" block (its "which form?" dropdown) — every other
  // block's Edit simply ignores whichever of these it doesn't need. Kept
  // optional so no other block file needs to know this exists.
  Edit: ComponentType<{
    config: C;
    onChange: (next: C) => void;
    childBlocks?: BlockInstance[];
    renderChildList?: () => ReactNode;
    event?: EventRecord;
    onEventFieldsChange?: (patch: Partial<EventRecord>) => void;
    availableForms?: FormRecord[];
  }>;
  Render: ComponentType<{
    config: C;
    ctx: PageRenderContext;
    renderedChildren?: ReactNode[];
  }>;
};

// The single extension point: adding a new block type (e.g. the future
// sandboxed custom-HTML/CSS/JS block) means adding one entry here — the
// public-page renderer and the dashboard builder canvas both just look
// blocks up by `type` and never need to change.
export const BLOCK_REGISTRY = {
  hero: {
    type: "hero",
    label: "Cover / hero",
    defaultConfig: heroDefaultConfig,
    Edit: HeroEdit,
    Render: HeroRender,
  },
  text: {
    type: "text",
    label: "Text",
    defaultConfig: textDefaultConfig,
    Edit: TextEdit,
    Render: TextRender,
  },
  image: {
    type: "image",
    label: "Image",
    defaultConfig: imageDefaultConfig,
    Edit: ImageEdit,
    Render: ImageRender,
  },
  carousel: {
    type: "carousel",
    label: "Image carousel",
    defaultConfig: carouselDefaultConfig,
    Edit: CarouselEdit,
    Render: CarouselRender,
  },
  spacer: {
    type: "spacer",
    label: "Spacer",
    defaultConfig: spacerDefaultConfig,
    Edit: SpacerEdit,
    Render: SpacerRender,
  },
  countdown: {
    type: "countdown",
    label: "Countdown",
    defaultConfig: countdownDefaultConfig,
    Edit: CountdownEdit,
    Render: CountdownRender,
  },
  schedule: {
    type: "schedule",
    label: "Schedule / itinerary",
    defaultConfig: scheduleDefaultConfig,
    Edit: ScheduleEdit,
    Render: ScheduleRender,
  },
  "rsvp-form": {
    type: "rsvp-form",
    label: "RSVP form",
    defaultConfig: rsvpFormDefaultConfig,
    Edit: RsvpFormEdit,
    Render: RsvpFormRender,
  },
  form: {
    type: "form",
    label: "Form",
    defaultConfig: formDefaultConfig,
    Edit: FormEdit,
    Render: FormRender,
  },
  "venue-map": {
    type: "venue-map",
    label: "Venue map",
    defaultConfig: venueMapDefaultConfig,
    Edit: VenueMapEdit,
    Render: VenueMapRender,
    // VenueMapEdit takes no props — cast keeps the shared Edit signature.
  },
  "custom-html": {
    type: "custom-html",
    label: "Custom HTML/CSS/JS",
    defaultConfig: customHtmlDefaultConfig,
    Edit: CustomHtmlEdit,
    Render: CustomHtmlRender,
  },
  container: {
    type: "container",
    label: "Container (nest elements)",
    defaultConfig: containerDefaultConfig,
    Edit: ContainerEdit,
    Render: ContainerRender,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as unknown as { [K in BlockType]: BlockDefinition<any> };

export function blockLabel(type: BlockType): string {
  return BLOCK_REGISTRY[type]?.label ?? type;
}

export function defaultConfigFor(type: BlockType) {
  return BLOCK_REGISTRY[type].defaultConfig;
}

export function makeBlockInstance(type: BlockType): BlockInstance {
  const base = { id: crypto.randomUUID(), type, config: defaultConfigFor(type) };
  return (type === "container" ? { ...base, children: [] } : base) as BlockInstance;
}

// A "form" block pre-bound to a specific saved form — used when the
// palette lists the host's actual forms by name (component-palette.tsx)
// instead of one generic "Form" entry that needs a follow-up "which form?"
// step in the Properties Panel. Kept separate from makeBlockInstance
// (rather than a generic config-override param) since only this one block
// type has a meaningful "create it already pointed at something" case.
export function makeFormBlockInstance(formId: string): BlockInstance {
  return {
    id: crypto.randomUUID(),
    type: "form",
    config: { ...formDefaultConfig, formId },
  } as BlockInstance;
}
