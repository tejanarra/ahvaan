import type { Metadata } from "next";
import { DocsArticle, Callout, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Account & security",
  description: "Signing up, signing in, resetting a forgotten password, and how ahvaan keeps public forms from being abused.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("Account & security")}&section=Guides`] },
  twitter: { card: "summary_large_image", images: [`/docs/og?title=${encodeURIComponent("Account & security")}&section=Guides`] },
};

export default function AccountSecurityPage() {
  return (
    <DocsArticle
      title="Account & security"
      description="Signing up, signing in, resetting a forgotten password, and how ahvaan keeps public forms from being abused."
      current="/docs/account-security"
    >
      <p>
        You can sign up and sign in with an email and password, or continue with Google. Passwords
        must be at least 8 characters, both at signup and when you set a new one.
      </p>

      <h2>Forgotten password</h2>
      <p>
        Use <strong>Forgot password</strong> and enter your email — you&rsquo;ll get a reset link if
        an account exists for it. Once you follow that link, set a new password (again, at least 8
        characters) and you&rsquo;re signed back in.
      </p>
      <Callout title="Same message either way">
        Requesting a reset always shows the same message: &ldquo;If that email has an account, a
        reset link is on its way.&rdquo; That&rsquo;s deliberate, not a bug — if the response
        differed depending on whether the account existed, anyone could use the reset form to
        check which emails have signed up for ahvaan.
      </Callout>

      <h2>Already signed in?</h2>
      <p>
        Visiting the sign-in, sign-up, or forgot-password page while you&rsquo;re already signed in
        sends you straight to your dashboard instead of showing the form again — there&rsquo;s
        nothing to do there once you have a live session.
      </p>

      <h2>Signing out</h2>
      <p>Sign out from the dashboard at any time; it ends your session and returns you to the sign-in page.</p>

      <h2>Public forms and abuse protection</h2>
      <p>
        RSVP forms and custom forms are open to anyone with the link, so ahvaan applies some basic
        rate limiting behind the scenes to keep them from being spammed or scripted. In practice
        this only ever shows up as a brief delay if a form is submitted unusually fast or
        repeatedly from the same place — normal guests submitting a form once will never notice
        it. If you&rsquo;re curious how it actually works, see the reference page on{" "}
        <a href="/docs/reference/rate-limiting" className="text-accent hover:underline">
          rate limiting & size budgets
        </a>
        .
      </p>

      <DocsPrevNext current="/docs/account-security" />
    </DocsArticle>
  );
}
