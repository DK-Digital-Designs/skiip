import React from 'react';
import {
    getCartLineDisplayName,
    getCartLineDisplayUnitPrice,
    getCartLineModifierDisplay,
    getCartLineNote,
} from '../../lib/cart/cartLineIdentity';
import { formatCurrency } from '../../lib/ui-format';

function normalizeModifierDisplay(modifierDisplay = []) {
    return (modifierDisplay || [])
        .map((modifier) => ({
            groupName: modifier.groupName || modifier.group_name || modifier.group || 'Option',
            optionName: modifier.optionName || modifier.option_name || modifier.name || 'Selected option',
            priceDelta: Number(modifier.priceDelta ?? modifier.price_delta ?? 0),
        }))
        .filter((modifier) => modifier.optionName);
}

export function getOrderItemSummaryData(item) {
    const quantity = Number(item?.quantity || 0);
    const unitPrice = Number(item?.unitPrice ?? item?.price ?? getCartLineDisplayUnitPrice(item));
    const totalPrice = Number(item?.totalPrice ?? item?.total ?? (unitPrice * quantity));

    return {
        name: item?.name || getCartLineDisplayName(item),
        quantity,
        unitPrice,
        totalPrice,
        modifierDisplay: normalizeModifierDisplay(item?.modifierDisplay || getCartLineModifierDisplay(item)),
        lineNote: item?.lineNote || getCartLineNote(item),
    };
}

export default function OrderItemSummary({
    item,
    name,
    quantity,
    unitPrice,
    totalPrice,
    modifierDisplay,
    lineNote,
    compact = false,
    controls = null,
}) {
    const summary = getOrderItemSummaryData(item || {
        name,
        quantity,
        unitPrice,
        totalPrice,
        modifierDisplay,
        lineNote,
    });
    const hasModifiers = summary.modifierDisplay.length > 0;
    const hasNote = Boolean(summary.lineNote);

    return (
        <div className={compact ? 'order-item-summary order-item-summary--compact' : 'order-item-summary'}>
            <div className="order-item-summary__main">
                <div style={{ minWidth: 0 }}>
                    <strong className="order-item-summary__name">
                        {summary.quantity > 0 ? `${summary.quantity}x ` : ''}{summary.name}
                    </strong>
                    {summary.unitPrice > 0 && (
                        <p className="text-muted order-item-summary__unit">
                            {formatCurrency(summary.unitPrice)} each
                        </p>
                    )}
                </div>
                {summary.totalPrice > 0 && (
                    <strong className="order-item-summary__total">{formatCurrency(summary.totalPrice)}</strong>
                )}
            </div>

            {(hasModifiers || hasNote) && (
                <div className="order-item-summary__details">
                    {hasModifiers && summary.modifierDisplay.map((modifier, index) => (
                        <div key={`${modifier.groupName}-${modifier.optionName}-${index}`} className="order-item-summary__modifier">
                            <span>{modifier.groupName}</span>
                            <strong>
                                {modifier.optionName}
                                {modifier.priceDelta > 0 ? ` (+${formatCurrency(modifier.priceDelta)})` : ''}
                            </strong>
                        </div>
                    ))}
                    {hasNote && (
                        <div className="order-item-summary__note">
                            <span>Note</span>
                            <strong>{summary.lineNote}</strong>
                        </div>
                    )}
                </div>
            )}

            {controls && <div className="order-item-summary__controls">{controls}</div>}
        </div>
    );
}
