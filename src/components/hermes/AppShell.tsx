import { LeftSidebar, useNewSessionShortcut } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { CommandPalette } from "./CommandPalette";

export function AppShell({ children }: { children: React.ReactNode }) {
  useNewSessionShortcut();
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <LeftSidebar />
      <main className="flex h-full min-w-0 flex-1">{children}</main>
      <RightSidebar />
      <CommandPalette />
    </div>
  );
}
