import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hermes/AppShell";
import { useStore, WALLPAPER_PRESETS, DEFAULT_WALLPAPER } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Eye, EyeOff, Save, Check, Upload, Trash2, RotateCcw, Github, ExternalLink } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
            <WallpaperCard />
            <ShortcutsCard />
            <AboutCard />
            <DangerCard />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Card({ title, desc, children, danger }: { title: string; desc?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`glass-soft rounded-2xl p-6 ${danger ? "border-destructive/30" : ""}`}>
      <h2 className={`text-sm font-semibold tracking-tight ${danger ? "text-destructive" : ""}`}>{title}</h2>
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
          <Input type={show ? "text" : "password"} value={key} onChange={(e) => setKey(e.target.value)}
            placeholder="sk-…" className="pr-10 font-mono" />
          <button onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">Stored locally in your browser. Never sent to Lovable.</p>
      </div>
      <Button onClick={() => { setSettings({ baseUrl: base, apiKey: key }); toast.success("Connection saved"); }}
        className="bg-white/[0.08] hover:bg-white/[0.14] border border-white/10">
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
          <button key={t}
            onClick={() => { setSettings({ theme: t }); document.documentElement.classList.toggle("light", t === "light"); }}
            className={`flex-1 rounded-lg border px-4 py-3 text-sm capitalize transition ${
              settings.theme === t ? "border-white/[0.20] bg-white/[0.08]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
            }`}>
            {t}
          </button>
        ))}
      </div>
    </Card>
  );
}

function WallpaperCard() {
  const wallpaper = useStore((s) => s.settings.wallpaper);
  const setSettings = useStore((s) => s.setSettings);
  const [advanced, setAdvanced] = useState(false);
  const [url, setUrl] = useState(wallpaper.type === "image" ? wallpaper.value : "");
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Card title="Wallpaper" desc="Background layer behind the liquid glass surfaces.">
      <div>
        <Label className="mb-2 block text-xs">Presets</Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {WALLPAPER_PRESETS.map((p) => {
            const selected = wallpaper.type === "gradient" && wallpaper.value === p.value;
            return (
              <button key={p.name} title={p.name}
                onClick={() => setSettings({ wallpaper: { type: "gradient", value: p.value } })}
                className={`relative h-10 w-full overflow-hidden rounded-lg border transition ${
                  selected ? "border-white/30 ring-2 ring-white/20" : "border-white/[0.08] hover:border-white/[0.16]"
                }`}
                style={{ background: p.value }}>
                {selected && (
                  <span className="absolute inset-0 grid place-items-center bg-black/30">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-xs hover:bg-white/[0.08]">
          <Upload className="h-3.5 w-3.5" /> Upload image
        </button>
        <button onClick={() => setSettings({ wallpaper: DEFAULT_WALLPAPER })}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-xs hover:bg-white/[0.08]">
          None / Default
        </button>
        <button onClick={() => setAdvanced(!advanced)}
          className="ml-auto rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
          {advanced ? "Hide advanced" : "Advanced"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => setSettings({ wallpaper: { type: "image", value: String(reader.result) } });
            reader.readAsDataURL(f);
          }} />
      </div>

      {wallpaper.type === "image" && (
        <div className="flex items-center gap-3">
          <div className="h-12 w-20 rounded-md border border-white/[0.08]"
            style={{ backgroundImage: `url(${wallpaper.value})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          <span className="text-xs text-muted-foreground">Custom image active</span>
        </div>
      )}

      {advanced && (
        <div>
          <Label className="mb-1.5 block text-xs">Image URL</Label>
          <div className="flex gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            <Button onClick={() => url && setSettings({ wallpaper: { type: "image", value: url } })}
              className="bg-white/[0.08] hover:bg-white/[0.14] border border-white/10">Set</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function ShortcutsCard() {
  const list = [
    ["⌘K", "Command palette"],
    ["⌘N", "New session"],
    ["⌘B", "Toggle left sidebar"],
    ["⌘⇧B", "Toggle right sidebar"],
    ["↵", "Send message"],
    ["⇧↵", "New line"],
    ["/", "Slash commands"],
  ];
  return (
    <Card title="Keyboard shortcuts">
      <div className="grid gap-2 sm:grid-cols-2">
        {list.map(([k, d]) => (
          <div key={k} className="flex items-center justify-between rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm">
            <span>{d}</span>
            <kbd className="rounded bg-white/[0.06] px-2 py-0.5 font-mono text-xs">{k}</kbd>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AboutCard() {
  return (
    <Card title="About">
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Version</span>
          <span className="font-mono text-xs">0.1.0</span>
        </div>
        <a href="https://github.com" target="_blank" rel="noreferrer"
          className="flex items-center justify-between rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm hover:bg-white/[0.04]">
          <span className="flex items-center gap-2"><Github className="h-3.5 w-3.5" /> GitHub repository</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </a>
        <a href="https://hermes-agent.nousresearch.com" target="_blank" rel="noreferrer"
          className="flex items-center justify-between rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm hover:bg-white/[0.04]">
          <span>Built on Hermes Agent</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </a>
      </div>
    </Card>
  );
}

function DangerCard() {
  const clear = useStore((s) => s.clearAllSessions);
  const reset = useStore((s) => s.resetSettings);
  return (
    <Card title="Danger zone" desc="These actions cannot be undone." danger>
      <div className="flex flex-wrap gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="border border-destructive/30 text-destructive hover:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Clear all sessions
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete every session?</AlertDialogTitle>
              <AlertDialogDescription>
                All conversations will be permanently removed from this browser.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { clear(); toast.success("All sessions cleared"); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete all
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="border border-white/[0.10] hover:bg-white/[0.06]">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset settings
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
              <AlertDialogDescription>
                Connection, models, theme, and wallpaper will return to defaults. Sessions are preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { reset(); toast.success("Settings reset"); }}>
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}
