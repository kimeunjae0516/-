import { AnalysisRecord, PersonProfile } from "@/types/analysis";
import { IStorage } from "./IStorage";

const DB_NAME = "talkthermo-v3";
const STORE_RECORDS = "records";
const STORE_PEOPLE = "people";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        db.createObjectStore(STORE_RECORDS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_PEOPLE)) {
        db.createObjectStore(STORE_PEOPLE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => {
      const values = req.result as Array<T & { createdAt?: number }>;
      resolve(values.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)));
    };
    req.onerror = () => reject(req.error);
  });
}

async function put<T>(storeName: string, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export class IndexedDbStorage implements IStorage {
  async getRecords(): Promise<AnalysisRecord[]> {
    return getAll<AnalysisRecord>(STORE_RECORDS);
  }
  async saveRecord(record: AnalysisRecord): Promise<void> {
    await put(STORE_RECORDS, record);
  }
  async getPeople(): Promise<PersonProfile[]> {
    return getAll<PersonProfile>(STORE_PEOPLE);
  }
  async savePerson(profile: PersonProfile): Promise<void> {
    await put(STORE_PEOPLE, profile);
  }
}
