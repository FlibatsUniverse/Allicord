/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import allicord from "file://../../../../../assets/alliance.svg?base64";
import equicord from "file://../../../../../assets/icons/equicord/icon.png?base64";
import modified from "file://../../../../../assets/icons/equicord/modified.png?base64";
import user from "file://../../../../../assets/icons/misc/userplugin.png?base64";
import vencord from "file://../../../../../assets/icons/vencord/icon-light.png?base64";

// Embedded so they load under Discord's CSP, which blocks remote hosts.
export const SourceIcons = {
    allicord: `data:image/svg+xml;base64,${allicord}`,
    equicord: `data:image/png;base64,${equicord}`,
    modified: `data:image/png;base64,${modified}`,
    user: `data:image/png;base64,${user}`,
    vencord: `data:image/png;base64,${vencord}`
};
