import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LocalStorageAdapter } from "./local-storage";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true })));
});

describe("LocalStorageAdapter", () => {
  it("round-trips files inside its configured root", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "resume-storage-"));
    roots.push(root);
    const storage = new LocalStorageAdapter(root);

    await storage.put("user/project/resume.txt", new TextEncoder().encode("简历"), "text/plain");

    expect(new TextDecoder().decode(await storage.get("user/project/resume.txt"))).toBe("简历");
  });

  it("rejects path traversal", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "resume-storage-"));
    roots.push(root);
    const storage = new LocalStorageAdapter(root);

    await expect(
      storage.put("../outside.txt", new Uint8Array([1]), "text/plain"),
    ).rejects.toThrow("INVALID_STORAGE_KEY");
  });
});
