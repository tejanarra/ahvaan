"use client";

import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent, TouchEvent } from "react";
import Image from "next/image";
import { RsvpForm } from "./rsvp-form";

const DRAG_LOCK_THRESHOLD = 10;
const DRAG_COMPLETE_THRESHOLD = 0.25;

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

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(pageCount - 1, p + 1));

  const cardGoPrev = () => setCardPage((p) => Math.max(0, p - 1));
  const cardGoNext = () => setCardPage((p) => Math.min(DESKTOP_CARD_PAGES.length - 1, p + 1));

  // Drag-to-turn: the page under the finger follows it 1:1 (like a scroll
  // gesture, not a blind swipe) and only commits to the next/prev page — or
  // springs back — once the finger lifts, based on how far it travelled.
  const pagerRef = useRef<HTMLDivElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const dragLocked = useRef(false);
  const dragAxisRef = useRef<"x" | "y">("x");
  const scrollableAncestor = useRef<HTMLElement | null>(null);
  const [dragDirection, setDragDirection] = useState<"next" | "prev" | null>(null);
  const [dragProgress, setDragProgress] = useState(0);

  // If the touch started inside a scrollable region (the RSVP form can
  // overflow on short screens), a vertical drag should scroll it normally —
  // the page-turn gesture only takes over once that content is already at
  // the edge it's being dragged past.
  const findScrollableAncestor = (node: HTMLElement | null): HTMLElement | null => {
    let el = node;
    while (el && el !== pagerRef.current) {
      if (el.scrollHeight > el.clientHeight + 1) return el;
      el = el.parentElement;
    }
    return null;
  };

  const handleTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
    dragLocked.current = false;
    scrollableAncestor.current = findScrollableAncestor(e.target as HTMLElement);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;

    if (!dragLocked.current) {
      if (Math.abs(dx) < DRAG_LOCK_THRESHOLD && Math.abs(dy) < DRAG_LOCK_THRESHOLD) return;

      const axis: "x" | "y" = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      const primary = axis === "x" ? dx : dy;

      let canNext = primary < 0 && page < pageCount - 1;
      let canPrev = primary > 0 && page > 0;

      if (axis === "y") {
        const sa = scrollableAncestor.current;
        if (sa) {
          const atBottom = sa.scrollTop + sa.clientHeight >= sa.scrollHeight - 1;
          const atTop = sa.scrollTop <= 1;
          if (canNext && !atBottom) canNext = false;
          if (canPrev && !atTop) canPrev = false;
        }
      }

      if (!canNext && !canPrev) {
        // No page to turn to in this direction (or, for a vertical drag,
        // the form still has room to scroll) — let the browser handle it
        // as a normal scroll instead of hijacking the gesture.
        touchStart.current = null;
        return;
      }
      dragLocked.current = true;
      dragAxisRef.current = axis;
    }

    if (e.cancelable) e.preventDefault();

    const axis = dragAxisRef.current;
    const primary = axis === "x" ? dx : dy;
    const rect = pagerRef.current?.getBoundingClientRect();
    const size = (axis === "x" ? rect?.width : rect?.height) ||
      (axis === "x" ? window.innerWidth : window.innerHeight);

    if (primary < 0 && page < pageCount - 1) {
      setDragDirection("next");
      setDragProgress(Math.min(1, -primary / size));
    } else if (primary > 0 && page > 0) {
      setDragDirection("prev");
      setDragProgress(Math.min(1, primary / size));
    } else {
      setDragDirection(null);
      setDragProgress(0);
    }
  };

  const handleTouchEnd = () => {
    touchStart.current = null;
    if (dragLocked.current) {
      if (dragDirection === "next" && dragProgress > DRAG_COMPLETE_THRESHOLD) goNext();
      else if (dragDirection === "prev" && dragProgress > DRAG_COMPLETE_THRESHOLD) goPrev();
    }
    dragLocked.current = false;
    setDragDirection(null);
    setDragProgress(0);
  };

  // Base rest angle for page i, plus a live drag override for whichever
  // single page is currently being dragged (the transition is switched off
  // for that page only, so it tracks the finger without any easing lag).
  //
  // Past 90deg a page is fully backface-hidden — invisible either way. A
  // "prev" drag starts its page at -180 (fully hidden) and only crosses
  // into the visible 0..-90 arc once the drag is already halfway done, so
  // half of every backward drag visibly does nothing. Mapping the whole
  // drag range onto just the visible arc (0 to -90, not 0 to -180) fixes
  // that for both directions — every bit of finger movement now produces
  // a visible change from the very start of the gesture.
  const getPageTransform = (i: number) => {
    let angle = page > i ? -180 : 0;
    let dragging = false;

    if (dragDirection === "next" && i === page) {
      angle = -90 * dragProgress;
      dragging = true;
    } else if (dragDirection === "prev" && i === page - 1) {
      angle = -90 * (1 - dragProgress);
      dragging = true;
    }

    return { angle, dragging };
  };

  // Full inline style for a page div. The flip itself always looks the
  // same (rotateY around the left spine) no matter which gesture — a
  // horizontal swipe or a vertical one — is driving it.
  const getPageStyle = (i: number): CSSProperties => {
    const { angle, dragging } = getPageTransform(i);
    return {
      backgroundImage: "url(/4.png)",
      transformOrigin: "left center",
      transform: `rotateY(${angle}deg)`,
      transitionDuration: dragging ? "0ms" : undefined,
      boxShadow:
        "inset 18px 0 32px -20px rgba(58,32,10,0.45), inset -10px 0 20px -16px rgba(255,255,255,0.5)",
    };
  };

  // Dots: tap jumps straight to that page; press-and-hold then drag scrubs
  // between pages as the finger/pointer moves across the whole dot bar.
  const dotBarRef = useRef<HTMLDivElement | null>(null);
  const isDraggingDots = useRef(false);

  const pageFromPointerX = (clientX: number) => {
    const bar = dotBarRef.current;
    if (!bar) return page;
    const rect = bar.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const idx = Math.round(ratio * (pageCount - 1));
    return Math.min(pageCount - 1, Math.max(0, idx));
  };

  const handleDotPointerDown = (e: PointerEvent<HTMLButtonElement>, i: number) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // No active pointer session to capture (e.g. simulated events) — the
      // drag-to-scrub gesture just won't track outside the dot bar bounds.
    }
    isDraggingDots.current = true;
    setPage(i);
  };

  const handleDotPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingDots.current) return;
    setPage(pageFromPointerX(e.clientX));
  };

  const handleDotPointerUp = () => {
    isDraggingDots.current = false;
  };

  return (
    <>
      {/* Mobile: swipeable page-flip pager (cover -> details -> RSVP, if invited) */}
      <div
        ref={pagerRef}
        className="relative h-dvh w-full overflow-hidden lg:hidden [touch-action:none]"
        style={{ perspective: 2000 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div
          className="absolute inset-0 bg-[#f7ecf7] bg-cover bg-center transition-transform duration-[1900ms] ease-[cubic-bezier(0.45,0,0.15,1)] [backface-visibility:hidden] [will-change:transform]"
          style={{ ...getPageStyle(0), zIndex: pageCount }}
        >
          <Image
            src={MOBILE_CARD_PAGES[0].src}
            alt={MOBILE_CARD_PAGES[0].alt}
            fill
            priority
            sizes="100vw"
            className="object-contain"
          />
        </div>

        <div
          className="absolute inset-0 bg-[#f7ecf7] bg-cover bg-center transition-transform duration-[1900ms] ease-[cubic-bezier(0.45,0,0.15,1)] [backface-visibility:hidden] [will-change:transform]"
          style={{ ...getPageStyle(1), zIndex: pageCount - 1 }}
        >
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
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 overflow-y-auto bg-[#f7ecf7] bg-cover bg-center px-4 py-10 transition-transform duration-[1900ms] ease-[cubic-bezier(0.45,0,0.15,1)] [backface-visibility:hidden] [touch-action:pan-y] [will-change:transform]"
            style={{ ...getPageStyle(2), zIndex: pageCount - 2 }}
          >
            <RsvpBlock inviteId={inviteId!} guestName={guestName!} existingRsvp={existingRsvp} />
          </div>
        )}

        <div
          className="absolute inset-x-0 z-20 flex items-center justify-center"
          style={{ bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem))" }}
        >
          <div ref={dotBarRef} className="flex touch-none gap-3 px-2 py-2">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to page ${i + 1}`}
                onPointerDown={(e) => handleDotPointerDown(e, i)}
                onPointerMove={handleDotPointerMove}
                onPointerUp={handleDotPointerUp}
                onPointerCancel={handleDotPointerUp}
                className={`h-2.5 w-2.5 shrink-0 rounded-full border transition-all [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.55))] ${
                  i === page
                    ? "scale-125 border-white/80 bg-gold-dark"
                    : "border-white/80 bg-gold/60"
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
