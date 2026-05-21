import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useStores } from '../../lib/hooks/useMenu';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import BottomNav from '../../components/ui/BottomNav';
import SkiipLogo from '../../components/ui/SkiipLogo';
import BuyerAccountMenu from '../../components/shared/BuyerAccountMenu';
import { SettingsService } from '../../lib/services/settings.service';
import { DEFAULT_LAUNCH_EVENT } from '../../lib/launch-event';
import { getInitials, getVendorImage } from '../../lib/ui-format';
import {
    getOrderableVendors,
    getVendorTags,
} from '../../lib/vendor-tags';
import { trackSkiipEvent } from '../../lib/analytics';

const MOCK_VENDORS = [
    {
        id: '1',
        name: 'Burger Bliss',
        description: 'Gourmet burgers and loaded fries',
        pickup_location: 'Food Court A, Stall 3',
        tags: ['Burgers', 'Budget'],
        stripe_connect_status: 'ready',
    },
    {
        id: '2',
        name: 'Taco Town',
        description: 'Street tacos, nachos, and fresh salsa',
        pickup_location: 'Food Court B, Stall 1',
        tags: ['Tacos'],
        stripe_connect_status: 'ready',
    },
    {
        id: '3',
        name: 'Drinks & Co',
        description: 'Cocktails, mocktails, and cold soft drinks',
        pickup_location: 'Bar Area 2',
        tags: ['Bar'],
        stripe_connect_status: 'ready',
    },
];

function VendorMedia({ vendor }) {
    const image = getVendorImage(vendor);

    return (
        <div className="vendor-card__media">
            {image ? (
                <img src={image} alt={vendor.name} />
            ) : (
                <span className="vendor-card__initials">{getInitials(vendor.name)}</span>
            )}
        </div>
    );
}

function VendorCard({ vendor, index }) {
    const tags = getVendorTags(vendor);
    const vendorLabel = `${vendor.id || 'unknown'}:${vendor.name || 'Unknown vendor'}`;

    return (
        <Link
            key={vendor.id}
            to={`/order/vendor/${vendor.id}`}
            className="vendor-card"
            onClick={() => trackSkiipEvent('vendor_card_clicked', { vendor: vendorLabel })}
        >
            <div style={{ display: 'grid', alignContent: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={index === 0 ? 'chip chip--accent' : 'chip'}>
                        {index === 0 ? 'Trending' : 'Open'}
                    </span>
                    {tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="chip chip--cyan">
                            {tag}
                        </span>
                    ))}
                </div>
                <div>
                    <h3 style={{ color: 'var(--ink)', fontSize: '22px', lineHeight: 1.05 }}>
                        {vendor.name}
                    </h3>
                    {vendor.description && (
                        <p className="text-muted" style={{ fontSize: '14px', marginTop: '6px' }}>
                            {vendor.description}
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className="btn btn-primary" style={{ minHeight: '34px', padding: '9px 16px', fontSize: '12px' }}>
                        View Menu
                    </span>
                    {vendor.pickup_location && (
                        <span className="text-muted" style={{ fontSize: '12px', fontWeight: 800 }}>
                            {vendor.pickup_location}
                        </span>
                    )}
                </div>
            </div>
            <VendorMedia vendor={vendor} />
        </Link>
    );
}

function sortVendors(vendors, sortMode) {
    const copy = [...vendors];
    if (sortMode === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name));
    if (sortMode === 'location') {
        return copy.sort((a, b) => String(a.pickup_location || '').localeCompare(String(b.pickup_location || '')));
    }
    return copy;
}

export default function VendorList() {
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('event') || 1;
    const { data: qStores = [], isLoading: isStoresLoading } = useStores(isSupabaseConfigured() ? eventId : null);
    const [launchEvent, setLaunchEvent] = useState(DEFAULT_LAUNCH_EVENT);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('all');
    const [sortMode, setSortMode] = useState('recommended');

    useEffect(() => {
        let active = true;
        SettingsService.getLaunchEvent().then((settings) => {
            if (active) setLaunchEvent(settings);
        });
        return () => {
            active = false;
        };
    }, []);

    const isDemo = !isSupabaseConfigured();
    const vendors = isDemo ? MOCK_VENDORS : qStores;
    const loading = isDemo ? false : isStoresLoading;
    const orderableVendors = useMemo(() => getOrderableVendors(vendors), [vendors]);

    const availableTags = useMemo(() => {
        const tags = orderableVendors.flatMap((vendor) => getVendorTags(vendor));
        return ['all', ...new Set(tags)].slice(0, 9);
    }, [orderableVendors]);

    const filteredVendors = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        const filtered = orderableVendors.filter((vendor) => {
            const tags = getVendorTags(vendor);
            const matchesTag = selectedTag === 'all' || tags.includes(selectedTag);
            const matchesSearch = !query
                || `${vendor.name || ''} ${vendor.description || ''} ${vendor.pickup_location || ''} ${tags.join(' ')}`
                    .toLowerCase()
                    .includes(query);

            return matchesTag && matchesSearch;
        });

        return sortVendors(filtered, sortMode);
    }, [orderableVendors, searchTerm, selectedTag, sortMode]);

    const isBarMode = selectedTag.toLowerCase() === 'bar'
        || /\b(bar|beer|cocktail|mocktail|drink|wine)\b/i.test(searchTerm);
    const vendorKicker = isBarMode ? 'BROWSE THE BAR' : 'Browse vendors';
    const vendorHeading = isBarMode ? 'Now pouring' : 'What do you fancy?';

    function handleTagSelect(tag) {
        setSelectedTag(tag);
        trackSkiipEvent('vendor_filter_used', { filter: `tag:${tag}` });
    }

    function handleSortModeChange(event) {
        const nextSortMode = event.target.value;
        setSortMode(nextSortMode);
        trackSkiipEvent('vendor_filter_used', { filter: `sort:${nextSortMode}` });
    }

    return (
        <main className="app-page app-page--buyer">
            <div className="container" style={{ display: 'grid', gap: '26px' }}>
                <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <SkiipLogo />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BuyerAccountMenu />
                    </div>
                </section>

                <section className="hero-panel">
                    <div className="hero-panel__content">
                        <span className="chip chip--cyan" style={{ width: 'fit-content', color: '#fff', background: 'rgba(34,211,238,0.22)' }}>
                            {launchEvent.label}
                        </span>
                        <h1>{launchEvent.title}</h1>
                        <p>{launchEvent.subtitle}</p>
                    </div>
                </section>

                <section className="surface" style={{ display: 'grid', gap: '16px', padding: '18px', borderRadius: '28px' }}>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        <p className="page-kicker">Find a vendor</p>
                        <h2 style={{ color: 'var(--ink)', fontSize: '22px', lineHeight: 1.15 }}>Search by food, drink, stall, or location.</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(150px, 220px)', gap: '12px' }}>
                        <input
                            aria-label="Search vendors"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search burgers, bar, chicken..."
                        />
                        <select aria-label="Sort vendors" value={sortMode} onChange={handleSortModeChange}>
                            <option value="recommended">Recommended</option>
                            <option value="name">A to Z</option>
                            <option value="location">Location</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {availableTags.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                className={selectedTag === tag ? 'btn btn-purple' : 'btn btn-ghost'}
                                onClick={() => handleTagSelect(tag)}
                                style={{ minHeight: '34px', padding: '8px 12px', fontSize: '12px' }}
                            >
                                {tag === 'all' ? 'All vendors' : tag}
                            </button>
                        ))}
                    </div>
                </section>

                {isDemo && (
                    <div className="chip chip--accent" style={{ width: 'fit-content' }}>
                        Demo mode: using sample vendor data
                    </div>
                )}

                <section style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '16px' }}>
                        <div>
                            <p className="page-kicker">{vendorKicker}</p>
                            <h2 style={{ color: 'var(--ink)', fontSize: '28px', lineHeight: 1.1 }}>{vendorHeading}</h2>
                        </div>
                        <span className="text-accent" style={{ fontSize: '13px', fontWeight: 900 }}>
                            {filteredVendors.length} shown
                        </span>
                    </div>

                    {loading ? (
                        <div className="vendor-grid">
                            {[...Array(4)].map((_, index) => (
                                <div key={index} className="vendor-card">
                                    <div>
                                        <LoadingSkeleton width="80px" height="14px" borderRadius="999px" style={{ marginBottom: '14px' }} />
                                        <LoadingSkeleton width="72%" height="25px" borderRadius="10px" style={{ marginBottom: '10px' }} />
                                        <LoadingSkeleton width="92%" height="16px" borderRadius="8px" />
                                    </div>
                                    <LoadingSkeleton height="116px" borderRadius="999px" />
                                </div>
                            ))}
                        </div>
                    ) : orderableVendors.length === 0 ? (
                        <div className="surface empty-state">
                            <h3>No live vendors yet</h3>
                            <p>Check back once the event vendors are open for ordering.</p>
                        </div>
                    ) : filteredVendors.length === 0 ? (
                        <div className="surface empty-state">
                            <h3>No vendors match that search</h3>
                            <p>Try another tag, food type, or stall name.</p>
                            <button type="button" className="btn btn-primary" onClick={() => {
                                setSearchTerm('');
                                setSelectedTag('all');
                            }}>
                                Reset filters
                            </button>
                        </div>
                    ) : (
                        <div className="vendor-grid">
                            {filteredVendors.map((vendor, index) => (
                                <VendorCard key={vendor.id} vendor={vendor} index={index} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
            <BottomNav />
        </main>
    );
}
