/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Notice } from "@components/Notice";
import { AllicordDevs, EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { Menu, showToast, UserStore } from "@webpack/common";

const PlatformMenuItem = findComponentByCodeLazy("#{intl::MORE_OPTIONS}", ",renderSubmenu:");

const platforms = [
    ["desktop", "Desktop"],
    ["web", "Web"],
    ["android", "Android"],
    ["ios", "iOS"],
    ["xbox", "Xbox"],
    ["playstation", "Playstation"],
    ["vr", "VR"]
] as const;

// The same icons Discord uses for its platform indicators
const icons: Record<string, { path: string; viewBox: string; }> = {
    desktop: {
        path: "M4 2.5c-1.103 0-2 .897-2 2v11c0 1.104.897 2 2 2h7v2H7v2h10v-2h-4v-2h7c1.103 0 2-.896 2-2v-11c0-1.103-.897-2-2-2H4Zm16 2v9H4v-9h16Z",
        viewBox: "0 0 24 24"
    },
    web: {
        path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93Zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39Z",
        viewBox: "0 0 24 24"
    },
    mobile: {
        path: "M 187 0 L 813 0 C 916.277 0 1000 83.723 1000 187 L 1000 1313 C 1000 1416.277 916.277 1500 813 1500 L 187 1500 C 83.723 1500 0 1416.277 0 1313 L 0 187 C 0 83.723 83.723 0 187 0 Z M 125 1000 L 875 1000 L 875 250 L 125 250 Z M 500 1125 C 430.964 1125 375 1180.964 375 1250 C 375 1319.036 430.964 1375 500 1375 C 569.036 1375 625 1319.036 625 1250 C 625 1180.964 569.036 1125 500 1125 Z",
        viewBox: "0 0 1000 1500"
    },
    embedded: {
        path: "M3.06 20.4q-1.53 0-2.37-1.065T.06 16.74l1.26-9q.27-1.8 1.605-2.97T6.06 3.6h11.88q1.8 0 3.135 1.17t1.605 2.97l1.26 9q.21 1.53-.63 2.595T20.94 20.4q-.63 0-1.17-.225T18.78 19.5l-2.7-2.7H7.92l-2.7 2.7q-.45.45-.99.675t-1.17.225Zm14.94-7.2q.51 0 .855-.345T19.2 12q0-.51-.345-.855T18 10.8q-.51 0-.855.345T16.8 12q0 .51.345 .855T18 13.2Zm-2.4-3.6q.51 0 .855-.345T16.8 8.4q0-.51-.345-.855T15.6 7.2q-.51 0-.855.345T14.4 8.4q0 .51.345 .855T15.6 9.6ZM6.9 13.2h1.8v-2.1h2.1v-1.8h-2.1v-2.1h-1.8v2.1h-2.1v1.8h2.1v2.1Z",
        viewBox: "0 0 24 24"
    },
    vr: {
        path: "M8.46 8.64a1 1 0 0 1 1 1c0 .44-.3.8-.72.92l-.11.07c-.08.06-.2.19-.2.41a.99.99 0 0 1-.98.86h-.06a1 1 0 0 1-.94-1.05l.02-.32c.05-1.06.92-1.9 1.99-1.9ZM15.55 5a5.5 5.5 0 0 1 5.15 3.67h.3a2 2 0 0 1 2 2v3.18a2 2 0 0 1-2 1.99h-.2A4.54 4.54 0 0 1 16.55 19a4.45 4.45 0 0 1-3.6-1.83 1.2 1.2 0 0 0-1.9 0 4.44 4.44 0 0 1-3.9 1.82 4.54 4.54 0 0 1-3.94-3.15H3a2 2 0 0 1-2-2v-3.18c0-1.1.9-1.99 2-1.99h.3A5.5 5.5 0 0 1 8.46 5h7.09Zm-7.1 2C6.6 7 5.06 8.5 4.97 10.41l-.02.66v3.18c0 1.43 1.05 2.66 2.34 2.74.85.06 1.63-.32 2.14-1.01a3.2 3.2 0 0 1 2.57-1.3c1 0 1.97.48 2.57 1.3.5.69 1.3 1.08 2.14 1.01 1.3-.08 2.34-1.31 2.34-2.74l-.02-3.84a3.54 3.54 0 0 0-3.49-3.43H8.45Z",
        viewBox: "0 4 24 16"
    }
};

const platformIcons: Record<string, string> = {
    desktop: "desktop",
    web: "web",
    android: "mobile",
    ios: "mobile",
    xbox: "embedded",
    playstation: "embedded",
    vr: "vr"
};

function PlatformIcon({ platform, ...props }: { platform: string; className?: string; width?: number; height?: number; }) {
    const { path, viewBox } = icons[platformIcons[platform] ?? "desktop"];

    return (
        <svg viewBox={viewBox} width={props.width ?? 18} height={props.height ?? 18} className={props.className} fill="currentColor" aria-hidden>
            <path d={path} />
        </svg>
    );
}

function PlatformEntry() {
    const { platform, showInStatusMenu } = settings.use(["platform", "showInStatusMenu"]);
    if (!showInStatusMenu) return null;

    return (
        <PlatformMenuItem
            id="vc-platform-spoofer"
            icon={props => <PlatformIcon platform={platform} {...props} />}
            label="Platform"
            renderSubmenu={PlatformSubMenu}
        />
    );
}

function PlatformSubMenu() {
    const { platform } = settings.use(["platform"]);

    return (
        <Menu.Menu navId="vc-platform-spoofer-submenu" onClose={() => { }}>
            {platforms.map(([value, label]) => (
                <Menu.MenuRadioItem
                    key={value}
                    id={`vc-platform-spoofer-${value}`}
                    group="vc-platform-spoofer"
                    label={label}
                    checked={platform === value}
                    action={() => {
                        if (platform === value) return;
                        settings.store.platform = value;
                        showToast("Restart Discord to show up as " + label, "message");
                    }}
                />
            ))}
        </Menu.Menu>
    );
}

const settings = definePluginSettings({
    showInStatusMenu: {
        type: OptionType.BOOLEAN,
        description: "Show the platform switcher in the account panel's status menu",
        default: true
    },
    platform: {
        type: OptionType.SELECT,
        description: "What platform to show up as on",
        restartNeeded: true,
        options: [
            {
                label: "Desktop",
                value: "desktop",
                default: true,
            },
            {
                label: "Web",
                value: "web",
            },
            {
                label: "Android",
                value: "android"
            },
            {
                label: "iOS",
                value: "ios"
            },
            {
                label: "Xbox",
                value: "xbox",
            },
            {
                label: "Playstation",
                value: "playstation",
            },
            {
                label: "VR",
                value: "vr",
            },
        ]
    }
});

export default definePlugin({
    name: "PlatformSpoofer",
    isModifiedEquicord: true,
    description: "Spoof what platform or device you're on",
    tags: ["Utility"],
    authors: [EquicordDevs.Drag, EquicordDevs.neoarz, AllicordDevs.Flibat],
    settingsAboutComponent: () => (
        <Notice.Warning>
            We can't guarantee this plugin won't get you warned or banned.
        </Notice.Warning>
    ),
    settings: settings,
    patches: [
        {
            find: "_doIdentify(){",
            replacement: [
                {
                    match: /window._ws=null,null!=\i/,
                    replace: "false"
                },
                {
                    match: /(?<="GatewaySocket"\)\}\),properties:)(\i)/,
                    replace: "{...$1,...$self.getPlatform(true)}"
                },
            ]
        },
        {
            find: "#{intl::STATUS_MENU_LABEL}",
            replacement: {
                match: /(popoutContainerRef:\i,scrollerRef:\i.{0,50}\}\))(?=\]|,\$self\.render\(\)\])/,
                replace: "$1,$self.renderStatusMenu()"
            }
        },
        {
            find: "#{intl::MORE_OPTIONS}),...",
            replacement: {
                match: /\i:\(\)=>\i,(?=.*?function (\i).{0,100}renderSubmenu:\i,ref:)/,
                replace: "$&PlatformMenuItem:()=>$1,"
            }
        }
    ],
    renderStatusMenu() {
        return (
            <ErrorBoundary noop>
                <PlatformEntry />
            </ErrorBoundary>
        );
    },
    getPlatform(bypass, userId?: any) {
        const platform = settings.store.platform ?? "desktop";

        if (bypass || userId === UserStore.getCurrentUser().id) {
            switch (platform) {
                case "desktop":
                    return { browser: "Discord Client" };
                case "web":
                    return { browser: "Discord Web" };
                case "ios":
                    return { browser: "Discord iOS" };
                case "android":
                    return { browser: "Discord Android" };
                case "xbox":
                    return { browser: "Discord Embedded" };
                case "playstation":
                    return { browser: "Discord Embedded" };
                case "vr":
                    return { browser: "Discord VR" };
                default:
                    return null;
            }
        }

        return null;
    }
});
