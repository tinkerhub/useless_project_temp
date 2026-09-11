import type {
    ComponentType,
} from "react";

import ExcuseGenerator from "../pages/ExcuseGenerator";
import TyperChecker from "../pages/TyperChecker";
import {
    ExcuseIcon,
    KeyboardIcon,
} from "../components/ToolIcons";

export interface UselessTool {
    id: string;
    name: string;
    tagline: string;
    icon: ComponentType;
    component: ComponentType;
}

export const tools: UselessTool[] = [
    {
        id: "excuse-generator",
        name: "Excuse Generator",
        tagline:
            "Accountability avoidance technology for situations that probably didn't need an excuse.",
        icon: ExcuseIcon,
        component: ExcuseGenerator,
    },
    {
        id: "typer-checker",
        name: "The Typer Checker",
        tagline:
            "Judges your typing and whatever dark secrets it reveals about you as a person.",
        icon: KeyboardIcon,
        component: TyperChecker,
    },
];