import type { Metadata } from "next";
import { DocsArticle, Callout, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Images",
  description: "What you can upload, how large it can be, and what happens to it when you delete something.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("Images")}&section=Guides`] },
  twitter: { card: "summary_large_image", images: [`/docs/og?title=${encodeURIComponent("Images")}&section=Guides`] },
};

export default function ImagesPage() {
  return (
    <DocsArticle
      title="Images"
      description="What you can upload, how large it can be, and what happens to it when you delete something."
      current="/docs/images"
    >
      <p>
        Any image you upload — an event&rsquo;s hero photo, an Image block, a carousel slide, or
        your own profile photo — goes through the same rules.
      </p>

      <h2>Accepted files</h2>
      <p>
        JPEG, PNG, WebP, or GIF. Anything else is rejected before it uploads.
      </p>

      <h2>Size limit</h2>
      <p>
        Images are capped at 5MB. If your original photo is larger than that (and isn&rsquo;t a
        GIF — animated GIFs are uploaded as-is, since re-encoding would flatten them to one frame),
        ahvaan compresses it in your browser first: shrinking its dimensions and re-encoding it at
        progressively lower quality until it fits, before it ever reaches the 5MB cap. Most phone
        photos never actually hit the limit because of this. If a file still won&rsquo;t fit after
        compression, you&rsquo;ll need to resize it yourself before uploading.
      </p>
      <Callout>
        If an upload is rejected outright, you&rsquo;ll see: &ldquo;Images must be 5MB or smaller.&rdquo;
      </Callout>

      <h2>Cleanup on delete</h2>
      <p>
        Images aren&rsquo;t left behind. Deleting an event removes every image attached to it, and
        deleting your account removes every image across every event you&rsquo;ve created, plus
        your profile photo. Nothing lingers in storage after the thing it belonged to is gone.
      </p>

      <DocsPrevNext current="/docs/images" />
    </DocsArticle>
  );
}
