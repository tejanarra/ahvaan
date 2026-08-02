# Auth email templates

Branded HTML for every Supabase Auth email this product actually triggers
(confirmed against `src/lib/auth-actions.ts` — signup, password reset, and
Google OAuth sign-in are the only auth flows in the app, so Magic Link,
Invite User, Change Email, and Reauthentication templates aren't included
here since nothing in the codebase sends them).

Generated from one shared shell in `scripts/build-auth-email-templates.mjs`
(same paper/ink tokens, Georgia serif heading, accent-green button as the
Resend-sent emails in `src/lib/email.ts` — see that file's `emailFrame`) so
every email this product sends, whether via Supabase's own mailer or
Resend, reads as the same brand. Regenerate after editing the script:

```
node scripts/build-auth-email-templates.mjs
```

## Installing into Supabase

Supabase Auth email templates are configured in the Dashboard, not in this
repo's code — paste each file's contents into its matching template slot
under **Authentication → Emails → Templates**:

| File | Supabase template | Subject |
|---|---|---|
| `confirm-signup.html` | Confirm signup | Confirm your email address |
| `reset-password.html` | Reset Password | Reset your password |
| `password-changed.html` | Password Changed *(under Security emails, if enabled on your plan)* | Your password was changed |
| `new-signin-method-linked.html` | New sign-in method linked *(under Security emails, if enabled on your plan)* | A new sign-in method was linked |

For each: open the template, replace the **Source** with the file's
contents, set the **Subject** from the table above, and save. The
`{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .Provider }}`, `{{ .SiteURL }}`
placeholders are Supabase's own Go-template variables — do not rename or
remove them, Supabase fills them in at send time.

`{{ .SiteURL }}` must be set correctly in **Authentication → URL
Configuration** for the wordmark/footer links and the `/icon.png` logo to
resolve to the real production domain.

## Deliverability (Dashboard/DNS — not code)

These templates control content and branding only. The following affect
whether these emails actually land in an inbox instead of spam, and live
outside this codebase entirely:

- **SPF/DKIM/DMARC DNS records** — required for both Resend (the app's own
  invite/reminder/verification emails, `src/lib/email.ts`) and Supabase's
  auth mailer. Per `docs/01-product-definition.md` and `SAAS_PLAN.md`,
  Resend domain verification was still pending as of the last check — until
  it's done, `RESEND_FROM_EMAIL` sends from an unverified domain, which most
  providers spam-filter or bounce. Verify in the Resend dashboard under
  Domains.
- **Supabase's default auth mailer is rate-limited and not meant for
  production volume** — for anything beyond low-volume testing, configure a
  custom SMTP provider (can be the same Resend account) under
  **Project Settings → Auth → SMTP Settings**, with its own verified
  sending domain.
- **Reply-To** — the Resend-sent emails now set `replyTo` to the support
  inbox already linked from the Privacy Policy (see `SUPPORT_EMAIL` in
  `src/lib/email.ts`). Supabase's auth emails have no per-template Reply-To
  field; if using custom SMTP, most providers let you set a default
  Reply-To there instead.
