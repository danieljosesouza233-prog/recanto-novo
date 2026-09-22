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

/** Exclui uma doação — somente administradores (RLS exige role admin). */
export const deleteDonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("doacoes").delete().eq("id", data.id);
    if (error) throw new Error("Sem permissão para excluir esta doação.");
    return { ok: true };
  });

/** Lista as doações registradas — somente administradores. */
export const listDonations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("doacoes")
      .select("id, nome, celular, valor, status, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error("Sem permissão para ver as doações.");
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
