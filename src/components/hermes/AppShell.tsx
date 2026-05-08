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

  // Auto-collapse on small screens
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <LeftSidebar />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex min-h-0 flex-1">{children}</main>
      </div>
      <RightSidebar />
      <CommandPalette />
    </div>
  );
}
