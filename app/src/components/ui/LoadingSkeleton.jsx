import React from 'react';

/**
 * Reusable LoadingSkeleton component
 * @param {string} width
 * @param {string} height
 * @param {string} borderRadius
 * @param {Object} style
 */
export default function LoadingSkeleton({ width = '100%', height = '20px', borderRadius = '4px', style = {} }) {
    return (
        <div
            className="skeleton-pulse"
            style={{
                width,
                height,
                borderRadius,
                background: 'rgba(255, 255, 255, 0.05)',
                ...style
            }}
        />
    );
}

// Helper to render multiple lines
export const SkeletonLines = ({ count = 3, gap = '12px', ...props }) => (
    <div style={{ display: 'grid', gap }}>
        {[...Array(count)].map((_, i) => (
            <LoadingSkeleton key={i} {...props} />
        ))}
    </div>
);
