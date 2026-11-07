/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type DonorBadge = Record<"tooltip" | "badge", string>;

let vencordDonors = {} as Record<string, DonorBadge[]>;
let equicordDonors = {} as Record<string, DonorBadge[]>;

export const getVencordDonorBadges = (userId: string): DonorBadge[] | undefined => vencordDonors[userId];
export const getEquicordDonorBadges = (userId: string): DonorBadge[] | undefined => equicordDonors[userId];

async function fetchBadges(url: string, noCache: boolean) {
    return fetch(url, noCache ? { cache: "no-cache" } : {}).then(r => r.json());
}

export async function loadDonorBadges(noCache = false) {
    const [vencord, equicord] = await Promise.all([
        fetchBadges("https://badges.vencord.dev/badges.json", noCache),
        fetchBadges("https://badge.equicord.org/badges.json", noCache)
    ]);

    vencordDonors = vencord;
    equicordDonors = equicord;
}
