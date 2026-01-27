import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function VendorList() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('event') || 1; // Default event

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            // Demo mode with mock data
            setVendors([
                { id: '1', name: 'Burger Bliss', description: 'Gourmet burgers and loaded fries', pickup_location: 'Food Court A, Stall 3' },
                { id: '2', name: 'Pizza Paradise', description: 'Wood-fired artisan pizzas', pickup_location: 'Food Court B, Stall 1' },
                { id: '3', name: 'Drinks & Co', description: 'Craft cocktails and refreshments', pickup_location: 'Bar Area 2' },
            ]);
            setLoading(false);
            return;
        }
        fetchVendors();
    }, [eventId]);

    async function fetchVendors() {
        try {
            const { data, error } = await supabase
                .from('vendors')
                .select('*')
                .eq('event_id', eventId)
                .eq('is_active', true);

            if (error) throw error;
            setVendors(data || []);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            {/* Header */}
            <header style={{ padding: '20px 0', borderBottom: '1px solid var(--stroke)', marginBottom: '40px' }}>
                <div className="container">
                    <Link to="/" style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)', textDecoration: 'none' }}>
                        ← Back
                    </Link>
                </div>
            </header>

            <div className="container">
                {!isSupabaseConfigured() && (
                    <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #f59e0b', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                        <p style={{ color: '#f59e0b', margin: 0 }}>
                            ⚠️ <strong>Demo Mode:</strong> Supabase not configured. Using mock data. See SETUP.md to connect your database.
                        </p>
                    </div>
                )}

                <h1 style={{ fontSize: '40px', fontWeight: '800', marginBottom: '16px' }}>Choose a Vendor</h1>
                <p className="text-muted" style={{ marginBottom: '40px' }}>Select from the vendors below to view their menu.</p>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                    </div>
                ) : vendors.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                        <h3>No vendors available</h3>
                        <p className="text-muted">Please check back later or contact the event organizer.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {vendors.map((vendor) => (
                            <Link
                                key={vendor.id}
                                to={`/order/vendor/${vendor.id}`}
                                className="card"
                                style={{ textDecoration: 'none', transition: 'transform 0.2s', cursor: 'pointer' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {vendor.logo_url && (
                                    <div style={{ width: '100%', height: '160px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={vendor.logo_url} alt={vendor.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </div>
                                )}
                                <h3 style={{ marginBottom: '8px' }}>{vendor.name}</h3>
                                {vendor.description && <p className="text-muted" style={{ fontSize: '14px' }}>{vendor.description}</p>}
                                {vendor.pickup_location && (
                                    <p className="text-accent" style={{ fontSize: '13px', marginTop: '12px' }}>📍 {vendor.pickup_location}</p>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
