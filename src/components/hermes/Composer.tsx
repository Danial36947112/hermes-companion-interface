import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, ArrowUp, Square, Slash } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const SLASH_COMMANDS = [
  { cmd: "/compress", desc: "Compact context window" },
  { cmd: "/model", desc: "Switch active model" },
  { cmd: "/skills", desc: "List loaded skills" },
  { cmd: "/clear", desc: "Clear current session" },
  { cmd: "/export", desc: "Export as Markdown" },
  { cmd: "/branch", desc: "Branch this conversation" },
];

export function Composer({
  onSend, busy, onStop,
}: { onSend: (text: string) => void; busy: boolean; onStop: () => void }) {
  const [val, setVal] = useState("");
  const [showSlash, setShowSlash] = useState(false);
  const [slashIdx, setSlashIdx] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);
  const model = useStore((s) => s.settings.model);

  useEffect(() => { ref.current?.focus(); }, []);

  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 240) + "px";
  }, [val]);

  const filtered = SLASH_COMMANDS.filter((c) =>
    val.startsWith("/") ? c.cmd.startsWith(val.split(/\s/)[0]) : false
  );

  function submit() {
    if (!val.trim() || busy) return;
    onSend(val.trim());
    setVal("");
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {showSlash && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="absolute bottom-full left-0 mb-2 w-72 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-elevated"
          >
            {filtered.map((c, i) => (
              <button
                key={c.cmd}
                onClick={() => { setVal(c.cmd + " "); setShowSlash(false); ref.current?.focus(); }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                  i === slashIdx ? "bg-accent" : "hover:bg-accent/60"
                )}
              >
                <span className="font-mono text-neon">{c.cmd}</span>
                <span className="text-xs text-muted-foreground">{c.desc}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-strong rounded-2xl p-2 shadow-elevated focus-within:neon-ring transition">
        <textarea
          ref={ref}
          rows={1}
          value={val}
          placeholder="Message Hermes…  (try /skills)"
          onChange={(e) => {
            setVal(e.target.value);
            setShowSlash(e.target.value.startsWith("/"));
            setSlashIdx(0);
          }}
          onKeyDown={(e) => {
            if (showSlash && filtered.length) {
              if (e.key === "ArrowDown") { e.preventDefault(); setSlashIdx((i) => (i + 1) % filtered.length); return; }
              if (e.key === "ArrowUp") { e.preventDefault(); setSlashIdx((i) => (i - 1 + filtered.length) % filtered.length); return; }
              if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey && val.split(/\s/).length === 1)) {
                e.preventDefault(); setVal(filtered[slashIdx].cmd + " "); setShowSlash(false); return;
              }
              if (e.key === "Escape") { setShowSlash(false); return; }
            }
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
          className="scrollbar-thin block w-full resize-none bg-transparent px-3 py-2 text-[14.5px] leading-relaxed outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between gap-2 px-1.5 pb-0.5 pt-1">
          <div className="flex items-center gap-1">
            <button title="Attach" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
              <Paperclip className="h-4 w-4" />
            </button>
            <button title="Slash commands" onClick={() => { setVal("/"); setShowSlash(true); ref.current?.focus(); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
              <Slash className="h-4 w-4" />
            </button>
            <div className="ml-1 flex items-center gap-1.5 rounded-md border border-border/60 bg-surface/60 px-2 py-1 font-mono text-[10.5px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-neon shadow-glow" />
              {model}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {val.length} chars · ~{Math.ceil(val.length / 4)} tok
            </span>
            {busy ? (
              <button onClick={onStop} className="grid h-8 w-8 place-items-center rounded-lg bg-destructive text-destructive-foreground hover:opacity-90">
                <Square className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button onClick={submit} disabled={!val.trim()}
                className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-cyber text-primary-foreground shadow-glow transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40">
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 px-2 text-center text-[10.5px] text-muted-foreground">
        <kbd className="rounded bg-surface px-1.5 py-0.5 font-mono">↵</kbd> send ·{" "}
        <kbd className="rounded bg-surface px-1.5 py-0.5 font-mono">⇧↵</kbd> newline ·{" "}
        <kbd className="rounded bg-surface px-1.5 py-0.5 font-mono">⌘K</kbd> command palette
      </div>
    </div>
  );
}
