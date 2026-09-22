import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "./index";
import heroFamily from "@/assets/pitoco.png";

export const Route = createFileRoute("/pitoco")({
  head: () => ({
    meta: [
      { title: "Ajude o Pitoco a se Recuperar" },
      {
        name: "description",
        content:
          "Pitoco foi maltratado e abandonado às margens de uma rodovia, correndo risco de perder a visão. Precisamos de R$ 1.400 para exames, tratamento e possível cirurgia. Doe agora via PIX.",
      },
      { property: "og:title", content: "Ajude o Pitoco a se Recuperar! ❤️" },
      {
        property: "og:description",
        content:
          "Maltratado e abandonado, Pitoco corre risco de perder a visão. Sua doação faz a diferença.",
      },
      { property: "og:image", content: heroFamily },
      { name: "twitter:image", content: heroFamily },
    ],
  }),
  component: Landing,
});
