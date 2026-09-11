import ThemeToggle from "./ThemeToggle";

import "./AppHeader.css";

interface AppHeaderProps {
    onBack?: () => void;
}

function AppHeader({ onBack }: AppHeaderProps) {
    return (
        <header className="app-header">
            <div className="app-header-inner">
                {onBack ? (
                    <button
                        type="button"
                        className="header-back"
                        onClick={onBack}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        <span>Dashboard</span>
                    </button>
                ) : (
                    <span className="header-brand">
                        UselessOS<sup>™</sup>
                    </span>
                )}

                <ThemeToggle />
            </div>
        </header>
    );
}

export default AppHeader;