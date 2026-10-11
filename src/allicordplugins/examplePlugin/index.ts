/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    exampleText: {
        type: OptionType.STRING,
        description: "An example setting with no effect on Discord.",
        default: "Alliance"
    }
});

export default definePlugin({
    name: "AllicordExample",
    description: "Demonstrates Alliance plugin discovery and settings without changing Discord.",
    authors: [EquicordDevs.nobody],
    enabledByDefault: false,
    settings
});
