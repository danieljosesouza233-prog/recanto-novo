import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso restrito | Ajude o Pitoco" },
      { name: "description", content: "Área administrativa da campanha Ajude o Pitoco." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Acesso restrito | Ajude o Pitoco" },
      { property: "og:description", content: "Área administrativa da campanha Ajude o Pitoco." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const ADMIN_EMAIL_DOMAIN = "ajude-o-pitoco.local";

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const email = username.includes("@")
      ? username.trim()
      : `${username.trim().toLowerCase()}@${ADMIN_EMAIL_DOMAIN}`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage("Usuário ou senha inválidos.");
      return;
    }
    void navigate({ to: "/admin", replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-5 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-background p-7 shadow-xl">
        <div className="flex items-center justify-center gap-2">
          <Heart size={20} className="text-primary" fill="currentColor" />
          <span className="text-lg font-extrabold tracking-tight">
            Ajude o <span className="font-normal">Pitoco</span>
          </span>
        </div>
        <h1 className="mt-5 text-center text-xl font-extrabold tracking-tight">
          Acesso administrativo
        </h1>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Área restrita para acompanhar as doações.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuário"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm font-semibold outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm font-semibold outline-none focus:border-primary"
          />
          {message && <p className="text-xs font-semibold text-destructive">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-cta flex h-[54px] w-full items-center justify-center gap-2 px-6 text-base disabled:opacity-60"
          >
            <Lock size={16} /> {loading ? "Aguarde..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
