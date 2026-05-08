import { useEffect, useRef, useState } from "react";
import { useStore, newId, type Message } from "@/lib/store";
import { streamChat, toApiMessages } from "@/lib/hermes-api";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";
import { Sparkles, Zap, Brain, Code2 } from "lucide-react";
import { motion } from "framer-motion";

const SUGGESTIONS = [
  { icon: Code2, label: "Write a TypeScript LRU cache", prompt: "Write a generic TypeScript LRU cache with tests." },
  { icon: Brain, label: "Explain attention with math", prompt: "Explain self-attention with the math equations." },
  { icon: Zap, label: "Plan an agent loop", prompt: "Help me design a self-improving agent loop with tools." },
  { icon: Sparkles, label: "Brainstorm a product name", prompt: "Brainstorm 10 names for a developer AI companion." },
];

export function ChatArea() {
  const activeId = useStore((s) => s.activeId);
  const sessions = useStore((s) => s.sessions);
  const settings = useStore((s) => s.settings);
  const append = useStore((s) => s.appendMessage);
  const update = useStore((s) => s.updateMessage);
  const create = useStore((s) => s.createSession);

  const session = sessions.find((s) => s.id === activeId) ?? null;
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [session?.messages.length, session?.messages[session.messages.length - 1]?.content]);

  async function send(text: string) {
    let sid = activeId;
    if (!sid) sid = create();
    const userMsg: Message = { id: newId(), role: "user", content: text, createdAt: Date.now() };
    append(sid, userMsg);

    const aId = newId();
    const showTool = /search|find|look up/i.test(text);
    const assistantMsg: Message = {
      id: aId, role: "assistant", content: "", createdAt: Date.now(), streaming: true,
      tools: showTool ? [{ id: newId(), name: "web_search", status: "running", input: text.slice(0, 40) }] : undefined,
    };
    append(sid, assistantMsg);

    setBusy(true);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const all = (sessions.find((s) => s.id === sid)?.messages ?? []).concat([userMsg]);
      let acc = "";
      for await (const chunk of streamChat(settings, toApiMessages(all), ac.signal)) {
        acc += chunk;
        update(sid, aId, { content: acc });
      }
      update(sid, aId, {
        streaming: false,
        tools: showTool ? [{ id: newId(), name: "web_search", status: "done", input: text.slice(0, 40) }] : undefined,
      });
    } catch (e: any) {
      update(sid, aId, {
        streaming: false,
        content: (assistantMsg.content || "") + `\n\n> ⚠ ${e?.message ?? "Stream failed"}`,
      });
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function stop() { abortRef.current?.abort(); }

  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border/60 px-4 backdrop-blur">
        <div className="flex items-center gap-2 text-sm">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-primary to-cyber font-mono text-[10px] font-bold text-primary-foreground">H</span>
          <span className="font-medium">{session?.title ?? "Hermes Companion"}</span>
          {session && (
            <span className="rounded-full border border-border/60 bg-surface/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {session.messages.length} msg
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon shadow-glow" />
          connected · {settings.model}
        </div>
      </div>

      {/* Scroll area */}
      <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {!session || session.messages.length === 0 ? (
            <EmptyState onPick={(p) => send(p)} />
          ) : (
            <div className="space-y-6">
              {session.messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border/60 bg-gradient-to-b from-transparent to-background/40 px-4 pb-4 pt-3">
        <div className="mx-auto max-w-3xl">
          <Composer onSend={send} busy={busy} onStop={stop} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (p: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl py-16 text-center"
    >
      <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary via-cyber to-neon shadow-glow">
        <span className="font-mono text-2xl font-bold text-primary-foreground">H</span>
        <div className="absolute -inset-2 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 to-neon/20 blur-2xl" />
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        <span className="gradient-text">Hermes</span> at your service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Persistent. Self-improving. Connected to your tools and memory.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => onPick(s.prompt)}
            className="group flex items-start gap-3 rounded-xl border border-border/60 bg-surface/40 p-4 text-left transition hover:border-primary/60 hover:bg-surface"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-neon/20 text-neon transition group-hover:from-primary/40 group-hover:to-neon/40">
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium">{s.label}</div>
              <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{s.prompt}</div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
