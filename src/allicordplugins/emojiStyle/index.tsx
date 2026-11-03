/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { definePluginSettings } from "@api/Settings";
import { AllicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { React } from "@webpack/common";

const EMOJI_RE = /((?![©®™])\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier}|‍\p{Extended_Pictographic})*)/u;

const EMOJI_RE_GLOBAL = new RegExp(EMOJI_RE.source, "gu");

interface SlateRange {
    anchor: { path: number[]; offset: number; };
    focus: { path: number[]; offset: number; };
    emojiStyle?: string;
}

type SlateDecorate = (entry: [{ text?: unknown; }, number[]]) => SlateRange[] | undefined;

interface FragmentNode {
    type: unknown;
    key: string | null;
    props: { children?: unknown; };
}

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
            find: /renderLeaf\(\i\)\{let\{editor:\i,renderExtraLeaf:/,
            replacement: [
                {
                    match: /(?<=renderLeaf\((\i)\)\{)(?=let\{editor:\i,renderExtraLeaf:)/,
                    replace: "return $self.wrapLeaf($1,this.renderLeafOriginal($1))}renderLeafOriginal($1){"
                },
                {
                    match: /decorate:(\i),renderElement:this\.renderElement,renderLeaf:this\.renderLeaf/,
                    replace: "decorate:$self.decorate($1),renderElement:this.renderElement,renderLeaf:this.renderLeaf"
                }
            ]
        },
        {
            find: /\$b:\(\i,\i\)=>\(0,\i\.jsx\)\("strong"/,
            replacement: {
                match: /(?<=\$b:\(\i,\i\)=>\(0,\i\.jsx\)\("strong",\{children:)\i/,
                replace: "$self.emojiText($&)"
            }
        },
        {
            find: /let\{ref:\i,children:\i,className:\i,color:\i,roleColors:/,
            replacement: {
                match: /(?<=\)\{)(?=let\{ref:\i,children:\i,className:\i,color:\i,roleColors:)/,
                replace: "$self.renderEmojis(arguments[0]);"
            }
        },
        {
            find: '"data-slate-placeholder":"true"',
            replacement: {
                match: /(?<="data-slate-placeholder":"true",children:)\i/,
                replace: "$self.emojiText($&)"
            }
        },
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

    decorate(original?: SlateDecorate): SlateDecorate {
        return entry => {
            const ranges = original?.(entry) ?? [];
            const [node, path] = entry;
            if (typeof node.text !== "string") return ranges;

            for (const match of node.text.matchAll(EMOJI_RE_GLOBAL)) {
                ranges.push({
                    anchor: { path, offset: match.index },
                    focus: { path, offset: match.index + match[0].length },
                    emojiStyle: match[0]
                });
            }
            return ranges;
        };
    },

    wrapLeaf({ leaf }: { leaf: { emojiStyle?: string; }; }, rendered: React.ReactNode) {
        return leaf.emojiStyle
            ? <span className="vc-emoji-style" style={{ backgroundImage: `url("${this.getURL(leaf.emojiStyle)}")` }}>{rendered}</span>
            : rendered;
    },

    emojiImage(emoji: string) {
        return <img className="emoji" src={this.getURL(emoji)} alt={emoji} draggable={false} />;
    },

    emojiText(text: unknown): unknown {
        if (typeof text === "object" && text !== null && (text as FragmentNode).type === React.Fragment) {
            const { key, props } = text as FragmentNode;
            const children = this.emojiText(props.children);
            return children === props.children ? text : <React.Fragment key={key}>{children as React.ReactNode}</React.Fragment>;
        }

        if (Array.isArray(text)) {
            const parts = text.map(part => this.emojiText(part));
            return parts.some((part, i) => part !== text[i]) ? parts : text;
        }

        if (typeof text !== "string" || !EMOJI_RE.test(text)) return text;

        return text.split(EMOJI_RE).map((part, i) => i % 2 ? <React.Fragment key={i}>{this.emojiImage(part)}</React.Fragment> : part);
    },

    renderEmojis(props: { children?: unknown; }) {
        props.children = this.emojiText(props.children);
    },

    getURL(emoji: string) {
        return `https://emoji.coolpixels.net/${encodeURIComponent(emoji)}?style=${settings.store.style}`;
    }
});
