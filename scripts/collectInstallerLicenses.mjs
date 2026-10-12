/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const output = process.argv[2];
const text = readFileSync(join(output, "modules.json"), "utf8").trim();
const modules = text ? JSON.parse(`[${text.replace(/}\s*{/g, "},{")}]`) : [];
const manifest = [];
for (const module of modules) {
    if (module.Error || !module.Dir) throw new Error(`Cannot inspect ${module.Path}: ${module.Error ?? "No source directory"}`);
    const notices = readdirSync(module.Dir, { withFileTypes: true })
        .filter(file => file.isFile() && /^(licen[cs]e|copying|notice|copyright)/i.test(file.name));
    if (!notices.length) throw new Error(`No license notice found for ${module.Path}`);
    const directory = join(output, "licenses", module.Path.replaceAll("/", "_"));
    mkdirSync(directory, { recursive: true });
    for (const file of notices) copyFileSync(join(module.Dir, file.name), join(directory, file.name));
    manifest.push({ module: module.Path, version: module.Version });
}
mkdirSync(join(output, "licenses"), { recursive: true });
copyFileSync("LICENSE", join(output, "licenses", "Installer-LICENSE"));
writeFileSync(join(output, "licenses", "modules.json"), JSON.stringify(manifest, null, 2));
console.log(`Collected installer license notices for ${modules.length} modules.`);
