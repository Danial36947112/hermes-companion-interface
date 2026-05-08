// Streams from an OpenAI-compatible /chat/completions endpoint.
// Falls back to a local mock stream when no API key is configured —
// keeps the UI fully functional out of the box.
import type { Message, Settings } from "./store";

export async function* streamChat(
  settings: Settings,
  messages: { role: string; content: string }[],
  signal?: AbortSignal
): AsyncGenerator<string> {
  if (!settings.apiKey || !settings.baseUrl) {
    yield* mockStream(messages[messages.length - 1]?.content ?? "");
    return;
  }
  const res = await fetch(`${settings.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: settings.temperature,
      stream: true,
    }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // ignore
      }
    }
  }
}

async function* mockStream(prompt: string): AsyncGenerator<string> {
  const reply = craftMockReply(prompt);
  const tokens = reply.split(/(\s+)/);
  for (const tok of tokens) {
    await new Promise((r) => setTimeout(r, 18 + Math.random() * 35));
    yield tok;
  }
}

function craftMockReply(prompt: string) {
  const p = prompt.toLowerCase();
  if (p.includes("code") || p.includes("```") || p.includes("function")) {
    return `Sure — here's a small example.\n\n\`\`\`ts\n// Fibonacci with memoization\nconst fib = (() => {\n  const cache = new Map<number, number>();\n  return function f(n: number): number {\n    if (n < 2) return n;\n    if (cache.has(n)) return cache.get(n)!;\n    const v = f(n - 1) + f(n - 2);\n    cache.set(n, v);\n    return v;\n  };\n})();\n\`\`\`\n\nLet me know if you want it iterative or async.`;
  }
  if (p.includes("math") || p.includes("equation") || p.includes("latex")) {
    return `Of course — here's the Schrödinger equation:\n\n$$ i\\hbar \\frac{\\partial}{\\partial t} \\Psi(x,t) = \\hat{H}\\,\\Psi(x,t) $$\n\nThis describes how the quantum state evolves over time.`;
  }
  return `**Hermes** here. I received: _"${prompt}"_.\n\nI'm currently running in **demo mode** — connect a real Hermes-compatible endpoint in **Settings** to unlock streaming, tool calls, and persistent memory.\n\n- Use \`/skills\` to view loaded skills\n- Use \`/model\` to switch model\n- Use \`/compress\` to compact context\n\nReady when you are.`;
}

export function toApiMessages(msgs: Message[]) {
  return msgs.map((m) => ({ role: m.role, content: m.content }));
}
