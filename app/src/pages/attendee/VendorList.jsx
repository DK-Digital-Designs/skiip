import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useStores } from '../../lib/hooks/useMenu';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import BottomNav from '../../components/ui/BottomNav';
import Icon from '../../components/ui/Icon';
import SkiipLogo from '../../components/ui/SkiipLogo';
import { getInitials, getVendorImage } from '../../lib/ui-format';

const MOCK_VENDORS = [
    {
        id: '1',
        name: 'Burger Bliss',
        description: 'Gourmet burgers and loaded fries',
        pickup_location: 'Food Court A, Stall 3',
    },
    {
        id: '2',
        name: 'Taco Town',
        description: 'Street tacos, nachos, and fresh salsa',
        pickup_location: 'Food Court B, Stall 1',
    },
    {
        id: '3',
        name: 'Drinks & Co',
        description: 'Cocktails, mocktails, and cold soft drinks',
        pickup_location: 'Bar Area 2',
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

export default function VendorList() {
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('event') || 1;
    const { data: qStores = [], isLoading: isStoresLoading } = useStores(isSupabaseConfigured() ? eventId : null);

    const isDemo = !isSupabaseConfigured();
    const vendors = isDemo ? MOCK_VENDORS : qStores;
    const loading = isDemo ? false : isStoresLoading;

    return (
        <main className="app-page app-page--buyer">
            <div className="container" style={{ display: 'grid', gap: '26px' }}>
                <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <SkiipLogo />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button type="button" className="btn btn-ghost icon-button" aria-label="Notifications">
                            <Icon name="bell" size={19} />
                        </button>
                        <Link to="/order/profile" className="btn btn-accent icon-button" aria-label="Profile">
                            <Icon name="user" size={18} />
                        </Link>
                    </div>
                </section>

                <section className="hero-panel">
                    <div className="hero-panel__content">
                        <span className="chip chip--cyan" style={{ width: 'fit-content', color: '#fff', background: 'rgba(34,211,238,0.22)' }}>
                            Live now
                        </span>
                        <h1>Summer Beats 2026</h1>
                        <p>Skip the lines, enjoy the vibes. Browse vendors and order ahead from your phone.</p>
                    </div>
                </section>

                <section className="surface" style={{ display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr) auto', alignItems: 'center', gap: '16px', padding: '18px', borderRadius: '28px' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,211,238,0.16)', display: 'grid', placeItems: 'center', color: 'var(--ink)' }}>
                        <Icon name="map" size={28} />
                    </div>
                    <div>
                        <h2 style={{ color: 'var(--ink)', fontSize: '20px', lineHeight: 1.15 }}>Find your nearest stall</h2>
                        <p className="text-muted" style={{ fontSize: '14px' }}>
                            View {vendors.length || 0} vendors across the park.
                        </p>
                    </div>
                    <Link to="/order" className="btn btn-ghost icon-button" aria-label="Open stall map">
                        <Icon name="map" size={20} />
                    </Link>
                </section>

                {isDemo && (
                    <div className="chip chip--accent" style={{ width: 'fit-content' }}>
                        Demo mode: using sample vendor data
                    </div>
                )}

                <section style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '16px' }}>
                        <div>
                            <p className="page-kicker">Browse vendors</p>
                            <h2 style={{ color: 'var(--ink)', fontSize: '28px', lineHeight: 1.1 }}>Choose your stall</h2>
                        </div>
                        <span className="text-accent" style={{ fontSize: '13px', fontWeight: 900 }}>See all</span>
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
                    ) : vendors.length === 0 ? (
                        <div className="surface empty-state">
                            <h3>No vendors available</h3>
                            <p>Check back later or ask the event team which stalls are open.</p>
                        </div>
                    ) : (
                        <div className="vendor-grid">
                            {vendors.map((vendor, index) => (
                                <Link key={vendor.id} to={`/order/vendor/${vendor.id}`} className="vendor-card">
                                    <div style={{ display: 'grid', alignContent: 'center', gap: '10px' }}>
                                        <span className={index === 0 ? 'chip chip--accent' : 'chip'}>
                                            {index === 0 ? 'Trending' : 'Popular'}
                                        </span>
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
                            ))}
                        </div>
                    )}
                </section>
            </div>
            <BottomNav />
        </main>
    );
}
