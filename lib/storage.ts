import { AnalysisRecord, PersonProfile } from "@/types/analysis";

export interface IStorage {
  getRecords(): AnalysisRecord[];
  saveRecord(record: AnalysisRecord): void;
  getPeople(): PersonProfile[];
  savePerson(nickname: string): PersonProfile;
}

const RECORD_KEY = "talkthermo.records";
const PEOPLE_KEY = "talkthermo.people";

const parse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export class LocalStorageAdapter implements IStorage {
  getRecords(): AnalysisRecord[] {
    if (typeof window === "undefined") return [];
    return parse(localStorage.getItem(RECORD_KEY), []);
  }

  saveRecord(record: AnalysisRecord) {
    if (typeof window === "undefined") return;
    const records = this.getRecords();
    localStorage.setItem(RECORD_KEY, JSON.stringify([record, ...records]));
  }

  getPeople(): PersonProfile[] {
    if (typeof window === "undefined") return [];
    return parse(localStorage.getItem(PEOPLE_KEY), []);
  }

  savePerson(nickname: string): PersonProfile {
    const item = { id: crypto.randomUUID(), nickname, createdAt: Date.now() };
    if (typeof window !== "undefined") {
      const people = this.getPeople();
      localStorage.setItem(PEOPLE_KEY, JSON.stringify([item, ...people]));
    }
    return item;
  }
}

export const storage: IStorage = new LocalStorageAdapter();
