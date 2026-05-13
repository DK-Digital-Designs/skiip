import React, { useRef, useState } from 'react';

const HOLD_MS = 900;

export default function HoldToConfirmButton({
    children,
    confirmLabel = 'Hold to confirm',
    onConfirm,
    disabled = false,
    className = 'btn btn-danger',
    holdMs = HOLD_MS,
    ...props
}) {
    const timerRef = useRef(null);
    const [holding, setHolding] = useState(false);

    function clearHold() {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
        setHolding(false);
    }

    function startHold() {
        if (disabled || timerRef.current) return;
        setHolding(true);
        timerRef.current = window.setTimeout(() => {
            timerRef.current = null;
            setHolding(false);
            onConfirm?.();
        }, holdMs);
    }

    return (
        <button
            type="button"
            className={className}
            disabled={disabled}
            onMouseDown={startHold}
            onMouseUp={clearHold}
            onMouseLeave={clearHold}
            onTouchStart={startHold}
            onTouchEnd={clearHold}
            onTouchCancel={clearHold}
            aria-label={holding ? confirmLabel : undefined}
            {...props}
        >
            {holding ? confirmLabel : children}
        </button>
    );
}
