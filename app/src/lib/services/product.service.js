import { supabase } from '../supabase';

export const ProductService = {
    /**
     * Get all active products
     * @param {object} filters 
     * @param {number} page 
     * @param {number} limit 
     */
    async getProducts({ category, storeId, search } = {}, page = 1, limit = 20) {
        if (!supabase) return { data: [], count: 0 };

        let query = supabase
            .from('products')
            .select('*, stores(name, slug)', { count: 'exact' })
            .eq('status', 'active')
            .is('deleted_at', null);

        if (category) {
            query = query.eq('category', category);
        }

        if (storeId) {
            query = query.eq('store_id', storeId);
        }

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await query
            .range(from, to)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { data, count };
    },

    /**
     * Get a single product by slug
     * @param {string} slug 
     */
    async getProductBySlug(slug) {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('products')
            .select('*, stores(name, slug, logo_url)')
            .eq('slug', slug)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get a single product by ID
     * @param {string} id 
     */
    async getProductById(id) {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('products')
            .select('*, stores(name, slug, logo_url)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Create a new product
     * @param {object} productData 
     */
    async createProduct(productData) {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a product
     * @param {string} id 
     * @param {object} updates 
     */
    async updateProduct(id, updates) {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a product (soft delete)
     * @param {string} id 
     */
    async deleteProduct(id) {
        if (!supabase) throw new Error('Supabase not configured');

        const { error } = await supabase
            .from('products')
            .update({ deleted_at: new Date().toISOString(), status: 'archived' })
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
