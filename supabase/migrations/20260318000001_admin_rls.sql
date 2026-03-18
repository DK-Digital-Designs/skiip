-- Add Admin RLS Policies

-- For user_profiles
CREATE POLICY "Admins can view and edit all profiles" ON public.user_profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- For stores
CREATE POLICY "Admins can view and edit all stores" ON public.stores
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- For products
CREATE POLICY "Admins can view and edit all products" ON public.products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- For orders
CREATE POLICY "Admins can view and edit all orders" ON public.orders
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);
