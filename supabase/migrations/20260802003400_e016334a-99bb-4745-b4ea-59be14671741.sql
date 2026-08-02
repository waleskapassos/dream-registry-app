CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin' AND user_id = uid);
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE public.gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  purchased_count integer NOT NULL DEFAULT 0 CHECK (purchased_count >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gifts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gifts TO authenticated;
GRANT ALL ON public.gifts TO service_role;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gifts public read" ON public.gifts FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "gifts admin read" ON public.gifts FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "gifts admin insert" ON public.gifts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "gifts admin update" ON public.gifts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "gifts admin delete" ON public.gifts FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER gifts_updated_at BEFORE UPDATE ON public.gifts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  couple_names text NOT NULL DEFAULT 'Nossos Nomes',
  wedding_date text NOT NULL DEFAULT '',
  ceremony_venue text NOT NULL DEFAULT '',
  ceremony_address text NOT NULL DEFAULT '',
  maps_url text NOT NULL DEFAULT '',
  ceremony_time text NOT NULL DEFAULT '',
  pix_key text NOT NULL DEFAULT '',
  pix_name text NOT NULL DEFAULT '',
  welcome_message text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin insert" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "settings admin update" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  attending boolean NOT NULL DEFAULT true,
  guests integer NOT NULL DEFAULT 0 CHECK (guests >= 0 AND guests <= 20),
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.rsvps TO anon, authenticated;
GRANT SELECT, DELETE ON public.rsvps TO authenticated;
GRANT ALL ON public.rsvps TO service_role;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsvp public insert" ON public.rsvps FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "rsvp admin read" ON public.rsvps FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "rsvp admin delete" ON public.rsvps FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name text NOT NULL,
  guest_email text,
  guest_phone text,
  message text,
  total_cents integer NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  payment_method text NOT NULL DEFAULT 'pix',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders admin read" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders admin delete" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  gift_id uuid REFERENCES public.gifts(id) ON DELETE SET NULL,
  title text NOT NULL,
  unit_price_cents integer NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0)
);
GRANT SELECT, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items admin read" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "order items admin delete" ON public.order_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.site_settings (id) VALUES (true);