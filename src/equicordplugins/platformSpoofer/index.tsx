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
                <PlatformMenuItem
                    id="vc-platform-spoofer"
                    icon={() => <div />}
                    label="Platform"
                    renderSubmenu={PlatformSubMenu}
                />
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
