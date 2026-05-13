import React from 'react';
import Icon from './Icon';

const iconForState = {
    done: 'check',
    current: 'utensils',
    pending: 'clock',
};

export default function StatusTimeline({ steps }) {
    return (
        <div className="timeline">
            {steps.map((step) => (
                <div key={step.id} className={`timeline-step timeline-step--${step.state}`}>
                    <div className="timeline-step__dot">
                        <Icon name={iconForState[step.state] || 'clock'} size={20} />
                    </div>
                    <div>
                        <h3 style={{ color: step.state === 'current' ? 'var(--accent)' : 'var(--ink)', fontSize: '18px', lineHeight: 1.2 }}>
                            {step.label}
                        </h3>
                        <p className="text-muted" style={{ fontSize: '14px', marginTop: '3px' }}>
                            {step.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
