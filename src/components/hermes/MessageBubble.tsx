import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, RefreshCw, Edit3, GitBranch, Check, Play, Wrench, Loader2,
  ChevronDown, Globe, Terminal, FileCode, X, AlertCircle,
} from "lucide-react";
import { useState } from "react";
import type { Message, ToolCall } from "@/lib/store";
import { cn } from "@/lib/utils";

export function MessageBubble({
  message,
  onRegenerate,
  onEdit,
  onApproveTool,
}: {
  message: Message;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  onApproveTool?: (toolId: string, decision: "once" | "session" | "always" | "deny") => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="group flex justify-end"
      >
        <div className="flex max-w-[78%] flex-col items-end gap-1.5">
          {editing ? (
            <div className="glass-strong w-full rounded-2xl rounded-tr-md p-2">
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    setEditing(false);
                    onEdit?.(draft.trim());
                  }
                  if (e.key === "Escape") { setEditing(false); setDraft(message.content); }
                }}
                rows={Math.min(8, draft.split("\n").length + 1)}
                className="scrollbar-thin block w-full resize-none bg-transparent px-2 py-1 text-[14.5px] leading-relaxed outline-none"
              />
              <div className="flex justify-end gap-1 px-1 pt-1">
                <button
                  onClick={() => { setEditing(false); setDraft(message.content); }}
                  className="rounded-md p-1 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { setEditing(false); onEdit?.(draft.trim()); }}
                  className="rounded-md p-1 text-primary hover:bg-white/[0.08]"
                  title="Save & regenerate"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl rounded-tr-md border border-white/[0.10] bg-white/[0.08] px-4 py-2.5 text-foreground"
              style={{ backdropFilter: "blur(20px) saturate(160%)" }}
            >
              <div className="whitespace-pre-wrap text-[14.5px] leading-relaxed">
                {message.content}
              </div>
            </div>
          )}
          {!editing && (
            <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100">
              <ActionBtn icon={Copy} label="Copy" onClick={() => navigator.clipboard.writeText(message.content)} />
              <ActionBtn icon={Edit3} label="Edit" onClick={() => { setDraft(message.content); setEditing(true); }} />
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex gap-3"
    >
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/[0.10] bg-white/[0.04] text-foreground">
        <span className="font-mono text-[10px] font-semibold">H</span>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {message.tools?.map((t) => (
          <ToolCallView key={t.id} tool={t} onApprove={(d) => onApproveTool?.(t.id, d)} />
        ))}
        {message.content ? (
          <div
            className="rounded-2xl rounded-tl-md border border-white/[0.06] bg-white/[0.02] px-4 py-2.5"
            style={{ backdropFilter: "blur(16px) saturate(140%)" }}
          >
            <div className="prose prose-invert prose-sm max-w-none prose-pre:my-2 prose-pre:bg-transparent prose-pre:p-0 prose-p:leading-relaxed prose-headings:mb-2 prose-code:rounded prose-code:bg-white/[0.06] prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.85em] prose-code:before:content-[''] prose-code:after:content-['']">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {message.streaming && (
              <span className="ml-2 mt-1 inline-block h-3.5 w-1 translate-y-0.5 animate-pulse rounded-sm bg-primary" />
            )}
          </div>
        ) : message.streaming ? (
          <div className="rounded-2xl rounded-tl-md border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <TypingDots />
          </div>
        ) : null}
        {!message.streaming && message.content && (
          <div className="mt-1.5 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
            <ActionBtn icon={Copy} label="Copy" onClick={() => navigator.clipboard.writeText(message.content)} />
            <ActionBtn icon={RefreshCw} label="Regenerate" onClick={onRegenerate} />
            <ActionBtn icon={GitBranch} label="Branch" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ActionBtn({
  icon: Icon, label, onClick,
}: { icon: React.ComponentType<{ className?: string }>; label: string; onClick?: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        onClick?.();
        if (label === "Copy") { setCopied(true); setTimeout(() => setCopied(false), 1200); }
      }}
      title={label}
      className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
    >
      {copied && label === "Copy" ? <Check className="h-3.5 w-3.5 text-primary" /> : <Icon className="h-3.5 w-3.5" />}
    </button>
  );
}

function toolIcon(name: string) {
  if (/web|search|browse|http/i.test(name)) return Globe;
  if (/shell|bash|exec|cmd/i.test(name)) return Terminal;
  if (/code|file|edit/i.test(name)) return FileCode;
  return Wrench;
}

function ToolCallView({
  tool, onApprove,
}: {
  tool: ToolCall;
  onApprove: (d: "once" | "session" | "always" | "deny") => void;
}) {
  const isShell = /^(shell|bash)$/i.test(tool.name);
  const needsApproval = isShell && tool.status === "running" && !tool.approval;
  if (needsApproval) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong overflow-hidden rounded-2xl"
      >
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">Shell command requires approval</span>
        </div>
        <div className="px-3 py-2">
          <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-black/40 p-2.5 font-mono text-[12px] text-foreground">
            $ {tool.input ?? ""}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 border-t border-white/[0.06] px-3 py-2">
          <ApprovalBtn label="Allow once" onClick={() => onApprove("once")} />
          <ApprovalBtn label="Allow in session" onClick={() => onApprove("session")} />
          <ApprovalBtn label="Always allow" onClick={() => onApprove("always")} />
          <ApprovalBtn label="Deny" danger onClick={() => onApprove("deny")} />
        </div>
      </motion.div>
    );
  }
  return <ToolCard tool={tool} />;
}

function ApprovalBtn({
  label, onClick, danger,
}: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium transition hover:bg-white/[0.08]",
        danger && "text-destructive border-destructive/30 hover:bg-destructive/10"
      )}
    >
      {label}
    </button>
  );
}

function ToolCard({ tool }: { tool: ToolCall }) {
  const [open, setOpen] = useState(false);
  const Icon = toolIcon(tool.name);
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-white/[0.03]",
          tool.status === "running" && "shimmer"
        )}
      >
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono font-medium">{tool.name}</span>
        {tool.input && (
          <span className="truncate font-mono text-muted-foreground">— {tool.input}</span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          <StatusBadge status={tool.status} />
          <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition", open && "rotate-180")} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-white/[0.06]"
          >
            <div className="space-y-2 p-3">
              {tool.input && (
                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Input</div>
                  <pre className="scrollbar-thin overflow-x-auto rounded-xl border border-white/[0.08] bg-black/40 p-2.5 font-mono text-[11.5px] leading-relaxed">
                    {tool.input}
                  </pre>
                </div>
              )}
              {tool.output && (
                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Output</div>
                  <pre className="scrollbar-thin overflow-x-auto whitespace-pre-wrap rounded-xl border border-white/[0.08] bg-black/40 p-2.5 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
                    {tool.output}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: ToolCall["status"] }) {
  if (status === "running")
    return (
      <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-primary">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        running
      </span>
    );
  if (status === "error")
    return (
      <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] text-destructive">
        <X className="h-2.5 w-2.5" /> error
      </span>
    );
  return (
    <span className="flex items-center gap-1 rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-muted-foreground">
      <Check className="h-2.5 w-2.5 text-primary" /> done
    </span>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const code = extractText(children);
  return (
    <div className="my-2 overflow-hidden rounded-xl border border-white/[0.08] bg-black/40">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">code</span>
        <div className="flex gap-1">
          <button
            onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
            className="flex items-center gap-1 rounded p-1 text-[10px] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
          >
            {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button className="flex items-center gap-1 rounded p-1 text-[10px] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground">
            <Play className="h-3 w-3" /> Run
          </button>
        </div>
      </div>
      <pre className="scrollbar-thin overflow-x-auto p-3 font-mono text-[12.5px] leading-relaxed">{children}</pre>
    </div>
  );
}

function extractText(node: any): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node?.props?.children) return extractText(node.props.children);
  return "";
}
