import { ImageResponse } from "next/og";
import { getEventBySlugPublic } from "@/lib/data/events";
import { getEventTypeLabel } from "@/lib/event-types";
import { resolveThemeColors } from "@/lib/themes";
import { parsePageSchema } from "@/lib/schemas/page-schema";

export const alt = "Event invitation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function formatEventLine(eventDate: string | null, eventTime: string | null): string | null {
  if (!eventDate) return null;
  const date = new Date(`${eventDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  return eventTime ? `${formatted} · ${eventTime}` : formatted;
}

// The fallback og:image for any event that hasn't set its own cover image
// (src/app/e/[slug]/page.tsx's generateMetadata points here whenever
// event.cover_image_url is unset) — a themed card built from the event's
// own title/date/venue and theme colors, in the same "Stage vignette" style
// as the site-wide static .../opengraph-image.tsx, rather than one generic
// image shared by every event. No `runtime = "edge"`: it needs the same
// service-role Supabase client every other data-layer read in this app
// uses, which isn't guaranteed edge-safe.
export default async function EventOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlugPublic(slug);

  // A missing event or an unpublished draft never surfaces its real title
  // here (matches generateMetadata's own withholding) — link previews for
  // either should just get a generic branded card, not a broken image.
  if (!event || event.status === "draft") {
    return new ImageResponse(<GenericCard />, { ...size });
  }

  const pageSchema = parsePageSchema(event.page_schema);
  const theme = resolveThemeColors(event.theme_id, pageSchema?.themeOverrides);
  const dateLine = formatEventLine(event.event_date, event.event_time);
  const eventTypeLabel = getEventTypeLabel(event.event_type);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#211E19",
        }}
      >
        <div
          style={{
            width: 1080,
            height: 550,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 28,
            padding: "0 80px",
            background: theme.background,
            color: theme.foreground,
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: theme.accent,
            }}
          >
            {eventTypeLabel || "You're invited"}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: event.title.length > 28 ? 60 : 76,
              fontFamily: "serif",
              fontStyle: "italic",
              textAlign: "center",
              color: theme.foreground,
              maxWidth: 900,
            }}
          >
            {event.title}
          </div>
          <div style={{ marginTop: 20, height: 2, width: 100, background: theme.accent }} />
          {dateLine && (
            <div style={{ marginTop: 24, fontSize: 30, color: theme.foreground, opacity: 0.8, textAlign: "center" }}>
              {dateLine}
            </div>
          )}
          {event.venue_name && (
            <div style={{ marginTop: 8, fontSize: 24, color: theme.foreground, opacity: 0.6, textAlign: "center" }}>
              {event.venue_name}
            </div>
          )}
          <div
            style={{
              marginTop: 36,
              fontSize: 18,
              padding: "10px 28px",
              borderRadius: 999,
              background: theme.accentDark,
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            RSVP on Ahvan
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

function GenericCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#211E19",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontSize: 88,
          fontFamily: "serif",
          fontStyle: "italic",
          color: "#FBFAF8",
        }}
      >
        Ahvan
        <div style={{ marginTop: 16, fontSize: 26, color: "#7FB394", letterSpacing: 3, textTransform: "uppercase" }}>
          You&apos;re invited
        </div>
      </div>
    </div>
  );
}
