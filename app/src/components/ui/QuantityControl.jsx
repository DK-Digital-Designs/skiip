import React from 'react';
import Icon from './Icon';

export default function QuantityControl({ value, onIncrement, onDecrement, min = 0, label = 'Quantity' }) {
    return (
        <div className="quantity-control" aria-label={label}>
            <button
                type="button"
                onClick={onDecrement}
                disabled={value <= min}
                aria-label="Decrease quantity"
            >
                <Icon name="minus" size={16} />
            </button>
            <strong>{value}</strong>
            <button type="button" onClick={onIncrement} aria-label="Increase quantity">
                <Icon name="plus" size={16} />
            </button>
        </div>
    );
}
