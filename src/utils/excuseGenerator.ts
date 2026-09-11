import {
    excuseTemplates,
} from "../data/excuses";

import type {
    ExcuseLevel,
    Situation,
} from "../data/excuses";

export function generateExcuse(
    situation: Situation,
    level: ExcuseLevel
): string {
    const matchingTemplates = excuseTemplates.filter(
        (excuse) =>
            excuse.situation === situation &&
            excuse.level === level
    );

    if (matchingTemplates.length === 0) {
        return "Unfortunately, no excuse was found. This is deeply embarrassing.";
    }

    const group = matchingTemplates[
        Math.floor(Math.random() * matchingTemplates.length)
    ];

    return group.templates[
        Math.floor(Math.random() * group.templates.length)
    ];
}