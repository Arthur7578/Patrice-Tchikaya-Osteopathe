import { expect, test } from "@playwright/test";
import { sitemapPaths } from "./helpers";

/**
 * Langues du site (build avec TRANSLATION_MODE=identity : textes de Notion en français sous chaque langue, textes
 * d'interface traduits). Vérifie le routage par langue, les hreflang, le sélecteur et la redirection d'entrée.
 */
const CHROME_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

test.describe("langues", () => {
  // Build sans TRANSLATION_MODE=identity (ni clé API) : français seul, rien à vérifier ici (voir CLAUDE.md).
  test.beforeEach(async ({ request }) => {
    test.skip(!(await sitemapPaths(request)).includes("/en"), "langues non publiées : build avec TRANSLATION_MODE=identity");
  });

  test("chaque langue : <html lang>, hreflang vers toutes les versions + x-default, canonical propre", async ({ page }) => {
    for (const [path, lang] of [["/", "fr-LU"], ["/de", "de"], ["/en", "en"], ["/lb", "lb"], ["/pt", "pt-PT"]] as const) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) =>
        links.map((l) => `${l.getAttribute("hreflang")} ${new URL(l.getAttribute("href")!).pathname}`),
      );
      expect(alternates.sort(), path).toEqual(["de /de", "en /en", "fr /", "lb /lb", "pt /pt", "x-default /"]);
    }
  });

  test("sitemap : chaque page dans les 5 langues", async ({ request }) => {
    const paths = await sitemapPaths(request);
    for (const path of ["/paiement", "/articles", "/mentions-legales", "/confidentialite"]) {
      expect(paths).toEqual(expect.arrayContaining([path, `/de${path}`, `/en${path}`, `/lb${path}`, `/pt${path}`]));
    }
  });

  test("/fr/… redirige vers l'adresse sans préfixe (une seule URL par page)", async ({ request }) => {
    const res = await request.get("/fr/paiement", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers().location).toBe("/paiement");
  });

  test("pages juridiques traduites : mention « la version française fait foi », lien depuis le pied de page", async ({ page }) => {
    await page.goto("/de");
    await page.locator('footer a[href="/de/mentions-legales"]').click();
    // Attendre la navigation : sinon le <h1> lu peut encore être celui de l'accueil.
    await expect(page).toHaveURL(/\/de\/mentions-legales$/);
    await expect(page.locator("h1")).toHaveText("Impressum");
    await expect(page.locator("main")).toContainText("französischen Fassung");
  });


  test("sélecteur de langue : mène à la même page dans l'autre langue, et ce choix est retenu", async ({ page, isMobile }) => {
    test.skip(isMobile, "même composant sur mobile");
    await page.goto("/paiement");
    await page.locator("header summary").filter({ hasText: /fr/i }).click();
    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/paiement$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    // Retour au français par le sélecteur : retenu (cookie), plus de redirection selon le navigateur.
    await page.locator("header summary").filter({ hasText: /en/i }).click();
    await page.getByRole("link", { name: "Français" }).click();
    await expect(page).toHaveURL(/\/paiement$/);
    expect((await page.context().cookies()).find((c) => c.name === "locale")?.value).toBe("fr");
  });

  test("mobile : le sélecteur est dans le menu (l'en-tête est trop étroit)", async ({ page, isMobile }) => {
    test.skip(!isMobile, "menu mobile");
    await page.goto("/paiement");
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await page.getByRole("list", { name: "Langue du site" }).getByRole("link", { name: "Português" }).click();
    await expect(page).toHaveURL(/\/pt\/paiement$/);
  });

  test("entrée sur le site avec un navigateur en portugais : redirigé vers /pt (pas les robots)", async ({ browser, baseURL }) => {
    const visitor = await browser.newContext({ baseURL, locale: "pt-PT", userAgent: CHROME_UA });
    const page = await visitor.newPage();
    await page.goto("/paiement");
    await expect(page).toHaveURL(/\/pt\/paiement$/);
    await visitor.close();

    const robot = await browser.newContext({ baseURL, locale: "pt-PT", userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)" });
    const res = await (await robot.newPage()).goto("/paiement");
    expect(res?.url()).toMatch(/\/paiement$/);
    expect(res?.url()).not.toMatch(/\/pt\//);
    await robot.close();
  });
});
