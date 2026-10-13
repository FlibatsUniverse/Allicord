/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface Webhook {
    id: string;
    token: string;
    name: string;
    avatar?: string | null;
    channel_id?: string;
}

export interface EmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

export interface Embed {
    title?: string;
    url?: string;
    description?: string;
    color?: number;
    author?: { name: string; icon_url?: string; };
    footer?: { text: string; icon_url?: string; };
    image?: { url: string; };
    thumbnail?: { url: string; };
    fields?: EmbedField[];
}

export interface WebhookMessage {
    username?: string;
    avatar_url?: string;
    content?: string;
    embeds: Embed[];
}
