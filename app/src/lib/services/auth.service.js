import { supabase } from '../supabase';
import { CANONICAL_PRODUCTION_ORIGIN, markPasswordRecoveryRequest } from '../auth-callback';

function getPasswordResetRedirectUrl() {
    const configuredAppOrigin = import.meta.env.VITE_PUBLIC_APP_ORIGIN;
    const appOrigin = configuredAppOrigin || (import.meta.env.PROD ? CANONICAL_PRODUCTION_ORIGIN : window.location.origin);
    const appRoot = new URL(import.meta.env.BASE_URL || '/', appOrigin);
    appRoot.hash = '/reset-password';
    return appRoot.toString();
}

export const AuthService = {
    /**
     * Sign up a new user
     * @param {string} email 
     * @param {string} password 
     * @param {string} fullName 
     */
    async signUp(email, password, fullName) {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) throw error;


        return data;
    },

    /**
     * Sign up a new vendor
     */
    async signUpVendor() {
        throw new Error('Vendor accounts are created by SKIIP admins for launch.');
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
     * Email a recovery link that returns users to the password update screen.
     * @param {string} email
     */
    async requestPasswordReset(email) {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: getPasswordResetRedirectUrl(),
        });

        if (error) throw error;
        markPasswordRecoveryRequest();
        return data;
    },

    /**
     * Change the current authenticated user's password.
     * @param {string} password
     */
    async updatePassword(password) {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase.auth.updateUser({ password });

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
