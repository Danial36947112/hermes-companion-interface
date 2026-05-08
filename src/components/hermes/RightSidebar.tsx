import { useState } from "react";
import {
  ChevronRight, FileCode, FileText, Folder, Layers, BookOpen, Wrench,
  PanelRightClose, PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";

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
        <button
          onClick={toggle}
          title="Expand panel (⌘⇧B)"
          className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
        >
          <PanelRightOpen className="h-4 w-4" />
        </button>
        <div className="my-2 h-px w-6 bg-white/[0.06]" />
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); toggle(); }}
            title={t.label}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
          >
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
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-[11px] font-medium transition",
                tab === t.id
                  ? "bg-white/[0.06] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={toggle}
          title="Collapse (⌘⇧B)"
          className="ml-1 grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
        >
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
  return (
    <div className="space-y-5 text-sm">
      <Section title="Active Context">
        <p className="text-muted-foreground">
          Hermes is tracking the current task across <span className="text-foreground">3 files</span>{" "}
          and <span className="text-foreground">12 turns</span>. Working memory at{" "}
          <span className="text-foreground">42%</span>.
        </p>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
          <div className="h-full w-[42%] rounded-full bg-primary/70" />
        </div>
      </Section>
      <Section title="Recent Recall">
        {["User prefers terse explanations", "Project uses TanStack Start", "Theme: liquid glass"].map((m) => (
          <div key={m} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-xs text-muted-foreground">
            {m}
          </div>
        ))}
      </Section>
      <Section title="Token Usage">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Input" value="8.2k" />
          <Stat label="Output" value="1.4k" />
        </div>
      </Section>
    </div>
  );
}

function FilesPanel() {
  const tree = [
    { name: "workspace", children: [
      { name: "src", children: [
        { name: "agent.py", file: true },
        { name: "tools.py", file: true },
      ]},
      { name: "SOUL.md", file: true },
      { name: "README.md", file: true },
    ]},
  ];
  return <Tree nodes={tree} depth={0} />;
}

function Tree({ nodes, depth }: { nodes: any[]; depth: number }) {
  return (
    <div className="space-y-0.5">
      {nodes.map((n) => <TreeNode key={n.name} node={n} depth={depth} />)}
    </div>
  );
}

function TreeNode({ node, depth }: { node: any; depth: number }) {
  const [open, setOpen] = useState(true);
  const isFile = node.file;
  return (
    <div>
      <button
        onClick={() => !isFile && setOpen(!open)}
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
      {!isFile && open && node.children && <Tree nodes={node.children} depth={depth + 1} />}
    </div>
  );
}

function SkillsPanel() {
  const skills = [
    { name: "web_search", desc: "Search the web for current information", on: true },
    { name: "code_exec", desc: "Execute Python in sandbox", on: true },
    { name: "file_io", desc: "Read & write workspace files", on: true },
    { name: "memory_recall", desc: "Long-term semantic memory", on: false },
    { name: "vision", desc: "Analyze images & screenshots", on: false },
  ];
  return (
    <div className="space-y-2">
      {skills.map((s) => (
        <div key={s.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-medium">{s.name}</span>
            <Switch defaultChecked={s.on} />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

function SoulPanel() {
  return (
    <div className="space-y-3">
      <Section title="SOUL.md">
        <pre className="whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
{`# Hermes
I am a persistent, self-improving agent.
My values: honesty, rigor, curiosity, kindness.
I prefer clarity over cleverness.
I learn from each interaction and refine my own skills.`}
        </pre>
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
