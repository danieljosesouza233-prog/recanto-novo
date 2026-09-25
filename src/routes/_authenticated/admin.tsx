import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Download,
  FileText,
  History,
  LogOut,
  Pencil,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  claimFirstAdmin,
  deleteDonation,
  listAuditLog,
  listDeletedDonations,
  listDonations,
  listMetaEvents,
  restoreDonation,
  setDonationPago,
  setDonationValor,
} from "@/lib/donations.functions";

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
  pago: boolean;
};

type DeletedDonation = Donation & { deleted_at: string };

type AuditEntry = {
  id: string;
  doacao_id: string;
  action: "created" | "deleted" | "restored";
  actor_user_id: string | null;
  nome: string;
  celular: string;
  valor: number;
  status: string;
  created_at: string;
};

const actionLabel: Record<AuditEntry["action"], string> = {
  created: "Criada",
  deleted: "Excluída",
  restored: "Restaurada",
};

const actionStyle: Record<AuditEntry["action"], string> = {
  created: "bg-primary-soft text-primary-dark",
  deleted: "bg-destructive/10 text-destructive",
  restored: "bg-muted text-muted-foreground",
};

type MetaEvent = {
  id: string;
  doacao_id: string | null;
  event_name: string;
  event_id: string;
  status: "success" | "failed";
  http_status: number | null;
  error: string | null;
  requested_at: string;
  responded_at: string | null;
  latency_ms: number | null;
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
  const listDeleted = useServerFn(listDeletedDonations);
  const restore = useServerFn(restoreDonation);
  const listAudit = useServerFn(listAuditLog);
  const listEvents = useServerFn(listMetaEvents);
  const setPago = useServerFn(setDonationPago);
  const setValor = useServerFn(setDonationValor);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [tab, setTab] = useState<"doacoes" | "lixeira" | "auditoria" | "eventos">("doacoes");
  const [togglingPagoId, setTogglingPagoId] = useState<string | null>(null);
  const [editingValorId, setEditingValorId] = useState<string | null>(null);
  const [valorDraft, setValorDraft] = useState("");
  const [savingValorId, setSavingValorId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"todos" | "chave_copiada" | "dados_enviados">("todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

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

  const {
    data: deletedData,
    isLoading: isLoadingDeleted,
    error: deletedError,
    refetch: refetchDeleted,
    isFetching: isFetchingDeleted,
  } = useQuery({
    queryKey: ["donations-deleted"],
    queryFn: () => listDeleted({}) as Promise<DeletedDonation[]>,
    enabled: bootstrapped && tab === "lixeira",
  });

  const {
    data: auditData,
    isLoading: isLoadingAudit,
    error: auditError,
    refetch: refetchAudit,
    isFetching: isFetchingAudit,
  } = useQuery({
    queryKey: ["donations-audit"],
    queryFn: () => listAudit({}) as Promise<AuditEntry[]>,
    enabled: bootstrapped && tab === "auditoria",
  });

  const {
    data: eventsData,
    isLoading: isLoadingEvents,
    error: eventsError,
    refetch: refetchEvents,
    isFetching: isFetchingEvents,
  } = useQuery({
    queryKey: ["meta-events"],
    queryFn: () => listEvents({}) as Promise<MetaEvent[]>,
    enabled: bootstrapped && tab === "eventos",
  });

  const eventsStats = useMemo(() => {
    const list = eventsData ?? [];
    const success = list.filter((e) => e.status === "success");
    const failed = list.filter((e) => e.status === "failed");
    const latencies = success.map((e) => e.latency_ms).filter((v): v is number => v != null);
    const avgLatency = latencies.length
      ? Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length)
      : null;
    return { total: list.length, success: success.length, failed: failed.length, avgLatency };
  }, [eventsData]);

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
    if (!window.confirm("Mover esta doação para a lixeira?")) return;
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

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await restore({ data: { id } });
      await Promise.all([refetchDeleted(), refetch()]);
    } catch {
      window.alert("Não foi possível restaurar esta doação.");
    } finally {
      setRestoringId(null);
    }
  };

  const handleTogglePago = async (d: Donation) => {
    setTogglingPagoId(d.id);
    try {
      await setPago({ data: { id: d.id, pago: !d.pago } });
      await refetch();
    } catch {
      window.alert("Não foi possível atualizar o status de pagamento.");
    } finally {
      setTogglingPagoId(null);
    }
  };

  const startEditValor = (d: Donation) => {
    setEditingValorId(d.id);
    setValorDraft(String(d.valor));
  };

  const cancelEditValor = () => {
    setEditingValorId(null);
    setValorDraft("");
  };

  const saveValor = async (id: string) => {
    const parsed = Number(valorDraft.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) {
      window.alert("Valor inválido.");
      return;
    }
    setSavingValorId(id);
    try {
      await setValor({ data: { id, valor: parsed } });
      await refetch();
      setEditingValorId(null);
    } catch {
      window.alert("Não foi possível atualizar o valor.");
    } finally {
      setSavingValorId(null);
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

        <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-border">
          {(
            [
              { key: "doacoes", label: "Doações", icon: Users },
              { key: "lixeira", label: "Lixeira", icon: Trash2 },
              { key: "auditoria", label: "Auditoria", icon: History },
              { key: "eventos", label: "Eventos Meta", icon: Send },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold ${
                tab === key
                  ? "border-primary text-primary-dark"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {tab === "doacoes" && (
        <>
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
                  <th className="px-4 py-3">Pago</th>
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
                    <td className="whitespace-nowrap px-4 py-3 font-bold">
                      {editingValorId === d.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            inputMode="decimal"
                            autoFocus
                            value={valorDraft}
                            onChange={(e) => setValorDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void saveValor(d.id);
                              if (e.key === "Escape") cancelEditValor();
                            }}
                            className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm font-bold"
                          />
                          <button
                            onClick={() => void saveValor(d.id)}
                            disabled={savingValorId === d.id}
                            aria-label="Salvar valor"
                            className="rounded-lg p-1 text-primary-dark hover:bg-primary-soft disabled:opacity-50"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={cancelEditValor}
                            aria-label="Cancelar edição"
                            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditValor(d)}
                          className="group flex items-center gap-1.5 hover:text-primary-dark"
                          aria-label="Editar valor"
                        >
                          {brl(Number(d.valor))}
                          <Pencil size={12} className="opacity-0 group-hover:opacity-60" />
                        </button>
                      )}
                    </td>
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
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        onClick={() => void handleTogglePago(d)}
                        disabled={togglingPagoId === d.id}
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-colors disabled:opacity-50 ${
                          d.pago
                            ? "bg-primary-soft text-primary-dark"
                            : "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        }`}
                      >
                        {d.pago ? "Pago" : "Não pago"}
                      </button>
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
        </>
        )}

        {tab === "lixeira" && (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Doações excluídas ficam aqui e podem ser restauradas a qualquer momento.
              </p>
              <button
                onClick={() => void refetchDeleted()}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary"
              >
                <RefreshCw size={14} className={isFetchingDeleted ? "animate-spin" : ""} /> Atualizar
              </button>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border bg-background">
              {isLoadingDeleted && <p className="p-6 text-sm text-muted-foreground">Carregando...</p>}
              {deletedError && (
                <p className="p-6 text-sm font-semibold text-destructive">
                  Você não tem permissão para ver a lixeira.
                </p>
              )}
              {!isLoadingDeleted && !deletedError && (deletedData ?? []).length === 0 && (
                <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                  <Trash2 size={16} /> A lixeira está vazia.
                </p>
              )}
              {(deletedData ?? []).length > 0 && (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Excluída em</th>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Celular</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {(deletedData ?? []).map((d) => (
                      <tr key={d.id} className="border-b border-border/60 last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {new Date(d.deleted_at).toLocaleString("pt-BR")}
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
                            onClick={() => void handleRestore(d.id)}
                            disabled={restoringId === d.id}
                            aria-label="Restaurar doação"
                            className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary-dark disabled:opacity-50"
                          >
                            <RotateCcw size={13} /> Restaurar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === "auditoria" && (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Histórico de criação, exclusão e restauração de doações — pra rastrear qualquer divergência.
              </p>
              <button
                onClick={() => void refetchAudit()}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary"
              >
                <RefreshCw size={14} className={isFetchingAudit ? "animate-spin" : ""} /> Atualizar
              </button>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border bg-background">
              {isLoadingAudit && <p className="p-6 text-sm text-muted-foreground">Carregando...</p>}
              {auditError && (
                <p className="p-6 text-sm font-semibold text-destructive">
                  Você não tem permissão para ver a auditoria.
                </p>
              )}
              {!isLoadingAudit && !auditError && (auditData ?? []).length === 0 && (
                <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                  <History size={16} /> Nenhum evento registrado ainda.
                </p>
              )}
              {(auditData ?? []).length > 0 && (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Quando</th>
                      <th className="px-4 py-3">Ação</th>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Celular</th>
                      <th className="px-4 py-3">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(auditData ?? []).map((a) => (
                      <tr key={a.id} className="border-b border-border/60 last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {new Date(a.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`rounded-lg px-2 py-1 text-[11px] font-bold ${actionStyle[a.action]}`}>
                            {actionLabel[a.action]}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">{a.nome}</td>
                        <td className="whitespace-nowrap px-4 py-3">{a.celular}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-bold">{brl(Number(a.valor))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === "eventos" && (
          <div className="mt-5">
            <p className="mb-3 text-sm text-muted-foreground">
              Cada evento (pixel + Conversions API) enviado ao Meta fica registrado aqui — mostra se o
              Facebook confirmou o recebimento (sucesso) ou recusou/falhou, com o horário exato e o tempo
              de resposta. Não mostra quando o Facebook processa internamente o evento pra dentro das
              campanhas — isso não é exposto pela API deles, só aparece no Gerenciador de Anúncios.
            </p>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total
                </div>
                <div className="mt-1 text-2xl font-extrabold">{eventsStats.total}</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Enviados
                </div>
                <div className="mt-1 text-2xl font-extrabold text-primary-dark">{eventsStats.success}</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Falharam
                </div>
                <div className="mt-1 text-2xl font-extrabold text-destructive">{eventsStats.failed}</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Latência média
                </div>
                <div className="mt-1 text-2xl font-extrabold">
                  {eventsStats.avgLatency != null ? `${eventsStats.avgLatency}ms` : "—"}
                </div>
              </div>
            </div>
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => void refetchEvents()}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary"
              >
                <RefreshCw size={14} className={isFetchingEvents ? "animate-spin" : ""} /> Atualizar
              </button>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border bg-background">
              {isLoadingEvents && <p className="p-6 text-sm text-muted-foreground">Carregando...</p>}
              {eventsError && (
                <p className="p-6 text-sm font-semibold text-destructive">
                  Você não tem permissão para ver os eventos do Meta.
                </p>
              )}
              {!isLoadingEvents && !eventsError && (eventsData ?? []).length === 0 && (
                <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                  <Send size={16} /> Nenhum evento registrado ainda.
                </p>
              )}
              {(eventsData ?? []).length > 0 && (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Enviado em</th>
                      <th className="px-4 py-3">Evento</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Resposta (ms)</th>
                      <th className="px-4 py-3">Detalhe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(eventsData ?? []).map((e) => (
                      <tr key={e.id} className="border-b border-border/60 last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {new Date(e.requested_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 font-semibold">{e.event_name}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                              e.status === "success"
                                ? "bg-primary-soft text-primary-dark"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {e.status === "success" ? "Enviado" : "Falhou"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{e.latency_ms ?? "—"}</td>
                        <td className="max-w-xs truncate px-4 py-3 text-xs text-muted-foreground">
                          {e.status === "failed" ? e.error : e.http_status ? `HTTP ${e.http_status}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
