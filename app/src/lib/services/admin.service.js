import { supabase } from '../supabase';

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
            .select('id, order_number, created_at, total, status, payment_status, payment_failed_at, payment_failure_code, payment_failure_message, customer_phone, refund_amount, stores(name)')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },
};
