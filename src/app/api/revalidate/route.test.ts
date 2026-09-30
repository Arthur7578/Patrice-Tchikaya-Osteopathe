import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath }));

const { GET, POST } = await import("./route");

const req = (url: string, init?: ConstructorParameters<typeof NextRequest>[1]) => new NextRequest(`https://exemple.test${url}`, init);

describe("/api/revalidate", () => {
  beforeEach(() => {
    revalidatePath.mockClear();
    vi.stubEnv("REVALIDATE_SECRET", "s3cret");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("refuse (401) sans secret", async () => {
    const res = await GET(req("/api/revalidate"));
    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("refuse (401) avec un mauvais secret", async () => {
    const res = await GET(req("/api/revalidate?secret=faux"));
    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("refuse (401) si REVALIDATE_SECRET n'est pas configuré, même sans secret fourni", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    const res = await GET(req("/api/revalidate"));
    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("refuse (401) un secret vide quand REVALIDATE_SECRET est vide (« ?secret= » ne doit pas passer)", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    const res = await GET(req("/api/revalidate?secret="));
    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("revalide tout le site avec le bon secret en query", async () => {
    const res = await GET(req("/api/revalidate?secret=s3cret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ revalidated: true });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("accepte le secret via l'en-tête x-revalidate-secret (POST)", async () => {
    const res = await POST(req("/api/revalidate", { method: "POST", headers: { "x-revalidate-secret": "s3cret" } }));
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });
});
