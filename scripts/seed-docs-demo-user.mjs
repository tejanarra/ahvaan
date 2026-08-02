// One-off: creates (or confirms) the docs-screenshot demo host account via
// the Supabase Admin API, so scripts/docs-screenshots.mjs can log in without
// depending on real email delivery. Run manually, not part of the app.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) process.env[match[1]] ??= match[2];
}

const EMAIL = process.env.DOCS_SCREENSHOT_EMAIL ?? "docs-demo@example.com";
const PASSWORD = process.env.DOCS_SCREENSHOT_PASSWORD ?? "docs-demo-password-123";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email === EMAIL);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    console.log("confirmed existing user", existing.id);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  console.log("created user", data.user.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
