import type { Metadata } from "next";
import { DocsArticle, Callout, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Your public profile",
  description: "A small, optional 'hosted by' credit that shows up at the bottom of your guest pages.",
  openGraph: { images: ["/docs/screenshots/host-profile.png"] },
  twitter: { card: "summary_large_image", images: ["/docs/screenshots/host-profile.png"] },
};

export default function ProfilePage() {
  return (
    <DocsArticle
      title="Your public profile"
      description="A small, optional 'hosted by' credit that shows up at the bottom of your guest pages."
      current="/docs/profile"
    >
      <p>
        Your profile lives under <strong>Profile</strong> in the dashboard, separate from any one
        event. It has three fields, all optional: a <strong>photo</strong>, a{" "}
        <strong>display name</strong>, and a <strong>bio</strong>. Leave any of them blank and it
        simply doesn&rsquo;t show up on your guest pages.
      </p>

      <h2>Where it shows up</h2>
      <p>
        Your name and photo appear discreetly at the bottom of every published guest page, as
        &ldquo;Hosted by [name]&rdquo; — small and low-contrast, more a footnote than a profile
        card. Your bio isn&rsquo;t shown there; it&rsquo;s only stored for your own reference.
        Nothing appears at all if you&rsquo;ve left both name and photo blank.
      </p>
      <Screenshot src="host-profile" alt="The profile page showing photo, display name, and bio fields" />

      <Callout title="Always shown">
        One line always appears at the bottom of every published guest page, whether or not
        you&rsquo;ve filled in a profile: &ldquo;This page and any data collected here are managed
        by its host, not ahvaan.&rdquo; It&rsquo;s a fixed disclaimer, not something you can turn
        off — every guest page collects RSVPs and responses on your behalf, and this line makes
        that clear regardless of how much of your own profile you&rsquo;ve set up.
      </Callout>

      <DocsPrevNext current="/docs/profile" />
    </DocsArticle>
  );
}
