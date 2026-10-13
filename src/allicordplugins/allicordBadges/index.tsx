/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addProfileBadge, BadgePosition, ProfileBadge, removeProfileBadge } from "@api/Badges";
import { isPluginEnabled } from "@api/PluginManager";
import { definePluginSettings } from "@api/Settings";
import { openContributorModal } from "@components/settings";
import GlobalBadgesPlugin from "@equicordplugins/globalBadges";
import BadgeAPI from "@plugins/_api/badges";
import { AllicordDevs } from "@utils/constants";
import definePlugin, { OptionType, PluginSettingBooleanDef } from "@utils/types";
import { UserStore } from "@webpack/common";

import { AllicordDonorModal, BotModal, UniverseModal } from "./modals";

interface UserBadge {
    tooltip: string;
    mod: string;
    badge: string;
    kind?: string;
}

const services = [
    ["vencord", "Vencord", true],
    ["equicord", "Equicord"],
    ["badgevault", "BadgeVault"],
    ["nekocord", "Nekocord"],
    ["reviewdb", "ReviewDB"],
    ["aero", "Aero"],
    ["aliucord", "Aliucord"],
    ["raincord", "Raincord"],
    ["velocity", "Velocity"],
    ["enmity", "Enmity"],
    ["paicord", "Paicord"],
    ["bunny", "Bunny"],
    ["goosemod", "GooseMod"],
    ["replugged", "Replugged"],
    ["betterdiscord", "BetterDiscord"],
    ["vendroidenhanced", "Vendroid Enhanced"],
    ["revenge", "Revenge"],
    ["record", "ReCord"]
] as const;

const settings = definePluginSettings({
    apiUrl: {
        type: OptionType.STRING,
        description: "Badge API to fetch badges from.",
        default: "https://alliance.flibat.com/api/badges"
    },
    showDiscord: {
        type: OptionType.BOOLEAN,
        description: "Discord badges. Always on.",
        default: true,
        disabled: () => true
    },
    showAllicord: {
        type: OptionType.BOOLEAN,
        description: "Allicord badges. Always on.",
        default: true,
        disabled: () => true
    },
    ...Object.fromEntries(services.map(([id, name, on]) => [id, {
        type: OptionType.BOOLEAN,
        description: `Show ${name} badges.`,
        default: !!on,
        onChange: loadBadges
    } satisfies PluginSettingBooleanDef] as const))
});

let users: Record<string, UserBadge[]> = {};
let intervalId: ReturnType<typeof setInterval>;

async function loadBadges() {
    const base = settings.store.apiUrl.replace(/\/$/, "");
    const data = await fetch(`${base}/users`, { cache: "no-cache" }).then(r => r.json());
    users = data.users;
}

// What clicking an Allicord badge opens.
function openBadge(kind: string | undefined, userId: string) {
    const { origin } = new URL(settings.store.apiUrl);
    switch (kind) {
        case "contributor":
        case "developer": {
            const user = UserStore.getUser(userId);
            if (user) openContributorModal(user);
            break;
        }
        case "universe": return UniverseModal(origin);
        case "bot": return BotModal(origin);
        case "donor": return AllicordDonorModal(origin);
    }
}

const badge: ProfileBadge = {
    id: "allicord_badges",
    getBadges({ userId }) {
        const donor = [
            ...BadgeAPI.DonorBadges[userId] ?? [],
            ...BadgeAPI.EquicordDonorBadges[userId] ?? []
        ];
        const global = isPluginEnabled(GlobalBadgesPlugin.name)
            ? GlobalBadgesPlugin.getGlobalBadges(userId) ?? []
            : [];
        const seen = new Set([
            ...donor.map(b => b.badge),
            ...donor.map(b => b.tooltip),
            ...global.map(b => b.iconSrc)
        ]);

        return (users[userId] ?? [])
            .filter(b => {
                if (b.mod !== "allicord" && !settings.store[b.mod]) return false;

                const key = `${b.mod}:${b.tooltip}`;
                if (seen.has(b.badge) || seen.has(key) || (b.mod !== "allicord" && seen.has(b.tooltip))) return false;
                seen.add(b.badge);
                seen.add(key);
                return true;
            })
            .map((b, idx) => ({
                id: `allicord_badges_${b.mod}_${idx}`,
                iconSrc: b.badge,
                description: b.tooltip,
                position: BadgePosition.START,
                props: { style: { borderRadius: "50%", transform: "scale(0.9)" } },
                onClick: b.kind ? () => openBadge(b.kind, userId) : undefined
            }));
    }
};

export default definePlugin({
    name: "AllicordBadges",
    description: "Shows Allicord and other client mod badges on profiles. Discord and Allicord badges are always on.",
    authors: [AllicordDevs.Flibat],
    required: true,
    enabledByDefault: true,
    settings,
    async start() {
        settings.store.showDiscord = true;
        settings.store.showAllicord = true;
        addProfileBadge(badge);
        await loadBadges();
        intervalId = setInterval(loadBadges, 1000 * 60 * 30);
    },
    stop() {
        clearInterval(intervalId);
        removeProfileBadge(badge);
    }
});
