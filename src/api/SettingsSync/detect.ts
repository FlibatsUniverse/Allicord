/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Reads a settings file from any client mod and turns it into one common plan.
 *
 * Nothing here knows about the app it runs in, so Allicord and Allidroid share
 * this exact file. Formats are recognized by their shape, not by name, which is
 * why a file from a mod nobody has heard of still imports whatever it holds
 * that both apps understand: plugin switches, plugin links, theme links and
 * custom CSS.
 */

export const BACKUP_VERSION = 1;

/** What Allidroid keeps and Allicord carries along untouched so a round trip loses nothing. */
export interface AllidroidBlock {
    version: number;
    plugins?: { id: string; url?: string; enabled: boolean; }[];
    themes?: { url: string; selected?: boolean; }[];
    fonts?: { url: string; }[];
    settings?: Record<string, any>;
}

export interface ImportPlan {
    /** A short label for the screen: what kind of file this looks like. */
    kind: string;
    /** Plugins that are installed from a link and then switched on or off. */
    pluginLinks: { url: string; enabled: boolean; }[];
    /** Plugins named in the file, matched to the apps' own plugins by name. */
    pluginStates: { name: string; enabled: boolean; }[];
    themeLinks: string[];
    customCss?: string;
    allidroid?: AllidroidBlock;
}

const UNSAFE = new Set(["__proto__", "constructor", "prototype"]);
const URL_RE = /^https?:\/\/\S+$/i;
const MAX_DEPTH = 8;

export function isSafe(value: unknown, depth = 0): boolean {
    if (value == null || typeof value !== "object") return true;
    if (depth > 64) return false;
    for (const key of Object.keys(value as object)) {
        if (UNSAFE.has(key)) return false;
        if (!isSafe((value as any)[key], depth + 1)) return false;
    }
    return true;
}

const isObject = (v: unknown): v is Record<string, any> => v != null && typeof v === "object" && !Array.isArray(v);
const isUrl = (v: unknown): v is string => typeof v === "string" && URL_RE.test(v.trim());
const isCssUrl = (url: string) => /\.css(\?|#|$)/i.test(url);

function uniqueBy<T>(list: T[], key: (item: T) => string) {
    const seen = new Set<string>();
    return list.filter(item => {
        const k = key(item);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

function emptyPlan(kind: string): ImportPlan {
    return { kind, pluginLinks: [], pluginStates: [], themeLinks: [] };
}

/** `{ "Name": { enabled: true } }`, the plugin table of Allicord and the client mods it descends from. */
function readPluginTable(table: unknown) {
    const out: { name: string; enabled: boolean; }[] = [];
    if (!isObject(table)) return out;
    for (const [name, value] of Object.entries(table)) {
        if (isObject(value) && typeof value.enabled === "boolean") out.push({ name, enabled: value.enabled });
    }
    return out;
}

/** `{ "Name": true }`, a plain on and off list. */
function readSwitchTable(table: unknown) {
    const out: { name: string; enabled: boolean; }[] = [];
    if (!isObject(table)) return out;
    const entries = Object.entries(table);
    if (!entries.length || !entries.every(([, v]) => typeof v === "boolean")) return out;
    for (const [name, enabled] of entries) if (!isUrl(name)) out.push({ name, enabled: enabled as boolean });
    return out;
}

/** `{ "https://…": { enabled, manifest?, selected? } }`, a list of plugins or themes kept by their link. */
function readLinkTable(table: unknown) {
    const plugins: { url: string; enabled: boolean; }[] = [];
    const themes: string[] = [];
    if (!isObject(table)) return { plugins, themes };

    for (const [url, value] of Object.entries(table)) {
        if (!isUrl(url) || !isObject(value)) continue;
        const looksLikeTheme = "selected" in value || (isObject(value.data) && "authors" in value.data) || isCssUrl(url);
        if (looksLikeTheme) themes.push(url);
        else plugins.push({ url, enabled: value.enabled !== false });
    }
    return { plugins, themes };
}

function readUrlList(list: unknown) {
    if (!Array.isArray(list)) return [] as string[];
    return list.map(item => isObject(item) ? item.url ?? item.link ?? item.href : item).filter(isUrl).map(s => s.trim());
}

/** Last resort: walk the file and pick up links filed under anything called a plugin or a theme. */
function scan(value: unknown, path: string[], plan: ImportPlan, depth = 0) {
    if (depth > MAX_DEPTH || value == null) return;

    if (isUrl(value)) {
        const where = path.join(".").toLowerCase();
        if (isCssUrl(value) || where.includes("theme")) plan.themeLinks.push(value.trim());
        else if (where.includes("plugin") || where.includes("addon") || where.includes("repo")) plan.pluginLinks.push({ url: value.trim(), enabled: true });
        return;
    }

    if (Array.isArray(value)) {
        value.forEach(item => scan(item, path, plan, depth + 1));
        return;
    }

    if (isObject(value)) {
        for (const [key, child] of Object.entries(value)) {
            if (isUrl(key) && isObject(child)) {
                const where = path.join(".").toLowerCase();
                if (isCssUrl(key) || where.includes("theme")) plan.themeLinks.push(key.trim());
                else plan.pluginLinks.push({ url: key.trim(), enabled: child.enabled !== false });
            }
            scan(child, [...path, key], plan, depth + 1);
        }
    }
}

function finish(plan: ImportPlan) {
    plan.pluginLinks = uniqueBy(plan.pluginLinks, p => p.url);
    plan.pluginStates = uniqueBy(plan.pluginStates, p => p.name.toLowerCase());
    plan.themeLinks = [...new Set(plan.themeLinks)];
    return plan;
}

export function isEmptyPlan(plan: ImportPlan) {
    return !plan.pluginLinks.length && !plan.pluginStates.length && !plan.themeLinks.length && !plan.customCss && !plan.allidroid;
}

/**
 * Works out what a file holds. Throws if it is not JSON or is unsafe, and
 * returns an empty plan if nothing in it is something the apps can use.
 */
export function detectSettings(input: string | unknown): ImportPlan {
    let data: any = input;
    if (typeof input === "string") {
        try {
            data = JSON.parse(input);
        } catch (error) {
            throw new Error("This is not a settings file. It is not valid JSON.");
        }
    }
    if (!isSafe(data)) throw new Error("This file contains unsafe keys, so it was not read.");
    if (data == null || typeof data !== "object") throw new Error("This is not a settings file.");

    // A backup written by Allicord or Allidroid, with the Allidroid block if there is one.
    if (isObject(data) && (isObject(data.allidroid) || "settings" in data && isObject(data.settings) && "plugins" in data.settings)) {
        const plan = emptyPlan(isObject(data.allidroid) ? "Allidroid backup" : "Allicord backup");
        const settings = isObject(data.settings) ? data.settings : {};
        plan.pluginStates = readPluginTable(settings.plugins);
        plan.themeLinks = readUrlList(settings.themeLinks);
        if (typeof data.quickCss === "string" && data.quickCss.trim()) plan.customCss = data.quickCss;
        if (isObject(data.allidroid)) {
            plan.allidroid = data.allidroid as AllidroidBlock;
            for (const p of plan.allidroid.plugins ?? []) if (p.url) plan.pluginLinks.push({ url: p.url, enabled: p.enabled });
            for (const t of plan.allidroid.themes ?? []) plan.themeLinks.push(t.url);
        }
        return finish(plan);
    }

    // The bare settings file of Allicord and the mods it descends from.
    if (isObject(data) && isObject(data.plugins) && readPluginTable(data.plugins).length) {
        const plan = emptyPlan("Settings file");
        plan.pluginStates = readPluginTable(data.plugins);
        plan.themeLinks = readUrlList(data.themeLinks);
        if (typeof data.quickCss === "string") plan.customCss = data.quickCss;
        return finish(plan);
    }

    // Plugin or theme lists kept by link, as mobile mods store them.
    if (isObject(data)) {
        const links = readLinkTable(data);
        if (links.plugins.length || links.themes.length) {
            const plan = emptyPlan(links.plugins.length ? "Plugin list" : "Theme list");
            plan.pluginLinks = links.plugins;
            plan.themeLinks = links.themes;
            return finish(plan);
        }
    }

    // A plain list of links.
    if (Array.isArray(data)) {
        const urls = readUrlList(data);
        if (urls.length) {
            const plan = emptyPlan("Link list");
            for (const url of urls) {
                if (isCssUrl(url)) plan.themeLinks.push(url);
                else plan.pluginLinks.push({ url, enabled: true });
            }
            return finish(plan);
        }
    }

    // A plain on and off list of names, as desktop mods keep them.
    const switches = readSwitchTable(data);
    if (switches.length) {
        const plan = emptyPlan("Plugin switches");
        plan.pluginStates = switches;
        return finish(plan);
    }

    // Anything else: look for links under plugin and theme headings, and for custom CSS.
    const plan = emptyPlan("Settings file");
    scan(data, [], plan);
    if (isObject(data)) {
        const css = data.quickCss ?? data.customCss ?? data.css ?? data.customcss;
        if (typeof css === "string" && css.trim()) plan.customCss = css;
        for (const [key, value] of Object.entries(data)) {
            if (isObject(value)) {
                plan.pluginStates.push(...readPluginTable(value));
                if (/plugin/i.test(key)) plan.pluginStates.push(...readSwitchTable(value));
            }
        }
    }
    return finish(plan);
}

/** Builds the `allidroid` block for an export. */
export function makeAllidroidBlock(block: Omit<AllidroidBlock, "version">): AllidroidBlock {
    return { version: BACKUP_VERSION, ...block };
}
