import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import {
  Plus, Settings as SettingsIcon, Sparkles, Brain, LayoutDashboard, Search,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const create = useStore((s) => s.createSession);
  const sessions = useStore((s) => s.sessions);
  const select = useStore((s) => s.selectSession);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl rounded-2xl border border-border bg-popover border-white/10" onClick={(e) => e.stopPropagation()}>
        <Command label="Command palette" className="overflow-hidden rounded-2xl">
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              placeholder="Type a command or search…"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="scrollbar-thin max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">No results.</Command.Empty>
            <Command.Group heading="Actions" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              <Item icon={Plus} label="New session" onSelect={() => { create(); navigate({ to: "/" }); setOpen(false); }} />
              <Item icon={LayoutDashboard} label="Open Dashboard" onSelect={() => { navigate({ to: "/" }); setOpen(false); }} />
              <Item icon={Sparkles} label="Skills Library" onSelect={() => { navigate({ to: "/skills" }); setOpen(false); }} />
              <Item icon={Brain} label="Memory Explorer" onSelect={() => { navigate({ to: "/memory" }); setOpen(false); }} />
              <Item icon={SettingsIcon} label="Settings" onSelect={() => { navigate({ to: "/settings" }); setOpen(false); }} />
            </Command.Group>
            {sessions.length > 0 && (
              <Command.Group heading="Sessions" className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                {sessions.slice(0, 8).map((s) => (
                  <Command.Item
                    key={s.id} value={s.title}
                    onSelect={() => { select(s.id); navigate({ to: "/" }); setOpen(false); }}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm aria-selected:bg-accent"
                  >
                    <span className="truncate">{s.title}</span>
                    <span className="ml-2 font-mono text-[10px] text-muted-foreground">{s.messages.length}m</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function Item({ icon: Icon, label, onSelect }: { icon: any; label: string; onSelect: () => void }) {
  return (
    <Command.Item
      value={label}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm aria-selected:bg-accent"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </Command.Item>
  );
}
