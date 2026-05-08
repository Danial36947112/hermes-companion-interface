import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hermes/AppShell";
import { Sparkles, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const SKILLS = [
  { name: "web_search", desc: "Search the web in real time", on: true, version: "1.4.0" },
  { name: "code_exec", desc: "Run Python in an isolated sandbox", on: true, version: "2.1.0" },
  { name: "file_io", desc: "Read & write workspace files", on: true, version: "1.0.2" },
  { name: "memory_recall", desc: "Long-term semantic memory", on: false, version: "0.9.1" },
  { name: "vision", desc: "Analyze images & screenshots", on: false, version: "0.6.0" },
  { name: "shell", desc: "Execute shell commands", on: false, version: "1.2.0" },
];

export const Route = createFileRoute("/skills")({
  head: () => ({ meta: [{ title: "Skills — Hermes" }] }),
  component: SkillsPage,
});

function SkillsPage() {
  return (
    <AppShell>
      <div className="scrollbar-thin h-full w-full overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Skills Library</h1>
              <p className="mt-1 text-sm text-muted-foreground">Compose Hermes' capabilities. Toggle, create, version.</p>
            </div>
            <Button className="bg-white/[0.08] hover:bg-white/[0.14] border border-white/10"><Plus className="mr-2 h-4 w-4" /> New skill</Button>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {SKILLS.map((s) => (
              <div key={s.name} className="group rounded-2xl border border-border/60 bg-surface/40 p-5 transition hover:border-primary/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-neon/20 text-neon">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-mono text-sm font-medium">{s.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">v{s.version}</div>
                    </div>
                  </div>
                  <Switch defaultChecked={s.on} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
