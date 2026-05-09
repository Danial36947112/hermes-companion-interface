import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hermes/AppShell";
import { Sparkles, Plus, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { fetchSkills, toggleSkill, type SkillEntry } from "@/lib/hermes-api";
import { cn } from "@/lib/utils";

const MOCK_SKILLS: (SkillEntry & { version?: string })[] = [
  { name: "web_search", desc: "Search the web in real time", on: true, version: "1.4.0", origin: "built-in" },
  { name: "code_exec", desc: "Run Python in an isolated sandbox", on: true, version: "2.1.0", origin: "built-in" },
  { name: "file_io", desc: "Read & write workspace files", on: true, version: "1.0.2", origin: "built-in" },
  { name: "memory_recall", desc: "Long-term semantic memory", on: false, version: "0.9.1", origin: "learned" },
  { name: "vision", desc: "Analyze images & screenshots", on: false, version: "0.6.0", origin: "built-in" },
  { name: "shell", desc: "Execute shell commands", on: false, version: "1.2.0", origin: "custom" },
];

export const Route = createFileRoute("/skills")({
  head: () => ({ meta: [{ title: "Skills — Hermes" }] }),
  component: SkillsPage,
});

function SkillsPage() {
  const baseUrl = useStore((s) => s.settings.baseUrl);
  const [skills, setSkills] = useState(MOCK_SKILLS);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchSkills(baseUrl).then((res) => {
      if (cancelled || !res) return;
      setSkills(res.map((s) => ({ ...s, origin: s.origin ?? "built-in" })));
    });
    return () => { cancelled = true; };
  }, [baseUrl]);

  const filtered = useMemo(
    () => skills.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.desc.toLowerCase().includes(q.toLowerCase())),
    [skills, q]
  );

  return (
    <AppShell>
      <div className="scrollbar-thin h-full w-full overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Skills Library</h1>
              <p className="mt-1 text-sm text-muted-foreground">Compose Hermes' capabilities. Toggle, create, version.</p>
            </div>
            <Button className="bg-white/[0.08] hover:bg-white/[0.14] border border-white/10">
              <Plus className="mr-2 h-4 w-4" /> New skill
            </Button>
          </div>

          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search skills…"
              className="h-10 border-white/[0.06] bg-white/[0.03] pl-10" />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {filtered.map((s, i) => (
              <div key={s.name} className="glass-soft group rounded-2xl p-5 transition hover:border-white/[0.14]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.10] bg-white/[0.04] text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-mono text-sm font-medium">{s.name}</div>
                      <OriginBadge origin={s.origin ?? "built-in"} />
                    </div>
                  </div>
                  <Switch
                    checked={s.on}
                    onCheckedChange={(v) => {
                      setSkills((cur) => cur.map((x) => x.name === s.name ? { ...x, on: v } : x));
                      toggleSkill(baseUrl, s.name);
                    }}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No skills match "{q}".</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function OriginBadge({ origin }: { origin: "built-in" | "learned" | "custom" }) {
  const cls = cn(
    "inline-block rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider",
    origin === "built-in" && "bg-white/[0.06] text-muted-foreground",
    origin === "learned" && "bg-primary/15 text-primary",
    origin === "custom" && "bg-white/[0.10] text-foreground"
  );
  return <span className={cls}>{origin}</span>;
}
