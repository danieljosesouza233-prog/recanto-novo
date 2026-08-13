CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE TABLE public.doacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  celular text NOT NULL,
  valor numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'dados_enviados',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX doacoes_created_at_idx ON public.doacoes (created_at DESC);

GRANT INSERT ON public.doacoes TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.doacoes TO authenticated;
GRANT ALL ON public.doacoes TO service_role;

ALTER TABLE public.doacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register a donation" ON public.doacoes
  FOR INSERT TO anon, authenticated WITH CHECK (
    length(nome) BETWEEN 1 AND 120
    AND length(celular) BETWEEN 8 AND 40
    AND valor >= 0 AND valor <= 1000000
    AND status IN ('dados_enviados','chave_copiada')
  );

CREATE POLICY "Admins can read donations" ON public.doacoes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update donations" ON public.doacoes
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete donations" ON public.doacoes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER doacoes_set_updated_at BEFORE UPDATE ON public.doacoes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();