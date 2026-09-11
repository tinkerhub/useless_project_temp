import { tools } from "../data/tools";

import type { ToolStats } from "../utils/stats";

import "./Dashboard.css";

interface DashboardProps {
    stats: ToolStats;
    onOpenTool: (toolId: string) => void;
}

function Dashboard({ stats, onOpenTool }: DashboardProps) {
    const totalUses = tools.reduce(
        (sum, tool) => sum + (stats[tool.id] ?? 0),
        0
    );

    return (
        <div className="dashboard-page">

            <header className="dashboard-header">
                <div className="dashboard-eyebrow">
                    UselessOS™ / Dashboard
                </div>

                <h1 className="dashboard-title">
                    Pick your poison.
                </h1>

                <p className="dashboard-subtitle">
                    A curated collection of completely useless
                    utilities. No purpose, no judgment, just
                    vibes.
                </p>
            </header>

            {totalUses > 0 && (
                <p className="dashboard-total">
                    {totalUses} useless{" "}
                    {totalUses === 1 ? "moment" : "moments"}{" "}
                    recorded so far. Impressive.
                </p>
            )}

            <div className="tool-grid">
                {tools.map((tool) => {
                    const used = stats[tool.id] ?? 0;
                    const Icon = tool.icon;

                    return (
                        <button
                            key={tool.id}
                            type="button"
                            className="tool-card"
                            onClick={() =>
                                onOpenTool(tool.id)
                            }
                        >
                            <span className="tool-card-icon">
                                <Icon />
                            </span>

                            <span className="tool-card-name">
                                {tool.name}
                            </span>

                            <span className="tool-card-tagline">
                                {tool.tagline}
                            </span>

                            <span className="tool-card-stats">
                                {used > 0
                                    ? `Used ${used} time${used === 1 ? "" : "s"}`
                                    : "Never used"}
                            </span>
                        </button>
                    );
                })}
            </div>

        </div>
    );
}

export default Dashboard;