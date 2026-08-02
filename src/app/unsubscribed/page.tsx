import Link from "next/link";
import { BrandLockup } from "@/components/brand";
import { PublicFooter } from "@/components/public-footer";
import { Button } from "@/components/ui/button";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { getEventTitleById } from "@/lib/data/events";
import { resubscribeToEventAction } from "./actions";

export const metadata = { title: "Unsubscribed" };

// Reached only via a redirect from /unsubscribe's route handler (which
// already performed the unsubscribe) — this page is purely a receipt, plus
// an inline "undo" for anyone who clicked by mistake. Re-verifies the same
// token so the "Resubscribe to this event" button below has something
// scoped to act on without requiring login.
export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; invalid?: string }>;
}) {
  const { token, invalid } = await searchParams;
  const payload = token ? verifyUnsubscribeToken(token) : null;
  const event = payload ? await getEventTitleById(payload.eventId) : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-16 text-center sm:px-6">
        <Link href="/" aria-label="ahvaan home" className="inline-flex">
          <BrandLockup />
        </Link>

        {payload && event ? (
          <>
            <h1 className="mt-8 font-display text-2xl text-foreground">You&rsquo;re unsubscribed</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              You won&rsquo;t receive further email about <strong className="text-foreground">{event.title}</strong> at
              this address.
            </p>
            <form action={resubscribeToEventAction} className="mt-6">
              <input type="hidden" name="token" value={token} />
              <Button type="submit" variant="secondary">
                Undo — resubscribe to this event
              </Button>
            </form>
          </>
        ) : invalid ? (
          <>
            <h1 className="mt-8 font-display text-2xl text-foreground">Link no longer valid</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              This unsubscribe link has expired or was already used. If you&rsquo;re still receiving emails you don&rsquo;t
              want, contact{" "}
              <a href="mailto:support@ahvaan.tejanarra.space" className="text-accent hover:underline">
                support@ahvaan.tejanarra.space
              </a>
              .
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-8 font-display text-2xl text-foreground">You&rsquo;re unsubscribed</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">You won&rsquo;t receive further email for this event.</p>
          </>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
