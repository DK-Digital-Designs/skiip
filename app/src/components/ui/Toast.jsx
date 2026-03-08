import { create } from 'zustand';

export const useToast = create((set) => ({
    toasts: [],
    addToast: (message, type = 'info') => {
        const id = Date.now();
        set((state) => ({
            toasts: [...state.toasts, { id, message, type }]
        }));
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id)
            }));
        }, 3000);
    },
    removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
    }))
}));

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'grid',
            gap: '12px',
            maxWidth: '320px'
        }}>
            {toasts.map((toast) => (
                <div key={toast.id} className="card" style={{
                    padding: '12px 16px',
                    background: toast.type === 'error' ? '#ef4444' : 'var(--card)',
                    color: toast.type === 'error' ? 'white' : 'var(--text)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{toast.message}</span>
                    <button onClick={() => removeToast(toast.id)} style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: '4px',
                        lineHeight: '1'
                    }}>&times;</button>
                </div>
            ))}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
