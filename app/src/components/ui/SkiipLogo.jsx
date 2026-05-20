import React from 'react';
import { Link } from 'react-router-dom';
import skiipLogo from '../../assets/skiip-logo.png';

export default function SkiipLogo({ to = '/', compact = false }) {
    return (
        <Link to={to} className="brand-mark" aria-label="SKIIP home">
            <span className="brand-mark__icon">
                <img src={skiipLogo} alt="" />
            </span>
            {!compact && <span className="brand-mark__text">SKIIP</span>}
        </Link>
    );
}
