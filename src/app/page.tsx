import Link from "next/link";
import { THEMES } from "@/lib/themes";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <span className="text-lg font-semibold text-foreground">Invitely</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground">
            Sign in
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started free</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
          Beautiful invites. Effortless RSVPs.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted">
          Create a themed invitation page for any event — weddings, birthdays,
          baby showers, and more — send personal links to your guests, and
          track every RSVP in one place. Completely free.
        </p>
        <Link href="/signup" className="mt-8 inline-block">
          <Button size="lg">Create your event</Button>
        </Link>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {THEMES.map((theme) => (
            <div key={theme.id} className="overflow-hidden rounded-lg border border-border">
              <div
                className="h-20"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
                }}
              />
              <p className="px-3 py-2 text-left text-sm font-medium text-foreground">{theme.label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
