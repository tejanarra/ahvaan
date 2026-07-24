import { wedding } from "@/lib/wedding";

export function VenueMap() {
  return (
    <div className="w-full max-w-md rounded-[1.75rem] border border-white/60 bg-white/55 p-4 shadow-[0_8px_30px_-15px_rgba(138,98,21,0.25)] backdrop-blur-md sm:p-5">
      <p className="text-center font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
        Venue
      </p>
      <p className="mt-1 text-center font-script text-lg text-foreground">
        {wedding.venue.name}
      </p>
      <p className="text-center font-script text-sm italic text-foreground/85">
        {wedding.venue.address}
      </p>

      <div className="mt-3 overflow-hidden rounded-xl border border-gold/25">
        <iframe
          src={wedding.venue.embedUrl}
          title="Venue location map"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-48 w-full sm:h-56"
        />
      </div>

      <a
        href={wedding.venue.directionsUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gold-dark px-6 py-2.5 font-display text-sm uppercase tracking-[0.15em] text-white shadow-sm transition hover:scale-[1.02] hover:bg-[#5c3a0c] active:scale-[0.98]"
      >
        Get Directions
      </a>
    </div>
  );
}
