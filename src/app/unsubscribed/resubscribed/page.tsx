import Link from "next/link";
import { BrandLockup } from "@/components/brand";
import { PublicFooter } from "@/components/public-footer";

export const metadata = { title: "Resubscribed" };

export default function ResubscribedPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-16 text-center sm:px-6">
        <Link href="/" aria-label="ahvaan home" className="inline-flex">
          <BrandLockup />
        </Link>
        <h1 className="mt-8 font-display text-2xl text-foreground">You&rsquo;re back on the list</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          You&rsquo;ll receive event emails at this address again.
        </p>
      </div>
      <PublicFooter />
    </div>
  );
}
