import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { motion } from "framer-motion";
import { Copy, RefreshCw, Edit3, GitBranch, Check, Play, Wrench, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Message } from "@/lib/store";
import { cn } from "@/lib/utils";

export function MessageBubble({
  message,
  onRegenerate,
  onEdit,
}: {
  message: Message;
  onRegenerate?: () => void;
  onEdit?: () => void;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="group flex justify-end"
      >
        <div
          className="max-w-[78%] rounded-2xl rounded-tr-md border border-white/[0.10] bg-white/[0.08] px-4 py-2.5 text-foreground"
          style={{ backdropFilter: "blur(20px) saturate(160%)" }}
        >
          <div className="whitespace-pre-wrap text-[14.5px] leading-relaxed">
            {message.content}
          </div>
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
      <div className="min-w-0 flex-1">
        {message.tools?.map((t) => <ToolBadge key={t.id} tool={t} />)}
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
            <ActionBtn icon={Edit3} label="Edit" onClick={onEdit} />
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

function ToolBadge({ tool }: { tool: NonNullable<Message["tools"]>[number] }) {
  return (
    <div className={cn(
      "mb-2 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px]",
      tool.status === "running" && "shimmer"
    )}>
      {tool.status === "running" ? (
        <Loader2 className="h-3 w-3 animate-spin text-primary" />
      ) : (
        <Wrench className="h-3 w-3 text-primary" />
      )}
      <span className="font-mono text-muted-foreground">Using</span>
      <span className="font-mono font-medium">{tool.name}</span>
      {tool.input && <span className="truncate text-muted-foreground">— {tool.input}</span>}
    </div>
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
