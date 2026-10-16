/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import ErrorBoundary from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Heart } from "@components/Heart";
import { Paragraph } from "@components/Paragraph";
import { DonateButton } from "@components/settings";
import { openInviteModal } from "@utils/discord";
import { Margins } from "@utils/margins";
import { Modal, openModal } from "@webpack/common";
import { ReactNode } from "react";

interface BadgeModalOptions {
    title: string;
    heart?: boolean;
    images: string[];
    text: string[];
    action: ReactNode;
}

function openBadgeModal({ title, heart, images, text, action }: BadgeModalOptions) {
    openModal(props => (
        <ErrorBoundary noop onError={props.onClose}>
            <Modal
                {...props}
                title={
                    <Heading tag="h2" style={{ width: "100%", textAlign: "center", margin: 0 }}>
                        <Flex justifyContent="center" alignItems="center" gap="0.5em">
                            {heart && <Heart />}
                            {title}
                        </Flex>
                    </Heading>
                }
            >
                <div>
                    <Flex>
                        {images.map(src => (
                            <img key={src} role="presentation" src={src} alt="" width={112} height={112} style={{ margin: "auto" }} />
                        ))}
                    </Flex>
                    <div style={{ padding: "1em" }}>
                        {text.map((line, i) => (
                            <Paragraph key={i} className={i ? Margins.top20 : undefined}>{line}</Paragraph>
                        ))}
                    </div>
                </div>
                <div>
                    <Flex justifyContent="center" style={{ width: "100%" }}>
                        {action}
                    </Flex>
                </div>
            </Modal>
        </ErrorBoundary>
    ));
}

export function UniverseModal(apiOrigin: string) {
    openBadgeModal({
        title: "Flibat's Universe",
        images: ["ff8ab6", "6bc8ff", "ffb86b"].map(c => `${apiOrigin}/v1/alliance/badges/flibatsuniverse.svg?color=${c}`),
        text: [
            "This badge is granted automatically to server staff in Flibat's Universe, the community behind Alliance Development.",
            "Its color matches the member's rank in the community."
        ],
        action: <Button onClick={() => openInviteModal("XszKXdqaZP")}>Join the community</Button>
    });
}

export function BotModal(apiOrigin: string) {
    openBadgeModal({
        title: "Official Alliance Bot",
        images: [`${apiOrigin}/v1/alliance/badges/assets/allicord/bot.svg`],
        text: ["This is an official bot made and run by Alliance Development."],
        action: <Button onClick={() => VencordNative.native.openExternal("https://alliance.flibat.com/invite")}>Add Alliance</Button>
    });
}

export function AllicordDonorModal(apiOrigin: string) {
    openBadgeModal({
        title: "Allicord Donor",
        heart: true,
        images: ["donor", "donor-night"].map(n => `${apiOrigin}/v1/alliance/badges/assets/allicord/${n}.svg`),
        text: [
            "This badge is a special perk for Allicord donors.",
            "Please consider supporting the development of Allicord by becoming a donor. It would mean a lot!"
        ],
        action: <DonateButton allicord />
    });
}
