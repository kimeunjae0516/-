import { IStorage } from "./IStorage";
import { IndexedDbStorage } from "./indexeddb-storage";
import { LocalStorageStorage } from "./localstorage-storage";

let singleton: IStorage | null = null;

export function getStorage(): IStorage {
  if (singleton) return singleton;
  if (typeof window !== "undefined" && "indexedDB" in window) {
    singleton = new IndexedDbStorage();
  } else {
    singleton = new LocalStorageStorage();
  }
  return singleton;
}
