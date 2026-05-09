import { useEffect } from "react";
import { LeftSidebar, useNewSessionShortcut } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { CommandPalette } from "./CommandPalette";
import { TopBar } from "./TopBar";
import { useStore } from "@/lib/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  useNewSessionShortcut();
  const setLeft = useStore((s) => s.setLeftCollapsed);
  const setRight = useStore((s) => s.setRightCollapsed);
  const wallpaper = useStore((s) => s.settings.wallpaper);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const apply = () => {
      const w = window.innerWidth;
      if (w < 1024) { setLeft(true); setRight(true); }
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [setLeft, setRight]);

  const wpStyle: React.CSSProperties =
    wallpaper.type === "image"
      ? {
          backgroundImage: `url(${wallpaper.value})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : wallpaper.type === "gradient"
      ? { background: wallpaper.value }
      : {};

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      {/* Wallpaper layer */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={wpStyle}
      />
      <div className="relative z-10 flex h-full w-full">
        <LeftSidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex min-h-0 flex-1">{children}</main>
        </div>
        <RightSidebar />
        <CommandPalette />
      </div>
    </div>
  );
}
