function ExcuseIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="12" x2="13" y2="12" />
        </svg>
    );
}

function KeyboardIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <line x1="6" y1="10" x2="6" y2="10" />
            <line x1="10" y1="10" x2="10" y2="10" />
            <line x1="14" y1="10" x2="14" y2="10" />
            <line x1="18" y1="10" x2="18" y2="10" />
            <line x1="6" y1="14" x2="6" y2="14" />
            <line x1="10" y1="14" x2="16" y2="14" />
            <line x1="18" y1="14" x2="18" y2="14" />
        </svg>
    );
}

export {
    ExcuseIcon,
    KeyboardIcon,
};