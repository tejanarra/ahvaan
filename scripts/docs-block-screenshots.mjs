// One-off: captures a clean Properties Panel screenshot for every block
// type, one at a time, on a dedicated scratch event (kept minimal on
// purpose so each new block is easy to find and select without scrolling
// through unrelated clutter). Run manually: node scripts/docs-block-screenshots.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE_URL = process.env.DOCS_SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = "public/docs/screenshots";
const EMAIL = process.env.DOCS_SCREENSHOT_EMAIL ?? "docs-demo@example.com";
const PASSWORD = process.env.DOCS_SCREENSHOT_PASSWORD ?? "docs-demo-password-123";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const EVENT_TITLE = "Block Reference";

mkdirSync(OUT_DIR, { recursive: true });

async function shot(page, name) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT_DIR}/${name}.png` });
  console.log("captured", name);
}

async function ensureEvent(page) {
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(500);
  const existing = page.getByRole("link", { name: new RegExp(EVENT_TITLE, "i") });
  if (await existing.count()) {
    await existing.first().click();
    await page.waitForURL(new RegExp(`/dashboard/events/${UUID}`), { timeout: 10000 });
    return page.url().match(new RegExp(`/dashboard/events/${UUID}`))[0];
  }
  await page.goto(`${BASE_URL}/dashboard/events/new`);
  await page.getByLabel("Event title").fill(EVENT_TITLE);
  await page.getByLabel("Date").fill("2026-12-01");
  await page.getByLabel("Venue name").fill("Reference Hall");
  await page.getByLabel("Venue address").fill("1 Docs Way, Reference, CA");
  await page.getByRole("button", { name: /Create event/i }).click();
  await page.waitForURL(new RegExp(`/dashboard/events/${UUID}`), { timeout: 10000 });
  return page.url().match(new RegExp(`/dashboard/events/${UUID}`))[0];
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /Sign in|Log in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });

  const eventUrl = await ensureEvent(page);

  const blocks = [
    { label: "Container (nest elements)", shot: "block-container-properties" },
    { label: "Custom HTML/CSS/JS", shot: "block-custom-html-properties" },
    { label: "Schedule / itinerary", shot: "block-schedule-properties" },
  ];

  for (const b of blocks) {
    await page.goto(`${BASE_URL}${eventUrl}/design`);
    await page.waitForTimeout(700);
    const before = await page.locator("[data-block-id]").count();
    const card = page.getByText(b.label, { exact: true }).first();
    if (!(await card.count())) {
      console.log("skip (not found in palette):", b.label);
      continue;
    }
    await card.click();
    await page.waitForTimeout(400);
    const after = page.locator("[data-block-id]");
    const count = await after.count();
    if (count <= before) {
      console.log("skip (block did not get added):", b.label);
      continue;
    }
    const newBlock = after.nth(count - 1);
    await newBlock.scrollIntoViewIfNeeded();
    await newBlock.click({ force: true });
    await shot(page, b.shot);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
