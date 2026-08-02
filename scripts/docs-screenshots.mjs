// One-off tool for capturing real app screenshots for the /docs site.
// Not part of the build/test pipeline — run manually:
//   node scripts/seed-docs-demo-user.mjs   (once, or whenever the account needs recreating)
//   node scripts/docs-screenshots.mjs
// Requires a running dev server at BASE_URL (defaults to localhost:3000).
// Uses a fully generic demo account/content — no real names, emails, or
// domains ever appear in these screenshots.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE_URL = process.env.DOCS_SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = "public/docs/screenshots";
const EMAIL = process.env.DOCS_SCREENSHOT_EMAIL ?? "docs-demo@example.com";
const PASSWORD = process.env.DOCS_SCREENSHOT_PASSWORD ?? "docs-demo-password-123";
const EVENT_TITLE = "Docs Demo Wedding";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

mkdirSync(OUT_DIR, { recursive: true });

async function shot(page, name, opts = {}) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT_DIR}/${name}.png`, fullPage: opts.fullPage ?? false });
  console.log("captured", name);
}

async function ensureSignedIn(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /Sign in|Log in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

async function ensureDemoEvent(page) {
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(500);
  const existingCard = page.getByText(EVENT_TITLE, { exact: true });
  if (await existingCard.count()) {
    const link = page.getByRole("link", { name: new RegExp(EVENT_TITLE, "i") }).first();
    await link.click();
    await page.waitForURL(new RegExp(`/dashboard/events/${UUID}`), { timeout: 10000 });
    return page.url().match(new RegExp(`/dashboard/events/${UUID}`))[0];
  }

  await page.goto(`${BASE_URL}/dashboard/events/new`);
  await page.getByLabel("Event title").fill(EVENT_TITLE);
  await page.getByLabel("Subtitle").fill("Join us as we celebrate");
  await page.getByLabel("Date").fill("2026-10-10");
  await page.getByLabel("Time").fill("4:00 PM");
  await page.getByLabel("Venue name").fill("The Garden Pavilion");
  await page.getByLabel("Venue address").fill("500 Orchard Lane, Napa, CA");
  await page.getByRole("button", { name: /Create event/i }).click();
  await page.waitForURL(new RegExp(`/dashboard/events/${UUID}`), { timeout: 10000 });
  return page.url().match(new RegExp(`/dashboard/events/${UUID}`))[0];
}

async function addBlockAndScreenshot(page, eventUrl, { label, screenshotName }) {
  await page.goto(`${BASE_URL}${eventUrl}/design`);
  await page.waitForTimeout(800);
  const card = page.getByText(label, { exact: true }).first();
  if (!(await card.count())) {
    console.log("skip (not found):", label);
    return;
  }
  await card.click();
  await page.waitForTimeout(400);
  // Newly added block lands at the end of the canvas — select it.
  const blockCard = page.locator(`text=${label}`).last();
  if (await blockCard.count()) await blockCard.click();
  await shot(page, screenshotName);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await ensureSignedIn(page);
  await shot(page, "dashboard-empty-or-list");

  const eventUrl = await ensureDemoEvent(page);
  await shot(page, "event-overview");

  // --- Settings: draft/published toggle, event details ---
  await page.goto(`${BASE_URL}${eventUrl}/settings`);
  await shot(page, "event-settings");

  // --- Page builder: overview + palette ---
  await page.goto(`${BASE_URL}${eventUrl}/design`);
  await page.waitForTimeout(1000);
  await shot(page, "page-builder-overview");

  const heroBlock = page.locator("text=Hero").first();
  if (await heroBlock.count()) {
    await heroBlock.click();
    await shot(page, "page-builder-properties-panel");
  }

  // A representative sample of block-editor panels (not literally every
  // type — the PropertyRow-based Edit UI is the same shape throughout;
  // Container and Custom HTML are the two structurally distinct ones).
  await addBlockAndScreenshot(page, eventUrl, { label: "Container (nest elements)", screenshotName: "block-container-properties" });
  await addBlockAndScreenshot(page, eventUrl, { label: "Custom HTML/CSS/JS", screenshotName: "block-custom-html-properties" });
  await addBlockAndScreenshot(page, eventUrl, { label: "Schedule / itinerary", screenshotName: "block-schedule-properties" });

  // Theme picker + page-level Code editor (top bar of the builder).
  await page.goto(`${BASE_URL}${eventUrl}/design`);
  await page.waitForTimeout(800);
  const themeButton = page.getByRole("button", { name: /Classic Gold|Modern Minimal|Playful Pastel|Midnight Elegant|Garden Party|Ocean Air|Fiesta|Ink & Blush/i });
  if (await themeButton.count()) {
    await themeButton.first().click();
    await shot(page, "theme-picker");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
  await page.goto(`${BASE_URL}${eventUrl}/design`);
  await page.waitForTimeout(800);
  const codeButton = page.getByRole("button", { name: /^Code$/i });
  if (await codeButton.count()) {
    await codeButton.first().click();
    await shot(page, "page-json-editor");
    await page.keyboard.press("Escape");
  }

  // --- RSVP form fields + Actions (post-submit behavior) ---
  await page.goto(`${BASE_URL}${eventUrl}/fields`);
  await shot(page, "rsvp-form-builder");

  const actionsTab = page.getByRole("link", { name: /^Actions$/i }).or(page.getByRole("button", { name: /^Actions$/i }));
  if (await actionsTab.count()) {
    await actionsTab.first().click();
    await page.waitForTimeout(500);
    await shot(page, "rsvp-post-submit-actions");
  }

  // --- Generic forms: list, builder, data ---
  await page.goto(`${BASE_URL}${eventUrl}/forms`);
  await shot(page, "forms-list");

  const existingForm = page.getByRole("link", { name: /Dietary Preferences/i });
  const newFormButton = page.getByRole("button", { name: /New form/i }).first();
  if (await existingForm.count()) {
    await existingForm.first().click();
    await page.waitForURL(/\/forms\//, { timeout: 10000 });
    await shot(page, "custom-form-builder");
    const dataTab = page.getByRole("link", { name: /^Data$/i }).or(page.getByRole("button", { name: /^Data$/i }));
    if (await dataTab.count()) {
      await dataTab.first().click();
      await page.waitForTimeout(400);
      await shot(page, "custom-form-data");
    }
  } else if (await newFormButton.count()) {
    await newFormButton.click();
    await page.waitForTimeout(400);
    const nameInput = page.getByLabel(/name/i).first();
    if (await nameInput.count()) await nameInput.fill("Dietary Preferences");
    const createFormButton = page.getByRole("button", { name: /Create form/i });
    if (await createFormButton.count()) {
      await createFormButton.click();
      await page.waitForURL(/\/forms\//, { timeout: 10000 });
      await shot(page, "custom-form-builder");

      const dataTab = page.getByRole("link", { name: /^Data$/i }).or(page.getByRole("button", { name: /^Data$/i }));
      if (await dataTab.count()) {
        await dataTab.first().click();
        await page.waitForTimeout(400);
        await shot(page, "custom-form-data");
      }
    }
  }

  // --- Guests: invites tab, responded tab, invite link ---
  await page.goto(`${BASE_URL}${eventUrl}`);
  await shot(page, "guest-dashboard", { fullPage: true });

  const respondedTab = page.getByRole("button", { name: /^Responded/i }).or(page.getByRole("link", { name: /^Responded/i }));
  if (await respondedTab.count()) {
    await respondedTab.first().click();
    await page.waitForTimeout(400);
    await shot(page, "guest-dashboard-responded");
  }

  const inviteLinkBtn = page.getByRole("button", { name: /Share invite link/i });
  if (await inviteLinkBtn.count()) {
    await inviteLinkBtn.first().click();
    await page.waitForTimeout(400);
    await shot(page, "invite-link-share");
    await page.keyboard.press("Escape");
  }

  // --- Host profile ---
  await page.goto(`${BASE_URL}/dashboard/profile`);
  await shot(page, "host-profile");

  // --- Publish the event, then screenshot the real guest-facing page ---
  await page.goto(`${BASE_URL}${eventUrl}/settings`);
  await page.waitForTimeout(800);
  const publishBtn = page.getByRole("button", { name: /^Publish$/i });
  if (await publishBtn.count()) {
    await publishBtn.click();
    await page.waitForTimeout(1200);
  }
  const previewLink = page.getByRole("link", { name: /Preview page|View public page/i });
  let guestUrl = null;
  if (await previewLink.count()) {
    guestUrl = await previewLink.first().getAttribute("href");
  }
  if (guestUrl) {
    const full = guestUrl.startsWith("http") ? guestUrl : `${BASE_URL}${guestUrl}`;
    await page.goto(full);
    await shot(page, "guest-page-desktop", { fullPage: true });

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(full);
    await shot(mobile, "guest-page-mobile", { fullPage: true });
    await mobile.close();
  } else {
    console.log("skip guest page shots: preview link not found");
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
