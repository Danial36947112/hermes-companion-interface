import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hermes/AppShell";
import { Input } from "@/components/ui/input";
import { Search, Brain } from "lucide-react";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/memory")({
  head: () => ({ meta: [{ title: "Memory — Hermes" }] }),
  component: MemoryPage,
});

function MemoryPage() {
  const sessions = useStore((s) => s.sessions);
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    if (!q) return [];
    const lc = q.toLowerCase();
    const out: { sid: string; title: string; snippet: string }[] = [];
    for (const s of sessions) {
      for (const m of s.messages) {
        if (m.content.toLowerCase().includes(lc)) {
          out.push({ sid: s.id, title: s.title, snippet: m.content.slice(0, 200) });
        }
      }
    }
    return out.slice(0, 50);
  }, [sessions, q]);

  return (
    <AppShell>
      <div className="scrollbar-thin h-full w-full overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-neon" />
            <h1 className="text-2xl font-semibold tracking-tight">Memory Explorer</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Search across all conversations & long-term memories.</p>
          <div className="relative mt-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search memories…" className="h-11 pl-10 text-base" />
          </div>
          <div className="mt-6 space-y-2">
            {!q && <p className="py-12 text-center text-sm text-muted-foreground">Type to search across {sessions.length} sessions.</p>}
            {q && results.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No matches.</p>}
            {results.map((r, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-surface/40 p-4">
                <div className="text-xs font-medium text-neon">{r.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{r.snippet}…</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
