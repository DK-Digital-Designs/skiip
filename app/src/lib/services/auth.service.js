import { supabase } from '../supabase';

export const AuthService = {
    /**
     * Sign up a new user
     * @param {string} email 
     * @param {string} password 
     * @param {string} fullName 
     * @param {string} role - 'buyer' or 'seller'
     */
    async signUp(email, password, fullName, role = 'buyer') {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                },
            },
        });

        if (error) throw error;

        // Create user profile record
        if (data.user) {
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert([
                    {
                        id: data.user.id,
                        email: email,
                        full_name: fullName,
                        role: role,
                    },
                ]);

            if (profileError) {
                console.error('Error creating user profile:', profileError);
                // We don't throw here to avoid failing the signup if profile creation fails, 
                // but robust apps should handle this transactionally or via triggers.
            }
        }

        return data;
    },

    /**
     * Sign up a new vendor
     */
    async signUpVendor(email, password, fullName, storeName, storeSlug) {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: 'seller',
                },
            },
        });

        if (error) throw error;

        if (data.user) {
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert([{
                    id: data.user.id,
                    email: email,
                    full_name: fullName,
                    role: 'seller',
                }]);

            if (profileError) {
                console.error('Error creating user profile:', profileError);
            }

            const { error: storeError } = await supabase
                .from('stores')
                .insert([{
                    user_id: data.user.id,
                    name: storeName,
                    slug: storeSlug,
                    status: 'pending' // pending by default for verification
                }]);

            if (storeError) {
                console.error('Error creating store:', storeError);
                throw storeError;
            }
        }

        return data;
    },

    /**
     * Sign in an existing user
     * @param {string} email 
     * @param {string} password 
     */
    async signIn(email, password) {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    },

    /**
     * Sign out the current user
     */
    async signOut() {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * Get the current user session
     */
    async getSession() {
        if (!supabase) return null;
        const { data } = await supabase.auth.getSession();
        return data.session;
    },

    /**
     * Get current user details including profile
     */
    async getCurrentUser() {
        if (!supabase) return null;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Fetch profile
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return {
            ...user,
            profile,
        };
    }
};
