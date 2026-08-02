// One-off tool: builds a few published, publicly-visible example events under
// the generic docs-demo@example.com account (see scripts/seed-docs-demo-user.mjs)
// so the docs site can link to real, live sample designs. Not part of the
// build/test pipeline — run manually:
//   node scripts/docs-example-events.mjs
import { chromium } from "playwright";

const BASE_URL = process.env.DOCS_SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.DOCS_SCREENSHOT_EMAIL ?? "docs-demo@example.com";
const PASSWORD = process.env.DOCS_SCREENSHOT_PASSWORD ?? "docs-demo-password-123";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

const EXAMPLES = [
  {
    title: "Sunlit Garden Brunch",
    subtitle: "A late-morning celebration in the orchard",
    date: "2026-09-19",
    time: "11:00 AM",
    venueName: "The Orchard House",
    venueAddress: "12 Meadowbrook Ln, Sonoma, CA",
    themeLabel: "Garden Party",
    blocksToAdd: ["Text", "Countdown", "Schedule / itinerary"],
  },
  {
    title: "Midnight Gala",
    subtitle: "Black tie, low light, one unforgettable night",
    date: "2026-11-07",
    time: "8:00 PM",
    venueName: "The Aurelius Ballroom",
    venueAddress: "900 Vine St, San Francisco, CA",
    themeLabel: "Midnight Elegant",
    blocksToAdd: ["Image carousel", "Countdown"],
  },
  {
    title: "Playful Backyard Bash",
    subtitle: "Cake, kazoos, and a bounce house",
    date: "2026-08-22",
    time: "2:00 PM",
    venueName: "Maple Street Backyard",
    venueAddress: "44 Maple St, Austin, TX",
    themeLabel: "Playful Pastel",
    blocksToAdd: ["Text", "Spacer", "Schedule / itinerary"],
  },
];

async function ensureSignedIn(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /Sign in|Log in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

async function buildExample(page, spec) {
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(500);
  const existing = page.getByRole("link", { name: new RegExp(spec.title, "i") });
  if (await existing.count()) {
    console.log("skip (exists):", spec.title);
    return;
  }

  await page.goto(`${BASE_URL}/dashboard/events/new`);
  await page.getByLabel("Event title").fill(spec.title);
  await page.getByLabel("Subtitle").fill(spec.subtitle);
  await page.getByLabel("Date").fill(spec.date);
  await page.getByLabel("Time").fill(spec.time);
  await page.getByLabel("Venue name").fill(spec.venueName);
  await page.getByLabel("Venue address").fill(spec.venueAddress);
  await page.getByRole("button", { name: /Create event/i }).click();
  await page.waitForURL(new RegExp(`/dashboard/events/${UUID}`), { timeout: 10000 });
  const eventUrl = page.url().match(new RegExp(`/dashboard/events/${UUID}`))[0];

  // Theme
  await page.goto(`${BASE_URL}${eventUrl}/design`);
  await page.waitForTimeout(800);
  const themeButton = page.getByRole("button", {
    name: /Classic Gold|Modern Minimal|Playful Pastel|Midnight Elegant|Garden Party|Ocean Air|Fiesta|Ink & Blush/i,
  });
  await themeButton.first().click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: spec.themeLabel, exact: true }).click();
  await page.waitForTimeout(300);

  // Blocks — click each palette card to append it.
  for (const label of spec.blocksToAdd) {
    const card = page.getByText(label, { exact: true }).first();
    if (await card.count()) {
      await card.click();
      await page.waitForTimeout(400);
    } else {
      console.log("  block not found in palette:", label);
    }
  }
  await page.waitForTimeout(500);
  const saveButton = page.getByRole("button", { name: /^Save$/i });
  if (await saveButton.count()) {
    await saveButton.click();
    await page.waitForTimeout(600);
  }

  // Publish
  await page.goto(`${BASE_URL}${eventUrl}/settings`);
  await page.waitForTimeout(800);
  const publishBtn = page.getByRole("button", { name: /^Publish$/i });
  if (await publishBtn.count()) {
    await publishBtn.click();
    await page.waitForTimeout(1000);
  }

  const link = page.getByRole("link", { name: /Preview page|View public page/i });
  const href = (await link.count()) ? await link.first().getAttribute("href") : null;
  console.log("built:", spec.title, "->", href);
  return href;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await ensureSignedIn(page);

  const results = [];
  for (const spec of EXAMPLES) {
    const href = await buildExample(page, spec);
    results.push({ title: spec.title, href });
  }
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
