import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocsArticle, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Live examples",
  description: "Real, published invite pages built with the page builder — browse them for design ideas.",
  openGraph: { images: ["/docs/screenshots/guest-page-desktop.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/guest-page-desktop.png"] },
};

const EXAMPLES = [
  {
    title: "Sunlit Garden Brunch",
    theme: "Garden Party",
    href: "/events/sunlit-garden-brunch-f2e19e1a",
    description:
      "A single-column layout with a side-by-side \"getting there\" section, a photo, an elegant timeline schedule, a countdown, and an embedded custom form for song requests.",
  },
  {
    title: "Midnight Gala",
    theme: "Midnight Elegant",
    href: "/events/midnight-gala-bd0d26ca",
    description: "A moodier, dark-themed page — a full-bleed photo, a card-style schedule, and a countdown to doors-open.",
  },
  {
    title: "Playful Backyard Bash",
    theme: "Playful Pastel",
    href: "/events/playful-backyard-bash-5edf3753",
    description:
      "A 3-column grid of quick details (cake, dress code, gifts), a minimal-style schedule, and an embedded guestbook form alongside the RSVP.",
  },
];

export default function ExamplesPage() {
  return (
    <DocsArticle
      title="Live examples"
      description="Real, published event pages built entirely with the page builder — every block, layout, and form on these pages is exactly what's covered in the rest of these docs."
      current="/docs/examples"
    >
      <p>
        These are ordinary events on an ordinary account — nothing special under the hood, just the
        same blocks, themes, and forms any host has access to, combined a few different ways.
        They&rsquo;re anonymous and open to anyone with the link, so their RSVP forms and any
        embedded custom forms genuinely work — try one.
      </p>

      <div className="not-prose grid grid-cols-1 gap-4 sm:grid-cols-2">
        {EXAMPLES.map((example) => (
          <a key={example.href} href={example.href} target="_blank" rel="noreferrer">
            <Card className="h-full px-4 py-4 transition-colors hover:bg-surface-hover">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-lg text-foreground">{example.title}</p>
                <Badge variant="accent">{example.theme}</Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{example.description}</p>
              <p className="mt-3 text-xs text-accent">Open the live page →</p>
            </Card>
          </a>
        ))}
      </div>

      <p className="text-sm text-muted">
        Want to see how one of these is built? Every block used here is documented on its own page
        under{" "}
        <Link href="/docs/page-builder" className="text-accent hover:underline">
          the page builder
        </Link>
        .
      </p>

      <DocsPrevNext current="/docs/examples" />
    </DocsArticle>
  );
}
