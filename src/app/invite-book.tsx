"use client";

import { useState } from "react";
import Image from "next/image";
import { RsvpModal } from "./rsvp-modal";
import { VenueMap } from "./venue-map";

export function InviteBook() {
  const [opened, setOpened] = useState(false);

  return (
    <>
      {/* Mobile: full-screen flip book */}
      <div className="lg:hidden">
        <div className="relative h-dvh w-full" style={{ perspective: 2000 }}>
          <Image
            src="/right.jpg"
            alt="Wedding details"
            fill
            priority
            sizes="100vw"
            className="object-contain"
          />

          <button
            type="button"
            aria-label={opened ? "View invitation front" : "Tap to open invitation"}
            onClick={() => setOpened((o) => !o)}
            className="absolute inset-0 h-full w-full cursor-pointer transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] [backface-visibility:hidden] [transform-style:preserve-3d]"
            style={{
              transformOrigin: "left center",
              transform: opened ? "rotateY(-140deg)" : "rotateY(0deg)",
            }}
          >
            <Image
              src="/left.jpg"
              alt="Wedding invitation"
              fill
              priority
              sizes="100vw"
              className="object-contain shadow-2xl [backface-visibility:hidden]"
            />
            {!opened && (
              <span className="absolute bottom-12 left-1/2 flex -translate-x-1/2 animate-[gentle-bounce_2s_ease-in-out_infinite] flex-col items-center gap-1">
                <span className="rounded-full bg-white/75 px-5 py-2 font-display text-xs uppercase tracking-[0.2em] text-gold-dark shadow-md backdrop-blur-sm">
                  Tap to open
                </span>
              </span>
            )}
          </button>
        </div>

        {opened && (
          <div className="flex flex-col items-center gap-6 px-4 py-10 [animation:fade-in-up_0.7s_ease-out]">
            <VenueMap />
            <RsvpModal />
          </div>
        )}
      </div>

      {/* Desktop: side-by-side book */}
      <div className="hidden flex-col items-center gap-8 px-4 py-10 lg:flex">
        <div className="flex h-[78vh] items-stretch gap-0">
          <Image
            src="/left.jpg"
            alt="Swathi weds Sri Sai Teja — invitation, page one"
            width={768}
            height={1024}
            priority
            className="h-full w-auto rounded-l-2xl object-contain shadow-[0_20px_60px_-25px_rgba(138,98,21,0.45)]"
          />
          <Image
            src="/right.jpg"
            alt="Wedding details, page two"
            width={763}
            height={1024}
            priority
            className="h-full w-auto rounded-r-2xl border-l border-gold/30 object-contain shadow-[0_20px_60px_-25px_rgba(138,98,21,0.45)]"
          />
        </div>

        <div className="flex flex-col items-center gap-6 [animation:fade-in-up_0.8s_ease-out]">
          <VenueMap />
          <RsvpModal />
        </div>
      </div>
    </>
  );
}
