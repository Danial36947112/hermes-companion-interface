import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hermes/AppShell";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Eye, EyeOff, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Hermes" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <div className="scrollbar-thin h-full w-full overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-10">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your Hermes-compatible endpoint and model preferences.
          </p>
          <div className="mt-8 space-y-6">
            <ConnectionCard />
            <ModelCard />
            <AppearanceCard />
            <ShortcutsCard />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 p-6">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function ConnectionCard() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const [show, setShow] = useState(false);
  const [base, setBase] = useState(settings.baseUrl);
  const [key, setKey] = useState(settings.apiKey);
  return (
    <Card title="Connection" desc="OpenAI-compatible endpoint (Hermes gateway, OpenRouter, NVIDIA, Google, etc.)">
      <div>
        <Label className="mb-1.5 block text-xs">Base URL</Label>
        <Input value={base} onChange={(e) => setBase(e.target.value)} placeholder="https://api.openai.com/v1" />
      </div>
      <div>
        <Label className="mb-1.5 block text-xs">API Key</Label>
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            value={key} onChange={(e) => setKey(e.target.value)}
            placeholder="sk-…"
            className="pr-10 font-mono"
          />
          <button onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">Stored locally in your browser. Never sent to Lovable.</p>
      </div>
      <Button
        onClick={() => { setSettings({ baseUrl: base, apiKey: key }); toast.success("Connection saved"); }}
        className="bg-gradient-to-r from-primary to-cyber"
      >
        <Save className="mr-2 h-4 w-4" /> Save
      </Button>
    </Card>
  );
}

function ModelCard() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  return (
    <Card title="Models">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs">Main model</Label>
          <Input value={settings.model} onChange={(e) => setSettings({ model: e.target.value })} className="font-mono" />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Auxiliary model</Label>
          <Input value={settings.auxModel} onChange={(e) => setSettings({ auxModel: e.target.value })} className="font-mono" />
        </div>
      </div>
      <div>
        <Label className="mb-2 block text-xs">Temperature: <span className="font-mono text-neon">{settings.temperature.toFixed(2)}</span></Label>
        <Slider min={0} max={2} step={0.05} value={[settings.temperature]} onValueChange={([v]) => setSettings({ temperature: v })} />
      </div>
    </Card>
  );
}

function AppearanceCard() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  return (
    <Card title="Appearance">
      <div className="flex gap-2">
        {(["dark", "light"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setSettings({ theme: t }); document.documentElement.classList.toggle("light", t === "light"); }}
            className={`flex-1 rounded-lg border px-4 py-3 text-sm capitalize transition ${
              settings.theme === t ? "border-primary bg-accent" : "border-border/60 hover:bg-surface"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </Card>
  );
}

function ShortcutsCard() {
  const list = [
    ["⌘K", "Command palette"],
    ["⌘N", "New session"],
    ["↵", "Send message"],
    ["⇧↵", "New line"],
    ["/", "Slash commands"],
  ];
  return (
    <Card title="Keyboard shortcuts">
      <div className="grid gap-2 sm:grid-cols-2">
        {list.map(([k, d]) => (
          <div key={k} className="flex items-center justify-between rounded-md border border-border/60 bg-surface/40 px-3 py-2 text-sm">
            <span>{d}</span>
            <kbd className="rounded bg-surface px-2 py-0.5 font-mono text-xs">{k}</kbd>
          </div>
        ))}
      </div>
    </Card>
  );
}
