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

    const tone = {
        error: { background: 'var(--red)', color: '#fff' },
        success: { background: 'var(--green)', color: '#fff' },
        info: { background: 'var(--ink)', color: '#fff' },
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'grid',
            gap: '12px',
            width: 'min(calc(100vw - 32px), 360px)'
        }}>
            {toasts.map((toast) => (
                <div key={toast.id} style={{
                    padding: '14px 16px',
                    borderRadius: '18px',
                    background: tone[toast.type]?.background || tone.info.background,
                    color: tone[toast.type]?.color || tone.info.color,
                    boxShadow: 'var(--shadow)',
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
                    from { transform: translateY(14px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
