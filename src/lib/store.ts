import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";

export type Role = "user" | "assistant" | "system";

export type ToolCall = {
  id: string;
  name: string;
  status: "running" | "done" | "error";
  input?: string;
  output?: string;
};

export type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  tools?: ToolCall[];
  streaming?: boolean;
};

export type Session = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  archived?: boolean;
  messages: Message[];
};

export type Settings = {
  baseUrl: string;
  apiKey: string;
  model: string;
  auxModel: string;
  temperature: number;
  theme: "dark" | "light";
};

type Store = {
  sessions: Session[];
  activeId: string | null;
  openTabs: string[];
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  settings: Settings;
  // actions
  createSession: () => string;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  pinSession: (id: string) => void;
  archiveSession: (id: string) => void;
  appendMessage: (sid: string, msg: Message) => void;
  updateMessage: (sid: string, mid: string, patch: Partial<Message>) => void;
  setSettings: (patch: Partial<Settings>) => void;
  closeTab: (id: string) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
  setLeftCollapsed: (v: boolean) => void;
  setRightCollapsed: (v: boolean) => void;
};

const defaultSettings: Settings = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "Hermes-4-405B",
  auxModel: "Hermes-3-8B",
  temperature: 0.7,
  theme: "dark",
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeId: null,
      openTabs: [],
      leftCollapsed: false,
      rightCollapsed: false,
      settings: defaultSettings,
      createSession: () => {
        const s: Session = {
          id: nanoid(),
          title: "New conversation",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };
        set((st) => ({
          sessions: [s, ...st.sessions],
          activeId: s.id,
          openTabs: st.openTabs.includes(s.id) ? st.openTabs : [...st.openTabs, s.id],
        }));
        return s.id;
      },
      selectSession: (id) =>
        set((st) => ({
          activeId: id,
          openTabs: st.openTabs.includes(id) ? st.openTabs : [...st.openTabs, id],
        })),
      deleteSession: (id) =>
        set((st) => {
          const sessions = st.sessions.filter((s) => s.id !== id);
          const openTabs = st.openTabs.filter((t) => t !== id);
          return {
            sessions,
            openTabs,
            activeId: st.activeId === id ? sessions[0]?.id ?? null : st.activeId,
          };
        }),
      closeTab: (id) =>
        set((st) => {
          const openTabs = st.openTabs.filter((t) => t !== id);
          let activeId = st.activeId;
          if (activeId === id) {
            const idx = st.openTabs.indexOf(id);
            activeId = openTabs[idx] ?? openTabs[idx - 1] ?? openTabs[0] ?? null;
          }
          return { openTabs, activeId };
        }),
      toggleLeft: () => set((st) => ({ leftCollapsed: !st.leftCollapsed })),
      toggleRight: () => set((st) => ({ rightCollapsed: !st.rightCollapsed })),
      setLeftCollapsed: (v) => set({ leftCollapsed: v }),
      setRightCollapsed: (v) => set({ rightCollapsed: v }),
      renameSession: (id, title) =>
        set((st) => ({
          sessions: st.sessions.map((s) => (s.id === id ? { ...s, title } : s)),
        })),
      pinSession: (id) =>
        set((st) => ({
          sessions: st.sessions.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)),
        })),
      archiveSession: (id) =>
        set((st) => ({
          sessions: st.sessions.map((s) => (s.id === id ? { ...s, archived: !s.archived } : s)),
        })),
      appendMessage: (sid, msg) =>
        set((st) => ({
          sessions: st.sessions.map((s) =>
            s.id === sid
              ? {
                  ...s,
                  messages: [...s.messages, msg],
                  updatedAt: Date.now(),
                  title:
                    s.messages.length === 0 && msg.role === "user"
                      ? msg.content.slice(0, 48)
                      : s.title,
                }
              : s
          ),
        })),
      updateMessage: (sid, mid, patch) =>
        set((st) => ({
          sessions: st.sessions.map((s) =>
            s.id === sid
              ? {
                  ...s,
                  messages: s.messages.map((m) => (m.id === mid ? { ...m, ...patch } : m)),
                }
              : s
          ),
        })),
      setSettings: (patch) => set((st) => ({ settings: { ...st.settings, ...patch } })),
    }),
    { name: "hermes-webui" }
  )
);

export const newId = () => nanoid();
