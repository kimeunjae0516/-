"use client";

import { create } from "zustand";
import { AnalysisRecord, PersonProfile } from "@/types/analysis";
import { getStorage } from "@/lib/storage";

interface AppState {
  saveEnabled: boolean;
  records: AnalysisRecord[];
  people: PersonProfile[];
  setSaveEnabled: (enabled: boolean) => void;
  load: () => Promise<void>;
  addRecord: (record: AnalysisRecord) => Promise<void>;
  addPerson: (nickname: string) => Promise<PersonProfile>;
  setSelectedSuggestionStyle: (recordId: string, style: "soft" | "clear" | "short") => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  saveEnabled: false,
  records: [],
  people: [],
  setSaveEnabled: (enabled) => set({ saveEnabled: enabled }),
  load: async () => {
    const storage = getStorage();
    const [records, people] = await Promise.all([storage.getRecords(), storage.getPeople()]);
    set({ records, people });
  },
  addRecord: async (record) => {
    const storage = getStorage();
    await storage.saveRecord(record);
    set((state) => ({ records: [record, ...state.records] }));
  },
  addPerson: async (nickname) => {
    const profile: PersonProfile = { id: crypto.randomUUID(), nickname, createdAt: Date.now() };
    const storage = getStorage();
    await storage.savePerson(profile);
    set((state) => ({ people: [profile, ...state.people] }));
    return profile;
  },
  setSelectedSuggestionStyle: async (recordId, style) => {
    const storage = getStorage();
    const updated = get().records.map((r) => (r.id === recordId ? { ...r, selectedSuggestionStyle: style } : r));
    const changed = updated.find((r) => r.id === recordId);
    if (changed) await storage.saveRecord(changed);
    set({ records: updated });
  }
}));
