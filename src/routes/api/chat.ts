import { createFileRoute } from "@tanstack/react-router";

// Streaming tutor endpoint. The AI key and prompt stay on the server.
export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleChat } = await import("@/lib/ai/chat.server");
        return handleChat(request);
      },
    },
  },
});
