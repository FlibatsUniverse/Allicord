/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addProfileBadge, BadgePosition, ProfileBadge, removeProfileBadge } from "@api/Badges";
import { ApplicationCommandInputType, sendBotMessage } from "@api/Commands";
import { definePluginSettings } from "@api/Settings";
import { openContributorModal } from "@components/settings";
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
    provider: {
        type: OptionType.SELECT,
        description: "Badge API Provider",
        options: [
            { label: "Allicord Badges", value: "allicord", default: true },
            { label: "Custom", value: "custom" }
        ],
        onChange: loadBadges
    },
    customUrl: {
        type: OptionType.STRING,
        description: "Custom badge API URL",
        default: "",
        hidden: () => settings.store.provider !== "custom",
        onChange: loadBadges
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

const DEFAULT_API_URL = "https://alliance.flibat.com/api/badges";

function getApiUrl() {
    const { provider, customUrl } = settings.store;
    return provider === "custom" && customUrl ? customUrl : DEFAULT_API_URL;
}

let users: Record<string, UserBadge[]> = {};
let intervalId: ReturnType<typeof setInterval>;

async function loadBadges() {
    const base = getApiUrl().replace(/\/$/, "");
    const data = await fetch(`${base}/users`, { cache: "no-cache" }).then(r => r.json());
    users = data.users;
}

// What clicking an Allicord badge opens.
function openBadge(kind: string | undefined, userId: string) {
    const { origin } = new URL(getApiUrl());
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
        const owned = new Set([
            ...BadgeAPI.DonorBadges[userId] ?? [],
            ...BadgeAPI.EquicordDonorBadges[userId] ?? []
        ].map(b => b.badge));

        return (users[userId] ?? [])
            .filter(b => (b.mod === "allicord" || settings.store[b.mod]) && !owned.has(b.badge))
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
    conflicts: ["GlobalBadges"],
    enabledByDefault: true,
    settings,
    commands: [{
        name: "refresh-badges",
        description: "Refreshes the badges shown on everyone's profile",
        inputType: ApplicationCommandInputType.BUILT_IN,
        async execute(_, ctx) {
            try {
                await loadBadges();
                sendBotMessage(ctx.channel.id, { content: "Badges refreshed." });
            } catch {
                sendBotMessage(ctx.channel.id, { content: "Could not refresh badges. Try again in a moment." });
            }
        }
    }],
    async start() {
        settings.store.showDiscord = true;
        settings.store.showAllicord = true;
        addProfileBadge(badge);
        await loadBadges();
        intervalId = setInterval(loadBadges, 1000 * 60 * 10);
    },
    stop() {
        clearInterval(intervalId);
        removeProfileBadge(badge);
    }
});
