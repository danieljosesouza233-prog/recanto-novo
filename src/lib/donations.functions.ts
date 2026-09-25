import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const recordSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  celular: z.string().trim().min(8).max(40),
  valor: z.number().nonnegative().max(1000000),
});

const markSchema = z.object({ id: z.string().uuid() });

/** Grava os dados do doador (etapa 2). */
export const recordDonation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => recordSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("doacoes")
      .insert({
        nome: data.nome,
        celular: data.celular,
        valor: data.valor,
        status: "dados_enviados",
      })
      .select("id")
      .single();
    if (error) return { id: null as string | null };
    await supabaseAdmin.from("doacoes_audit_log").insert({
      doacao_id: row.id,
      action: "created",
      nome: data.nome,
      celular: data.celular,
      valor: data.valor,
      status: "dados_enviados",
    });
    return { id: row.id as string };
  });

/** Marca que a pessoa copiou a chave PIX (etapa 3). */
export const markDonationCopied = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => markSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("doacoes")
      .update({ status: "chave_copiada" })
      .eq("id", data.id)
      .eq("status", "dados_enviados");
    return { ok: true };
  });

const deleteSchema = z.object({ id: z.string().uuid() });

/** Move uma doação para a lixeira (soft delete) — somente administradores. */
export const deleteDonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error: fetchError } = await context.supabase
      .from("doacoes")
      .select("nome, celular, valor, status")
      .eq("id", data.id)
      .single();
    if (fetchError || !row) throw new Error("Doação não encontrada.");

    const { error } = await context.supabase
      .from("doacoes")
      .update({ deleted_at: new Date().toISOString(), deleted_by: context.userId })
      .eq("id", data.id);
    if (error) throw new Error("Sem permissão para excluir esta doação.");

    await context.supabase.from("doacoes_audit_log").insert({
      doacao_id: data.id,
      action: "deleted",
      actor_user_id: context.userId,
      nome: row.nome,
      celular: row.celular,
      valor: row.valor,
      status: row.status,
    });
    return { ok: true };
  });

/** Restaura uma doação da lixeira — somente administradores. */
export const restoreDonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error: fetchError } = await context.supabase
      .from("doacoes")
      .select("nome, celular, valor, status")
      .eq("id", data.id)
      .single();
    if (fetchError || !row) throw new Error("Doação não encontrada.");

    const { error } = await context.supabase
      .from("doacoes")
      .update({ deleted_at: null, deleted_by: null })
      .eq("id", data.id);
    if (error) throw new Error("Sem permissão para restaurar esta doação.");

    await context.supabase.from("doacoes_audit_log").insert({
      doacao_id: data.id,
      action: "restored",
      actor_user_id: context.userId,
      nome: row.nome,
      celular: row.celular,
      valor: row.valor,
      status: row.status,
    });
    return { ok: true };
  });

/** Lista as doações ativas (não excluídas) — somente administradores. */
export const listDonations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("doacoes")
      .select("id, nome, celular, valor, status, created_at, pago")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error("Sem permissão para ver as doações.");
    return data ?? [];
  });

/** Lista as doações na lixeira (excluídas) — somente administradores. */
export const listDeletedDonations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("doacoes")
      .select("id, nome, celular, valor, status, created_at, deleted_at, pago")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error("Sem permissão para ver a lixeira.");
    return data ?? [];
  });

/** Lista o histórico de auditoria (criação/exclusão/restauração) — somente administradores. */
export const listAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("doacoes_audit_log")
      .select("id, doacao_id, action, actor_user_id, nome, celular, valor, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error("Sem permissão para ver o log de auditoria.");
    return data ?? [];
  });

const setPagoSchema = z.object({ id: z.string().uuid(), pago: z.boolean() });

/** Marca uma doação como paga/não paga — controle interno, não dispara nenhum evento de pixel. */
export const setDonationPago = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => setPagoSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("doacoes")
      .update({ pago: data.pago })
      .eq("id", data.id);
    if (error) throw new Error("Sem permissão para atualizar esta doação.");
    return { ok: true };
  });

const setValorSchema = z.object({ id: z.string().uuid(), valor: z.number().nonnegative().max(1000000) });

/** Corrige o valor de uma doação — controle interno, não dispara nenhum evento de pixel. */
export const setDonationValor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => setValorSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("doacoes")
      .update({ valor: data.valor })
      .eq("id", data.id);
    if (error) throw new Error("Sem permissão para atualizar esta doação.");
    return { ok: true };
  });

/** Lista o histórico de envio de eventos ao Meta (pixel/CAPI) — somente administradores. */
export const listMetaEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("meta_events_log")
      .select(
        "id, doacao_id, event_name, event_id, status, http_status, error, requested_at, responded_at, latency_ms",
      )
      .order("requested_at", { ascending: false })
      .limit(500);
    if (error) throw new Error("Sem permissão para ver os eventos do Meta.");
    return data ?? [];
  });

/** Indica se o usuário logado é administrador. */
export const isAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: Boolean(data) };
  });

/**
 * Bootstrap: o primeiro usuário cadastrado vira administrador.
 * Se já existir um admin, não faz nada.
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { granted: false };
    await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "admin" });
    return { granted: true };
  });
