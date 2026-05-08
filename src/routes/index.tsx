import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hermes/AppShell";
import { ChatArea } from "@/components/hermes/ChatArea";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hermes Companion — AI Agent" },
      { name: "description", content: "A persistent, self-improving AI agent companion." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <ChatArea />
    </AppShell>
  );
}
