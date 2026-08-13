import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Download, LogOut, RefreshCw, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { claimFirstAdmin, listDonations } from "@/lib/donations.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel de doações | Instituto do Amor" },
      { name: "description", content: "Controle interno das doações recebidas na campanha." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Painel de doações | Instituto do Amor" },
      {
        property: "og:description",
        content: "Controle interno das doações recebidas na campanha.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Donation = {
  id: string;
  nome: string;
  celular: string;
  valor: number;
  status: string;
  created_at: string;
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const claim = useServerFn(claimFirstAdmin);
  const list = useServerFn(listDonations);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [filter, setFilter] = useState<"todos" | "chave_copiada" | "dados_enviados">("todos");

  useEffect(() => {
    void claim({})
      .catch(() => null)
      .finally(() => setBootstrapped(true));
  }, [claim]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["donations"],
    queryFn: () => list({}) as Promise<Donation[]>,
    enabled: bootstrapped,
  });

  const rows = useMemo(
    () => (data ?? []).filter((d) => filter === "todos" || d.status === filter),
    [data, filter],
  );

  const total = rows.reduce((sum, d) => sum + Number(d.valor), 0);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  const exportCsv = () => {
    const header = "Data,Nome,Celular,Valor,Status\n";
    const body = rows
      .map((d) =>
        [
          new Date(d.created_at).toLocaleString("pt-BR"),
          `"${d.nome.replace(/"/g, '""')}"`,
          d.celular,
          Number(d.valor).toFixed(2).replace(".", ","),
          d.status === "chave_copiada" ? "Chave copiada" : "Dados enviados",
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([`\uFEFF${header}${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `doacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Painel de doações</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Nome, celular e valor informados pelos doadores.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void refetch()}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} /> Atualizar
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary"
            >
              <Download size={14} /> CSV
            </button>
            <button
              onClick={() => void signOut()}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Registros
            </div>
            <div className="mt-1 text-2xl font-extrabold">{rows.length}</div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Valor somado
            </div>
            <div className="mt-1 text-2xl font-extrabold">{brl(total)}</div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Chave copiada
            </div>
            <div className="mt-1 text-2xl font-extrabold">
              {rows.filter((d) => d.status === "chave_copiada").length}
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          {(["todos", "chave_copiada", "dados_enviados"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-2 text-xs font-bold ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background"
              }`}
            >
              {f === "todos" ? "Todos" : f === "chave_copiada" ? "Chave copiada" : "Só dados"}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-background">
          {isLoading && <p className="p-6 text-sm text-muted-foreground">Carregando...</p>}
          {error && (
            <p className="p-6 text-sm font-semibold text-destructive">
              Você não tem permissão para ver as doações.
            </p>
          )}
          {!isLoading && !error && rows.length === 0 && (
            <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Users size={16} /> Nenhuma doação registrada ainda.
            </p>
          )}
          {rows.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Celular</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-b border-border/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(d.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 font-semibold">{d.nome}</td>
                    <td className="whitespace-nowrap px-4 py-3">{d.celular}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-bold">{brl(Number(d.valor))}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                          d.status === "chave_copiada"
                            ? "bg-primary-soft text-primary-dark"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {d.status === "chave_copiada" ? "Chave copiada" : "Dados enviados"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
