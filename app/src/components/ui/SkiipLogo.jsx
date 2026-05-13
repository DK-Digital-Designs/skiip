import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

export default function SkiipLogo({ to = '/', compact = false }) {
    return (
        <Link to={to} className="brand-mark" aria-label="SKIIP home">
            <span className="brand-mark__icon">
                <Icon name="bag" size={20} strokeWidth={2.2} />
            </span>
            {!compact && <span className="brand-mark__text">SKIIP</span>}
        </Link>
    );
}
