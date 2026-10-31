/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { AllicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { React } from "@webpack/common";

const EMOJI_RE = /((?![©®™])\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier}|‍\p{Extended_Pictographic})*)/u;

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
        },
        {
            find: ".useSpriteSheet){let",
            replacement: {
                match: /if\(!(\i)\.useSpriteSheet\)\{let (\i)=null==\i\.id\?\i\.url:/,
                replace: "if(null==$1.id||!$1.useSpriteSheet){let $2=null==$1.id?$1.surrogates?$self.getURL($1.surrogates):$1.url:"
            }
        },
        {
            find: /\{variant:\i,tag:\i="div",selectable:\i=!1/,
            replacement: {
                match: /(?=let \i=\{color:\i,\.\.\.\i,\.\.\.(\i)\.style\};)/,
                replace: "$self.renderEmojis($1);"
            }
        },
        {
            find: /`emoji\$\{\i\.index\}`/,
            replacement: {
                match: /children:(\i)\[0\](?=\},`emoji)/,
                replace: "children:$self.emojiImage($1[0])"
            }
        }
    ],

    emojiImage(emoji: string) {
        return <img className="emoji" src={this.getURL(emoji)} alt={emoji} draggable={false} />;
    },

    renderEmojis(props: { children?: unknown; }) {
        const { children } = props;
        if (typeof children !== "string" || !EMOJI_RE.test(children)) return;

        props.children = children.split(EMOJI_RE).map((part, i) => i % 2 ? <React.Fragment key={i}>{this.emojiImage(part)}</React.Fragment> : part);
    },

    getURL(emoji: string) {
        return `https://emoji.coolpixels.net/${encodeURIComponent(emoji)}?style=${settings.store.style}`;
    }
});
