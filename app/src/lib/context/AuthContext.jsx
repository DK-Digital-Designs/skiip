import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/auth.service';
import { supabase, isSupabaseConfigured } from '../supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        
        // Timeout fail-safe to unstick the UI if Supabase genuinely hangs
        const timeoutId = setTimeout(() => {
            if (isMounted && loading) {
                console.warn("Auth initialization timed out, forcing load completion.");
                setLoading(false);
            }
        }, 12000);

        // Listen for auth changes (this immediately fires an INITIAL_SESSION event in v2)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;
            try {
                setUser(session?.user ?? null);
                if (session?.user) {
                    const { data, error } = await supabase
                        .from('user_profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                    
                    if (error) {
                        console.warn('Profile fetch error during auth state change:', error.message);
                        setProfile(null);
                    } else {
                        setProfile(data);
                    }
                } else {
                    setProfile(null);
                }
            } catch (err) {
                console.error("Auth state change error:", err);
            } finally {
                if (isMounted) {
                    clearTimeout(timeoutId);
                    setLoading(false);
                }
            }
        });

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        user,
        profile,
        loading,
        signIn: AuthService.signIn.bind(AuthService),
        signUp: AuthService.signUp.bind(AuthService),
        signOut: AuthService.signOut.bind(AuthService),
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div style={{ 
                    minHeight: '100vh', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    background: 'var(--bg)',
                    flexDirection: 'column',
                    gap: '24px'
                }}>
                    <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading SKIIP...</p>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
