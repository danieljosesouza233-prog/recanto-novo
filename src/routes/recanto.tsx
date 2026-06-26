import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "./index";
import heroFamily from "@/assets/hero-family.jpg";

export const Route = createFileRoute("/recanto")({
  head: () => ({
    meta: [
      { title: "Instituto do Amor — Ajude Joaquim a voltar a andar" },
      {
        name: "description",
        content:
          "Joaquim sofreu maus-tratos e teve a coluna fraturada. Precisamos de R$ 1.400 para sua cirurgia. Doe agora via PIX.",
      },
      { property: "og:title", content: "Ajude Joaquim a voltar a andar — Instituto do Amor" },
      {
        property: "og:description",
        content:
          "Espancado e abandonado, Joaquim precisa de cirurgia para voltar a andar. Sua doação faz a diferença.",
      },
      { property: "og:image", content: heroFamily },
      { name: "twitter:image", content: heroFamily },
    ],
  }),
  component: Landing,
});
