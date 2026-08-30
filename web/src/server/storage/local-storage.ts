import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageAdapter } from "./storage";

export class LocalStorageAdapter implements StorageAdapter {
  private readonly root: string;

  constructor(rootPath: string) {
    this.root = path.resolve(rootPath);
  }

  private resolveKey(key: string): string {
    if (!key || key.includes("\0") || path.isAbsolute(key)) {
      throw new Error("INVALID_STORAGE_KEY");
    }
    const resolved = path.resolve(this.root, key);
    if (resolved !== this.root && !resolved.startsWith(`${this.root}${path.sep}`)) {
      throw new Error("INVALID_STORAGE_KEY");
    }
    return resolved;
  }

  async put(
    key: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<void> {
    void contentType;
    const target = this.resolveKey(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }

  async get(key: string): Promise<Uint8Array> {
    return new Uint8Array(await readFile(this.resolveKey(key)));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveKey(key), { force: true });
  }
}
