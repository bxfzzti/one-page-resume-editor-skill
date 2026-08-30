import { LocalStorageAdapter } from "./local-storage";

export interface StorageAdapter {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}

export function getStorageAdapter(): StorageAdapter {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver !== "local") throw new Error("STORAGE_DRIVER_NOT_SUPPORTED");
  return new LocalStorageAdapter(
    process.env.LOCAL_STORAGE_PATH ?? ".data/storage",
  );
}
