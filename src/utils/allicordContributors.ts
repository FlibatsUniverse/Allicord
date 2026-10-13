/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isAllicordDev } from "./misc";

const contributors = new Set<string>();

/** Remembers who the badge API says is a contributor, so settings can check without loading the badge plugin */
export function setAllicordContributors(ids: Iterable<string>) {
    contributors.clear();
    for (const id of ids) contributors.add(id);
}

export function isAllicordContributor(userId?: string) {
    return !!userId && (isAllicordDev(userId) || contributors.has(userId));
}
