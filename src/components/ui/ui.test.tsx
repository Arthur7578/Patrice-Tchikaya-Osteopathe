import { describe, expect, it } from "vitest";
import { JsonLd } from "@/components/seo/json-ld";
import { render } from "@/test/render";
import { ImagePlaceholder } from "./image-placeholder";
import { Button, buttonVariants } from "./button";
import { StarRating } from "./star-rating";

describe("StarRating", () => {
  const stars = (value: number) =>
    render(<StarRating value={value} />)
      .querySelectorAll("svg")
      .map((svg) => (svg.getAttribute("class")?.includes("fill-amber-400") ? "★" : "☆"))
      .join("");

  it("5 étoiles, arrondies à l'entier le plus proche", () => {
    expect(stars(5)).toBe("★★★★★");
    expect(stars(4.4)).toBe("★★★★☆");
    expect(stars(4.5)).toBe("★★★★★");
    expect(stars(1)).toBe("★☆☆☆☆");
  });

  it("étoiles décoratives ; valeur exacte annoncée aux lecteurs d'écran", () => {
    const root = render(<StarRating value={4.7} />);
    expect(root.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(5);
    expect(root.querySelector(".sr-only")?.text).toBe("Note : 4,7 sur 5");
    expect(root.text).not.toContain("/5");
  });

  it("showValue : affiche « N/5 » (masqué aux lecteurs d'écran, qui ont déjà la note)", () => {
    const value = render(<StarRating value={4} showValue />).querySelector('span[aria-hidden="true"]');
    expect(value?.text).toBe("4/5");
  });
});

describe("Button", () => {
  it("bouton par défaut : variante principale, taille moyenne", () => {
    const button = render(<Button type="button">OK</Button>).querySelector("button")!;
    expect(button.getAttribute("class")).toBe(buttonVariants());
    expect(button.getAttribute("class")).toContain("bg-sage-700");
    expect(button.getAttribute("class")).toContain("h-11");
  });

  it("variantes et classes supplémentaires", () => {
    const button = render(
      <Button variant="secondary" size="lg" className="w-full">
        OK
      </Button>,
    ).querySelector("button")!;
    expect(button.getAttribute("class")).toContain("border-slate-200");
    expect(button.getAttribute("class")).toContain("h-13");
    expect(button.getAttribute("class")).toContain("w-full");
  });

  it("asChild : le style s'applique à l'enfant (ex. un vrai lien), sans <button>", () => {
    const root = render(
      <Button asChild variant="ghost">
        <a href="https://cal.eu/cabinet/consultation">Prendre rendez-vous</a>
      </Button>,
    );
    expect(root.querySelector("button")).toBeNull();
    const link = root.querySelector("a")!;
    expect(link.getAttribute("href")).toBe("https://cal.eu/cabinet/consultation");
    expect(link.getAttribute("class")).toContain("hover:bg-sage-50");
  });
});

describe("JsonLd", () => {
  it("échappe « < » : un texte de Notion ne peut pas fermer la balise <script> (anti-XSS)", () => {
    const html = render(<JsonLd data={{ "@context": "https://schema.org", "@type": "Thing", name: "</script><script>alert(1)</script>" }} />).toString();
    expect(html).not.toContain("</script><script>");
    expect(html).toContain("\\u003c/script>\\u003cscript>alert(1)\\u003c/script>");
  });
});

describe("ImagePlaceholder", () => {
  it("fond décoratif (masqué aux lecteurs d'écran) avec monogramme", () => {
    const root = render(<ImagePlaceholder />);
    expect(root.querySelector('[aria-hidden="true"]')?.text.trim()).toBe("PT");
    expect(render(<ImagePlaceholder monogram="JT" />).text.trim()).toBe("JT");
  });
});
