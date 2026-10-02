import { describe, expect, it } from "vitest";
import { FALLBACK_CONTENT as C } from "@/lib/content/fallback";
import { googleMapsDirectionsUrl, googleMapsSearchUrl } from "./maps";

describe("liens Google Maps", () => {
  it("l'itinéraire cible l'adresse complète, encodée", () => {
    const url = new URL(googleMapsDirectionsUrl(C));
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/dir/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("destination")).toBe(
      `${C.contact.street}, ${C.contact.postalCode} ${C.contact.locality}, ${C.contact.countryName}`,
    );
  });

  it("la recherche contient le praticien, « ostéopathe » et l'adresse", () => {
    const query = new URL(googleMapsSearchUrl(C)).searchParams.get("query")!;
    expect(query).toContain(C.practitioner.name);
    expect(query).toContain("ostéopathe");
    expect(query).toContain(C.contact.locality);
  });

  it("n'utilise aucune clé d'API", () => {
    expect(googleMapsSearchUrl(C)).not.toMatch(/key=/);
    expect(googleMapsDirectionsUrl(C)).not.toMatch(/key=/);
  });
});
