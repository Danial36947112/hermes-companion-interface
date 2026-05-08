import { useEffect, useRef, useState } from "react";
import { useStore, newId, type Message } from "@/lib/store";
import { streamChat, toApiMessages } from "@/lib/hermes-api";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";

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
      {/* Scroll area */}
      <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 pb-40 pt-8">
          {session && session.messages.length > 0 && (
            <div className="space-y-6">
              {session.messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating composer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-5">
        <div className="pointer-events-auto mx-auto max-w-3xl">
          <Composer onSend={send} busy={busy} onStop={stop} />
        </div>
      </div>
    </div>
  );
}
