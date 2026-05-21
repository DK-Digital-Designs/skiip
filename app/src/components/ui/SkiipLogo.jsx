import React from 'react';
import { Link } from 'react-router-dom';

export default function SkiipLogo({ to = '/', compact = false }) {
    return (
        <Link to={to} className="brand-mark" aria-label="SKIIP home">
            <span className="brand-mark__icon">
                <img
                    src="/brand/skiip-logo-256.png"
                    srcSet="/brand/skiip-logo-128.png 128w, /brand/skiip-logo-256.png 256w"
                    sizes="42px"
                    width="42"
                    height="42"
                    alt=""
                    decoding="async"
                    fetchPriority="high"
                />
            </span>
            {!compact && <span className="brand-mark__text">SKIIP</span>}
        </Link>
    );
}
