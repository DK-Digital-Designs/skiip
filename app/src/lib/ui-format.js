import { canCancelUnpaidOrder, getAllowedOrderTransitions } from './orders';

export function formatCurrency(value, currency = 'GBP') {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency,
    }).format(Number(value || 0));
}

export function formatOrderCode(order) {
    const raw = order?.order_number || order?.id || '';
    const value = String(raw).trim();
    if (!value) return 'ORDER';
    if (/^[A-Z][0-9]{3}$/i.test(value)) return value.toUpperCase();
    if (value.startsWith('ORD-')) return value;
    return `SK-${value.slice(0, 4).toUpperCase()}`;
}

export function getInitials(name = 'SKIIP') {
    return String(name)
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'SK';
}

export function getVendorImage(vendor) {
    return vendor?.logo_url || vendor?.image_url || vendor?.images?.[0] || null;
}

export function getQueueVisual(status) {
    const map = {
        paid: { laneClass: 'queue-lane--paid', cardClass: 'order-card--paid', actionClass: 'btn-cyan', label: 'New' },
        preparing: { laneClass: 'queue-lane--preparing', cardClass: 'order-card--preparing', actionClass: 'btn-orange', label: 'Preparing' },
        ready: { laneClass: 'queue-lane--ready', cardClass: 'order-card--ready', actionClass: 'btn-primary', label: 'Ready' },
        collected: { laneClass: '', cardClass: '', actionClass: 'btn-primary', label: 'Collected' },
        cancelled: { laneClass: '', cardClass: '', actionClass: 'btn-danger', label: 'Cancelled' },
    };

    return map[status] || { laneClass: '', cardClass: '', actionClass: 'btn-accent', label: 'Review' };
}

export function shouldShowVendorCancel(order) {
    const allowedTransitions = getAllowedOrderTransitions(order?.status);
    return allowedTransitions.includes('cancelled')
        && (order?.status !== 'pending' || canCancelUnpaidOrder(order));
}

export function getVendorActionClass(targetStatus) {
    if (targetStatus === 'preparing') return 'btn-cyan';
    if (targetStatus === 'ready') return 'btn-orange';
    if (targetStatus === 'collected') return 'btn-primary';
    if (targetStatus === 'cancelled') return 'btn-danger';
    return 'btn-accent';
}

export function getBuyerTimelineSteps(order) {
    const status = order?.status || 'pending';
    const paid = !['pending', 'cancelled'].includes(status) || order?.payment_status === 'succeeded';
    const orderReceivedDone = paid || status === 'pending';
    const preparingDone = ['preparing', 'ready', 'collected'].includes(status);
    const readyDone = ['ready', 'collected'].includes(status);
    const collectedDone = status === 'collected';

    const steps = [
        {
            id: 'received',
            label: 'Order received',
            description: paid ? 'Successfully placed with the vendor.' : 'Waiting for payment to complete.',
            active: orderReceivedDone,
        },
        {
            id: 'preparing',
            label: 'Preparing food',
            description: preparingDone ? 'The vendor is preparing your order.' : 'Active pulse starts when prep begins.',
            active: preparingDone,
        },
        {
            id: 'ready',
            label: 'Ready for pickup',
            description: readyDone ? 'Head to the stall when you are nearby.' : 'You will see this update when it is ready.',
            active: readyDone,
        },
        {
            id: 'collected',
            label: 'Order collected',
            description: collectedDone ? 'Enjoy the event.' : 'Final handoff at the stall.',
            active: collectedDone,
        },
    ];

    const currentIndex = Math.max(0, steps.findIndex((step, index) => step.active && !steps[index + 1]?.active));

    return steps.map((step, index) => ({
        ...step,
        state: step.active && index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending',
    }));
}
