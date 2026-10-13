/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IpcMainInvokeEvent } from "electron";

const HOSTS = ["discord.com", "canary.discord.com", "ptb.discord.com", "discordapp.com"];

function isWebhookUrl(value: string) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" && HOSTS.includes(url.hostname) && url.pathname.startsWith("/api/webhooks/");
    } catch {
        return false;
    }
}

export async function sendWebhook(_: IpcMainInvokeEvent, url: string, payload: string) {
    if (!isWebhookUrl(url)) return { status: 400, body: JSON.stringify({ message: "That is not a webhook URL." }) };

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
        });

        return { status: res.status, body: await res.text() };
    } catch (e) {
        return { status: 0, body: JSON.stringify({ message: e instanceof Error ? e.message : "The request failed." }) };
    }
}
