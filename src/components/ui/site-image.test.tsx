import { describe, expect, it } from "vitest";
import { render } from "@/test/render";
import { SiteImage } from "./site-image";

const image = { src: "https://exemple.test/photo.jpg", alt: "Portrait du praticien", width: 800, height: 600 };
const placeholder = <div data-testid="placeholder" />;

describe("SiteImage (règle 3)", () => {
  it("sans URL : rend le placeholder, jamais d'<img> cassée", () => {
    const root = render(<SiteImage image={{ ...image, src: null }} sizes="100vw" placeholder={placeholder} />);
    expect(root.querySelector('[data-testid="placeholder"]')).not.toBeNull();
    expect(root.querySelectorAll("img")).toHaveLength(0);
  });

  it("avec URL : injecte toujours l'alt Notion", () => {
    const img = render(<SiteImage image={image} sizes="100vw" placeholder={placeholder} />).querySelector("img")!;
    expect(img.getAttribute("alt")).toBe("Portrait du praticien");
    expect(img.getAttribute("width")).toBe("800");
  });

  it("preload : priorité haute pour l'image LCP uniquement", () => {
    const lcp = render(<SiteImage image={image} sizes="100vw" preload placeholder={placeholder} />).querySelector("img")!;
    const other = render(<SiteImage image={image} sizes="100vw" placeholder={placeholder} />).querySelector("img")!;
    expect(lcp.getAttribute("fetchpriority")).toBe("high");
    expect(other.getAttribute("fetchpriority")).not.toBe("high");
  });
});
