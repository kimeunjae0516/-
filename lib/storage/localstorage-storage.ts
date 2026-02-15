import { AnalysisRecord, PersonProfile } from "@/types/analysis";
import { IStorage } from "./IStorage";

const RECORD_KEY = "talkthermo.records.v3";
const PEOPLE_KEY = "talkthermo.people.v3";

const parse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export class LocalStorageStorage implements IStorage {
  async getRecords(): Promise<AnalysisRecord[]> {
    if (typeof window === "undefined") return [];
    return parse<AnalysisRecord[]>(localStorage.getItem(RECORD_KEY), []);
  }
  async saveRecord(record: AnalysisRecord): Promise<void> {
    if (typeof window === "undefined") return;
    const records = await this.getRecords();
    localStorage.setItem(RECORD_KEY, JSON.stringify([record, ...records]));
  }
  async getPeople(): Promise<PersonProfile[]> {
    if (typeof window === "undefined") return [];
    return parse<PersonProfile[]>(localStorage.getItem(PEOPLE_KEY), []);
  }
  async savePerson(profile: PersonProfile): Promise<void> {
    if (typeof window === "undefined") return;
    const people = await this.getPeople();
    localStorage.setItem(PEOPLE_KEY, JSON.stringify([profile, ...people]));
  }
}
