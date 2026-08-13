DROP POLICY IF EXISTS "Admins can read donations" ON public.doacoes;
DROP POLICY IF EXISTS "Admins can update donations" ON public.doacoes;
DROP POLICY IF EXISTS "Admins can delete donations" ON public.doacoes;

CREATE POLICY "Admins can read donations" ON public.doacoes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

CREATE POLICY "Admins can update donations" ON public.doacoes FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

CREATE POLICY "Admins can delete donations" ON public.doacoes FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated, anon, PUBLIC;