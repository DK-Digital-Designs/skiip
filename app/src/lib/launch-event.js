export const DEFAULT_LAUNCH_EVENT = {
    label: 'Live now',
    title: 'FOOD WITHOUT THE QUEUE',
    subtitle: "Order food and drinks from your phone and collect when it's ready.",
    landingTitle: 'FOOD WITHOUT THE QUEUE',
    landingSubtitle: "Order food and drinks from your phone and collect when it's ready.",
};

export function normalizeLaunchEvent(value = {}) {
    const source = value && typeof value === 'object' ? value : {};

    return {
        label: String(source.label || DEFAULT_LAUNCH_EVENT.label).trim() || DEFAULT_LAUNCH_EVENT.label,
        title: String(source.title || DEFAULT_LAUNCH_EVENT.title).trim() || DEFAULT_LAUNCH_EVENT.title,
        subtitle: String(source.subtitle || DEFAULT_LAUNCH_EVENT.subtitle).trim() || DEFAULT_LAUNCH_EVENT.subtitle,
        landingTitle: String(source.landingTitle || source.title || DEFAULT_LAUNCH_EVENT.landingTitle).trim() || DEFAULT_LAUNCH_EVENT.landingTitle,
        landingSubtitle: String(source.landingSubtitle || source.subtitle || DEFAULT_LAUNCH_EVENT.landingSubtitle).trim() || DEFAULT_LAUNCH_EVENT.landingSubtitle,
    };
}
