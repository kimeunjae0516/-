"use client";

import { create } from "zustand";
import { AnalysisRecord, PersonProfile } from "@/types/analysis";
import { storage } from "@/lib/storage";

interface AppState {
  saveEnabled: boolean;
  records: AnalysisRecord[];
  people: PersonProfile[];
  toggleSave: (enabled: boolean) => void;
  load: () => void;
  addRecord: (record: AnalysisRecord) => void;
  addPerson: (nickname: string) => PersonProfile;
}

export const useAppStore = create<AppState>((set) => ({
  saveEnabled: false,
  records: [],
  people: [],
  toggleSave: (enabled) => set({ saveEnabled: enabled }),
  load: () => set({ records: storage.getRecords(), people: storage.getPeople() }),
  addRecord: (record) => {
    storage.saveRecord(record);
    set((state) => ({ records: [record, ...state.records] }));
  },
  addPerson: (nickname) => {
    const person = storage.savePerson(nickname);
    set((state) => ({ people: [person, ...state.people] }));
    return person;
  }
}));
