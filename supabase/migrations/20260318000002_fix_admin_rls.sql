-- Fix Infinite Recursion in Admin RLS Policies

-- Create a secure function to check admin status that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (role = 'admin') INTO is_admin FROM public.user_profiles WHERE id = auth.uid();
  RETURN COALESCE(is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the broken recursive policies
DROP POLICY IF EXISTS "Admins can view and edit all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view and edit all stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can view and edit all products" ON public.products;
DROP POLICY IF EXISTS "Admins can view and edit all orders" ON public.orders;

-- Recreate them safely using the bypass function
CREATE POLICY "Admins can view and edit all profiles" ON public.user_profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view and edit all stores" ON public.stores FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view and edit all products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view and edit all orders" ON public.orders FOR ALL USING (public.is_admin());
