import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const put = vi.fn();
vi.mock("@vercel/blob", () => ({ put }));

const { POST } = await import("./route");

function request(fields: Record<string, string | File>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return new Request("https://exemple.test/api/admin/upload", { method: "POST", body: form });
}
const image = (type = "image/png", bytes = 10) => new File([new Uint8Array(bytes)], "photo.png", { type });

describe("/api/admin/upload", () => {
  beforeEach(() => {
    put.mockReset();
    put.mockResolvedValue({ url: "https://blob.test/photo-abc.png" });
    vi.stubEnv("ADMIN_UPLOAD_SECRET", "cle");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("refuse (401) sans clé ou avec une mauvaise clé, sans rien envoyer à Blob", async () => {
    expect((await POST(request({ file: image() }))).status).toBe(401);
    expect((await POST(request({ key: "faux", file: image() }))).status).toBe(401);
    expect(put).not.toHaveBeenCalled();
  });

  it("refuse (401) si ADMIN_UPLOAD_SECRET n'est pas configuré", async () => {
    vi.stubEnv("ADMIN_UPLOAD_SECRET", "");
    expect((await POST(request({ key: "", file: image() }))).status).toBe(401);
    expect(put).not.toHaveBeenCalled();
  });

  it("refuse (400) l'absence de fichier ou un fichier vide", async () => {
    expect((await POST(request({ key: "cle" }))).status).toBe(400);
    expect((await POST(request({ key: "cle", file: image("image/png", 0) }))).status).toBe(400);
  });

  it("refuse (400) un type non autorisé (ex. SVG, HTML)", async () => {
    const res = await POST(request({ key: "cle", file: image("image/svg+xml") }));
    expect(res.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it("refuse (400) un fichier de plus de 8 Mo", async () => {
    const res = await POST(request({ key: "cle", file: image("image/png", 8 * 1024 * 1024 + 1) }));
    expect(res.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it("envoie le fichier à Blob (public, suffixe aléatoire) et redirige (303) avec l'URL", async () => {
    const res = await POST(request({ key: "cle", file: image("image/webp") }));
    expect(put).toHaveBeenCalledWith("photo.png", expect.any(File), {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/webp",
    });
    expect(res.status).toBe(303);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/admin/photos");
    expect(location.searchParams.get("uploaded")).toBe("https://blob.test/photo-abc.png");
  });
});
