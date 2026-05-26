import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/auth.service';
import {
    clearPendingPasswordRecoveryRequest,
    clearPkceCallbackCode,
    getPkceCallbackCode,
    hasPendingPasswordRecoveryRequest,
    routeActivePasswordRecoverySession,
} from '../auth-callback';
import { supabase, isSupabaseConfigured } from '../supabase';

const AuthContext = createContext({});
const PASSWORD_RECOVERY_SESSION_KEY = 'skiip-password-recovery-session';

function getStoredRecoverySession() {
    return typeof window !== 'undefined' && window.sessionStorage.getItem(PASSWORD_RECOVERY_SESSION_KEY) === 'active';
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [passwordRecoverySession, setPasswordRecoverySession] = useState(getStoredRecoverySession);

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        let subscription = null;
        
        // Timeout fail-safe
        const timeoutId = setTimeout(() => {
            if (isMounted && loading) {
                console.warn("Auth initialization timed out, forcing load completion.");
                setLoading(false);
            }
        }, 8000); // Reduced to 8s

        async function initializeAuth() {
            try {
                const callbackCode = getPkceCallbackCode(window.location.href);
                if (callbackCode) {
                    const recoveryRequestPending = hasPendingPasswordRecoveryRequest();
                    const { data, error } = await supabase.auth.exchangeCodeForSession(callbackCode);
                    if (error) throw error;

                    clearPkceCallbackCode();
                    const isRecoveryCallback =
                        data?.redirectType === 'PASSWORD_RECOVERY' || recoveryRequestPending;

                    if (isRecoveryCallback) {
                        clearPendingPasswordRecoveryRequest();
                    }

                    if (isMounted) {
                        await handleAuthStateChange(
                            isRecoveryCallback ? 'PASSWORD_RECOVERY' : 'SIGNED_IN',
                            data.session
                        );
                    }
                    return;
                }

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

                if (event === 'PASSWORD_RECOVERY' && currentUser) {
                    window.sessionStorage.setItem(PASSWORD_RECOVERY_SESSION_KEY, 'active');
                    setPasswordRecoverySession(true);
                    routeActivePasswordRecoverySession();
                } else if (!currentUser || event === 'SIGNED_OUT') {
                    window.sessionStorage.removeItem(PASSWORD_RECOVERY_SESSION_KEY);
                    setPasswordRecoverySession(false);
                }
                
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

        function subscribeToAuthChanges() {
            const { data } = supabase.auth.onAuthStateChange((event, session) => {
                handleAuthStateChange(event, session);
            });
            subscription = data.subscription;
        }

        async function initializeAndSubscribe() {
            const hasPkceCallback = Boolean(getPkceCallbackCode(window.location.href));

            if (!hasPkceCallback) {
                subscribeToAuthChanges();
            }

            await initializeAuth();

            if (hasPkceCallback && isMounted) {
                subscribeToAuthChanges();
            }
        }

        initializeAndSubscribe();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            subscription?.unsubscribe();
        };
    }, []);

    function clearPasswordRecoverySession() {
        window.sessionStorage.removeItem(PASSWORD_RECOVERY_SESSION_KEY);
        setPasswordRecoverySession(false);
    }

    const value = {
        user,
        profile,
        loading,
        passwordRecoverySession,
        clearPasswordRecoverySession,
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
