import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, ArrowUp, Square, Slash } from "lucide-react";
import { cn } from "@/lib/utils";

const SLASH_COMMANDS = [
  { cmd: "/compress", desc: "Compact context window" },
  { cmd: "/model", desc: "Switch active model" },
  { cmd: "/skills", desc: "List loaded skills" },
  { cmd: "/clear", desc: "Clear current session" },
  { cmd: "/export", desc: "Export as Markdown" },
  { cmd: "/branch", desc: "Branch this conversation" },
];

const CONTEXT_LIMIT = 8000;

export function Composer({
  onSend, busy, onStop, contextTokens = 0,
}: {
  onSend: (text: string) => void;
  busy: boolean;
  onStop: () => void;
  contextTokens?: number;
}) {
  const [val, setVal] = useState("");
  const [showSlash, setShowSlash] = useState(false);
  const [slashIdx, setSlashIdx] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);

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

  const draftTokens = Math.ceil(val.length / 4);
  const totalTokens = contextTokens + draftTokens;

  return (
    <div className="relative">
      <AnimatePresence>
        {showSlash && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="glass-strong absolute bottom-full left-0 mb-2 w-72 overflow-hidden rounded-2xl p-1"
          >
            {filtered.map((c, i) => (
              <button
                key={c.cmd}
                onClick={() => { setVal(c.cmd + " "); setShowSlash(false); ref.current?.focus(); }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                  i === slashIdx ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                )}
              >
                <span className="font-mono text-primary">{c.cmd}</span>
                <span className="text-xs text-muted-foreground">{c.desc}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-strong rounded-3xl p-2 transition focus-within:border-white/[0.14]">
        <textarea
          ref={ref}
          rows={1}
          value={val}
          placeholder="Message Hermes…"
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
            <button title="Attach" className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground">
              <Paperclip className="h-4 w-4" />
            </button>
            <button title="Slash commands" onClick={() => { setVal("/"); setShowSlash(true); ref.current?.focus(); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground">
              <Slash className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {val.length} chars · ~{draftTokens} tok
            </span>
            <ContextRing tokens={totalTokens} limit={CONTEXT_LIMIT} />
            {busy ? (
              <button onClick={onStop} className="grid h-8 w-8 place-items-center rounded-xl bg-destructive text-destructive-foreground hover:opacity-90">
                <Square className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button onClick={submit} disabled={!val.trim()}
                className="grid h-8 w-8 place-items-center rounded-xl border border-white/[0.10] bg-white/[0.10] text-foreground transition hover:bg-white/[0.16] disabled:cursor-not-allowed disabled:opacity-40">
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContextRing({ tokens, limit }: { tokens: number; limit: number }) {
  const pct = Math.min(1, tokens / limit);
  const r = 11;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const color =
    pct >= 0.9 ? "var(--destructive)"
    : pct >= 0.7 ? "oklch(0.78 0.16 75)"
    : "var(--primary)";
  return (
    <div
      title={`~${tokens} tokens · ${Math.round(pct * 100)}% of context`}
      className="grid place-items-center"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
        <circle cx="14" cy="14" r={r} fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="2.5" />
        <circle
          cx="14" cy="14" r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 240ms ease, stroke 240ms ease" }}
        />
      </svg>
    </div>
  );
}
