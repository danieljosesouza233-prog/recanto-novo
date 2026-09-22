ALTER TABLE public.doacoes ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.doacoes ADD COLUMN deleted_by uuid REFERENCES auth.users(id);

CREATE TABLE public.doacoes_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doacao_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('created','deleted','restored')),
  actor_user_id uuid REFERENCES auth.users(id),
  nome text NOT NULL,
  celular text NOT NULL,
  valor numeric(10,2) NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX doacoes_audit_log_doacao_id_idx ON public.doacoes_audit_log (doacao_id);
CREATE INDEX doacoes_audit_log_created_at_idx ON public.doacoes_audit_log (created_at DESC);
CREATE INDEX doacoes_deleted_at_idx ON public.doacoes (deleted_at);

ALTER TABLE public.doacoes_audit_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.doacoes_audit_log TO authenticated;
GRANT ALL ON public.doacoes_audit_log TO service_role;

CREATE POLICY "Admins can read audit log" ON public.doacoes_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit log" ON public.doacoes_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert audit log" ON public.doacoes_audit_log
  FOR INSERT TO service_role WITH CHECK (true);
