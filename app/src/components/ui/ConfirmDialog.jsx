import React from 'react';

export default function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'danger',
    children,
    onConfirm,
    onCancel,
    confirmDisabled = false,
}) {
    if (!open) return null;

    return (
        <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
            <section
                className="dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <h2 id="confirm-dialog-title" style={{ color: 'var(--ink)', fontSize: '24px', marginBottom: '8px' }}>
                    {title}
                </h2>
                {description && <p className="text-muted" style={{ marginBottom: '18px' }}>{description}</p>}
                {children && <div style={{ marginBottom: '18px' }}>{children}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-ghost" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
                        onClick={onConfirm}
                        disabled={confirmDisabled}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </section>
        </div>
    );
}
