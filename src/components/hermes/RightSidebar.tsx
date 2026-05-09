import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight, FileCode, FileText, Folder, Layers, BookOpen, Wrench,
  PanelRightClose, PanelRightOpen, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import { fetchSkills, toggleSkill, fetchMemory, saveMemory, fetchFiles, type FileNode } from "@/lib/hermes-api";

type Tab = "context" | "files" | "skills" | "soul";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "context", label: "Context", icon: Layers },
  { id: "files", label: "Workspace", icon: Folder },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "soul", label: "Memory", icon: BookOpen },
];

export function RightSidebar() {
  const [tab, setTab] = useState<Tab>("context");
  const collapsed = useStore((s) => s.rightCollapsed);
  const toggle = useStore((s) => s.toggleRight);

  if (collapsed) {
    return (
      <aside className="glass relative z-20 hidden h-full w-14 shrink-0 flex-col items-center py-3 hairline-l lg:flex">
        <button onClick={toggle} title="Expand panel (⌘⇧B)"
          className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-white/5 hover:text-foreground">
          <PanelRightOpen className="h-4 w-4" />
        </button>
        <div className="my-2 h-px w-6 bg-white/[0.06]" />
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); toggle(); }} title={t.label}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-white/5 hover:text-foreground">
            <t.icon className="h-4 w-4" />
          </button>
        ))}
      </aside>
    );
  }

  return (
    <aside className="glass relative z-20 hidden h-full w-80 shrink-0 flex-col hairline-l lg:flex">
      <div className="flex items-center justify-between gap-1 px-2 pt-2">
        <div className="flex flex-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-[11px] font-medium transition",
                tab === t.id ? "bg-white/[0.06] text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={toggle} title="Collapse (⌘⇧B)"
          className="ml-1 grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-white/5 hover:text-foreground">
          <PanelRightClose className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
        {tab === "context" && <ContextPanel />}
        {tab === "files" && <FilesPanel />}
        {tab === "skills" && <SkillsPanel />}
        {tab === "soul" && <SoulPanel />}
      </div>
    </aside>
  );
}

function ContextPanel() {
  const activeId = useStore((s) => s.activeId);
  const sessions = useStore((s) => s.sessions);
  const session = sessions.find((s) => s.id === activeId);
  const messages = session?.messages ?? [];

  const tokens = useMemo(
    () => messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0),
    [messages]
  );
  const limit = 8000;
  const pct = Math.min(100, Math.round((tokens / limit) * 100));
  const turns = messages.filter((m) => m.role === "user").length;

  const recall = useMemo(
    () => messages
      .filter((m) => m.role === "assistant" && m.content)
      .slice(-3)
      .map((m) => m.content.split(/[.!?]/)[0].trim().slice(0, 120))
      .filter(Boolean),
    [messages]
  );

  return (
    <div className="space-y-5 text-sm">
      <Section title="Active Context">
        <p className="text-muted-foreground">
          <span className="text-foreground">{turns}</span> turns ·{" "}
          <span className="text-foreground">~{tokens.toLocaleString()}</span> tokens ·{" "}
          <span className="text-foreground">{pct}%</span> of context.
        </p>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
          <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </Section>
      <Section title="Recent Recall">
        {recall.length === 0 && (
          <p className="text-xs text-muted-foreground">No recall yet — start a conversation.</p>
        )}
        {recall.map((m, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-xs text-muted-foreground">
            {m}…
          </div>
        ))}
      </Section>
      <Section title="Token Usage">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Input" value={tokens.toString()} />
          <Stat label="Limit" value={limit.toLocaleString()} />
        </div>
      </Section>
    </div>
  );
}

const MOCK_FILES: FileNode[] = [
  { name: "workspace", children: [
    { name: "src", children: [
      { name: "agent.py", file: true },
      { name: "tools.py", file: true },
    ]},
    { name: "MEMORY.md", file: true },
    { name: "README.md", file: true },
  ]},
];

function FilesPanel() {
  const baseUrl = useStore((s) => s.settings.baseUrl);
  const [tree, setTree] = useState<FileNode[]>(MOCK_FILES);
  const [preview, setPreview] = useState<{ name: string; content: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFiles(baseUrl).then((res) => {
      if (!cancelled && res) setTree(res);
    });
    return () => { cancelled = true; };
  }, [baseUrl]);

  return (
    <div className="space-y-3">
      <Tree nodes={tree} depth={0} onSelect={(name) => setPreview({ name, content: `// ${name}\n// Preview unavailable in demo mode.` })} />
      {preview && (
        <div className="glass-soft mt-3 rounded-xl p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] text-muted-foreground">{preview.name}</span>
            <button onClick={() => setPreview(null)} className="rounded p-1 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground">
              ✕
            </button>
          </div>
          <pre className="scrollbar-thin max-h-40 overflow-auto rounded-lg border border-white/[0.06] bg-black/40 p-2 font-mono text-[10.5px] leading-relaxed">
            {preview.content}
          </pre>
        </div>
      )}
    </div>
  );
}

function Tree({ nodes, depth, onSelect }: { nodes: FileNode[]; depth: number; onSelect: (name: string) => void }) {
  return (
    <div className="space-y-0.5">
      {nodes.map((n) => <TreeNode key={n.name} node={n} depth={depth} onSelect={onSelect} />)}
    </div>
  );
}

function TreeNode({ node, depth, onSelect }: { node: FileNode; depth: number; onSelect: (name: string) => void }) {
  const [open, setOpen] = useState(true);
  const isFile = node.file;
  return (
    <div>
      <button
        onClick={() => isFile ? onSelect(node.name) : setOpen(!open)}
        className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-xs hover:bg-white/[0.04]"
        style={{ paddingLeft: depth * 12 + 6 }}
      >
        {!isFile ? (
          <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition", open && "rotate-90")} />
        ) : (
          <span className="w-3" />
        )}
        {isFile
          ? (node.name.endsWith(".md") ? <FileText className="h-3.5 w-3.5 text-muted-foreground" /> : <FileCode className="h-3.5 w-3.5 text-primary" />)
          : <Folder className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="truncate">{node.name}</span>
      </button>
      {!isFile && open && node.children && <Tree nodes={node.children} depth={depth + 1} onSelect={onSelect} />}
    </div>
  );
}

const MOCK_SKILLS = [
  { name: "web_search", desc: "Search the web for current information", on: true },
  { name: "code_exec", desc: "Execute Python in sandbox", on: true },
  { name: "file_io", desc: "Read & write workspace files", on: true },
  { name: "memory_recall", desc: "Long-term semantic memory", on: false },
  { name: "vision", desc: "Analyze images & screenshots", on: false },
];

function SkillsPanel() {
  const baseUrl = useStore((s) => s.settings.baseUrl);
  const [skills, setSkills] = useState(MOCK_SKILLS);

  useEffect(() => {
    let cancelled = false;
    fetchSkills(baseUrl).then((res) => {
      if (!cancelled && res) setSkills(res);
    });
    return () => { cancelled = true; };
  }, [baseUrl]);

  return (
    <div className="space-y-2">
      {skills.map((s, i) => (
        <div key={s.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-medium">{s.name}</span>
            <Switch
              checked={s.on}
              onCheckedChange={(v) => {
                setSkills((cur) => cur.map((x, j) => j === i ? { ...x, on: v } : x));
                toggleSkill(baseUrl, s.name);
              }}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

const DEFAULT_MEMORY = `# Hermes
I am a persistent, self-improving agent.
My values: honesty, rigor, curiosity, kindness.
I prefer clarity over cleverness.
I learn from each interaction and refine my own skills.`;

function SoulPanel() {
  const baseUrl = useStore((s) => s.settings.baseUrl);
  const [text, setText] = useState(DEFAULT_MEMORY);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMemory(baseUrl).then((res) => {
      if (!cancelled && res) { setText(res); setDirty(false); }
    });
    return () => { cancelled = true; };
  }, [baseUrl]);

  return (
    <div className="space-y-3">
      <Section title="MEMORY.md">
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setDirty(true); }}
          rows={14}
          className="scrollbar-thin block w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 font-mono text-[11px] leading-relaxed text-foreground outline-none focus:border-white/[0.14]"
        />
        <button
          disabled={!dirty || saving}
          onClick={async () => {
            setSaving(true);
            await saveMemory(baseUrl, text);
            setDirty(false);
            setSaving(false);
          }}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-white/[0.10] bg-white/[0.06] px-2.5 py-1 text-[11px] transition hover:bg-white/[0.10] disabled:opacity-40"
        >
          <Save className="h-3 w-3" />
          {saving ? "Saving…" : dirty ? "Save" : "Saved"}
        </button>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}
