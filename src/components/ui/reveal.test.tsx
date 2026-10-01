// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { domAnimation } from "motion/react";
import { afterEach, describe, expect, it } from "vitest";
import { loadFeatures, Reveal } from "./reveal";

describe("Reveal", () => {
  afterEach(cleanup);

  it("rend le contenu dans un conteneur data-reveal (visible sans JS grâce au <noscript> du layout)", () => {
    render(
      <Reveal className="ma-classe">
        <p>Contenu</p>
      </Reveal>,
    );
    const child = screen.getByText("Contenu");
    expect(child.parentElement).toHaveAttribute("data-reveal");
    expect(child.parentElement).toHaveClass("ma-classe");
  });

  it("charge à la demande les fonctionnalités d'animation de Motion (sans elles, rien ne s'anime)", async () => {
    await expect(loadFeatures()).resolves.toBe(domAnimation);
  });
});
