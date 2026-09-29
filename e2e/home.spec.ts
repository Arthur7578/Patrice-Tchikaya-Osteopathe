import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("page d'accueil", () => {
  test("un seul <h1>, canonique absolue, pas de script tiers au chargement", async ({ page }) => {
    const thirdParty: string[] = [];
    page.on("request", (r) => {
      const host = new URL(r.url()).hostname;
      if (host !== "localhost" && /google-analytics|googletagmanager|facebook|cal\.(eu|com)|maps\.google/.test(host)) {
        thirdParty.push(r.url());
      }
    });
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\//);
    await page.waitForLoadState("networkidle");
    expect(thirdParty, "règle 5 : aucun script tiers avant intention").toEqual([]);
  });

  test("les CTA de rendez-vous sont de vrais liens <a href>", async ({ page }) => {
    await page.goto("/");
    const links = page.locator('a[href^="https://"]').filter({ hasText: /rendez-vous|RDV/i });
    expect(await links.count()).toBeGreaterThanOrEqual(1);
    await expect(links.first()).toHaveAttribute("href", /^https:\/\/.+/);
  });

  test("le contenu est visible sans JavaScript", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("#faq")).toBeVisible();
    await ctx.close();
  });

  test("accessibilité (axe, WCAG A/AA)", async ({ page }) => {
    await page.goto("/");
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
  });
});

test.describe("menu mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "projet mobile uniquement");

  test("s'ouvre, se ferme avec Échap et rend le focus au bouton", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: /menu/i });
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toBeFocused();
  });
});

test.describe("routes techniques", () => {
  for (const path of ["/robots.txt", "/sitemap.xml", "/manifest.webmanifest"]) {
    test(`GET ${path} → 200`, async ({ request }) => {
      expect((await request.get(path)).status()).toBe(200);
    });
  }

  test("slug inconnu → 404", async ({ request }) => {
    expect((await request.get("/page-qui-n-existe-pas")).status()).toBe(404);
  });

  test("/api/revalidate refuse sans secret", async ({ request }) => {
    expect((await request.get("/api/revalidate")).status()).toBe(401);
  });
});
