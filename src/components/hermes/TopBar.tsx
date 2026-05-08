import { Link } from "@tanstack/react-router";
import { Settings as SettingsIcon, X, ChevronDown, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MODELS = ["Hermes-4-405B", "Hermes-4-70B", "Hermes-3-8B"];

export function TopBar() {
  const sessions = useStore((s) => s.sessions);
  const openTabs = useStore((s) => s.openTabs);
  const activeId = useStore((s) => s.activeId);
  const select = useStore((s) => s.selectSession);
  const close = useStore((s) => s.closeTab);
  const create = useStore((s) => s.createSession);
  const model = useStore((s) => s.settings.model);
  const setSettings = useStore((s) => s.setSettings);

  const tabSessions = openTabs
    .map((id) => sessions.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div className="glass relative z-10 flex h-11 shrink-0 items-center gap-1 px-2 hairline-b">
      {/* Tabs */}
      <div className="scrollbar-thin flex flex-1 items-center gap-1 overflow-x-auto">
        {tabSessions.map((s) => (
          <button
            key={s.id}
            onClick={() => select(s.id)}
            className={cn(
              "group flex h-8 max-w-[180px] shrink-0 items-center gap-2 rounded-lg border px-2.5 text-xs transition",
              s.id === activeId
                ? "border-white/[0.10] bg-white/[0.06] text-foreground"
                : "border-transparent text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
            )}
          >
            <span className={cn(
              "h-1.5 w-1.5 rounded-full transition",
              s.id === activeId ? "bg-primary" : "bg-white/20"
            )} />
            <span className="truncate">{s.title}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); close(s.id); }}
              className="ml-0.5 grid h-4 w-4 shrink-0 place-items-center rounded text-muted-foreground opacity-0 transition hover:bg-white/[0.08] hover:text-foreground group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        ))}
        <button
          onClick={() => create()}
          title="New tab"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Right: model + avatar + settings */}
      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-mono text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {model}
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Model
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {MODELS.map((m) => (
              <DropdownMenuItem key={m} onClick={() => setSettings({ model: m })} className="font-mono text-xs">
                <span className={cn(
                  "mr-2 h-1.5 w-1.5 rounded-full",
                  m === model ? "bg-primary" : "bg-white/20"
                )} />
                {m}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          to="/settings"
          title="Settings"
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
        >
          <SettingsIcon className="h-3.5 w-3.5" />
        </Link>

        <button
          title="Account"
          className="grid h-7 w-7 place-items-center rounded-full border border-white/[0.10] bg-white/[0.04] text-[10px] font-medium text-foreground transition hover:bg-white/[0.08]"
        >
          U
        </button>
      </div>
    </div>
  );
}
