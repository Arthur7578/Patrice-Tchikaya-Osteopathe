import { describe, expect, it, vi } from "vitest";

const Client = vi.fn();
vi.mock("@notionhq/client", () => ({ Client }));

const { createNotionClient, NOTION_API_VERSION } = await import("./client");

describe("createNotionClient", () => {
  it("version d'API épinglée (data sources, SDK v5) et délai de 15 s", () => {
    createNotionClient("secret_abc");
    expect(NOTION_API_VERSION).toBe("2025-09-03");
    expect(Client).toHaveBeenCalledWith({ auth: "secret_abc", notionVersion: "2025-09-03", timeoutMs: 15_000 });
  });
});
