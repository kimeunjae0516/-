import { AnalysisRecord, PersonProfile } from "@/types/analysis";

export interface IStorage {
  getRecords(): Promise<AnalysisRecord[]>;
  saveRecord(record: AnalysisRecord): Promise<void>;
  getPeople(): Promise<PersonProfile[]>;
  savePerson(profile: PersonProfile): Promise<void>;
}
