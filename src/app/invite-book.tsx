"use client";

import { useRef, useState } from "react";
import type { TouchEvent } from "react";
import Image from "next/image";
import { RsvpForm } from "./rsvp-form";

const SWIPE_THRESHOLD = 40;

type ExistingRsvp = {
  name: string;
  attending: boolean;
  additionalGuests: string[];
} | null;

function RsvpBlock({
  inviteId,
  guestName,
  existingRsvp,
}: {
  inviteId: string;
  guestName: string;
  existingRsvp: ExistingRsvp;
}) {
  return (
    <div className="w-full max-w-md">
      <h2 className="text-center font-display text-xl uppercase tracking-[0.15em] text-gold-dark">
        Kindly RSVP
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-center font-script text-base italic text-foreground/85">
        Please let us know who&rsquo;s coming from your side &mdash; you and
        anyone joining you &mdash; so we can plan seating and catering
        accordingly.
      </p>
      <div className="mt-4">
        <RsvpForm
          inviteId={inviteId}
          guestName={guestName}
          initialRsvp={existingRsvp}
        />
      </div>
    </div>
  );
}

function InviteOnlyNote() {
  return (
    <div className="w-full max-w-md text-center">
      <h2 className="font-display text-xl uppercase tracking-[0.15em] text-gold-dark">
        By Invitation Only
      </h2>
      <p className="mx-auto mt-2 max-w-sm font-script text-base italic text-foreground/85">
        RSVPs are only accepted through a personal invite link. If you&rsquo;re
        expecting one, please check with Swathi &amp; Sai Teja.
      </p>
    </div>
  );
}

const MOBILE_CARD_PAGES = [
  { src: "/leftMobile.png", alt: "Swathi weds Sri Sai Teja — invitation, page one" },
  { src: "/rightMobile.png", alt: "Wedding details, page two" },
];

const DESKTOP_CARD_PAGES = [
  { src: "/leftInviteDesktop.jpg", alt: "Swathi weds Sri Sai Teja — invitation, page one" },
  { src: "/rightInviteDesktop.jpg", alt: "Wedding details, page two" },
];

export function InviteBook({
  inviteId,
  guestName,
  existingRsvp,
}: {
  inviteId: string | null;
  guestName: string | null;
  existingRsvp: ExistingRsvp;
}) {
  const hasInvite = Boolean(inviteId && guestName);
  const pageCount = hasInvite ? 3 : 2;

  const [page, setPage] = useState(0);
  const [cardPage, setCardPage] = useState(0);
  const [hasSwiped, setHasSwiped] = useState(false);

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(pageCount - 1, p + 1));

  const cardGoPrev = () => setCardPage((p) => Math.max(0, p - 1));
  const cardGoNext = () => setCardPage((p) => Math.min(DESKTOP_CARD_PAGES.length - 1, p + 1));

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      setHasSwiped(true);
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  return (
    <>
      {/* Mobile: swipeable page pager (cover -> details -> RSVP, if invited) */}
      <div
        className="relative h-dvh w-full overflow-hidden lg:hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            width: `${pageCount * 100}%`,
            transform: `translateX(-${page * (100 / pageCount)}%)`,
          }}
        >
          <div className="relative h-full shrink-0" style={{ flexBasis: `${100 / pageCount}%` }}>
            <Image
              src={MOBILE_CARD_PAGES[0].src}
              alt={MOBILE_CARD_PAGES[0].alt}
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
          </div>

          <div className="relative h-full shrink-0" style={{ flexBasis: `${100 / pageCount}%` }}>
            <Image
              src={MOBILE_CARD_PAGES[1].src}
              alt={MOBILE_CARD_PAGES[1].alt}
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {hasInvite && (
            <div
              className="flex h-full shrink-0 flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-10"
              style={{ flexBasis: `${100 / pageCount}%` }}
            >
              <RsvpBlock inviteId={inviteId!} guestName={guestName!} existingRsvp={existingRsvp} />
            </div>
          )}
        </div>

        <div
          className="absolute inset-x-0 z-20 flex flex-col items-center gap-2"
          style={{ bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem))" }}
        >
          {!hasSwiped && (
            <div className="flex items-center gap-2 rounded-full bg-gold-dark px-4 py-2 shadow-md">
              <span className="font-display text-xs uppercase tracking-[0.15em] text-white">
                Swipe to explore
              </span>
              <span className="animate-[swipe-hint_1.4s_ease-in-out_infinite] text-white">
                &harr;
              </span>
            </div>
          )}

          <div className="flex gap-1.5">
            {Array.from({ length: pageCount }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full shadow-sm transition-colors ${
                  i === page ? "bg-gold-dark" : "bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: card pager (left/right) + persistent RSVP column (if invited) */}
      <div className="hidden h-screen items-stretch gap-6 px-4 py-6 lg:flex">
        <div className="relative flex min-h-0 flex-[3] flex-col items-center justify-center gap-4">
          <div className="relative flex min-h-0 w-full flex-1 items-center">
            <button
              type="button"
              onClick={cardGoPrev}
              disabled={cardPage === 0}
              aria-label="Previous page"
              className="absolute left-2 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gold-dark text-2xl text-white shadow-[0_8px_24px_-6px_rgba(138,98,21,0.5)] transition hover:scale-105 hover:bg-[#5c3a0c] disabled:pointer-events-none disabled:opacity-0"
            >
              &lsaquo;
            </button>

            <div className="relative h-full w-full">
              {DESKTOP_CARD_PAGES.map((card, i) => (
                <Image
                  key={card.src}
                  src={card.src}
                  alt={card.alt}
                  fill
                  priority
                  sizes="75vw"
                  className={`object-contain transition-opacity duration-500 ${
                    i === cardPage ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={cardGoNext}
              disabled={cardPage === DESKTOP_CARD_PAGES.length - 1}
              aria-label="Next page"
              className="absolute right-2 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gold-dark text-2xl text-white shadow-[0_8px_24px_-6px_rgba(138,98,21,0.5)] transition hover:scale-105 hover:bg-[#5c3a0c] disabled:pointer-events-none disabled:opacity-0"
            >
              &rsaquo;
            </button>
          </div>

          <div className="flex gap-1.5">
            {DESKTOP_CARD_PAGES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === cardPage ? "bg-gold-dark" : "bg-gold/30"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-[2] flex-col items-center justify-center overflow-y-auto py-2">
          {hasInvite ? (
            <RsvpBlock inviteId={inviteId!} guestName={guestName!} existingRsvp={existingRsvp} />
          ) : (
            <InviteOnlyNote />
          )}
        </div>
      </div>
    </>
  );
}
