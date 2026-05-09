import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Pin,
  Trash2,
  Archive,
  MoreHorizontal,
  Settings as SettingsIcon,
  LayoutDashboard,
  Sparkles,
  Brain,
  Edit3,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Download,
  Upload,
} from "lucide-react";
import { useStore, type Session, newId, type Message } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Filter = "all" | "today" | "pinned" | "archived";

export function LeftSidebar() {
  const sessions = useStore((s) => s.sessions);
  const activeId = useStore((s) => s.activeId);
  const collapsed = useStore((s) => s.leftCollapsed);
  const toggle = useStore((s) => s.toggleLeft);
  const select = useStore((s) => s.selectSession);
  const create = useStore((s) => s.createSession);
  const del = useStore((s) => s.deleteSession);
  const pin = useStore((s) => s.pinSession);
  const archive = useStore((s) => s.archiveSession);
  const rename = useStore((s) => s.renameSession);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<string | null>(null);

  const path = useRouterState({ select: (r) => r.location.pathname });

  const filtered = useMemo(() => {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    return sessions
      .filter((s) => {
        if (filter === "pinned") return s.pinned;
        if (filter === "archived") return s.archived;
        if (filter === "today") return s.updatedAt >= startOfDay.getTime();
        return !s.archived;
      })
      .filter((s) => (q ? s.title.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt);
  }, [sessions, q, filter]);

  if (collapsed) {
    return (
      <aside className="glass relative z-20 flex h-full w-14 shrink-0 flex-col items-center py-3 hairline-r">
        <button
          onClick={toggle}
          title="Expand sidebar (⌘B)"
          className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
        <div className="my-2 h-px w-6 bg-white/[0.06]" />
        <button
          onClick={() => create()}
          title="New session (⌘N)"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.06] text-foreground transition hover:bg-white/[0.12]"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="scrollbar-thin mt-3 flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto px-1.5">
          {sessions.slice(0, 10).map((s) => (
            <button
              key={s.id}
              onClick={() => select(s.id)}
              title={s.title}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-white/5 hover:text-foreground",
                s.id === activeId && "bg-white/[0.08] text-foreground"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
        <div className="mt-auto flex flex-col items-center gap-1 pt-2">
          <IconLink to="/skills" icon={Sparkles} label="Skills" active={path === "/skills"} />
          <IconLink to="/memory" icon={Brain} label="Memory" active={path === "/memory"} />
          <IconLink to="/settings" icon={SettingsIcon} label="Settings" active={path === "/settings"} />
        </div>
      </aside>
    );
  }

  return (
    <aside className="glass relative z-20 flex h-full w-72 shrink-0 flex-col text-sidebar-foreground hairline-r">
      {/* Brand */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.06]">
            <span className="font-mono text-[11px] font-semibold tracking-tight text-foreground">H</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium tracking-tight">Hermes</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Companion
            </span>
          </div>
        </div>
        <button
          onClick={toggle}
          title="Collapse (⌘B)"
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* New */}
      <div className="px-3">
        <Button
          onClick={() => create()}
          variant="ghost"
          className="group h-9 w-full justify-between gap-2 border border-white/[0.08] bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New session
          </span>
          <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘N
          </kbd>
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sessions…"
            className="h-9 border-white/[0.06] bg-white/[0.03] pl-8 text-sm"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 px-3 pt-3 text-xs">
        {(["all", "today", "pinned", "archived"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-md px-2 py-1 capitalize transition",
              filter === f
                ? "bg-white/[0.08] text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      <div className="scrollbar-thin mt-3 flex-1 overflow-y-auto px-2 pb-2">
        <AnimatePresence initial={false}>
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-3 py-10 text-center text-xs text-muted-foreground"
            >
              No sessions yet.
              <br /> Hit <span className="text-foreground">New session</span>.
            </motion.div>
          )}
          {filtered.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              active={s.id === activeId && path === "/"}
              editing={editing === s.id}
              onStartEdit={() => setEditing(s.id)}
              onCommitEdit={(t) => { rename(s.id, t || s.title); setEditing(null); }}
              onSelect={() => select(s.id)}
              onPin={() => pin(s.id)}
              onArchive={() => archive(s.id)}
              onDelete={() => del(s.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="hairline-t p-2">
        <FooterLink to="/" icon={LayoutDashboard} label="Dashboard" />
        <FooterLink to="/skills" icon={Sparkles} label="Skills" />
        <FooterLink to="/memory" icon={Brain} label="Memory" />
        <FooterLink to="/settings" icon={SettingsIcon} label="Settings" />
      </div>
    </aside>
  );
}

function IconLink({
  to, icon: Icon, label, active,
}: { to: string; icon: React.ComponentType<{ className?: string }>; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      title={label}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-white/5 hover:text-foreground",
        active && "bg-white/[0.08] text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
    </Link>
  );
}

function FooterLink({
  to, icon: Icon, label,
}: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const active = path === to;
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition",
        active
          ? "bg-white/[0.06] text-foreground"
          : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function SessionRow({
  session, active, editing, onStartEdit, onCommitEdit, onSelect, onPin, onArchive, onDelete,
}: {
  session: Session; active: boolean; editing: boolean;
  onStartEdit: () => void; onCommitEdit: (t: string) => void;
  onSelect: () => void; onPin: () => void; onArchive: () => void; onDelete: () => void;
}) {
  const preview =
    session.messages.find((m) => m.role === "user")?.content?.slice(0, 60) ?? "Empty conversation";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={cn(
        "group relative mb-1 rounded-lg px-2.5 py-2 transition",
        active
          ? "bg-white/[0.06]"
          : "hover:bg-white/[0.03]"
      )}
    >
      <Link to="/" onClick={onSelect} className="block">
        <div className="flex items-center gap-1.5">
          {session.pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
          {editing ? (
            <input
              autoFocus
              defaultValue={session.title}
              onBlur={(e) => onCommitEdit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onCommitEdit((e.target as HTMLInputElement).value);
                if (e.key === "Escape") onCommitEdit(session.title);
              }}
              className="w-full rounded bg-transparent text-sm outline-none ring-1 ring-ring"
            />
          ) : (
            <div className="truncate text-sm font-medium">{session.title}</div>
          )}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{preview}</div>
        <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {timeAgo(session.updatedAt)}
        </div>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="absolute right-1.5 top-1.5 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-white/[0.08] hover:text-foreground group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onStartEdit}><Edit3 className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
          <DropdownMenuItem onClick={onPin}><Pin className="mr-2 h-4 w-4" /> {session.pinned ? "Unpin" : "Pin"}</DropdownMenuItem>
          <DropdownMenuItem onClick={onArchive}><Archive className="mr-2 h-4 w-4" /> {session.archived ? "Unarchive" : "Archive"}</DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

function timeAgo(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Cmd+N shortcut
export function useNewSessionShortcut() {
  const create = useStore((s) => s.createSession);
  const toggleLeft = useStore((s) => s.toggleLeft);
  const toggleRight = useStore((s) => s.toggleRight);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "n") {
        e.preventDefault();
        create();
      } else if (meta && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleLeft();
      } else if (meta && e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleRight();
      } else if (meta && e.key === ".") {
        e.preventDefault();
        toggleRight();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [create, toggleLeft, toggleRight]);
}
