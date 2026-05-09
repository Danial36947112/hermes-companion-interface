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
  approval?: "once" | "session" | "always" | "deny";
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

export type Wallpaper = { type: "none" | "gradient" | "image"; value: string };

export type Settings = {
  baseUrl: string;
  apiKey: string;
  model: string;
  auxModel: string;
  temperature: number;
  theme: "dark" | "light";
  wallpaper: Wallpaper;
};

type Store = {
  sessions: Session[];
  activeId: string | null;
  openTabs: string[];
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  settings: Settings;
  // actions
  createSession: (seed?: Partial<Session>) => string;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  pinSession: (id: string) => void;
  archiveSession: (id: string) => void;
  appendMessage: (sid: string, msg: Message) => void;
  updateMessage: (sid: string, mid: string, patch: Partial<Message>) => void;
  removeMessage: (sid: string, mid: string) => void;
  truncateAfter: (sid: string, mid: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  closeTab: (id: string) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
  setLeftCollapsed: (v: boolean) => void;
  setRightCollapsed: (v: boolean) => void;
  clearAllSessions: () => void;
  resetSettings: () => void;
};

export const DEFAULT_WALLPAPER: Wallpaper = {
  type: "gradient",
  value:
    "radial-gradient(1000px 600px at 15% -10%, oklch(0.40 0.06 215 / 0.18), transparent 60%), radial-gradient(900px 500px at 100% 110%, oklch(0.35 0.05 210 / 0.10), transparent 60%), oklch(0.14 0.005 240)",
};

export const WALLPAPER_PRESETS: { name: string; value: string }[] = [
  { name: "Default", value: DEFAULT_WALLPAPER.value },
  {
    name: "Aurora",
    value:
      "radial-gradient(900px 600px at 10% 0%, oklch(0.55 0.16 160 / 0.25), transparent 60%), radial-gradient(800px 500px at 90% 100%, oklch(0.50 0.18 200 / 0.20), transparent 60%), oklch(0.12 0.01 200)",
  },
  {
    name: "Nebula",
    value:
      "radial-gradient(1100px 700px at 20% 20%, oklch(0.45 0.18 260 / 0.30), transparent 60%), radial-gradient(800px 500px at 100% 80%, oklch(0.50 0.20 320 / 0.18), transparent 60%), oklch(0.10 0.02 270)",
  },
  {
    name: "Dusk",
    value:
      "radial-gradient(900px 600px at 80% 0%, oklch(0.65 0.18 50 / 0.22), transparent 60%), radial-gradient(800px 500px at 0% 100%, oklch(0.45 0.14 30 / 0.18), transparent 60%), oklch(0.13 0.02 40)",
  },
  {
    name: "Deep Space",
    value:
      "radial-gradient(1000px 600px at 50% 10%, oklch(0.30 0.08 240 / 0.30), transparent 60%), radial-gradient(700px 500px at 90% 100%, oklch(0.25 0.10 280 / 0.18), transparent 60%), oklch(0.08 0.01 240)",
  },
  {
    name: "Mono",
    value:
      "radial-gradient(900px 600px at 10% 0%, oklch(0.30 0 0 / 0.30), transparent 60%), oklch(0.10 0 0)",
  },
];

const defaultSettings: Settings = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "Hermes-4-405B",
  auxModel: "Hermes-3-8B",
  temperature: 0.7,
  theme: "dark",
  wallpaper: DEFAULT_WALLPAPER,
};

export const useStore = create<Store>()(
  persist(
    (set) => ({
      sessions: [],
      activeId: null,
      openTabs: [],
      leftCollapsed: false,
      rightCollapsed: false,
      settings: defaultSettings,
      createSession: (seed) => {
        const s: Session = {
          id: nanoid(),
          title: "New conversation",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          ...seed,
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
                    (s.messages.length === 0 || s.title === "New conversation") &&
                    msg.role === "user"
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
      removeMessage: (sid, mid) =>
        set((st) => ({
          sessions: st.sessions.map((s) =>
            s.id === sid
              ? { ...s, messages: s.messages.filter((m) => m.id !== mid) }
              : s
          ),
        })),
      truncateAfter: (sid, mid) =>
        set((st) => ({
          sessions: st.sessions.map((s) => {
            if (s.id !== sid) return s;
            const idx = s.messages.findIndex((m) => m.id === mid);
            if (idx < 0) return s;
            return { ...s, messages: s.messages.slice(0, idx + 1) };
          }),
        })),
      setSettings: (patch) => set((st) => ({ settings: { ...st.settings, ...patch } })),
      clearAllSessions: () => set({ sessions: [], openTabs: [], activeId: null }),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    { name: "hermes-webui" }
  )
);

export const newId = () => nanoid();
