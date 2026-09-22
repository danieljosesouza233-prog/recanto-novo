import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Download, FileText, LogOut, RefreshCw, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { claimFirstAdmin, deleteDonation, listDonations } from "@/lib/donations.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel de doações | Ajude o Pitoco" },
      { name: "description", content: "Controle interno das doações recebidas na campanha." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Painel de doações | Ajude o Pitoco" },
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

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const claim = useServerFn(claimFirstAdmin);
  const list = useServerFn(listDonations);
  const remove = useServerFn(deleteDonation);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [filter, setFilter] = useState<"todos" | "chave_copiada" | "dados_enviados">("todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const rows = useMemo(() => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    return (data ?? []).filter((d) => {
      if (filter !== "todos" && d.status !== filter) return false;
      const created = new Date(d.created_at);
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
  }, [data, filter, dateFrom, dateTo]);

  const total = rows.reduce((sum, d) => sum + Number(d.valor), 0);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Excluir esta doação da lista? Essa ação não pode ser desfeita.")) return;
    setDeletingId(id);
    try {
      await remove({ data: { id } });
      await refetch();
    } catch {
      window.alert("Não foi possível excluir esta doação.");
    } finally {
      setDeletingId(null);
    }
  };

  const periodLabel = () => {
    if (dateFrom && dateTo) return `${dateFrom} a ${dateTo}`;
    if (dateFrom) return `a partir de ${dateFrom}`;
    if (dateTo) return `até ${dateTo}`;
    return "todo o período";
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
    const blob = new Blob([`﻿${header}${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `doacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rowsHtml = rows
      .map(
        (d) => `
          <tr>
            <td>${new Date(d.created_at).toLocaleString("pt-BR")}</td>
            <td>${d.nome.replace(/</g, "&lt;")}</td>
            <td>${d.celular}</td>
            <td class="valor">${brl(Number(d.valor))}</td>
            <td>
              <span class="badge ${d.status === "chave_copiada" ? "badge-ok" : "badge-muted"}">
                ${d.status === "chave_copiada" ? "Chave copiada" : "Dados enviados"}
              </span>
            </td>
          </tr>`,
      )
      .join("");

    win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charSet="utf-8" />
<title>Relatório de doações — Ajude o Pitoco</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Inter, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    color: #222;
    margin: 0;
    padding: 24px;
  }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .brand .dot {
    width: 32px; height: 32px; border-radius: 12px;
    background: #20C05C; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 16px;
  }
  .brand .name { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }
  h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; margin: 18px 0 2px; }
  .subtitle { color: #6B7280; font-size: 12px; margin-bottom: 20px; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 22px; }
  .stat {
    background: #EAF9F0; border-radius: 14px; padding: 12px 14px;
  }
  .stat .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #0F9B46; }
  .stat .value { font-size: 18px; font-weight: 800; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th {
    text-align: left; text-transform: uppercase; font-size: 9px; letter-spacing: .05em;
    color: #6B7280; border-bottom: 2px solid #EAF9F0; padding: 8px 6px;
  }
  tbody td { padding: 8px 6px; border-bottom: 1px solid #F0F0F0; }
  td.valor { font-weight: 700; }
  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 700;
  }
  .badge-ok { background: #EAF9F0; color: #0F9B46; }
  .badge-muted { background: #F0F0F0; color: #6B7280; }
  .footer { margin-top: 24px; font-size: 10px; color: #6B7280; text-align: center; }
</style>
</head>
<body>
  <div class="brand"><span class="dot">♥</span><span class="name">Ajude o Pitoco</span></div>
  <h1>Relatório de doações</h1>
  <div class="subtitle">Período: ${periodLabel()} · Gerado em ${new Date().toLocaleString("pt-BR")}</div>

  <div class="stats">
    <div class="stat"><div class="label">Registros</div><div class="value">${rows.length}</div></div>
    <div class="stat"><div class="label">Valor somado</div><div class="value">${brl(total)}</div></div>
    <div class="stat"><div class="label">Chave copiada</div><div class="value">${rows.filter((d) => d.status === "chave_copiada").length}</div></div>
  </div>

  <table>
    <thead>
      <tr><th>Data</th><th>Nome</th><th>Celular</th><th>Valor</th><th>Status</th></tr>
    </thead>
    <tbody>${rowsHtml || `<tr><td colspan="5" style="text-align:center;color:#6B7280;padding:20px;">Nenhuma doação no período selecionado.</td></tr>`}</tbody>
  </table>

  <div class="footer">Relatório interno — Ajude o Pitoco. Não compartilhar publicamente.</div>
</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
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
              onClick={exportPdf}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary"
            >
              <FileText size={14} /> PDF
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

        <div className="mt-5 flex flex-wrap items-center gap-2">
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

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              De
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              Até
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                max={toDateInputValue(new Date())}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold"
              />
            </label>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-xs font-semibold text-muted-foreground underline hover:text-foreground"
              >
                Limpar período
              </button>
            )}
          </div>
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
              <Users size={16} /> Nenhuma doação no período/filtro selecionado.
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
                  <th className="px-4 py-3" />
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
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        onClick={() => void handleDelete(d.id)}
                        disabled={deletingId === d.id}
                        aria-label="Excluir doação"
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
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
