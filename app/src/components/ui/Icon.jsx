import React from 'react';

const paths = {
    arrowLeft: (
        <>
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
        </>
    ),
    bag: (
        <>
            <path d="M6 8h12l-1 11H7L6 8Z" />
            <path d="M9 8a3 3 0 0 1 6 0" />
        </>
    ),
    bell: (
        <>
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
            <path d="M10 21h4" />
        </>
    ),
    cart: (
        <>
            <path d="M5 5h2l1.5 10h8.5l2-7H8" />
            <path d="M10 20h.01" />
            <path d="M17 20h.01" />
        </>
    ),
    calendar: (
        <>
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M8 3v4" />
            <path d="M16 3v4" />
            <path d="M4 10h16" />
        </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
        <>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v5l3 2" />
        </>
    ),
    close: (
        <>
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
        </>
    ),
    home: (
        <>
            <path d="M4 11 12 4l8 7" />
            <path d="M6 10v9h12v-9" />
            <path d="M10 19v-5h4v5" />
        </>
    ),
    map: (
        <>
            <path d="M9 18 3 20V6l6-2 6 2 6-2v14l-6 2-6-2Z" />
            <path d="M9 4v14" />
            <path d="M15 6v14" />
        </>
    ),
    minus: <path d="M5 12h14" />,
    plus: (
        <>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
        </>
    ),
    receipt: (
        <>
            <path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1V3Z" />
            <path d="M9 8h6" />
            <path d="M9 12h6" />
            <path d="M9 16h4" />
        </>
    ),
    settings: (
        <>
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19 12a7.1 7.1 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.8-1L14.4 3h-4l-.4 3.1a7 7 0 0 0-1.8 1l-2.4-1-2 3.4L5.8 11a7.1 7.1 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.8 1l.4 3.1h4l.4-3.1a7 7 0 0 0 1.8-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
        </>
    ),
    spark: (
        <>
            <path d="M13 2 5 13h7l-1 9 8-12h-7l1-8Z" />
        </>
    ),
    tag: (
        <>
            <path d="M20 13 13 20 4 11V4h7l9 9Z" />
            <path d="M7.5 7.5h.01" />
        </>
    ),
    user: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
        </>
    ),
    utensils: (
        <>
            <path d="M7 3v8" />
            <path d="M4 3v4a3 3 0 0 0 6 0V3" />
            <path d="M7 11v10" />
            <path d="M17 3v18" />
            <path d="M14 7c0-2.2 1.3-4 3-4" />
        </>
    ),
};

export default function Icon({ name, size = 20, strokeWidth = 2, className = '', ...props }) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {paths[name] || paths.spark}
        </svg>
    );
}
