import { useState } from "react";

import AppHeader from "./components/AppHeader";
import Dashboard from "./pages/Dashboard";

import { tools } from "./data/tools";
import { readStats, recordOpen } from "./utils/stats";

import type {
    ToolStats,
} from "./utils/stats";

import "./styles/global.css";

function App() {
    const [activeToolId, setActiveToolId] =
        useState<string | null>(null);

    const [stats, setStats] =
        useState<ToolStats>(readStats);

    const activeTool = tools.find(
        (tool) => tool.id === activeToolId
    );

    function handleOpenTool(toolId: string) {
        setStats(recordOpen(toolId));
        setActiveToolId(toolId);
    }

    function handleBack() {
        setActiveToolId(null);
    }

    const ActiveToolComponent = activeTool?.component;

    return (
        <div className="app">
            <AppHeader
                onBack={activeTool ? handleBack : undefined}
            />

            <main className="main-content">
                {activeTool && ActiveToolComponent ? (
                    <ActiveToolComponent />
                ) : (
                    <Dashboard
                        stats={stats}
                        onOpenTool={handleOpenTool}
                    />
                )}
            </main>
        </div>
    );
}

export default App;