import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso restrito | Instituto do Amor" },
      { name: "description", content: "Área administrativa do Instituto do Amor." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Acesso restrito | Instituto do Amor" },
      { property: "og:description", content: "Área administrativa do Instituto do Amor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
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
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setMessage("E-mail ou senha inválidos.");
        return;
      }
      void navigate({ to: "/admin", replace: true });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setLoading(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Conta criada! Se pedir confirmação, verifique seu e-mail e depois entre.");
      setMode("login");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-5 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-background p-7 shadow-xl">
        <div className="flex items-center justify-center gap-2">
          <Heart size={20} className="text-primary" fill="currentColor" />
          <span className="text-lg font-extrabold tracking-tight">
            Instituto <span className="font-normal">do</span> Amor
          </span>
        </div>
        <h1 className="mt-5 text-center text-xl font-extrabold tracking-tight">
          {mode === "login" ? "Acesso administrativo" : "Criar acesso administrativo"}
        </h1>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Área restrita para acompanhar as doações.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm font-semibold outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha (mín. 8 caracteres)"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm font-semibold outline-none focus:border-primary"
          />
          {message && <p className="text-xs font-semibold text-destructive">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-cta flex h-[54px] w-full items-center justify-center gap-2 px-6 text-base disabled:opacity-60"
          >
            <Lock size={16} /> {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
          className="mt-4 w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          {mode === "login" ? "Primeiro acesso? Criar conta" : "Já tenho conta. Entrar"}
        </button>
      </div>
    </main>
  );
}
