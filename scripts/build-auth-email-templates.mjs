// Generates the branded Supabase Auth email templates under
// supabase/email-templates/ from one shared shell, so all four stay
// byte-consistent with each other (and with the look of the Resend-sent
// emails in src/lib/email.ts — same paper/ink tokens, same Georgia serif
// heading, same accent button). Run manually: node scripts/build-auth-email-templates.mjs
// These are static files a human pastes into the Supabase Dashboard
// (Authentication → Email Templates) — Supabase renders its own
// {{ .ConfirmationURL }}-style Go-template variables server-side, so
// nothing here can (or should) be dynamic/generated at request time.
import { writeFileSync } from "node:fs";

const INK = "#211E19";
const MUTED = "#6E6A61";
const MUTED_FOREGROUND = "#A3A099";
const ACCENT = "#2F5D46";
const ACCENT_FOREGROUND = "#FFFFFF";
const BACKGROUND = "#FBFAF8";
const SURFACE = "#FFFFFF";
const BORDER = "#E7E4DD";
const DISPLAY_FONT = "Georgia, 'Times New Roman', serif";
const BODY_FONT = "Arial, Helvetica, sans-serif";

function shell({ heading, bodyHtml, ctaLabel, ctaUrl, note }) {
  return `<div style="background:${BACKGROUND};padding:32px 16px;font-family:${BODY_FONT};">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:${SURFACE};border:1px solid ${BORDER};border-radius:12px;" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:32px 32px 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:6px;vertical-align:middle;">
              <a href="{{ .SiteURL }}"><img src="{{ .SiteURL }}/icon.png" width="20" height="20" alt="ahvaan" style="display:block;border-radius:4px;" /></a>
            </td>
            <td style="vertical-align:middle;">
              <a href="{{ .SiteURL }}" style="font-family:${DISPLAY_FONT};font-size:18px;color:${INK};text-decoration:none;">ahvaan</a>
            </td>
            <td style="vertical-align:middle;padding-left:8px;">
              <span style="font-size:12px;color:${MUTED};">Invitations made easy</span>
            </td>
          </tr>
        </table>
        <h1 style="font-family:${DISPLAY_FONT};font-weight:normal;font-size:22px;margin:24px 0 12px;color:${INK};">${heading}</h1>
        ${bodyHtml}
        ${
          ctaUrl
            ? `<p style="margin-top:20px;">
          <a href="${ctaUrl}" style="display:inline-block;background:${ACCENT};color:${ACCENT_FOREGROUND};padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">${ctaLabel}</a>
        </p>
        <p style="margin-top:16px;font-size:12px;color:${MUTED_FOREGROUND};word-break:break-all;">Or copy this link: ${ctaUrl}</p>`
            : ""
        }
        ${note ? `<p style="margin-top:16px;font-size:14px;color:${MUTED};line-height:1.5;">${note}</p>` : ""}
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 28px;">
        <hr style="border:none;border-top:1px solid ${BORDER};margin:0 0 16px;" />
        <a href="{{ .SiteURL }}" style="font-size:12px;color:${MUTED};text-decoration:none;">ahvaan — design the invitation, share one link</a>
      </td>
    </tr>
  </table>
</div>
`;
}

const templates = {
  "confirm-signup.html": {
    subject: "Confirm your email address",
    html: shell({
      heading: "Confirm your email address",
      bodyHtml: `<p style="font-size:16px;line-height:1.5;color:${INK};margin:0;">Follow the link below to confirm this email address and finish signing up for ahvaan.</p>`,
      ctaLabel: "Confirm email address",
      ctaUrl: "{{ .ConfirmationURL }}",
    }),
  },
  "reset-password.html": {
    subject: "Reset your password",
    html: shell({
      heading: "Reset your password",
      bodyHtml: `<p style="font-size:16px;line-height:1.5;color:${INK};margin:0;">We received a request to reset your password. Follow the link below to choose a new one.</p>`,
      ctaLabel: "Reset password",
      ctaUrl: "{{ .ConfirmationURL }}",
      note: "If you didn't request this, you can safely ignore this email — your password won't change.",
    }),
  },
  "password-changed.html": {
    subject: "Your password was changed",
    html: shell({
      heading: "Your password was changed",
      bodyHtml: `<p style="font-size:16px;line-height:1.5;color:${INK};margin:0;">The password for <strong>{{ .Email }}</strong> was recently changed.</p>`,
      note: `If you didn't make this change, <a href="{{ .SiteURL }}/forgot-password" style="color:${ACCENT};">reset your password</a> right away.`,
    }),
  },
  "new-signin-method-linked.html": {
    subject: "A new sign-in method was linked",
    html: shell({
      heading: "A new sign-in method was linked",
      bodyHtml: `<p style="font-size:16px;line-height:1.5;color:${INK};margin:0;">Your <strong>{{ .Provider }}</strong> account was linked as a new sign-in method for <strong>{{ .Email }}</strong>.</p>`,
      note: `If you didn't make this change, <a href="{{ .SiteURL }}/forgot-password" style="color:${ACCENT};">reset your password</a> and contact us right away.`,
    }),
  },
};

for (const [filename, { html }] of Object.entries(templates)) {
  writeFileSync(`supabase/email-templates/${filename}`, html);
  console.log("wrote", filename);
}

console.log("\nSubjects (set these in the Supabase Dashboard alongside each template):");
for (const [filename, { subject }] of Object.entries(templates)) {
  console.log(` ${filename} -> "${subject}"`);
}
