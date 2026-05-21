import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { DEFAULT_LAUNCH_EVENT } from '../lib/launch-event';
import { SettingsService } from '../lib/services/settings.service';
import { trackSkiipEvent } from '../lib/analytics';

export default function LandingPage() {
    const [launchEvent, setLaunchEvent] = useState(DEFAULT_LAUNCH_EVENT);

    useEffect(() => {
        let active = true;
        SettingsService.getLaunchEvent().then((settings) => {
            if (active) setLaunchEvent(settings);
        });
        return () => {
            active = false;
        };
    }, []);

    return (
        <main className="app-page">
            <div className="container two-column" style={{ alignItems: 'center', minHeight: 'calc(100vh - 170px)' }}>
                <section>
                    <p className="page-kicker">Food without the queue</p>
                    <h1 className="page-title" style={{ marginTop: '12px' }}>
                        Order food and drinks without the queue.
                    </h1>
                    <p className="page-subtitle" style={{ marginTop: '18px' }}>
                        Browse festival vendors, pay on your phone, and collect when your order is ready.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '30px' }}>
                        <Link
                            to="/order"
                            className="btn btn-primary"
                            onClick={() => trackSkiipEvent('start_ordering_clicked', { location: 'landing_page' })}
                        >
                            <Icon name="bag" size={18} />
                            Start Ordering
                        </Link>
                    </div>
                </section>
                <section className="hero-panel" aria-label="SKIIP event preview">
                    <div className="hero-panel__content">
                        <span className="chip chip--cyan" style={{ width: 'fit-content', color: '#fff', background: 'rgba(34,211,238,0.22)' }}>
                            {launchEvent.label}
                        </span>
                        <h2>{launchEvent.landingTitle}</h2>
                        <p>{launchEvent.landingSubtitle}</p>
                    </div>
                </section>
            </div>
        </main>
    );
}
