/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { AllicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLES = [
    "apple", "google", "samsung", "microsoft-3D-fluent", "microsoft", "whatsapp", "twitter", "facebook",
    "huawei", "joypixels", "lg", "telegram", "animated-noto-color-emoji", "microsoft-teams", "skype",
    "twitter-emoji-stickers", "joypixels-animations", "serenityos", "toss-face", "sony", "noto-color-emoji",
    "noto-emoji", "openmoji", "icons8", "emojidex", "messenger", "htc", "softbank", "docomo", "au-kddi", "mozilla"
] as const;

const settings = definePluginSettings({
    style: {
        type: OptionType.SELECT,
        description: "Which emoji style to show.",
        restartNeeded: true,
        options: STYLES.map(style => ({ label: style, value: style, default: style === "apple" }))
    }
});

export default definePlugin({
    name: "EmojiStyle",
    description: "Replaces Discord's emojis with the emoji style of your choice.",
    authors: [AllicordDevs.coolpixels],
    settings,

    patches: [
        {
            find: '"no emoji for"',
            replacement: {
                match: /(?<=function \i\(\i\)\{if\(\i\.has\(\i\)\)return"";)/,
                replace: "return $self.getURL(arguments[0]);"
            }
        }
    ],

    getURL(emoji: string) {
        return `https://emoji.coolpixels.net/${encodeURIComponent(emoji)}?style=${settings.store.style}`;
    }
});
