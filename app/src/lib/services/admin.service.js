import { supabase } from '../supabase';
import { getFunctionAuthHeaders } from './function-auth';
import { canUseRealProductModifiers } from '../features/productModifiers';

const ADMIN_ORDER_ITEMS_SELECT = canUseRealProductModifiers()
    ? 'order_items(*, order_item_modifier_selections(*))'
    : 'order_items(*)';

export const AdminService = {
    async getDashboardMetrics() {
        if (!supabase) return null;

        const { data, error } = await supabase.rpc('get_admin_dashboard_metrics_v1');
        if (error) throw error;
        return data;
    },

    async getRecentOrders(limit = 20) {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('orders')
            .select(`id, order_number, created_at, subtotal, tip_amount, service_fee, total, status, payment_status, payment_failed_at, payment_failure_code, payment_failure_message, payment_intent_id, charge_id, checkout_session_id, paid_at, platform_fee, stripe_fee, vendor_net, customer_email, customer_phone, refund_amount, scheduled_collection_at, scheduled_collection_timezone, stores(name), ${ADMIN_ORDER_ITEMS_SELECT}`)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    async reconcileOrderPayment(orderId) {
        if (!supabase) throw new Error('Supabase not configured');
        const headers = await getFunctionAuthHeaders();

        const { data, error } = await supabase.functions.invoke('stripe-reconcile-order', {
            headers,
            body: { orderId },
        });

        if (error) throw error;
        return data;
    },
};
