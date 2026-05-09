import { useEffect, useRef, useState, useCallback } from "react";
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
  const truncateAfter = useStore((s) => s.truncateAfter);
  const removeMessage = useStore((s) => s.removeMessage);
  const create = useStore((s) => s.createSession);

  const session = sessions.find((s) => s.id === activeId) ?? null;
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [session?.messages.length, session?.messages[session.messages.length - 1]?.content]);

  const runAssistant = useCallback(async (sid: string, history: Message[]) => {
    const aId = newId();
    const lastUser = [...history].reverse().find((m) => m.role === "user");
    const showTool = lastUser ? /search|find|look up/i.test(lastUser.content) : false;
    const assistantMsg: Message = {
      id: aId, role: "assistant", content: "", createdAt: Date.now(), streaming: true,
      tools: showTool ? [{ id: newId(), name: "web_search", status: "running", input: lastUser!.content.slice(0, 40) }] : undefined,
    };
    append(sid, assistantMsg);

    setBusy(true);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      let acc = "";
      for await (const chunk of streamChat(settings, toApiMessages(history), ac.signal)) {
        acc += chunk;
        update(sid, aId, { content: acc });
      }
      update(sid, aId, {
        streaming: false,
        tools: showTool ? [{ id: newId(), name: "web_search", status: "done", input: lastUser!.content.slice(0, 40), output: "Found 8 relevant results." }] : undefined,
      });
    } catch (e: any) {
      update(sid, aId, {
        streaming: false,
        content: `\n\n> ⚠ ${e?.message ?? "Stream failed"}`,
      });
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [append, update, settings]);

  async function send(text: string) {
    let sid = activeId;
    if (!sid) sid = create();
    const userMsg: Message = { id: newId(), role: "user", content: text, createdAt: Date.now() };
    append(sid, userMsg);
    const history = (sessions.find((s) => s.id === sid)?.messages ?? []).concat([userMsg]);
    await runAssistant(sid, history);
  }

  function stop() { abortRef.current?.abort(); }

  function handleRegenerate(assistantId: string) {
    if (!session) return;
    const idx = session.messages.findIndex((m) => m.id === assistantId);
    if (idx < 0) return;
    removeMessage(session.id, assistantId);
    const history = session.messages.slice(0, idx);
    runAssistant(session.id, history);
  }

  function handleEdit(userId: string, newContent: string) {
    if (!session || !newContent) return;
    const idx = session.messages.findIndex((m) => m.id === userId);
    if (idx < 0) return;
    update(session.id, userId, { content: newContent });
    truncateAfter(session.id, userId);
    const history = session.messages.slice(0, idx).concat([{ ...session.messages[idx], content: newContent }]);
    runAssistant(session.id, history);
  }

  function handleApproveTool(messageId: string, toolId: string, decision: "once" | "session" | "always" | "deny") {
    if (!session) return;
    const msg = session.messages.find((m) => m.id === messageId);
    if (!msg?.tools) return;
    const updatedTools = msg.tools.map((t) =>
      t.id === toolId
        ? { ...t, approval: decision, status: decision === "deny" ? "error" as const : "done" as const, output: decision === "deny" ? "Denied by user." : "Approved." }
        : t
    );
    update(session.id, messageId, { tools: updatedTools });
  }

  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col">
      <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 pb-40 pt-8">
          {session && session.messages.length > 0 && (
            <div className="space-y-6">
              {session.messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  onRegenerate={m.role === "assistant" ? () => handleRegenerate(m.id) : undefined}
                  onEdit={m.role === "user" ? (c) => handleEdit(m.id, c) : undefined}
                  onApproveTool={(tid, d) => handleApproveTool(m.id, tid, d)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-5">
        <div className="pointer-events-auto mx-auto max-w-3xl">
          <Composer onSend={send} busy={busy} onStop={stop} contextTokens={estimateTokens(session?.messages ?? [])} />
        </div>
      </div>
    </div>
  );
}

function estimateTokens(messages: Message[]) {
  return messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
}
