import { createFileRoute } from "@tanstack/react-router";

import { StudyApp } from "@/components/study/StudyApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AZ-900 Study Buddy (Unofficial) — Learn Azure the African way" },
      {
        name: "description",
        content:
          "An unofficial AI study buddy for Azure Fundamentals (AZ-900). Simple explanations with African examples, Kiswahili and Sheng options, and quick check questions.",
      },
      { property: "og:title", content: "AZ-900 Study Buddy (Unofficial)" },
      {
        property: "og:description",
        content: "Learn Azure the African way: simple AZ-900 explanations, local examples and instant check questions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudyApp,
});
