export function VenueMap({
  venueName,
  venueAddress,
}: {
  venueName: string;
  venueAddress: string;
}) {
  const query = encodeURIComponent(venueAddress);
  const embedUrl = `https://www.google.com/maps?q=${query}&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;

  return (
    <div className="w-full">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]">Venue</p>
      <p className="mt-1 text-center text-base font-medium text-[var(--t-fg)]">{venueName}</p>
      <p className="text-center text-sm text-[var(--t-fg)]/70">{venueAddress}</p>

      <div className="mt-3 overflow-hidden rounded-lg border border-[var(--t-accent)]/25">
        <iframe
          src={embedUrl}
          title="Venue location map"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-48 w-full sm:h-56"
        />
      </div>

      <a
        href={directionsUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-[var(--t-accent-dark)] px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-white shadow-sm transition hover:opacity-90"
      >
        Get directions
      </a>
    </div>
  );
}
