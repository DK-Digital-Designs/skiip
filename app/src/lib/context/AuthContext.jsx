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
        
        // Timeout fail-safe
        const timeoutId = setTimeout(() => {
            if (isMounted && loading) {
                console.warn("Auth initialization timed out, forcing load completion.");
                setLoading(false);
            }
        }, 8000); // Reduced to 8s

        async function initializeAuth() {
            try {
                // 1. Check current session immediately
                const { data: { session } } = await supabase.auth.getSession();
                if (isMounted) {
                    await handleAuthStateChange('SIGNED_IN', session);
                }
            } catch (error) {
                console.error("Initial session check failed:", error);
                if (isMounted) setLoading(false);
            }
        }

        async function handleAuthStateChange(event, session) {
            if (!isMounted) return;
            try {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                
                if (currentUser) {
                    const { data, error } = await supabase
                        .from('user_profiles')
                        .select('*')
                        .eq('id', currentUser.id)
                        .single();
                    
                    if (error) {
                        console.warn('Profile fetch error:', error.message);
                        setProfile(null);
                    } else {
                        setProfile(data);
                    }
                } else {
                    setProfile(null);
                }
            } catch (err) {
                console.error("Auth process error:", err);
            } finally {
                if (isMounted) {
                    clearTimeout(timeoutId);
                    setLoading(false);
                }
            }
        }

        // Initialize immediately
        initializeAuth();

        // 2. Listen for subsequent changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            handleAuthStateChange(event, session);
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
