-- Function to atomically decrement product inventory
CREATE OR REPLACE FUNCTION public.decrement_inventory(product_id UUID, quantity_to_decrement INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products
    SET inventory_quantity = GREATEST(0, inventory_quantity - quantity_to_decrement)
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;