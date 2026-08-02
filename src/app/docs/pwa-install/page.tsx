import type { Metadata } from "next";
import { DocsArticle, Callout, Screenshot, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Installing the app (PWA)",
  description: "ahvaan can be installed like a native app on your phone or desktop — no app store required.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("Installing the app (PWA)")}&section=Guides`] },
  twitter: { card: "summary_large_image", images: [`/docs/og?title=${encodeURIComponent("Installing the app (PWA)")}&section=Guides`] },
};

export default function PwaInstallPage() {
  return (
    <DocsArticle
      title="Installing the app (PWA)"
      description="ahvaan can be installed like a native app on your phone or desktop — no app store required."
      current="/docs/pwa-install"
    >
      <p>
        ahvaan is a Progressive Web App: install it once, and it opens in its own window with its
        own icon, no browser address bar in the way. There&rsquo;s no separate app to download —
        installing just bookmarks the same site in a way your OS treats as a real app.
      </p>

      <h2>Install on iOS (Safari)</h2>
      <p>
        Open ahvaan in Safari, tap the <strong>Share</strong> icon, then choose{" "}
        <strong>Add to Home Screen</strong>. This is a manual step — iOS Safari doesn&rsquo;t show
        an automatic install banner, so you won&rsquo;t be prompted; you have to reach for it
        yourself.
      </p>

      <h2>Install on Android (Chrome)</h2>
      <p>
        Chrome usually offers this on its own: look for an <strong>Install app</strong> or{" "}
        <strong>Add to Home screen</strong> banner, or find the same option in Chrome&rsquo;s menu
        (the ⋮ icon) if it doesn&rsquo;t appear automatically.
      </p>

      <h2>Install on desktop (Chrome or Edge)</h2>
      <p>
        Look for an install icon in the address bar (usually a small monitor-and-arrow glyph), or
        open the browser menu and choose <strong>Install ahvaan&hellip;</strong>. Once installed,
        ahvaan opens in its own app window, separate from your regular browser tabs.
      </p>

      <Callout>
        Installing always opens to ahvaan&rsquo;s home page, not straight into the dashboard — this
        is deliberate. The dashboard is auth-gated, so if the install launched a signed-out visitor
        straight there, they&rsquo;d just get bounced to the login page. The home page works
        regardless of whether you&rsquo;re signed in: signed out, you get sign-in/sign-up buttons;
        signed in, the same page shows a single <strong>Dashboard</strong> button, so you&rsquo;re
        still just one tap from your events.
      </Callout>

      <p>
        There&rsquo;s no custom &ldquo;install ahvaan&rdquo; prompt inside the app itself — each
        platform uses its own native install UI as described above, not a banner ahvaan builds or
        controls.
      </p>

      <Screenshot src="dashboard-empty-or-list" alt="The dashboard, reached in one tap after installing and signing in" />

      <DocsPrevNext current="/docs/pwa-install" />
    </DocsArticle>
  );
}
