CREATE TABLE public.meta_events_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doacao_id uuid,
  event_name text NOT NULL,
  event_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('success','failed')),
  http_status integer,
  fb_response jsonb,
  error text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  latency_ms integer
);

CREATE INDEX meta_events_log_doacao_id_idx ON public.meta_events_log (doacao_id);
CREATE INDEX meta_events_log_requested_at_idx ON public.meta_events_log (requested_at DESC);
CREATE INDEX meta_events_log_status_idx ON public.meta_events_log (status);

ALTER TABLE public.meta_events_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.meta_events_log TO authenticated;
GRANT ALL ON public.meta_events_log TO service_role;

CREATE POLICY "Admins can read meta events log" ON public.meta_events_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
