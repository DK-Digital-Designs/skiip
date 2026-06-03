import { supabase } from '../supabase';
import { canUseRealProductModifiers } from '../features/productModifiers';
import { getFunctionAuthHeaders } from './function-auth';

const STORES_FRAGMENT = 'stores(name, slug)';
const STORES_FRAGMENT_WITH_LOGO = 'stores(name, slug, logo_url)';
const MODIFIER_GROUPS_FRAGMENT = `
    product_modifier_groups(
        id,
        name,
        required,
        min_select,
        max_select,
        sort_order,
        status,
        deleted_at,
        product_modifier_options(
            id,
            name,
            price_delta,
            sort_order,
            status,
            deleted_at
        )
    )
`;

function buildProductSelect({ withLogo = false } = {}) {
    const stores = withLogo ? STORES_FRAGMENT_WITH_LOGO : STORES_FRAGMENT;
    if (!canUseRealProductModifiers()) {
        return `*, ${stores}`;
    }
    return `*, ${stores}, ${MODIFIER_GROUPS_FRAGMENT}`;
}

function mapModifierOption(option) {
    return {
        id: option.id,
        name: option.name,
        priceDelta: Number(option.price_delta || 0),
        sortOrder: Number(option.sort_order || 0),
        status: option.status || 'active',
        active: option.status !== 'inactive' && !option.deleted_at,
    };
}

function mapModifierGroup(group) {
    const options = (group.product_modifier_options || [])
        .filter((option) => !option.deleted_at)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map(mapModifierOption);

    return {
        id: group.id,
        name: group.name,
        required: Boolean(group.required),
        minSelect: Number(group.min_select || 0),
        maxSelect: Number(group.max_select || 1),
        sortOrder: Number(group.sort_order || 0),
        status: group.status || 'active',
        active: group.status !== 'inactive' && !group.deleted_at,
        options,
    };
}

function mapProductModifiers(product) {
    if (!product?.product_modifier_groups) return product;

    const modifierGroups = product.product_modifier_groups
        .filter((group) => !group.deleted_at)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map(mapModifierGroup);

    return {
        ...product,
        modifierGroups,
    };
}

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
            .select(buildProductSelect(), { count: 'exact' })
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

        return { data: (data || []).map(mapProductModifiers), count };
    },

    /**
     * Get a single product by slug
     * @param {string} slug 
     */
    async getProductBySlug(slug) {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('products')
            .select(buildProductSelect({ withLogo: true }))
            .eq('slug', slug)
            .single();

        if (error) throw error;
        return mapProductModifiers(data);
    },

    /**
     * Get a single product by ID
     * @param {string} id 
     */
    async getProductById(id) {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('products')
            .select(buildProductSelect({ withLogo: true }))
            .eq('id', id)
            .single();

        if (error) throw error;
        return mapProductModifiers(data);
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
    },

    async saveProductModifiers(productId, groups = []) {
        if (!supabase) throw new Error('Supabase not configured');
        const headers = await getFunctionAuthHeaders();

        const { data, error } = await supabase.functions.invoke('vendor-product-modifiers', {
            headers,
            body: {
                productId,
                groups,
            },
        });

        if (error) throw new Error(error.message || 'Failed to save product modifiers');
        return data?.groups || [];
    }
};
