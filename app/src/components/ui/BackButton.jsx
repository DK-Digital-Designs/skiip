import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';

export default function BackButton({ to = '/order', label = 'Back', className = 'btn btn-ghost', ...props }) {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            className={className}
            onClick={() => navigate(to)}
            {...props}
        >
            <Icon name="arrowLeft" size={17} />
            {label}
        </button>
    );
}
