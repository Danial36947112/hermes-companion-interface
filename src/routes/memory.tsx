import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hermes/AppShell";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Brain, Save, RotateCcw } from "lucide-react";
import { fetchMemory, saveMemory, fetchUserProfile, saveUserProfile } from "@/lib/hermes-api";
import { toast } from "sonner";

export const Route = createFileRoute("/memory")({
  head: () => ({ meta: [{ title: "Memory — Hermes" }] }),
  component: MemoryPage,
});

const DEFAULT_MEMORY = `# Hermes
I am a persistent, self-improving agent.
My values: honesty, rigor, curiosity, kindness.`;

const DEFAULT_USER = `# User profile
Preferences and context Hermes should remember about you.`;

function MemoryPage() {
  const baseUrl = useStore((s) => s.settings.baseUrl);
  const [memory, setMemory] = useState(DEFAULT_MEMORY);
  const [userText, setUserText] = useState(DEFAULT_USER);
  const [memDirty, setMemDirty] = useState(false);
  const [userDirty, setUserDirty] = useState(false);
  const [savedMem, setSavedMem] = useState(DEFAULT_MEMORY);
  const [savedUser, setSavedUser] = useState(DEFAULT_USER);

  useEffect(() => {
    let cancelled = false;
    fetchMemory(baseUrl).then((res) => {
      if (cancelled || !res) return;
      setMemory(res); setSavedMem(res); setMemDirty(false);
    });
    fetchUserProfile(baseUrl).then((res) => {
      if (cancelled || !res) return;
      setUserText(res); setSavedUser(res); setUserDirty(false);
    });
    return () => { cancelled = true; };
  }, [baseUrl]);

  return (
    <AppShell>
      <div className="flex h-full w-full flex-col">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-8">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Memory</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Long-form notes Hermes carries between sessions.</p>

          <Tabs defaultValue="memory" className="mt-6 flex flex-1 flex-col">
            <TabsList className="glass-soft w-fit">
              <TabsTrigger value="memory">MEMORY.md</TabsTrigger>
              <TabsTrigger value="user">User profile</TabsTrigger>
            </TabsList>

            <TabsContent value="memory" className="mt-4 flex-1">
              <textarea
                value={memory}
                onChange={(e) => { setMemory(e.target.value); setMemDirty(true); }}
                className="scrollbar-thin glass-soft block h-[55vh] w-full resize-none rounded-2xl p-4 font-mono text-sm leading-relaxed outline-none focus:border-white/[0.14]"
              />
              <Footer
                dirty={memDirty}
                onSave={async () => { const ok = await saveMemory(baseUrl, memory); setSavedMem(memory); setMemDirty(false); toast[ok ? "success" : "message"](ok ? "Memory saved" : "Saved locally"); }}
                onDiscard={() => { setMemory(savedMem); setMemDirty(false); }}
              />
            </TabsContent>

            <TabsContent value="user" className="mt-4 flex-1">
              <textarea
                value={userText}
                onChange={(e) => { setUserText(e.target.value); setUserDirty(true); }}
                className="scrollbar-thin glass-soft block h-[55vh] w-full resize-none rounded-2xl p-4 font-mono text-sm leading-relaxed outline-none focus:border-white/[0.14]"
              />
              <Footer
                dirty={userDirty}
                onSave={async () => { const ok = await saveUserProfile(baseUrl, userText); setSavedUser(userText); setUserDirty(false); toast[ok ? "success" : "message"](ok ? "Profile saved" : "Saved locally"); }}
                onDiscard={() => { setUserText(savedUser); setUserDirty(false); }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}

function Footer({ dirty, onSave, onDiscard }: { dirty: boolean; onSave: () => void; onDiscard: () => void }) {
  return (
    <div className="glass mt-3 flex items-center justify-between rounded-xl px-4 py-2">
      <span className="text-xs text-muted-foreground">{dirty ? "Unsaved changes" : "All changes saved"}</span>
      <div className="flex gap-2">
        <Button variant="ghost" disabled={!dirty} onClick={onDiscard}
          className="border border-white/[0.06] hover:bg-white/[0.04]">
          <RotateCcw className="mr-2 h-3.5 w-3.5" /> Discard
        </Button>
        <Button disabled={!dirty} onClick={onSave}
          className="bg-white/[0.08] hover:bg-white/[0.14] border border-white/10">
          <Save className="mr-2 h-3.5 w-3.5" /> Save
        </Button>
      </div>
    </div>
  );
}
