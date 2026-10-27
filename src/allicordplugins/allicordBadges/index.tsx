/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./fixDiscordBadgePadding.css";

import { _getBadges, addProfileBadge, BadgePosition, BadgeUserArgs, ProfileBadge, removeProfileBadge } from "@api/Badges";
import { ApplicationCommandInputType, sendBotMessage } from "@api/Commands";
import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { CopyIcon, LinkIcon } from "@components/Icons";
import { openContributorModal } from "@components/settings";
import { SourceIcons } from "@components/settings/tabs/plugins/sourceIcons";
import { EquicordDonorModal, VencordDonorModal } from "@plugins/_api/badges/modals";
import { setAllicordContributors } from "@utils/allicordContributors";
import { AllicordDevs, Devs, EquicordDevs } from "@utils/constants";
import { copyWithToast } from "@utils/discord";
import { Logger } from "@utils/Logger";
import { shouldShowAllicordContributorBadge, shouldShowContributorBadge, shouldShowEquicordContributorBadge } from "@utils/misc";
import definePlugin, { OptionType, PluginSettingBooleanDef } from "@utils/types";
import { ContextMenuApi, Menu, showToast, UserStore } from "@webpack/common";
import flibatsuniverseIcon from "file://../../../assets/icons/allicord/flibatsuniverse.webp?base64";
import customIcon from "file://../../../assets/icons/misc/userplugin.webp?base64";

import Plugins, { PluginMeta } from "~plugins";

import { getEquicordDonorBadges, getVencordDonorBadges, loadDonorBadges } from "./donors";
import { AllicordDonorModal, BotModal, FlibatsUniverseModal } from "./modals";

interface UserBadge {
    tooltip: string;
    mod: string;
    badge: string;
    kind?: string;
}

const services = [
    ["vencord", "Vencord", true],
    ["allicord", "Allicord", true],
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

const providerIcons: Record<string, string> = {
    allicord: `data:image/webp;base64,${flibatsuniverseIcon}`,
    custom: `data:image/webp;base64,${customIcon}`
};

function renderProvider(option?: { label: string; value: string; }) {
    if (!option) return null;

    return (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src={providerIcons[option.value]} alt="" width={20} height={20} />
            {option.label}
        </span>
    );
}

const settings = definePluginSettings({
    provider: {
        type: OptionType.SELECT,
        description: "Badge API Provider",
        options: [
            { label: "Aerolith API", value: "allicord", default: true },
            { label: "Custom", value: "custom" }
        ],
        componentProps: {
            renderOptionLabel: renderProvider,
            renderOptionValue: (options: { label: string; value: string; }[]) => renderProvider(options?.[0])
        },
        onChange: loadBadges
    },
    customUrl: {
        type: OptionType.STRING,
        description: "Custom badge API URL",
        default: "",
        hidden: () => settings.store.provider !== "custom",
        onChange: loadBadges
    },
    modStyle: {
        type: OptionType.SELECT,
        description: "Show which client mod a badge comes from",
        options: [
            { label: "Don't show the mod", value: "none", default: true },
            { label: "Show the mod as a prefix", value: "prefix" },
            { label: "Show the mod as a suffix", value: "suffix" }
        ]
    },
    showDiscord: {
        type: OptionType.BOOLEAN,
        description: "Discord badges. Always on.",
        default: true,
        disabled: () => true
    },
    ...Object.fromEntries(services.map(([id, name, on]) => [id === "allicord" ? "showAllicord" : id, {
        type: OptionType.BOOLEAN,
        description: `Show ${name} badges.`,
        default: !!on,
        ...(id === "allicord" ? { disabled: () => true } : {}),
        onChange: loadBadges
    } satisfies PluginSettingBooleanDef] as const))
});

// Allicord's own badges come first, then flibatsuniverse, then other client mods in the order listed above
const kindOrder = ["developer", "contributor", "donor", "bot", "flibatsuniverse"];

function badgeRank({ mod, kind }: UserBadge) {
    if (mod === "allicord") {
        const rank = kindOrder.indexOf(kind ?? "");
        return rank === -1 ? kindOrder.length - 1 : rank;
    }

    return kindOrder.length + services.findIndex(([id]) => id === mod);
}

const DEFAULT_API_URL = "https://api.flibat.com/v1/alliance/badges";

function getApiUrl() {
    const { provider, customUrl } = settings.store;
    return provider === "custom" && customUrl ? customUrl : DEFAULT_API_URL;
}

const logger = new Logger("AllicordBadges");

let users: Record<string, UserBadge[]> = {};
let intervalId: ReturnType<typeof setInterval>;

async function loadBadges() {
    const base = getApiUrl().replace(/\/$/, "");
    const data = await fetch(`${base}/users`, { cache: "no-cache" }).then(r => r.json());
    users = data.data?.users ?? data.users;
    setAllicordContributors(Object.entries(users)
        .filter(([, badges]) => badges.some(b => b.mod === "allicord" && (b.kind === "contributor" || b.kind === "developer")))
        .map(([id]) => id));
}

async function refreshBadges(noCache = false) {
    await Promise.all([loadBadges(), loadDonorBadges(noCache)]);
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
        case "flibatsuniverse": return FlibatsUniverseModal(origin);
        case "bot": return BotModal(origin);
        case "donor": return AllicordDonorModal(origin);
    }
}

export function BadgeContextMenu({ badge }: { badge: Omit<ProfileBadge, "id"> & BadgeUserArgs; }) {
    return (
        <Menu.Menu
            navId="vc-badge-context"
            onClose={ContextMenuApi.closeContextMenu}
            aria-label="Badge Options"
        >
            {badge.description && (
                <Menu.MenuItem
                    id="vc-badge-copy-name"
                    label="Copy Badge Name"
                    action={() => copyWithToast(badge.description!)}
                    leadingAccessory={{ type: "icon", icon: CopyIcon }}
                />
            )}
            {badge.iconSrc && (
                <Menu.MenuItem
                    id="vc-badge-copy-link"
                    label="Copy Badge Image Link"
                    action={() => copyWithToast(badge.iconSrc!)}
                    leadingAccessory={{ type: "icon", icon: LinkIcon }}
                />
            )}
        </Menu.Menu>
    );
}

const roundedBadge = { style: { borderRadius: "50%", transform: "scale(0.9)" } };

function openBadgeMenu(event: React.MouseEvent, badge: ProfileBadge & BadgeUserArgs) {
    ContextMenuApi.openContextMenu(event, () => <BadgeContextMenu badge={badge} />);
}

function formatTooltip({ mod, tooltip }: UserBadge) {
    const { modStyle } = settings.store;
    if (mod === "allicord" || modStyle === "none") return tooltip;

    const name = services.find(([id]) => id === mod)?.[1] ?? mod;
    return modStyle === "prefix" ? `${name} - ${tooltip}` : `${tooltip} - ${name}`;
}

const ContributorBadge: ProfileBadge = {
    id: "vencord_contributor_badge",
    description: "Vencord Contributor",
    iconSrc: "https://cdn.discordapp.com/emojis/1092089799109775453.png?size=64",
    position: BadgePosition.START,
    shouldShow: ({ userId }) => shouldShowContributorBadge(userId),
    onClick: (_, { userId }) => openContributorModal(UserStore.getUser(userId))
};

const EquicordContributorBadge: ProfileBadge = {
    id: "equicord_contributor_badge",
    description: "Equicord Contributor",
    iconSrc: SourceIcons.equicord,
    position: BadgePosition.START,
    shouldShow: ({ userId }) => shouldShowEquicordContributorBadge(userId),
    onClick: (_, { userId }) => openContributorModal(UserStore.getUser(userId)),
    props: roundedBadge
};

const AllicordContributorBadge: ProfileBadge = {
    id: "allicord_contributor_badge",
    description: "Allicord Contributor",
    iconSrc: `${DEFAULT_API_URL}/assets/allicord/contributor.svg`,
    position: BadgePosition.START,
    shouldShow: ({ userId }) => shouldShowAllicordContributorBadge(userId),
    onClick: (_, { userId }) => openContributorModal(UserStore.getUser(userId)),
    props: roundedBadge
};

const UserPluginContributorBadge: ProfileBadge = {
    id: "user_plugin_contributor_badge",
    description: "User Plugin Contributor",
    iconSrc: SourceIcons.user,
    position: BadgePosition.START,
    shouldShow: ({ userId }) => {
        if (!IS_DEV) return false;

        return Object.values(Plugins).some(p => PluginMeta[p.name]?.userPlugin && p.authors.some(a => a.id.toString() === userId));
    },
    onClick: (_, { userId }) => openContributorModal(UserStore.getUser(userId)),
    props: roundedBadge
};

// Equicord donors, then Vencord donors
const donorBadge: ProfileBadge = {
    id: "allicord_donor_badges",
    getBadges({ userId }) {
        return [
            ...(getEquicordDonorBadges(userId) ?? []).map((b, idx) => ({
                id: `equicord_donor_badge_${idx}`,
                iconSrc: b.badge,
                description: b.tooltip,
                position: BadgePosition.START,
                props: roundedBadge,
                onContextMenu: openBadgeMenu,
                onClick: () => EquicordDonorModal()
            } satisfies ProfileBadge)),
            ...(getVencordDonorBadges(userId) ?? []).map((b, idx) => ({
                id: `vencord_donor_badge_${idx}`,
                iconSrc: b.badge,
                description: b.tooltip,
                position: BadgePosition.START,
                props: roundedBadge,
                onContextMenu: openBadgeMenu,
                onClick: () => VencordDonorModal()
            } satisfies ProfileBadge))
        ];
    }
};

const badge: ProfileBadge = {
    id: "allicord_badges",
    getBadges({ userId }) {
        const owned = new Set([
            ...getVencordDonorBadges(userId) ?? [],
            ...getEquicordDonorBadges(userId) ?? []
        ].map(b => b.badge));

        return (users[userId] ?? [])
            .filter(b => (b.mod === "allicord" || settings.store[b.mod]) && !owned.has(b.badge)
                && !(b.mod === "allicord" && b.kind === "contributor" && shouldShowAllicordContributorBadge(userId))
                && !(b.mod === "vencord" && b.tooltip === "Vencord Contributor" && shouldShowContributorBadge(userId))
                && !(b.mod === "equicord" && b.tooltip === "Equicord Contributor" && shouldShowEquicordContributorBadge(userId)))
            .sort((a, b) => badgeRank(a) - badgeRank(b))
            .map((b, idx) => ({
                id: `allicord_badges_${b.mod}_${idx}`,
                iconSrc: b.badge,
                description: formatTooltip(b),
                position: BadgePosition.START,
                props: roundedBadge,
                onContextMenu: openBadgeMenu,
                onClick: b.kind ? () => openBadge(b.kind, userId) : undefined
            }));
    }
};

const registered = [ContributorBadge, EquicordContributorBadge, AllicordContributorBadge, UserPluginContributorBadge, badge, donorBadge];

export default definePlugin({
    name: "AllicordBadges",
    description: "Adds contributor, donor and community badges to user profiles.",
    tags: ["Appearance"],
    authors: [
        AllicordDevs.Flibat,
        Devs.Megu, Devs.Ven, Devs.TheSun, Devs.kaxtusik,
        Devs.HypedDomi, EquicordDevs.Wolfie, Devs.thororen
    ],
    required: true,
    conflicts: ["BadgeAPI", "GlobalBadges"],
    enabledByDefault: true,
    settings,
    patches: [
        {
            find: "#{intl::PROFILE_USER_BADGES}",
            replacement: [
                {
                    match: /alt:" ","aria-hidden":!0,src:.{0,50}(\i).iconSrc/,
                    replace: "...$1.props,$&"
                },
                // Path with 2026-04-badge-discovery OFF
                {
                    match: /(?<=forceOpen:.{0,40}?ariaHidden:!0,)children:(?=.{0,50}?(\i)\.id)/,
                    replace: "children:$1.component?$self.renderBadgeComponent({...$1}):"
                },
                // Path with 2026-04-badge-discovery ON
                {
                    match: /(?<=fallbackIconSrc:.{0,50}?)children:(?=.{0,50}?(\i)\.id)/,
                    replace: "children:$1.component?$self.renderBadgeComponent({...$1}):"
                },
                // handle onClick and onContextMenu
                {
                    match: /href:(\i)\.link/,
                    replace: "...$self.getBadgeMouseEventHandlers($1),$&"
                }
            ]
        },
        {
            find: "getLegacyUsername(){",
            replacement: {
                match: /getBadges\(\)\{.{0,100}?return\[/,
                replace: "$&...$self.getBadges(this),"
            }
        }
    ],
    commands: [{
        name: "refresh-badges",
        description: "Refreshes the badges shown on everyone's profile",
        inputType: ApplicationCommandInputType.BUILT_IN,
        async execute(_, ctx) {
            try {
                await refreshBadges(true);
                sendBotMessage(ctx.channel.id, { content: "Badges refreshed." });
            } catch {
                sendBotMessage(ctx.channel.id, { content: "Could not refresh badges. Try again in a moment." });
            }
        }
    }],
    toolboxActions: {
        async "Refetch Badges"() {
            await refreshBadges(true);
            showToast({ text: "Successfully refetched badges!", variant: "success" });
        }
    },
    getBadges(profile: { userId: string; guildId: string; }) {
        if (!profile) return [];

        try {
            return _getBadges(profile);
        } catch (e) {
            logger.error(e);
            return [];
        }
    },
    renderBadgeComponent: ErrorBoundary.wrap((badge: ProfileBadge & BadgeUserArgs) => {
        const Component = badge.component!;
        return <Component {...badge} />;
    }, { noop: true }),
    getBadgeMouseEventHandlers(badge: ProfileBadge & BadgeUserArgs) {
        const handlers = {} as Record<string, (e: React.MouseEvent) => void>;

        if (!badge) return handlers;

        const { onClick, onContextMenu } = badge;

        if (onClick) handlers.onClick = e => onClick(e, badge);
        if (onContextMenu) handlers.onContextMenu = e => onContextMenu(e, badge);

        return handlers;
    },
    async start() {
        settings.store.showDiscord = true;
        settings.store.showAllicord = true;
        // The last badge added is shown first: donors, then Allicord and other mods, then contributors
        registered.forEach(addProfileBadge);
        const refresh = () => refreshBadges().catch(e => logger.error("Could not refresh badges", e));
        await refresh();
        intervalId = setInterval(refresh, 1000 * 60 * 10);
    },
    stop() {
        clearInterval(intervalId);
        registered.forEach(removeProfileBadge);
    }
});
