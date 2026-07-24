"use client";

import { useState } from "react";
import Image from "next/image";
import { RsvpForm } from "./rsvp-form";
import { VenueMap } from "./venue-map";

const PAGE_COUNT = 3;

function RsvpBlock() {
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
        <RsvpForm />
      </div>
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

export function InviteBook() {
  const [page, setPage] = useState(0);
  const [cardPage, setCardPage] = useState(0);

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(PAGE_COUNT - 1, p + 1));

  const cardGoPrev = () => setCardPage((p) => Math.max(0, p - 1));
  const cardGoNext = () => setCardPage((p) => Math.min(DESKTOP_CARD_PAGES.length - 1, p + 1));

  return (
    <>
      {/* Mobile: 3-page pager (cover -> details -> RSVP) */}
      <div className="relative h-dvh w-full overflow-hidden lg:hidden">
        <div
          className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            width: `${PAGE_COUNT * 100}%`,
            transform: `translateX(-${page * (100 / PAGE_COUNT)}%)`,
          }}
        >
          <div className="relative h-full shrink-0 basis-1/3">
            <Image
              src={MOBILE_CARD_PAGES[0].src}
              alt={MOBILE_CARD_PAGES[0].alt}
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
          </div>

          <div className="relative h-full shrink-0 basis-1/3">
            <Image
              src={MOBILE_CARD_PAGES[1].src}
              alt={MOBILE_CARD_PAGES[1].alt}
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
          </div>

          <div className="flex h-full shrink-0 basis-1/3 flex-col items-center gap-6 overflow-y-auto px-4 pt-10 pb-28">
            <VenueMap />
            <RsvpBlock />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={goPrev}
            disabled={page === 0}
            className="rounded-full bg-white/80 px-4 py-2 font-display text-xs uppercase tracking-[0.15em] text-gold-dark shadow-md backdrop-blur-sm transition disabled:opacity-0"
          >
            &lsaquo; Prev
          </button>

          <div className="flex gap-1.5">
            {Array.from({ length: PAGE_COUNT }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === page ? "bg-gold-dark" : "bg-gold/30"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={page === PAGE_COUNT - 1}
            className="rounded-full bg-white/80 px-4 py-2 font-display text-xs uppercase tracking-[0.15em] text-gold-dark shadow-md backdrop-blur-sm transition disabled:opacity-0"
          >
            Next &rsaquo;
          </button>
        </div>
      </div>

      {/* Desktop: card pager (left/right) + persistent RSVP/map column */}
      <div className="hidden h-screen items-stretch gap-6 px-6 py-6 lg:flex">
        <div className="relative flex min-h-0 flex-[2] flex-col items-center justify-center gap-4">
          <div className="relative min-h-0 w-full flex-1">
            {DESKTOP_CARD_PAGES.map((card, i) => (
              <Image
                key={card.src}
                src={card.src}
                alt={card.alt}
                fill
                priority
                sizes="66vw"
                className={`rounded-2xl object-contain shadow-[0_20px_60px_-25px_rgba(138,98,21,0.45)] transition-opacity duration-500 ${
                  i === cardPage ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={cardGoPrev}
              disabled={cardPage === 0}
              className="rounded-full bg-white/80 px-4 py-2 font-display text-xs uppercase tracking-[0.15em] text-gold-dark shadow-md backdrop-blur-sm transition disabled:opacity-0"
            >
              &lsaquo; Prev
            </button>

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

            <button
              type="button"
              onClick={cardGoNext}
              disabled={cardPage === DESKTOP_CARD_PAGES.length - 1}
              className="rounded-full bg-white/80 px-4 py-2 font-display text-xs uppercase tracking-[0.15em] text-gold-dark shadow-md backdrop-blur-sm transition disabled:opacity-0"
            >
              Next &rsaquo;
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto py-2">
          <RsvpBlock />
          <VenueMap />
        </div>
      </div>
    </>
  );
}
