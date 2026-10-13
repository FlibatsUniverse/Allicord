/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { AllicordDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { showToast } from "@webpack/common";

import { openComposer } from "./Composer";
import { Webhook } from "./types";

const COPY_LABEL = "Copy Webhook URL";
const SEND_LABEL = "Send Message";
const MARKER = "data-vc-webhook-composer";

let observer: MutationObserver | undefined;

// The webhook card keeps its webhook in props, which is the only place its token is available
function findWebhook(element: Element): Webhook | undefined {
    const key = Object.keys(element).find(k => k.startsWith("__reactFiber$"));
    let fiber = key ? (element as any)[key] : null;

    for (let depth = 0; fiber && depth < 80; depth++, fiber = fiber.return) {
        const props = fiber.memoizedProps;
        const webhook = props?.webhook ?? props?.editedWebhook;
        if (webhook?.id && webhook?.token) return webhook;
    }
}

function setLabel(button: HTMLElement, label: string) {
    const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
        if (node.textContent?.trim()) {
            node.textContent = label;
            return;
        }
        node = walker.nextNode();
    }
    button.textContent = label;
}

function addSendButton(copyButton: HTMLElement) {
    if (copyButton.nextElementSibling?.hasAttribute(MARKER)) return;

    const send = copyButton.cloneNode(true) as HTMLElement;
    send.setAttribute(MARKER, "");
    send.removeAttribute("id");
    setLabel(send, SEND_LABEL);

    send.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();

        const webhook = findWebhook(copyButton);
        if (!webhook) {
            showToast("Could not read this webhook", "failure");
            return;
        }

        openComposer(webhook);
    });

    copyButton.after(send);
}

function scan() {
    for (const button of document.querySelectorAll<HTMLElement>("button")) {
        if (button.hasAttribute(MARKER)) continue;
        if (button.textContent?.trim() === COPY_LABEL) addSendButton(button);
    }
}

export default definePlugin({
    name: "WebhookComposer",
    description: "Adds a Send Message button to webhook settings that opens a message builder with embeds and a live preview",
    tags: ["Servers", "Utility"],
    authors: [AllicordDevs.Flibat],
    start() {
        observer = new MutationObserver(scan);
        observer.observe(document.body, { childList: true, subtree: true });
        scan();
    },
    stop() {
        observer?.disconnect();
        observer = undefined;
        document.querySelectorAll(`[${MARKER}]`).forEach(el => el.remove());
    }
});
