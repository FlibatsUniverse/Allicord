/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Notice } from "@components/Notice";
import { EquicordDevs } from "@utils/constants";
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

const iconPaths: Record<string, string> = {
    desktop: "M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z",
    web: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
    phone: "M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99z",
    console: "M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
    vr: "M20.74 6H3.21C2.55 6 2 6.57 2 7.28v10.44c0 .7.55 1.28 1.23 1.28h4.79c.52 0 .96-.33 1.14-.79l1.4-3.48c.47-1.53 2.03-1.53 2.5 0l1.4 3.48c.18.46.63.79 1.14.79h4.79c.68 0 1.23-.57 1.23-1.28V7.28c0-.71-.55-1.28-1.26-1.28z"
};

const platformIcons: Record<string, string> = {
    desktop: "desktop",
    web: "web",
    android: "phone",
    ios: "phone",
    xbox: "console",
    playstation: "console",
    vr: "vr"
};

function PlatformIcon({ platform, ...props }: { platform: string; className?: string; width?: number; height?: number; }) {
    return (
        <svg viewBox="0 0 24 24" width={props.width ?? 18} height={props.height ?? 18} className={props.className} fill="currentColor" aria-hidden>
            <path d={iconPaths[platformIcons[platform] ?? "desktop"]} />
        </svg>
    );
}

function PlatformEntry() {
    const { platform } = settings.use(["platform"]);

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
    authors: [EquicordDevs.Drag, EquicordDevs.neoarz],
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
