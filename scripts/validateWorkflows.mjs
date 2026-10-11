/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readdirSync, readFileSync } from "fs";
import yaml from "yaml-js";

for (const file of readdirSync(".github/workflows").filter(name => name.endsWith(".yml"))) {
    const workflow = yaml.load(readFileSync(`.github/workflows/${file}`, "utf8"));
    if (!workflow.jobs || !workflow.permissions)
        throw new Error(`${file} needs jobs and explicit permissions.`);
    for (const job of Object.values(workflow.jobs)) {
        for (const step of job.steps ?? []) {
            if (step.uses && !/^actions\/[\w-]+@[a-f0-9]{40}$|^pnpm\/action-setup@[a-f0-9]{40}$/.test(step.uses))
                throw new Error(`${file} contains an unpinned or unexpected action: ${step.uses}`);
        }
    }
    console.log(`Validated ${file}`);
}
